import type { ConsultaDeAutoria } from "../../domain/ConsultaDeAutoria";
import { Isbn } from "../../domain/Isbn";
import type { Livro } from "../../domain/Livro";
import type { LivroRepository } from "../../domain/LivroRepository";
import { livroToJson, type LivroJson } from "../../output";

export class BuscarLivro {
  constructor(
    private readonly livros: LivroRepository,
    private readonly autoria: ConsultaDeAutoria,
  ) {}

  execute(q: string): LivroJson[] {
    if (Isbn.isValid(q)) {
      const porIsbn = this.livros.findByIsbn(new Isbn(q));

      if (porIsbn) return [this.comAutor(porIsbn)];
    }

    const porTitulo = this.livros.searchByTitulo(q);

    if (porTitulo.length > 0) return porTitulo.map((l) => this.comAutor(l));

    // pergunta à autoria QUEM bate com o nome, e filtra os próprios livros
    const autorIds = this.autoria.idsPorNome(q);

    return this.livros.findByAutorIds(autorIds).map((l) => this.comAutor(l));
  }

  private comAutor(livro: Livro): LivroJson {
    const autor = this.autoria.autor(livro.autorId);

    return livroToJson(livro, autor!);
  }
  
}
