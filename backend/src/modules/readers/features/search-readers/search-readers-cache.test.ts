import { expect, test } from "bun:test";
import { api, testName } from "#tests/api";
import { cleanTestCatalog } from "#tests/clean-catalog";
import { testReader } from "#tests/reader-fixtures";
import { sql } from "../../../../infrastructure/postgres";
import { createRedis, ready, redis, redisKey } from "../../../../infrastructure/redis";
import {
  invalidateReaderSearch,
  readCachedSearch,
  writeCachedSearch,
} from "../../infrastructure/searchCache";
import { searchReadersCached } from "./searchReadersCached";

type ReaderJson = { id: number; nome: string; cpf: string; email: string; telefone: string };

async function search(q?: string) {
  const url = q !== undefined ? `/leitores?q=${encodeURIComponent(q)}` : "/leitores";
  const response = await api("GET", url);
  expect(response.status).toBe(200);
  return {
    cache: response.headers.get("X-Cache"),
    readers: (await response.json()) as ReaderJson[],
  };
}

test("UC10: primeira busca é MISS, segunda pelo mesmo termo é HIT com o mesmo corpo", async () => {
  const reader = await testReader();
  const first = await search(reader.nome);
  expect(first.cache).toBe("MISS");
  const second = await search(reader.nome);
  expect(second.cache).toBe("HIT");
  expect(second.readers).toEqual(first.readers);
});

test("UC10: termos que diferem só em espaços nas pontas ou maiúsculas compartilham o resultado", async () => {
  const reader = await testReader();
  const first = await search(`   ${reader.nome.toLowerCase()}   `);
  expect(first.cache).toBe("MISS");
  const second = await search(reader.nome.toUpperCase());
  expect(second.cache).toBe("HIT");
  expect(second.readers).toEqual(first.readers);
});

test("UC10: sem q e com q vazio compartilham o resultado", async () => {
  await search("");
  await invalidateReaderSearch();
  const first = await search();
  expect(first.cache).toBe("MISS");
  const second = await search("");
  expect(second.cache).toBe("HIT");
  expect(second.readers).toEqual(first.readers);
});

test("UC10: cadastrar, editar e excluir leitor invalidam o cache", async () => {
  await search("");
  expect((await search("")).cache).toBe("HIT");

  const reader = await testReader();
  const afterCreate = await search("");
  expect(afterCreate.cache).toBe("MISS");
  expect(afterCreate.readers.some((r) => r.id === reader.id)).toBe(true);

  const renamed = testName("Leitor Atualizado");
  await search(renamed);
  const updateRes = await api("PUT", `/leitores/${reader.id}`, {
    nome: renamed,
    cpf: reader.cpf,
    email: `${crypto.randomUUID()}@exemplo.com`,
    telefone: "27999998888",
  });
  expect(updateRes.status).toBe(200);

  const afterUpdate = await search(renamed);
  expect(afterUpdate.cache).toBe("MISS");
  expect(afterUpdate.readers.map((r) => r.id)).toEqual([reader.id]);
  expect(afterUpdate.readers[0]!.nome).toBe(renamed);

  const deleteRes = await api("DELETE", `/leitores/${reader.id}`);
  expect(deleteRes.status).toBe(204);

  const afterDelete = await search(renamed);
  expect(afterDelete.cache).toBe("MISS");
  expect(afterDelete.readers).toEqual([]);
});

test("UC10: depois de um seed (POST /api/seed), a próxima busca é MISS", async () => {
  await search("");
  expect((await search("")).cache).toBe("HIT");
  try {
    const seedRes = await api("POST", "/seed");
    expect(seedRes.status).toBe(200);
    const afterSeed = await search("");
    expect(afterSeed.cache).toBe("MISS");
  } finally {
    await cleanTestCatalog();
    await sql`DELETE FROM leitores WHERE id IN (SELECT registro_id FROM seed_registros WHERE entidade = 'leitores')`;
    await sql`DELETE FROM seed_registros`;
    await sql`DELETE FROM seed_execucoes`;
    await sql`UPDATE autores SET livros_no_acervo = 0`;
  }
});

test("UC10: resultado velho gravado numa geração antiga não é lido", async () => {
  const term = testName("TermoLeitor");
  const read = await readCachedSearch(term);
  expect(read!.readers).toBeNull();
  // simula escrita entre a leitura no Postgres e a gravação no Redis
  await invalidateReaderSearch();
  await writeCachedSearch(term, read!.generation, [
    { id: 999999, name: "Velho", cpf: "12345678901", email: "velho@exemplo.com", phone: "27999999999" },
  ]);
  expect((await readCachedSearch(term))!.readers).toBeNull();
});

test("UC10: sem Redis a busca responde BYPASS do Postgres e invalidação não falha", async () => {
  const reader = await testReader();
  const dead = createRedis("redis://127.0.0.1:1", { autoReconnect: false });
  const result = await searchReadersCached(reader.nome, dead);
  expect(result.cache).toBe("BYPASS");
  expect(result.readers.map((r) => r.id)).toEqual([reader.id]);
  await expect(invalidateReaderSearch(dead)).resolves.toBeUndefined();
});

test("UC10: cada termo guardado expira sozinho (TTL)", async () => {
  if (!redis) return;
  const reader = await testReader();
  await search(reader.nome);
  await ready(redis);
  const current = await readCachedSearch(reader.nome);
  expect(current).not.toBeNull();
  const key = redisKey("leitores", "buscas", String(current!.generation));
  const fieldName = `q:${reader.nome.trim().toLocaleLowerCase("pt-BR")}`;
  const response = (await redis.send("HTTL", [key, "FIELDS", "1", fieldName])) as number[];
  expect(Array.isArray(response)).toBe(true);
  expect(response[0]).toBeGreaterThan(0);
  expect(response[0]).toBeLessThanOrEqual(60);
});
