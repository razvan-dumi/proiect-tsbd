import { Hono } from "hono";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, type Movie, movies, movieVec } from "./db.ts";
import { IndexPage, MoviePage, NotFound } from "./views.tsx";

const app = new Hono();

app.get("/", async (c) => {
  const list = await db
    .select()
    .from(movies)
    .orderBy(desc(movies.vote_average), movies.id)
    .limit(100);
  return c.html(<IndexPage movies={list} />);
});

app.get("/:id{[0-9]+}", async (c) => {
  const id = Number(c.req.param("id"));
  const [movie] = await db
    .select()
    .from(movies)
    .where(eq(movies.id, id))
    .limit(1);
  if (!movie) return c.html(<NotFound />, 404);

  const [vec] = await db
    .select()
    .from(movieVec)
    .where(eq(movieVec.movie_id, id))
    .limit(1);

  let related: Movie[] = [];
  if (vec) {
    const neighbours = await db.all<[number, number]>(
      sql`SELECT movie_id, distance
          FROM movie_vec
          WHERE embedding MATCH ${vec.embedding} AND k = ${11}
          ORDER BY distance`,
    );
    console.log(neighbours);
    const ids = neighbours
      .map(([movie_id]) => movie_id)
      .filter((mid) => mid !== id)
      .slice(0, 10);

    if (ids.length) {
      const rows = await db
        .select()
        .from(movies)
        .where(inArray(movies.id, ids));
      const byId = new Map(rows.map((r) => [r.id, r]));
      related = ids.map((i) => byId.get(i)!).filter(Boolean);
    }
  }

  return c.html(<MoviePage movie={movie} related={related} />);
});

app.notFound((c) => c.html(<NotFound />, 404));

const port = Number(Deno.env.get("PORT") ?? 8000);
console.log(`Listening on http://localhost:${port}`);
Deno.serve({ port }, app.fetch);
