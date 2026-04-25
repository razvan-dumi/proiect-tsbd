import { Database } from "@db/sqlite";
import * as sqliteVec from "sqlite-vec";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema.ts";

Deno.mkdirSync("data", { recursive: true });

const sqlite = new Database("data/movies.db");
sqlite.enableLoadExtension = true;
sqlite.loadExtension(sqliteVec.getLoadablePath());

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id            INTEGER PRIMARY KEY,
    title         TEXT NOT NULL,
    overview      TEXT,
    release_date  TEXT,
    poster_path   TEXT,
    genres        TEXT,
    vote_average  REAL
  );
`);
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS movie_vec USING vec0(
    movie_id  INTEGER PRIMARY KEY,
    embedding FLOAT[384]
  );
`);

type ProxyMethod = "run" | "all" | "values" | "get";

export const db = drizzle(
  (sql: string, params: unknown[], method: ProxyMethod) => {
    const args = params.map((p) => (p === undefined ? null : p)) as never[];
    const stmt = sqlite.prepare(sql);
    if (method === "run") {
      stmt.run(...args);
      return Promise.resolve({ rows: [] });
    }
    if (method === "get") {
      const row = [...stmt.values(...args)][0] ?? [];
      return Promise.resolve({ rows: row });
    }
    const rows = [...stmt.values(...args)];
    return Promise.resolve({ rows });
  },
  { schema },
);

export { sqlite };
export * from "./schema.ts";
