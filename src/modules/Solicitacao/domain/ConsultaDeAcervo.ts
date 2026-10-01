import { getBodyAsObject, getFieldAsPositiveInt, getFieldAsText } from "../../../shared/validation";

export type NovaSolicitacao = {
  numeroRegistro: string;
  matricula: string;
  diasPretendidos: number;
  observacao: string | null;
};

export function parseNovaSolicitacao(body: unknown): NovaSolicitacao {
  const data = getBodyAsObject(body);
  return {
    numeroRegistro: getFieldAsText(data, "numeroRegistro"),
    matricula: getFieldAsText(data, "matricula"),
    diasPretendidos: getFieldAsPositiveInt(data, "diasPretendidos"),
    observacao: data.observacao == null
      ? null
      : getFieldAsText(data, "observacao"),
  };
}