import { getDb } from "../server/db";
import { songs } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  // Get all unique genres
  const result = await db
    .select({ genre: songs.genre })
    .from(songs)
    .groupBy(songs.genre);

  console.log("Available genres:");
  result.forEach((row) => {
    console.log(`  - ${row.genre}`);
  });

  // Count songs by genre
  console.log("\nSongs count by genre:");
  for (const row of result) {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(songs)
      .where(sql`${songs.genre} = ${row.genre}`);
    console.log(`  - ${row.genre}: ${count[0].count} songs`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
