import { InvalidValue } from "./domain-errors";

class Identifier {
  constructor(readonly value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidValue(`identificador inválido: ${value}`);
    }
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}

/** Identidade que o sistema atribui. */
export class LivroId extends Identifier {}

/** Identidade que o sistema atribui — pelo mesmo motivo. */
export class AutorId extends Identifier {}

export class SolicitacaoId extends Identifier {}