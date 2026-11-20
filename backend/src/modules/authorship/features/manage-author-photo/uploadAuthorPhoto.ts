import { sql } from "../../../../infrastructure/postgres";
import { discardObject, putObject, storage } from "../../../../infrastructure/storage";
import { inTransaction } from "../../../../infrastructure/transaction";
import { NotFound } from "../../../../shared/errors";
import type { ImageUpload } from "../../../../shared/images";
import type { AuthorView } from "../../domain/Author";
import type { AuthorshipIntegration } from "../../domain/AuthorshipIntegration";
import { findAuthor, toAuthorView, type AuthorRow } from "../../infrastructure/authors";
import { photoKey } from "../../infrastructure/photos";
import { invalidateAuthorSearch } from "../../infrastructure/searchCache";

/**
 * UC26: grava a foto do autor no RustFS e marca no Postgres quando ela mudou.
 * Nessa ordem, uma falha no meio deixa no máximo um objeto sem uso no bucket,
 * nunca um autor apontando para uma foto que não existe.
 */
export async function uploadAuthorPhoto(
  id: number,
  image: ImageUpload,
  integration: AuthorshipIntegration,
  { client = storage, now = new Date() } = {},
): Promise<AuthorView> {
  // 404 antes de mandar qualquer byte para o RustFS
  await findAuthor(sql, id);
  await putObject(photoKey(id), image.bytes, image.type, client);

  const author = await inTransaction(async (tx) => {
    const [row] = await tx`
      UPDATE autores SET foto_atualizada_em = ${now} WHERE id = ${id}
      RETURNING id, nome AS name, tipo AS type, livros_no_acervo AS "bookCount"
    ` as AuthorRow[];
    return row ? toAuthorView(tx, row, integration) : null;
  });
  if (!author) {
    // o autor foi excluído enquanto a foto subia: o objeto não tem mais dono
    await discardObject(photoKey(id), client);
    throw new NotFound("Autor não encontrado");
  }
  // depois do COMMIT: só agora o autor atualizado é visível para quem refizer a busca
  await invalidateAuthorSearch();
  return author;
}
