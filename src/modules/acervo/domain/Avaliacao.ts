export class Avaliacao {
  constructor(
    readonly id: AvaliacaoId | null,
    readonly numeroRegistro: string,
    readonly matricula: string,
    readonly nota: number,
    readonly comentario: string | null,
  ) {
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw new InvalidValue("A nota deve ser um inteiro de 1 a 5");
    }
  }

  static registrar(
    numeroRegistro: string,
    matricula: string,
    nota: number,
    comentario: string | null,
  ): Avaliacao {
    return new Avaliacao(null, numeroRegistro, matricula, nota, comentario);
  }

  withId(id: AvaliacaoId): Avaliacao {
    return new Avaliacao(
      id, this.numeroRegistro, this.matricula, this.nota, this.comentario,
    );
  }
}