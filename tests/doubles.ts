import type {
  AutorConhecido,
  ConsultaDeAutoria,
} from "../src/modules/acervo/domain/ConsultaDeAutoria";
import { AutorId, LivroId } from "../src/shared/identifiers";
import type { Isbn } from "../src/modules/acervo/domain/Isbn";
import type { Livro } from "../src/modules/acervo/domain/Livro";
import type {
  AcervoEvent,
  EventPublisher,
} from "../src/modules/acervo/domain/events";
import type { LivroRepository } from "../src/modules/acervo/domain/LivroRepository";

export class InMemoryLivroRepository implements LivroRepository {
  private items: Livro[] = [];
  private nextId = 1;

  contarNoAcervoDoAutor(autorId: AutorId): number {
    return this.items.filter((item) => item.autorId.equals(autorId)).length;
  }

  contarCatalogadosNoAno(ano: string): number {
    return this.items.filter((item) => item.dataCatalogacao.startsWith(ano))
      .length;
  }
  findById(id: LivroId): Livro | null {
    return this.items.find((livro) => livro.id?.equals(id)) ?? null;
  }

  updateIsbn(livro: Livro): void {
    this.items = this.items.map((atual) =>
      atual.id?.equals(livro.id!) ? livro : atual,
    );
  }
  insert(livro: Livro): Livro {
    const salvo = livro.withId(new LivroId(this.nextId++));
    this.items.push(salvo);

    return salvo;
  }

  findByIsbn(isbn: Isbn): Livro | null {
    return this.items.find((item) => item.isbn.equals(isbn)) ?? null;
  }

  findByAutorId(autorId: AutorId): Livro[] {
    return this.items.filter((item) => item.autorId.equals(autorId));
  }

  searchByTitulo(termo: string): Livro[] {
    const alvo = termo.toLowerCase();

    return this.items.filter((item) => item.titulo.toLowerCase().includes(alvo));
  }

  findByAutorIds(autorIds: AutorId[]): Livro[] {
    return this.items.filter((item) =>
      autorIds.some((autorId) => item.autorId.equals(autorId)),
    );
  }
}

export class InMemoryAutoria implements ConsultaDeAutoria {
  constructor(private readonly items: Record<number, AutorConhecido>) { }

  autor(autorId: AutorId): AutorConhecido | null {
    return this.items[autorId.value] ?? null;
  }

  idsPorNome(termo: string): AutorId[] {
    const alvo = termo.toLowerCase();

    return Object.entries(this.items)
      .filter(([, autor]) => autor.nome.toLowerCase().includes(alvo))
      .map(([id]) => new AutorId(Number(id)));
  }
}

export class FakeEventPublisher implements EventPublisher {
  readonly published: AcervoEvent[] = [];

  publish(event: AcervoEvent): void {
    this.published.push(event);
  }
}
