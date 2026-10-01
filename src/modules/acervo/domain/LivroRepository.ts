import type { AutorId, LivroId } from "../../../shared/identifiers";
import type { Isbn } from "./Isbn";
import type { Livro } from "./Livro";

/**
 * Port: quem PRECISA do serviço declara o contrato. Esta interface vive no
 * domínio e não sabe que existe SQLite, HTTP ou qualquer outra tecnologia.
 * Repare que as duas primeiras assinaturas são perguntas de negócio, não
 * consultas.
 */
export interface LivroRepository {
  contarNoAcervoDoAutor(autorId: AutorId): number;
  contarCatalogadosNoAno(ano: string): number;

  insert(livro: Livro): Livro;
  findByIsbn(isbn: Isbn): Livro | null;
  findByAutorId(autorId: AutorId): Livro[];
  searchByTitulo(termo: string): Livro[];
  findByAutorIds(autorIds: AutorId[]): Livro[];
  findById(id: LivroId): Livro | null;
  updateIsbn(livro: Livro): void;
}
