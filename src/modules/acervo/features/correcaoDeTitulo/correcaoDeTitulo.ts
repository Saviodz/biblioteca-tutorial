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

export type CorrecaoDeTitulo = {
  id: number;
  titulo: string;
};

export function parseCorrecaoDeTitulo(
  params: { id?: string },
  body: unknown,
): CorrecaoDeTitulo {
  const data = getBodyAsObject(body);
  return {
    id: getFieldAsPositiveInt(params, "id"),
    titulo: getFieldAsText(data, "titulo"),
  };
}