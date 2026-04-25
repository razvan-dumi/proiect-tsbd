const BASE = "https://api.themoviedb.org/3";

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
}

export interface TmdbPopularResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

function apiKey(): string {
  const key = Deno.env.get("TMDB_API_KEY");
  if (!key) throw new Error("TMDB_API_KEY is not set.");
  return key;
}

async function get<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`TMDB ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export function fetchPopular(page: number): Promise<TmdbPopularResponse> {
  return get<TmdbPopularResponse>("/movie/popular", {
    page: String(page),
    language: "en-US",
  });
}

export async function fetchGenreMap(): Promise<Map<number, string>> {
  const data = await get<{ genres: TmdbGenre[] }>("/genre/movie/list", {
    language: "en-US",
  });
  return new Map(data.genres.map((g) => [g.id, g.name]));
}
