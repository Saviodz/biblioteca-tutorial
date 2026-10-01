import type { Hono } from "hono";
import { parseNovaSolicitacao } from "./input";
import type { UseCases } from "../../../../composition";

export function register(routes: Hono, useCases: UseCases): void {
  routes.post("/solicitacoes", async (contexto) => {
    const input = parseNovaSolicitacao(await contexto.req.json());
    const solicitacao = useCases.registrarSolicitacao.execute(input);
    contexto.header("Location", `/solicitacoes/${solicitacao.id}`);
    return contexto.json(solicitacao, 201);
  });
}