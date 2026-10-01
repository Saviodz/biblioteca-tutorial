import { getBodyAsObject, getFieldAsPositiveInt, getFieldAsText } from "../../../../shared/validation";

export type CorrecaoDeIsbn = {
  id: number;
  isbn: string;
};

export function parseCorrecaoDeIsbn(
  params: { id?: string },
  body: unknown,
): CorrecaoDeIsbn {
  const data = getBodyAsObject(body);
  return {
    id: getFieldAsPositiveInt(params, "id"),
    isbn: getFieldAsText(data, "isbn"),
  };
}