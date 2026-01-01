import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";

type Song = {
  id: number;
  title: string;
  vtuberName: string | null;
  thumbnailUrl: string | null;
  duration: number;
  genre: string;
  originalSong: string | null;
  viewCount: number;
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults, refetch } = trpc.songs.search.useQuery(
    {
      query: searchQuery,
      genre: selectedGenre,
    },
    {
      enabled: false,
    }
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      refetch();
    }
  };

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

  const genres = [
    { id: "all", label: "すべて" },
    { id: "cover", label: "カバー曲" },
    { id: "original", label: "オリジナル曲" },
    { id: "singing_stream", label: "歌枠" },
  ];

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      className="flex-row bg-surface rounded-lg p-3 mb-3 shadow-sm"
      activeOpacity={0.7}
      onPress={() => router.push(`/song/${item.id}`)}
    >
      <Image
        source={{ uri: item.thumbnailUrl || "https://via.placeholder.com/80" }}
        className="w-20 h-20 rounded-md"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-sm text-muted mt-1" numberOfLines={1}>
          {item.vtuberName}
        </Text>
        <View className="flex-row items-center mt-2">
          <Text className="text-xs text-muted mr-3">
            {formatViewCount(item.viewCount)}回
          </Text>
          <Text className="text-xs text-muted">
            {formatDuration(item.duration)}
          </Text>
          {item.originalSong && (
            <View className="ml-2 bg-primary/20 px-2 py-1 rounded">
              <Text className="text-xs text-primary font-medium">カバー</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">検索</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-surface rounded-full px-4 py-3 border border-border">
            <IconSymbol name="magnifyingglass" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-foreground"
              placeholder="楽曲名、VTuber名で検索"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Genre Filters */}
        <View className="px-6 mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {genres.map((genre) => (
              <TouchableOpacity
                key={genre.id}
                className={`px-5 py-2 rounded-full ${
                  selectedGenre === genre.id || (!selectedGenre && genre.id === "all")
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
                onPress={() => {
                  setSelectedGenre(genre.id === "all" ? undefined : genre.id);
                  if (isSearching) {
                    refetch();
                  }
                }}
              >
                <Text
                  className={`font-semibold ${
                    selectedGenre === genre.id || (!selectedGenre && genre.id === "all")
                      ? "text-background"
                      : "text-foreground"
                  }`}
                >
                  {genre.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Results */}
        <View className="flex-1 px-6">
          {!isSearching ? (
            <View className="flex-1 items-center justify-center">
              <IconSymbol name="music.note" size={64} color="#9CA3AF" />
              <Text className="text-lg text-muted mt-4">楽曲を検索してください</Text>
            </View>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text className="text-sm text-muted mb-3">
                  {searchResults.length}件の結果
                </Text>
              }
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <IconSymbol name="exclamationmark.triangle" size={64} color="#9CA3AF" />
              <Text className="text-lg text-muted mt-4">検索結果が見つかりません</Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
