import { ScrollView, Text, View, TouchableOpacity, Image, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

type Song = {
  id: number;
  title: string;
  vtuberName: string | null;
  thumbnailUrl: string | null;
  duration: number;
  genre: string;
  viewCount: number;
};

export default function HomeScreen() {
  const { data: recentSongs, isLoading } = trpc.songs.list.useQuery({ limit: 20 });
  const { data: coverSongs } = trpc.songs.byGenre.useQuery({ genre: "cover", limit: 10 });
  const { data: originalSongs } = trpc.songs.byGenre.useQuery({ genre: "original", limit: 10 });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderSongCard = (song: Song, index: number) => (
    <TouchableOpacity
      key={`song-${song.id}-${index}`}
      className="w-40 mr-4"
      activeOpacity={0.7}
      onPress={() => router.push(`/song/${song.id}`)}
    >
      <View className="bg-surface rounded-lg overflow-hidden shadow-sm">
        <Image
          source={{ uri: song.thumbnailUrl || "https://via.placeholder.com/160" }}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="p-3">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {song.title}
          </Text>
          <Text className="text-xs text-muted mt-1" numberOfLines={1}>
            {song.vtuberName}
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-muted">
              {formatViewCount(song.viewCount)}回
            </Text>
            <Text className="text-xs text-muted">
              {formatDuration(song.duration)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">ホーム</Text>
          <Text className="text-sm text-muted mt-1">VTuber楽曲を探す</Text>
        </View>

        {/* Recent Songs Section */}
        <View className="mb-6">
          <View className="px-6 mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">最近追加された楽曲</Text>
          </View>
          {isLoading ? (
            <View className="px-6">
              <Text className="text-muted">読み込み中...</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {recentSongs?.map((song, index) => renderSongCard(song, index))}
            </ScrollView>
          )}
        </View>

        {/* Cover Songs Section */}
        <View className="mb-6">
          <View className="px-6 mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">カバー曲</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {coverSongs?.map((song, index) => renderSongCard(song, index))}
          </ScrollView>
        </View>

        {/* Original Songs Section */}
        <View className="mb-6">
          <View className="px-6 mb-3 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">オリジナル曲</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {originalSongs?.map((song, index) => renderSongCard(song, index))}
          </ScrollView>
        </View>

        {/* Genre Quick Access */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-foreground mb-3">ジャンルから探す</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity className="bg-primary px-5 py-3 rounded-full">
              <Text className="text-background font-semibold">カバー曲</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface px-5 py-3 rounded-full border border-border">
              <Text className="text-foreground font-semibold">オリジナル曲</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface px-5 py-3 rounded-full border border-border">
              <Text className="text-foreground font-semibold">歌枠</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
