export function register(routes: Hono, useCases: UseCases): void {
  routes.patch("/livros/:id/titulo", async (contexto) => {
    const input = parseCorrecaoDeTitulo(
      contexto.req.param(),
      await contexto.req.json(),
    );
    return contexto.json(useCases.corrigirTitulo.execute(input), 200);
  });
}