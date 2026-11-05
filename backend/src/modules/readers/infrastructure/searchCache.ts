import type { RedisClient } from "bun";
import { ready, redis, redisKey } from "../../../infrastructure/redis";
import type { Reader } from "../domain/Reader";

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

/** Um resultado em cache vale por 60 s mesmo que ninguém o invalide. */
const TTL_SECONDS = 60;

const GENERATION = redisKey("leitores", "buscas", "geracao");

/**
 * Cada geração é um hash: um campo por termo buscado, cada campo com o próprio
 * TTL (HSETEX, novo no Redis 8). Quando todos os campos expiram, o hash some.
 */
function generationHash(generation: number): string {
  return redisKey("leitores", "buscas", String(generation));
}

/**
 * A busca usa ILIKE: "Ana" e " ana " são o mesmo resultado.
 * Sem q e com q vazio compartilham o mesmo campo ("q:").
 */
function field(term = ""): string {
  return `q:${term.trim().toLocaleLowerCase("pt-BR")}`;
}

/**
 * Lê a geração atual e, nela, o resultado do termo. Devolve null quando não há
 * Redis (bypass): quem chamou segue direto para o Postgres.
 */
export async function readCachedSearch(term = "", client: RedisClient | null = redis): Promise<{ generation: number; readers: Reader[] | null } | null> {
  if (!client) return null;
  try {
    await ready(client);
    const generation = Number(await client.get(GENERATION) ?? 0);
    const cached = await client.hget(generationHash(generation), field(term));
    return { generation, readers: cached === null ? null : JSON.parse(cached) as Reader[] };
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
    return null;
  }
}

/**
 * Grava na geração que estava valendo quando a leitura começou. Se uma escrita
 * invalidou o cache no meio do caminho, este resultado (talvez velho) vai para
 * uma geração que ninguém mais lê, e expira sozinho.
 */
export async function writeCachedSearch(term: string, generation: number, readers: Reader[], client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.send("HSETEX", [generationHash(generation), "EX", String(TTL_SECONDS), "FIELDS", "1", field(term), JSON.stringify(readers)]);
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
  }
}

/**
 * Invalida todas as buscas de uma vez: a próxima leitura procura na geração
 * seguinte, que começa vazia. Chame depois do COMMIT; antes dele, uma leitura
 * concorrente ainda veria o dado antigo no Postgres e o gravaria na geração nova.
 */
export async function invalidateReaderSearch(client: RedisClient | null = redis): Promise<void> {
  if (!client) return;
  try {
    await ready(client);
    await client.incr(GENERATION);
  } catch (error) {
    console.warn("Cache de leitores indisponível:", (error as Error).message);
  }
}
