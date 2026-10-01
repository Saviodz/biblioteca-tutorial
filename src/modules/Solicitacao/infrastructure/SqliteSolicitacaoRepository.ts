import { db } from "../../../infrastructure/db";
import { SolicitacaoId } from "../../../shared/identifiers";
import { Solicitacao } from "../domain/Solicitacao";
import type { SolicitacaoRepository } from "../domain/SolicitacaoRepository";

type SolicitacaoRow = {
  id: number;
  numero_registro: string;
  matricula: string;
  dias_pretendidos: number;
  observacao: string | null;
};

function toSolicitacao(row: SolicitacaoRow): Solicitacao {
  return new Solicitacao(
    new SolicitacaoId(row.id), row.numero_registro,
    row.matricula, row.dias_pretendidos, row.observacao,
  );
}

export class SqliteSolicitacaoRepository implements SolicitacaoRepository {
  findByMatriculaELivro(
    matricula: string,
    numeroRegistro: string,
  ): Solicitacao | null {
    const row = db.query(`
      SELECT * FROM solicitacoes
      WHERE matricula = ? AND numero_registro = ?
    `).get(matricula, numeroRegistro) as SolicitacaoRow | null;
    return row === null ? null : toSolicitacao(row);
  }

  insert(solicitacao: Solicitacao): Solicitacao {
    const result = db.run(`
      INSERT INTO solicitacoes
        (numero_registro, matricula, dias_pretendidos, observacao)
      VALUES (?, ?, ?, ?)
    `, [
      solicitacao.numeroRegistro, solicitacao.matricula,
      solicitacao.diasPretendidos, solicitacao.observacao,
    ]);
    return solicitacao.withId(new SolicitacaoId(Number(result.lastInsertRowid)));
  }
}