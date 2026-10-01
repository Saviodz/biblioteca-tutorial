import { NotFound, RuleConflict } from "../../../../shared/errors";
import { LivroId } from "../../../../shared/identifiers";
import { Isbn } from "../../domain/Isbn";
import type { LivroRepository } from "../../domain/LivroRepository";
import { isbnCorrigidoToJson, type IsbnCorrigidoJson } from "../../output";
import type { CorrecaoDeIsbn } from "./inputs";

export class CorrigirIsbn {
  constructor(private readonly livros: LivroRepository) {}

  execute(input: CorrecaoDeIsbn): IsbnCorrigidoJson {
    const id = new LivroId(input.id);
    const livro = this.livros.findById(id);
    if (!livro) throw new NotFound("Livro não encontrado");

    const isbn = new Isbn(input.isbn);
    const duplicado = this.livros.findByIsbn(isbn);
    if (duplicado && !duplicado.id?.equals(id)) {
      throw new RuleConflict("Outro livro já utiliza este ISBN");
    }

    const corrigido = livro.comIsbn(isbn);
    this.livros.updateIsbn(corrigido);
    return isbnCorrigidoToJson(corrigido);
  }
}