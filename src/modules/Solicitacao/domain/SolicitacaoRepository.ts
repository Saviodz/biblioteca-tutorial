import type { Solicitacao } from "./Solicitacao";

export interface SolicitacaoRepository {
  findByMatriculaELivro(
    matricula: string,
    numeroRegistro: string,
  ): Solicitacao | null;
  insert(solicitacao: Solicitacao): Solicitacao;
}