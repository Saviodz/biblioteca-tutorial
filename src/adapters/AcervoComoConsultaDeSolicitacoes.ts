import type { AutorConhecido, ConsultaDeAutoria } from "../modules/acervo";
import type { ConsultaDeAutores } from "../modules/autoria";
import type { AutorId } from "../shared/identifiers";

export class AcervoComoConsultaDeSolicitacoes implements ConsultaDeAcervo {
  constructor(private readonly livros: ConsultaDeLivros) {}

  existeNumeroRegistro(numeroRegistro: string): boolean {
    return this.livros.existeNumeroRegistro(numeroRegistro);
  }
}