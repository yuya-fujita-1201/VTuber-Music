/**
 * YouTube Data API integration for fetching VTuber music content
 * 
 * Note: This requires a YouTube Data API key to be set in environment variables
 * Get your API key from: https://console.cloud.google.com/apis/credentials
 */

import axios from "axios";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  viewCount: number;
  publishedAt: string;
  videoUrl: string;
}

/**
 * Parse ISO 8601 duration format (e.g., "PT4M8S") to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Search for VTuber music videos on YouTube
 */
export async function searchVTuberSongs(
  query: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YouTube API key not configured. Using mock data.");
    return [];
  }

  try {
    // Step 1: Search for videos
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        videoCategoryId: "10", // Music category
        maxResults,
        key: apiKey,
      },
    });

    const videoIds = searchResponse.data.items
      .map((item: any) => item.id.videoId)
      .join(",");

    if (!videoIds) {
      return [];
    }

    // Step 2: Get video details (duration, view count, etc.)
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
        key: apiKey,
      },
    });

    const videos: YouTubeVideo[] = detailsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount || "0", 10),
      publishedAt: item.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
    }));

    return videos;
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return [];
  }
}

/**
 * Get videos from a specific YouTube channel
 */
export async function getChannelVideos(
  channelId: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YouTube API key not configured. Using mock data.");
    return [];
  }

  try {
    // Step 1: Get channel uploads playlist
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: "contentDetails",
        id: channelId,
        key: apiKey,
      },
    });

    const uploadsPlaylistId =
      channelResponse.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return [];
    }

    // Step 2: Get videos from uploads playlist
    const playlistResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
      params: {
        part: "snippet",
        playlistId: uploadsPlaylistId,
        maxResults,
        key: apiKey,
      },
    });

    const videoIds = playlistResponse.data.items
      .map((item: any) => item.snippet.resourceId.videoId)
      .join(",");

    if (!videoIds) {
      return [];
    }

    // Step 3: Get video details
    const detailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
        key: apiKey,
      },
    });

    const videos: YouTubeVideo[] = detailsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount || "0", 10),
      publishedAt: item.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
    }));

    return videos;
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return [];
  }
}

/**
 * Search for cover songs of a specific original song
 */
export async function searchCoverSongs(
  originalSongTitle: string,
  maxResults: number = 10
): Promise<YouTubeVideo[]> {
  return searchVTuberSongs(`${originalSongTitle} cover 歌ってみた`, maxResults);
}
