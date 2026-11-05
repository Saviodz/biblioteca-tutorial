import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { readJsonBody } from "../../../../shared/http";
import { readerJson } from "../../infrastructure/json";
import { PostgresReaderRepository } from "../../infrastructure/PostgresReaderRepository";
import { invalidateReaderSearch } from "../../infrastructure/searchCache";
import { CreateReader } from "./CreateReader";

/** UC09: cadastra um leitor. */
export function registerRoutes(api: Hono): void {
  api.post("/leitores", async c => {
    const body = await readJsonBody(c);
    const reader = await inTransaction(tx => new CreateReader(new PostgresReaderRepository(tx)).execute(body));
    await invalidateReaderSearch();
    return c.json(readerJson(reader), 201);
  });
}
