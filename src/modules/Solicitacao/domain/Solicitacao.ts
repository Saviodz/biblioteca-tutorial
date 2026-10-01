import { InvalidValue } from "../../../shared/domain-errors";
import type { SolicitacaoId } from "../../../shared/identifiers";

export class Solicitacao {
  constructor(
    readonly id: SolicitacaoId | null,
    readonly numeroRegistro: string,
    readonly matricula: string,
    readonly diasPretendidos: number,
    readonly observacao: string | null,
  ) {
    if (!Number.isInteger(diasPretendidos) || diasPretendidos < 1 || diasPretendidos > 14) {
      throw new InvalidValue("O prazo pretendido deve ser um inteiro de 1 a 14 dias");
    }
  }

  static registrar(
    numeroRegistro: string,
    matricula: string,
    diasPretendidos: number,
    observacao: string | null,
  ): Solicitacao {
    return new Solicitacao(null, numeroRegistro, matricula, diasPretendidos, observacao);
  }

  withId(id: SolicitacaoId): Solicitacao {
    return new Solicitacao(
      id, this.numeroRegistro, this.matricula, this.diasPretendidos, this.observacao,
    );
  }
}