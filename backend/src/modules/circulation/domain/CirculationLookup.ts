export type ReaderSummary = { id: number; name: string; cpf: string; email: string };
export type CopySummary = { id: number; bookTitle: string; registrationNumber: string };

/** Somente as portas permitem consultar leitores e acervo. */
export interface CirculationLookup {
  reader(id: number): Promise<ReaderSummary | null>;
  copy(id: number): Promise<CopySummary | null>;
}
