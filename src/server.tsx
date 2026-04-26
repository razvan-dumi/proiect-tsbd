import { Hono } from "hono";
import { type Movie, query } from "./db.ts";
import { IndexPage, MoviePage, NotFound } from "./views.tsx";

const app = new Hono();

const MOVIE_COLS = `
  id "id", title "title", overview "overview",
  release_date "release_date", poster_path "poster_path",
  genres "genres", vote_average "vote_average"
`;

app.get("/", async (c) => {
  const list = await query<Movie>(
    `SELECT ${MOVIE_COLS} FROM movies
     ORDER BY vote_average DESC NULLS LAST, id
     FETCH FIRST 100 ROWS ONLY`,
  );
  return c.html(<IndexPage movies={list} />);
});

app.get("/:id{[0-9]+}", async (c) => {
  const id = Number(c.req.param("id"));

  const [movie] = await query<Movie>(
    `SELECT ${MOVIE_COLS} FROM movies WHERE id = :id`,
    { id },
  );
  if (!movie) return c.html(<NotFound />, 404);

  const related = await query<Movie>(
    `SELECT ${MOVIE_COLS}
     FROM   movies
     WHERE  id <> :id AND embedding IS NOT NULL
     ORDER  BY VECTOR_DISTANCE(
                 embedding,
                 (SELECT embedding FROM movies WHERE id = :id),
                 COSINE)
     FETCH  APPROX FIRST 10 ROWS ONLY`,
    { id },
  );

  return c.html(<MoviePage movie={movie} related={related} />);
});

app.notFound((c) => c.html(<NotFound />, 404));

const port = Number(Deno.env.get("PORT") ?? 8000);
Deno.serve({ port }, app.fetch);
