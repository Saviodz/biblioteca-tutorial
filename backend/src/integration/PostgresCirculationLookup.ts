import type { SQL } from "bun";
import type { CirculationLookup, CopySummary, ReaderSummary } from "../modules/circulation";

/** Adapter de integração: só aqui há SQL que atravessa leitores, exemplares e livros. */
export class PostgresCirculationLookup implements CirculationLookup {
  constructor(private readonly db: SQL) {}

  async reader(id: number): Promise<ReaderSummary | null> {
    const [row] = await this.db<ReaderSummary[]>`SELECT id, nome AS name, cpf, email FROM leitores WHERE id = ${id}`;
    return row ?? null;
  }

  async copy(id: number): Promise<CopySummary | null> {
    const [row] = await this.db<CopySummary[]>`SELECT e.id, e.numero_registro AS "registrationNumber", l.titulo AS "bookTitle"
      FROM exemplares e JOIN livros l ON l.id = e.livro_id WHERE e.id = ${id}`;
    return row ?? null;
  }
}
