import { closePool, exec } from "../src/db.ts";

async function main() {
  await exec(`DELETE FROM movies`);
  console.log("movies table cleared.");
}

if (import.meta.main) {
  try {
    await main();
  } finally {
    await closePool();
  }
}
