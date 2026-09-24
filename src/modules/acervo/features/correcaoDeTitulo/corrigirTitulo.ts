export type TituloCorrigidoJson = {
  id: number;
  isbn: string;
  titulo: string;
};

export function tituloCorrigidoToJson(livro: Livro): TituloCorrigidoJson {
  return {
    id: livro.id!.value,
    isbn: livro.isbn.value,
    titulo: livro.titulo,
  };
}