import type { Solicitacao } from "./domain/Solicitacao";

export type SolicitacaoJson = {
  id: number;
  numeroRegistro: string;
  matricula: string;
  diasPretendidos: number;
  observacao: string | null;
};

export function solicitacaoToJson(solicitacao: Solicitacao): SolicitacaoJson {
  return {
    id: solicitacao.id!.value,
    numeroRegistro: solicitacao.numeroRegistro,
    matricula: solicitacao.matricula,
    diasPretendidos: solicitacao.diasPretendidos,
    observacao: solicitacao.observacao,
  };
}