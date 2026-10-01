import { db } from "../../../infrastructure/db";

export function createSolicitacaoTables(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_registro TEXT NOT NULL,
      matricula TEXT NOT NULL,
      dias_pretendidos INTEGER NOT NULL,
      observacao TEXT,
      UNIQUE (numero_registro, matricula)
    );
  `);
}