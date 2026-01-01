/**
 * Seed script to populate the database with sample VTuber music data
 * Run with: pnpm tsx scripts/seed-data.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  vtubers,
  songs,
  tags,
  songTags,
  playlists,
  playlistSongs,
  favorites,
  playHistory,
} from "../drizzle/schema";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("🌱 Seeding database...");

  // Clean up existing data
  console.log("Cleaning up existing data...");
  try {
    await db.delete(songTags);
    await db.delete(playlistSongs);
    await db.delete(favorites);
    await db.delete(playHistory);
    await db.delete(playlists);
    await db.delete(songs);
    await db.delete(tags);
    await db.delete(vtubers);
    console.log("✓ Cleanup completed");
  } catch (error) {
    console.log("Note: Some tables may not exist yet, continuing...");
  }

  // Insert VTubers
  console.log("Adding VTubers...");
  const vtuberIds: Record<string, number> = {};

  const vtuberData = [
    {
      name: "星街すいせい",
      avatarUrl: "https://via.placeholder.com/150",
      channelUrl: "https://www.youtube.com/@HoshimachiSuisei",
      description: "ホロライブ所属のVTuber、歌唱力に定評がある",
    },
    {
      name: "宝鐘マリン",
      avatarUrl: "https://via.placeholder.com/150",
      channelUrl: "https://www.youtube.com/@HoushouMarine",
      description: "ホロライブ所属のVTuber、海賊船長",
    },
    {
      name: "天音かなた",
      avatarUrl: "https://via.placeholder.com/150",
      channelUrl: "https://www.youtube.com/@AmaneKanata",
      description: "ホロライブ所属のVTuber、天使",
    },
    {
      name: "常闇トワ",
      avatarUrl: "https://via.placeholder.com/150",
      channelUrl: "https://www.youtube.com/@TokoYami",
      description: "ホロライブ所属のVTuber、悪魔",
    },
    {
      name: "AZKi",
      avatarUrl: "https://via.placeholder.com/150",
      channelUrl: "https://www.youtube.com/@AZKi",
      description: "ホロライブ所属のVTuber、音楽特化",
    },
  ];

  for (const vtuber of vtuberData) {
    const result: any = await db.insert(vtubers).values(vtuber);
    // Get the inserted ID from the result
    const insertedId = result[0]?.insertId || result.insertId;
    vtuberIds[vtuber.name] = insertedId;
    console.log(`  Added ${vtuber.name} with ID: ${insertedId}`);
  }
  console.log("VTuber IDs:", vtuberIds);

  // Insert Tags
  console.log("Adding tags...");
  const tagIds: Record<string, number> = {};

  const tagData = [
    "J-POP",
    "アニソン",
    "ボカロ",
    "オリジナル曲",
    "バラード",
    "ロック",
    "アップテンポ",
    "コラボ",
  ];

  for (const tagName of tagData) {
    const result: any = await db.insert(tags).values({ name: tagName });
    const insertedId = result[0]?.insertId || result.insertId;
    tagIds[tagName] = insertedId;
  }

  // Insert Songs
  console.log("Adding songs...");
  const songData = [
    {
      title: "Stellar Stellar",
      vtuberId: vtuberIds["星街すいせい"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=a51VH9BYzZA",
      duration: 243,
      genre: "original",
      originalSong: null,
      uploadDate: new Date("2021-09-19"),
      viewCount: 15000000,
      tags: ["オリジナル曲", "J-POP", "アップテンポ"],
    },
    {
      title: "GHOST",
      vtuberId: vtuberIds["星街すいせい"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=IKKar5SS29E",
      duration: 221,
      genre: "original",
      originalSong: null,
      uploadDate: new Date("2022-03-23"),
      viewCount: 12000000,
      tags: ["オリジナル曲", "J-POP", "ロック"],
    },
    {
      title: "キングダム (Cover)",
      vtuberId: vtuberIds["星街すいせい"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example1",
      duration: 198,
      genre: "cover",
      originalSong: "キングダム",
      uploadDate: new Date("2023-01-15"),
      viewCount: 5000000,
      tags: ["J-POP", "アップテンポ"],
    },
    {
      title: "宝島 (Cover)",
      vtuberId: vtuberIds["宝鐘マリン"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example2",
      duration: 205,
      genre: "cover",
      originalSong: "宝島",
      uploadDate: new Date("2022-08-10"),
      viewCount: 8000000,
      tags: ["J-POP", "アップテンポ"],
    },
    {
      title: "Unison (Cover)",
      vtuberId: vtuberIds["宝鐘マリン"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example3",
      duration: 234,
      genre: "cover",
      originalSong: "Unison",
      uploadDate: new Date("2023-02-20"),
      viewCount: 4500000,
      tags: ["アニソン", "バラード"],
    },
    {
      title: "残酷な天使のテーゼ (Cover)",
      vtuberId: vtuberIds["天音かなた"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example4",
      duration: 245,
      genre: "cover",
      originalSong: "残酷な天使のテーゼ",
      uploadDate: new Date("2022-11-05"),
      viewCount: 6000000,
      tags: ["アニソン", "アップテンポ"],
    },
    {
      title: "残酷な天使のテーゼ (Cover)",
      vtuberId: vtuberIds["常闇トワ"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example5",
      duration: 248,
      genre: "cover",
      originalSong: "残酷な天使のテーゼ",
      uploadDate: new Date("2023-03-12"),
      viewCount: 3500000,
      tags: ["アニソン", "ロック"],
    },
    {
      title: "千本桜 (Cover)",
      vtuberId: vtuberIds["AZKi"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example6",
      duration: 241,
      genre: "cover",
      originalSong: "千本桜",
      uploadDate: new Date("2022-06-18"),
      viewCount: 7000000,
      tags: ["ボカロ", "アップテンポ"],
    },
    {
      title: "千本桜 (Cover)",
      vtuberId: vtuberIds["星街すいせい"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example7",
      duration: 239,
      genre: "cover",
      originalSong: "千本桜",
      uploadDate: new Date("2021-12-25"),
      viewCount: 9000000,
      tags: ["ボカロ", "アップテンポ"],
    },
    {
      title: "歌枠アーカイブ #1",
      vtuberId: vtuberIds["宝鐘マリン"],
      thumbnailUrl: "https://via.placeholder.com/480x360",
      videoUrl: "https://www.youtube.com/watch?v=example8",
      duration: 3600,
      genre: "singing_stream",
      originalSong: null,
      uploadDate: new Date("2023-04-01"),
      viewCount: 2000000,
      tags: ["J-POP", "アニソン"],
    },
  ];

  for (const song of songData) {
    const { tags: songTagNames, ...songWithoutTags } = song;
    const result: any = await db.insert(songs).values(songWithoutTags);
    const songId = result[0]?.insertId || result.insertId;

    // Add tags to song
    for (const tagName of songTagNames) {
      if (tagIds[tagName]) {
        await db.insert(songTags).values({
          songId,
          tagId: tagIds[tagName],
        });
      }
    }
  }

  // Update VTuber song counts
  console.log("Updating VTuber song counts...");
  for (const [name, id] of Object.entries(vtuberIds)) {
    const songCount = songData.filter((s) => s.vtuberId === id).length;
    await db
      .update(vtubers)
      .set({ songCount })
      .where(eq(vtubers.id, id));
  }

  console.log("✅ Seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
