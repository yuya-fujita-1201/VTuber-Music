/**
 * Script to fetch real VTuber music data from YouTube and populate the database
 * 
 * Usage: pnpm tsx scripts/fetch-youtube-data.ts
 */

import { searchVTuberSongs } from "../server/youtube-api";
import { getDb } from "../server/db";
import { vtubers, songs, songTags, tags } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// List of popular VTubers to fetch music from
const VTUBER_QUERIES = [
  "星街すいせい 歌ってみた",
  "宝鐘マリン 歌ってみた",
  "湊あくあ 歌ってみた",
  "白銀ノエル 歌ってみた",
  "不知火フレア 歌ってみた",
  "角巻わため 歌ってみた",
  "常闇トワ 歌ってみた",
  "天音かなた 歌ってみた",
  "雪花ラミィ 歌ってみた",
  "桃鈴ねね 歌ってみた",
];

async function main() {
  console.log("Fetching VTuber music data from YouTube...\n");

  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  for (const query of VTUBER_QUERIES) {
    console.log(`Searching for: ${query}`);
    
    try {
      const videos = await searchVTuberSongs(query, 10);
      
      if (videos.length === 0) {
        console.log(`  ⚠️  No videos found for "${query}"`);
        continue;
      }

      console.log(`  ✓ Found ${videos.length} videos`);

      for (const video of videos) {
        // Check if VTuber already exists
        let vtuber = await db
          .select()
          .from(vtubers)
          .where(eq(vtubers.name, video.channelTitle))
          .limit(1)
          .then((rows: any) => rows[0]);

        // Create VTuber if doesn't exist
        if (!vtuber) {
          const insertResult = await db
            .insert(vtubers)
            .values({
              name: video.channelTitle,
              channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
              avatarUrl: video.thumbnailUrl,
            })
            .$returningId();

          vtuber = {
            id: insertResult[0].id,
            name: video.channelTitle,
            channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
            avatarUrl: video.thumbnailUrl,
            createdAt: new Date(),
          };
        }

        // Check if song already exists
        const existingSong = await db
          .select()
          .from(songs)
          .where(eq(songs.videoUrl, video.videoUrl))
          .limit(1)
          .then((rows: any) => rows[0]);

        if (existingSong) {
          console.log(`    - Skipped (already exists): ${video.title}`);
          continue;
        }

        // Determine genre based on title keywords
        let genre = "pop";
        const titleLower = video.title.toLowerCase();
        if (titleLower.includes("rock") || titleLower.includes("ロック")) {
          genre = "rock";
        } else if (titleLower.includes("jazz") || titleLower.includes("ジャズ")) {
          genre = "jazz";
        } else if (titleLower.includes("ballad") || titleLower.includes("バラード")) {
          genre = "ballad";
        } else if (titleLower.includes("anime") || titleLower.includes("アニメ")) {
          genre = "anime";
        }

        // Extract original song name if it's a cover
        let originalSong = null;
        if (
          titleLower.includes("cover") ||
          titleLower.includes("歌ってみた") ||
          titleLower.includes("カバー")
        ) {
          // Try to extract original song name (simple heuristic)
          const match = video.title.match(/【(.+?)】/) || video.title.match(/「(.+?)」/);
          if (match) {
            originalSong = match[1];
          }
        }

        // Insert song
        await db.insert(songs).values({
          vtuberId: vtuber.id,
          title: video.title,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount,
          genre,
          originalSong,
          uploadDate: new Date(video.publishedAt),
        });

        console.log(`    + Added: ${video.title}`);
      }

      // Add a small delay to avoid hitting API rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ✗ Error fetching "${query}":`, error);
    }
  }

  console.log("\n✓ Finished fetching YouTube data!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
