import { describe, it, expect, beforeAll } from "vitest";
import * as db from "../server/db";

describe("Database Query Functions", () => {
  describe("VTubers", () => {
    it("should get all VTubers", async () => {
      const vtubers = await db.getAllVTubers();
      expect(Array.isArray(vtubers)).toBe(true);
      if (vtubers.length > 0) {
        expect(vtubers[0]).toHaveProperty("id");
        expect(vtubers[0]).toHaveProperty("name");
      }
    });

    it("should search VTubers by name", async () => {
      const results = await db.searchVTubers("すいせい");
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Songs", () => {
    it("should get all songs with pagination", async () => {
      const songs = await db.getAllSongs(10, 0);
      expect(Array.isArray(songs)).toBe(true);
      expect(songs.length).toBeLessThanOrEqual(10);
      if (songs.length > 0) {
        expect(songs[0]).toHaveProperty("id");
        expect(songs[0]).toHaveProperty("title");
        expect(songs[0]).toHaveProperty("vtuberName");
      }
    });

    it("should search songs by query", async () => {
      const results = await db.searchSongs("Stellar");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should get songs by genre", async () => {
      const coverSongs = await db.getSongsByGenre("cover", 5);
      expect(Array.isArray(coverSongs)).toBe(true);
      if (coverSongs.length > 0) {
        expect(coverSongs[0].genre).toBe("cover");
      }
    });

    it("should get songs by original song name", async () => {
      const results = await db.getSongsByOriginalSong("千本桜");
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0].originalSong).toBe("千本桜");
      }
    });
  });

  describe("Tags", () => {
    it("should get all tags", async () => {
      const tags = await db.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
      if (tags.length > 0) {
        expect(tags[0]).toHaveProperty("id");
        expect(tags[0]).toHaveProperty("name");
      }
    });
  });

  describe("Related Songs", () => {
    it("should get related songs", async () => {
      const allSongs = await db.getAllSongs(1, 0);
      if (allSongs.length > 0) {
        const songId = allSongs[0].id;
        const related = await db.getRelatedSongs(songId, 5);
        expect(Array.isArray(related)).toBe(true);
      }
    });
  });
});
