import type { RedisClient } from "bun";
import { sql } from "../../../../infrastructure/postgres";
import { redis } from "../../../../infrastructure/redis";
import type { Reader } from "../../domain/Reader";
import type { ReaderRepository } from "../../domain/ReaderRepository";
import { PostgresReaderRepository } from "../../infrastructure/PostgresReaderRepository";
import { readCachedSearch, writeCachedSearch, type CacheStatus } from "../../infrastructure/searchCache";
import { SearchReaders } from "./SearchReaders";

/**
 * Cache-aside: procura no Redis; se não estiver lá, busca no Postgres e guarda.
 * O caso de uso SearchReaders original continua intacto; o cache o envolve.
 */
export async function searchReadersCached(
  term = "",
  clientOrRepo?: RedisClient | ReaderRepository | null,
  maybeClient?: RedisClient | null,
): Promise<{ readers: Reader[]; cache: CacheStatus }> {
  let repository: ReaderRepository = new PostgresReaderRepository(sql);
  let client: RedisClient | null = redis;

  if (clientOrRepo && "search" in clientOrRepo) {
    repository = clientOrRepo;
    if (maybeClient !== undefined) client = maybeClient;
  } else if (clientOrRepo !== undefined) {
    client = clientOrRepo as RedisClient | null;
  }

  const cached = await readCachedSearch(term, client);
  if (cached?.readers) return { readers: cached.readers, cache: "HIT" };
  const readers = await new SearchReaders(repository).execute(term);
  if (!cached) return { readers, cache: "BYPASS" };
  await writeCachedSearch(term, cached.generation, readers, client);
  return { readers, cache: "MISS" };
}
