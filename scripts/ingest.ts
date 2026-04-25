import { sql } from "drizzle-orm";
import { db, movies } from "../src/db.ts";
import { fetchGenreMap, fetchPopular } from "../src/tmdb.ts";

const PAGES = 25;
const SLEEP_MS = 50;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const genres = await fetchGenreMap();
  console.log(`Loaded ${genres.size} TMDB genres.`);

  let total = 0;
  for (let page = 1; page <= PAGES; page++) {
    const data = await fetchPopular(page);
    const rows = data.results.map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview ?? "",
      release_date: m.release_date ?? "",
      poster_path: m.poster_path,
      genres: m.genre_ids
        .map((id) => genres.get(id))
        .filter((g): g is string => !!g),
      vote_average: m.vote_average ?? 0,
    }));

    await db.insert(movies).values(rows).onConflictDoUpdate({
      target: movies.id,
      set: {
        title: sql`excluded.title`,
        overview: sql`excluded.overview`,
        release_date: sql`excluded.release_date`,
        poster_path: sql`excluded.poster_path`,
        genres: sql`excluded.genres`,
        vote_average: sql`excluded.vote_average`,
      },
    });

    total += rows.length;
    console.log(`page ${page}/${PAGES} → +${rows.length} (total ${total})`);
    await sleep(SLEEP_MS);
  }

  const n = await db.$count(movies);
  console.log(`movies table now has ${n} rows.`);
}

if (import.meta.main) {
  await main();
}
