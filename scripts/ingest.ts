import { closePool, exec, type Movie, oracledb, query } from "../src/db.ts";
import {
  fetchGenreMap,
  fetchPopular,
  type TmdbPopularResponse,
} from "../src/tmdb.ts";

const PAGES = 25;
const SLEEP_MS = 50;
const CACHE_DIR = new URL("./cache/", import.meta.url);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readCache<T>(name: string): Promise<T | null> {
  try {
    const text = await Deno.readTextFile(new URL(name, CACHE_DIR));
    return JSON.parse(text) as T;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return null;
    throw e;
  }
}

async function writeCache(name: string, value: unknown): Promise<void> {
  await Deno.mkdir(CACHE_DIR, { recursive: true });
  await Deno.writeTextFile(
    new URL(name, CACHE_DIR),
    JSON.stringify(value, null, 2),
  );
}

async function cachedGenreMap(): Promise<Map<number, string>> {
  const cached = await readCache<[number, string][]>("genres.json");
  if (cached) return new Map(cached);
  const map = await fetchGenreMap();
  await writeCache("genres.json", [...map.entries()]);
  return map;
}

async function cachedPopular(page: number): Promise<TmdbPopularResponse> {
  const name = `page-${page}.json`;
  const cached = await readCache<TmdbPopularResponse>(name);
  if (cached) return cached;
  const data = await fetchPopular(page);
  await writeCache(name, data);
  return data;
}

function buildText(m: Pick<Movie, "title" | "genres" | "overview">): string {
  const genres = m.genres ?? [];
  const genreLine = genres.length ? `Genres: ${genres.join(", ")}.` : "";
  return [m.title + ".", genreLine, m.overview ?? ""].filter(Boolean).join(" ");
}

const MERGE_SQL = `
  MERGE INTO movies m
  USING (SELECT :id AS id FROM dual) s ON (m.id = s.id)
  WHEN MATCHED THEN UPDATE SET
    title        = :title,
    overview     = :overview,
    release_date = :rdate,
    poster_path  = :poster,
    genres       = :genres,
    vote_average = :vote,
    embedding    = VECTOR_EMBEDDING(ALL_MINILM_L6_V2 USING :etext AS data)
  WHEN NOT MATCHED THEN INSERT
    (id, title, overview, release_date, poster_path, genres, vote_average, embedding)
  VALUES
    (:id, :title, :overview, :rdate, :poster, :genres, :vote,
     VECTOR_EMBEDDING(ALL_MINILM_L6_V2 USING :etext AS data))
`;

async function main() {
  const genres = await cachedGenreMap();
  console.log(`Loaded ${genres.size} TMDB genres.`);

  let total = 0;
  for (let page = 1; page <= PAGES; page++) {
    const data = await cachedPopular(page);
    for (const m of data.results) {
      const movieGenres = m.genre_ids
        .map((id) => genres.get(id))
        .filter((g): g is string => !!g);
      const overview = m.overview ?? "";
      await exec(MERGE_SQL, {
        id: m.id,
        title: m.title,
        overview,
        rdate: m.release_date ?? "",
        poster: m.poster_path,
        genres: { val: movieGenres, type: oracledb.DB_TYPE_JSON },
        vote: m.vote_average ?? 0,
        etext: buildText({
          title: m.title,
          genres: movieGenres,
          overview,
        }),
      });
    }
    total += data.results.length;
    console.log(
      `page ${page}/${PAGES} → +${data.results.length} (total ${total})`,
    );
    await sleep(SLEEP_MS);
  }

  const [{ N: n }] = await query<{ N: number }>(
    `SELECT COUNT(*) AS n FROM movies WHERE embedding IS NOT NULL`,
  );
  console.log(`movies table now has ${n} rows with embeddings.`);
}

if (import.meta.main) {
  try {
    await main();
  } finally {
    await closePool();
  }
}
