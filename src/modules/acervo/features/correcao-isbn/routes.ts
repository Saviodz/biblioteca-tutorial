import type { Hono } from "hono";
import { parseCorrecaoDeIsbn } from "./inputs";
import type { UseCases } from "../../../../composition";

export function register(routes: Hono, useCases: UseCases): void {
  routes.patch("/livros/:id/isbn", async (contexto) => {
    const input = parseCorrecaoDeIsbn(
      contexto.req.param(),
      await contexto.req.json(),
    );
    return contexto.json(useCases.corrigirIsbn.execute(input), 200);
  });
}