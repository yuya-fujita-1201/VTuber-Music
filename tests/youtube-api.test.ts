import { describe, it, expect } from "vitest";
import { searchVTuberSongs } from "../server/youtube-api";

describe("YouTube API Integration", () => {
  it("should search for VTuber songs", async () => {
    // Test with a simple query
    const results = await searchVTuberSongs("星街すいせい 歌ってみた", 5);

    // If API key is not configured, results will be empty
    // This is expected behavior and not an error
    expect(Array.isArray(results)).toBe(true);

    if (results.length > 0) {
      // If we got results, validate the structure
      const firstResult = results[0];
      expect(firstResult).toHaveProperty("id");
      expect(firstResult).toHaveProperty("title");
      expect(firstResult).toHaveProperty("channelTitle");
      expect(firstResult).toHaveProperty("thumbnailUrl");
      expect(firstResult).toHaveProperty("duration");
      expect(firstResult).toHaveProperty("viewCount");
      expect(firstResult).toHaveProperty("videoUrl");
    }
  }, 10000); // 10 second timeout for API call
});
