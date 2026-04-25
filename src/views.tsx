/** @jsxImportSource hono/jsx */
import type { Movie } from "./db.ts";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const POSTER_BASE_SMALL = "https://image.tmdb.org/t/p/w185";

const css = `
  :root { color-scheme: dark; }
  body { font-family: system-ui, sans-serif; margin: 0; background: #0e0e10; color: #e6e6e6; }
  header { padding: 1rem 2rem; border-bottom: 1px solid #2a2a2e; background: #16161a; }
  header a { color: inherit; text-decoration: none; font-weight: 600; }
  main { padding: 2rem; max-width: 1200px; margin: 0 auto; }
  h1 { margin-top: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
  .card { background: #1c1c21; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: block; transition: transform 0.15s; }
  .card:hover { transform: translateY(-2px); }
  .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; background: #2a2a2e; display: block; }
  .card .meta { padding: 0.5rem 0.75rem; }
  .card .title { font-size: 0.9rem; font-weight: 600; line-height: 1.2; }
  .card .year { font-size: 0.75rem; color: #9a9aa3; margin-top: 0.25rem; }
  .detail { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; align-items: start; }
  .detail img { width: 100%; border-radius: 8px; }
  .badge { display: inline-block; background: #2a2a2e; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; margin-right: 0.4rem; }
  .vote { color: #ffcc4d; font-weight: 600; }
  @media (max-width: 700px) { .detail { grid-template-columns: 1fr; } }
`;

export function Layout(props: { title: string; children: any }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <header>
          <a href="/">🎬 Movie Recommender</a>
        </header>
        <main>{props.children}</main>
      </body>
    </html>
  );
}

function year(date: string | null): string {
  if (!date) return "";
  return date.slice(0, 4);
}

export function MovieCard(props: { movie: Movie; small?: boolean }) {
  const m = props.movie;
  const base = props.small ? POSTER_BASE_SMALL : POSTER_BASE;
  const poster = m.poster_path
    ? `${base}${m.poster_path}`
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>";
  return (
    <a class="card" href={`/${m.id}`}>
      <img src={poster} alt={m.title} loading="lazy" />
      <div class="meta">
        <div class="title">{m.title}</div>
        <div class="year">{year(m.release_date)}</div>
      </div>
    </a>
  );
}

export function IndexPage(props: { movies: Movie[] }) {
  return (
    <Layout title="Movies">
      <h1>Popular Movies</h1>
      <p style="color:#9a9aa3">
        Click any movie to see its details and a list of related movies powered
        by vector search.
      </p>
      <div class="grid">
        {props.movies.map((m) => (
          <MovieCard movie={m} />
        ))}
      </div>
    </Layout>
  );
}

export function MoviePage(props: { movie: Movie; related: Movie[] }) {
  const m = props.movie;
  const genres = m.genres ?? [];
  const poster = m.poster_path
    ? `${POSTER_BASE}${m.poster_path}`
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>";
  return (
    <Layout title={m.title}>
      <div class="detail">
        <img src={poster} alt={m.title} />
        <div>
          <h1 style="margin-bottom:0.25rem">{m.title}</h1>
          <div style="color:#9a9aa3; margin-bottom:1rem">
            {year(m.release_date)}
            {m.vote_average ? (
              <>
                {" "}
                · <span class="vote">★ {m.vote_average.toFixed(1)}</span>
              </>
            ) : null}
          </div>
          <div style="margin-bottom:1rem">
            {genres.map((g) => (
              <span class="badge">{g}</span>
            ))}
          </div>
          <p style="line-height:1.6">{m.overview}</p>
        </div>
      </div>

      <h2 style="margin-top:3rem">Related movies</h2>
      <p style="color:#9a9aa3">
        Nearest neighbours by semantic embedding similarity.
      </p>
      <div class="grid">
        {props.related.map((r) => (
          <MovieCard movie={r} small />
        ))}
      </div>
    </Layout>
  );
}

export function NotFound() {
  return (
    <Layout title="Not found">
      <h1>Movie not found</h1>
      <p>
        <a href="/">← Back to index</a>
      </p>
    </Layout>
  );
}
