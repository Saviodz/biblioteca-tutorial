type AvaliacaoRow = {
  id: number;
  numero_registro: string;
  matricula: string;
  nota: number;
  comentario: string | null;
};

function toAvaliacao(row: AvaliacaoRow): Avaliacao {
  return new Avaliacao(
    new AvaliacaoId(row.id), row.numero_registro,
    row.matricula, row.nota, row.comentario,
  );
}

export class SqliteAvaliacaoRepository implements AvaliacaoRepository {
  findByMatriculaELivro(
    matricula: string,
    numeroRegistro: string,
  ): Avaliacao | null {
    const row = db.query(`
      SELECT * FROM avaliacoes
      WHERE matricula = ? AND numero_registro = ?
    `).get(matricula, numeroRegistro) as AvaliacaoRow | null;
    return row === null ? null : toAvaliacao(row);
  }

  insert(avaliacao: Avaliacao): Avaliacao {
    const result = db.run(`
      INSERT INTO avaliacoes
        (numero_registro, matricula, nota, comentario)
      VALUES (?, ?, ?, ?)
    `, [
      avaliacao.numeroRegistro, avaliacao.matricula,
      avaliacao.nota, avaliacao.comentario,
    ]);
    return avaliacao.withId(new AvaliacaoId(Number(result.lastInsertRowid)));
  }
}