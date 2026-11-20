import { discardObject, requireStorage, storage } from "../../../../infrastructure/storage";
import { inTransaction } from "../../../../infrastructure/transaction";
import { NotFound } from "../../../../shared/errors";
import { photoKey } from "../../infrastructure/photos";
import { invalidateAuthorSearch } from "../../infrastructure/searchCache";

/**
 * UC26: a ordem é a inversa do envio. Primeiro o Postgres esquece a foto; depois
 * o objeto sai do bucket. Se o RustFS falhar nesse último passo, sobra um objeto
 * órfão, mas nenhum autor aponta para ele.
 */
export async function removeAuthorPhoto(id: number, client = storage): Promise<void> {
  // sem RustFS, 503 antes de mexer no banco
  requireStorage(client);
  const [row] = await inTransaction((tx) => tx`UPDATE autores SET foto_atualizada_em = NULL WHERE id = ${id} RETURNING id`);
  if (!row) throw new NotFound("Autor não encontrado");
  await discardObject(photoKey(id), client);
  await invalidateAuthorSearch();
}
