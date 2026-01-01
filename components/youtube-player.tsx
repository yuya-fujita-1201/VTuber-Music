import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

type YouTubePlayerProps = {
  videoUrl: string;
  className?: string;
};

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
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

/**
 * YouTube Player Component using expo-video
 * 
 * Note: expo-video cannot directly play YouTube URLs due to CORS restrictions.
 * This component uses YouTube's embed URL which works on web but may have limitations on native.
 * 
 * For production, consider:
 * 1. Using react-native-youtube-iframe for native platforms
 * 2. Or implementing a backend service to extract video streams
 */
export function YouTubePlayer({ videoUrl, className }: YouTubePlayerProps) {
  const videoId = extractYouTubeVideoId(videoUrl);
  
  if (!videoId) {
    return null;
  }

  // For web platform, use YouTube embed
  if (Platform.OS === "web") {
    return (
      <View className={className} style={styles.container}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1`}
          style={{ width: "100%", height: "100%", border: "none" } as any}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }

  // For native platforms, we'll show a message
  // In production, you would use react-native-youtube-iframe or similar
  return (
    <View className={className} style={styles.container}>
      <View style={styles.placeholder}>
        {/* Placeholder for native YouTube player */}
        {/* Install react-native-youtube-iframe for native support */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
});
