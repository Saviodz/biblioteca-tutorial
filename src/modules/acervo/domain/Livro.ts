import { InvalidValue } from "../../../shared/domain-errors";
import type { LivroId, AutorId } from "../../../shared/identifiers";
import type { Isbn } from "./Isbn";
import { NumeroRegistro } from "./NumeroRegistro";

export class TituloVazio extends InvalidValue {
  constructor() {
    super("O título do livro é obrigatório");
  }
}

export function toIso(dia: Date): string {
  return dia.toISOString().slice(0, 10);
}

export class Livro {
  constructor(
    readonly id: LivroId | null,
    readonly numeroRegistro: NumeroRegistro,
    readonly isbn: Isbn,
    readonly titulo: string,
    readonly autorId: AutorId,
    readonly dataCatalogacao: string,
  ) {
    if (Livro.normalizar(titulo) === "") {
      throw new TituloVazio();
    }
  }

  /** Um livro nasce por aqui — e nasce válido. */
  static catalogar(
    isbn: Isbn,
    titulo: string,
    autorId: AutorId,
    hoje: Date,
    catalogadosNoAno: number,
  ): Livro {
    const dia = toIso(hoje);

    return new Livro(
      null,
      NumeroRegistro.proximo(dia.slice(0, 4), catalogadosNoAno),
      isbn,
      titulo,
      autorId,
      dia,
    );
  }

  /** Quem atribui a identidade é a persistência; a entidade aceita sem virar mutável. */
  withId(id: LivroId): Livro {
    return new Livro(
      id,
      this.numeroRegistro,
      this.isbn,
      this.titulo,
      this.autorId,
      this.dataCatalogacao,
    );
  }
  comTitulo(titulo: string): Livro {
  return new Livro(
    this.id,
    this.numeroRegistro,
    this.isbn,
    titulo,
    this.autorId,
    this.dataCatalogacao,
  );
}
  /** O que conta como "a mesma obra" é decisão do negócio, não do SQL. */
  mesmoTituloQue(outro: string): boolean {
    return Livro.normalizar(this.titulo) === Livro.normalizar(outro);
  }

  private static normalizar(titulo: string): string {
    return titulo.trim().toLowerCase();
  }
}
