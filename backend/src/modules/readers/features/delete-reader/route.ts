import type { Hono } from "hono";
import { inTransaction } from "../../../../infrastructure/transaction";
import { PostgresReaderHistory } from "../../../../integration/PostgresReaderHistory";
import { parsePositiveId } from "../../../../shared/http";
import { PostgresReaderRepository } from "../../infrastructure/PostgresReaderRepository";
import { invalidateReaderSearch } from "../../infrastructure/searchCache";
import { DeleteReader } from "./DeleteReader";

/** UC12: exclui um leitor sem histórico. */
export function registerRoutes(api: Hono): void {
  api.delete("/leitores/:id", async c => {
    const id = parsePositiveId(c.req.param("id"));
    await inTransaction(tx => new DeleteReader(new PostgresReaderRepository(tx), new PostgresReaderHistory(tx)).execute(id));
    await invalidateReaderSearch();
    return c.body(null, 204);
  });
}
