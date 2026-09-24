import { db } from "../../../infrastructure/db";
import { LivroId, AutorId } from "../../../shared/identifiers";
import { Isbn } from "../domain/Isbn";
import { Livro } from "../domain/Livro";
import type { LivroRepository } from "../domain/LivroRepository";
import { NumeroRegistro } from "../domain/NumeroRegistro";

type LivroRow = {
  id: number;
  numero_registro: string;
  isbn: string;
  titulo: string;
  autor_id: number;
  data_catalogacao: string;
};

function toLivro(row: LivroRow): Livro {
  return new Livro(
    new LivroId(row.id),
    new NumeroRegistro(row.numero_registro),
    new Isbn(row.isbn),
    row.titulo,
    new AutorId(row.autor_id),
    row.data_catalogacao,
  );
}

export class SqliteLivroRepository implements LivroRepository {
  contarNoAcervoDoAutor(autorId: AutorId): number {
    const row = db
      .query("SELECT COUNT(*) AS total FROM livros WHERE autor_id = ?")
      .get(autorId.value) as { total: number };

    return row.total;
  }

  contarCatalogadosNoAno(ano: string): number {
    const row = db
      .query(
        `SELECT COUNT(*) AS total FROM livros
          WHERE data_catalogacao LIKE ?`,
      )
      .get(`${ano}%`) as { total: number };

    return row.total;
  }

  insert(livro: Livro): Livro {
    const result = db.run(
      `INSERT INTO livros (numero_registro, isbn, titulo, autor_id, data_catalogacao)
       VALUES (?, ?, ?, ?, ?)`,
      [
        livro.numeroRegistro.value,
        livro.isbn.value,
        livro.titulo,
        livro.autorId.value,
        livro.dataCatalogacao,
      ],
    );

    return livro.withId(new LivroId(Number(result.lastInsertRowid)));
  }

  findByIsbn(isbn: Isbn): Livro | null {
    const row = db
      .query("SELECT * FROM livros WHERE isbn = ?")
      .get(isbn.value) as LivroRow | null;

    return row === null ? null : toLivro(row);
  }

  findByAutorId(autorId: AutorId): Livro[] {
    const rows = db
      .query("SELECT * FROM livros WHERE autor_id = ?")
      .all(autorId.value) as LivroRow[];

    return rows.map(toLivro);
  }

  searchByTitulo(termo: string): Livro[] {
    const rows = db
      .query("SELECT * FROM livros WHERE titulo LIKE ?")
      .all(`%${termo}%`) as LivroRow[];

    return rows.map(toLivro);
  }

  findByAutorIds(autorIds: AutorId[]): Livro[] {
    if (autorIds.length === 0) return [];

    const placeholders = autorIds.map(() => "?").join(", ");
    const rows = db
      .query(`SELECT * FROM livros WHERE autor_id IN (${placeholders})`)
      .all(...autorIds.map((autorId) => autorId.value)) as LivroRow[];

    return rows.map(toLivro);
  }
  findById(id: LivroId): Livro | null;
 updateTitulo(livro: Livro): void;

  findById(id: LivroId): Livro | null {
    const row = db.query("SELECT * FROM livros WHERE id = ?")
      .get(id.value) as LivroRow | null;
    return row === null ? null : toLivro(row);
  }

  findById(id: LivroId): Livro | null {
  return this.items.find((livro) => livro.id?.equals(id)) ?? null;
}

updateTitulo(livro: Livro): void {
  this.items = this.items.map((atual) =>
    atual.id?.equals(livro.id!) ? livro : atual,
  );
}
  updateTitulo(livro: Livro): void {
    db.run("UPDATE livros SET titulo = ? WHERE id = ?", [
      livro.titulo,
      livro.id!.value,
    ]);
  }
}
