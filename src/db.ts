import oracledb from "oracledb";

oracledb.fetchAsString = [oracledb.CLOB];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

await oracledb.createPool({
  user: Deno.env.get("ORACLE_USER")!,
  password: Deno.env.get("ORACLE_PASSWORD")!,
  connectString: Deno.env.get("ORACLE_CONNECT_STRING")!,
  poolMin: 1,
  poolMax: 4,
});

export interface Movie {
  id: number;
  title: string;
  overview: string | null;
  release_date: string | null;
  poster_path: string | null;
  genres: string[] | null;
  vote_average: number | null;
}

type Binds = Record<string, unknown> | unknown[];

export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: Binds = {},
): Promise<T[]> {
  const c = await oracledb.getConnection();
  try {
    const r = await c.execute<T>(sql, binds);
    return r.rows ?? [];
  } finally {
    await c.close();
  }
}

export async function exec(sql: string, binds: Binds = {}): Promise<void> {
  const c = await oracledb.getConnection();
  try {
    await c.execute(sql, binds);
  } finally {
    await c.close();
  }
}

export const closePool = () => oracledb.getPool().close(0);

export { oracledb };
