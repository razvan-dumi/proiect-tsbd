import { eq, isNull } from "drizzle-orm";
import { db, type Movie, movies, movieVec } from "../src/db.ts";
import { embed } from "../src/embed.ts";

function buildText(m: Movie): string {
  const genres = m.genres ?? [];
  const genreLine = genres.length ? `Genres: ${genres.join(", ")}.` : "";
  return [m.title + ".", genreLine, m.overview ?? ""].filter(Boolean).join(" ");
}

async function main() {
  const pending = await db
    .select()
    .from(movies)
    .leftJoin(movieVec, eq(movieVec.movie_id, movies.id))
    .where(isNull(movieVec.movie_id));

  const list: Movie[] = pending.map((r) => r.movies);
  console.log(`${list.length} movies need embeddings.`);

  let i = 0;
  for (const m of list) {
    const vec = await embed(buildText(m));
    await db.insert(movieVec).values({
      movie_id: m.id,
      embedding: new Uint8Array(vec.buffer, vec.byteOffset, vec.byteLength),
    });
    i++;
    if (i % 25 === 0 || i === list.length) {
      console.log(`embedded ${i}/${list.length}`);
    }
  }

  const n = await db.$count(movieVec);
  console.log(`movie_vec table now has ${n} rows.`);
}

if (import.meta.main) {
  await main();
}
