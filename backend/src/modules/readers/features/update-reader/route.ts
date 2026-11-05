import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { parsePositiveId, readJsonBody } from "../../../../shared/http";
import { readerJson } from "../../infrastructure/json";
import { PostgresReaderRepository } from "../../infrastructure/PostgresReaderRepository";
import { invalidateReaderSearch } from "../../infrastructure/searchCache";
import { UpdateReader } from "./UpdateReader";

/** UC11: atualiza um leitor. */
export function registerRoutes(api: Hono): void {
  api.put("/leitores/:id", async c => {
    const id = parsePositiveId(c.req.param("id"));
    const body = await readJsonBody(c);
    const reader = await inTransaction(tx => new UpdateReader(new PostgresReaderRepository(tx)).execute(id, body));
    await invalidateReaderSearch();
    return c.json(readerJson(reader));
  });
}
