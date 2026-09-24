export interface AvaliacaoRepository {
  findByMatriculaELivro(
    matricula: string,
    numeroRegistro: string,
  ): Avaliacao | null;
  insert(avaliacao: Avaliacao): Avaliacao;
}