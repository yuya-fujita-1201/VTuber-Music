import { describe, it, expect } from "vitest";

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

describe("YouTube Player", () => {
  describe("extractYouTubeVideoId", () => {
    it("should extract video ID from standard YouTube URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from short YouTube URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from embed YouTube URL", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe("dQw4w9WgXcQ");
    });

    it("should extract video ID from YouTube URL with additional parameters", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe("dQw4w9WgXcQ");
    });

    it("should return null for invalid URL", () => {
      const url = "https://example.com/video";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBeNull();
    });

    it("should handle real VTuber song URLs", () => {
      const url = "https://www.youtube.com/watch?v=5y3xh8gs24c";
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe("5y3xh8gs24c");
    });
  });
});
