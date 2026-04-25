import { customType, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const bytes = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "blob",
});

export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  overview: text("overview"),
  release_date: text("release_date"),
  poster_path: text("poster_path"),
  genres: text("genres", { mode: "json" }).$type<string[]>(),
  vote_average: real("vote_average"),
});

export const movieVec = sqliteTable("movie_vec", {
  movie_id: integer("movie_id").primaryKey(),
  embedding: bytes("embedding"),
});

export type Movie = typeof movies.$inferSelect;
export type MovieInsert = typeof movies.$inferInsert;
export type MovieVecRow = typeof movieVec.$inferSelect;
