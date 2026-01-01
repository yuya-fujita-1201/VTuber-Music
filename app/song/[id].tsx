import {
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePlayer } from "@/lib/player-context";
import { useAuth } from "@/hooks/use-auth";
import { YouTubePlayer } from "@/components/youtube-player";

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const songId = parseInt(id || "0", 10);

  const { data: song, isLoading } = trpc.songs.getById.useQuery({ id: songId });
  const { data: relatedSongs } = trpc.songs.related.useQuery({ songId, limit: 10 });
  const { data: tags } = trpc.tags.forSong.useQuery({ songId });

  const { isAuthenticated } = useAuth();
  const { playSong, state: playerState } = usePlayer();

  const addFavoriteMutation = trpc.favorites.add.useMutation();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();
  const { data: isFavorite, refetch: refetchFavorite } = trpc.favorites.check.useQuery(
    { songId },
    { enabled: isAuthenticated }
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViewCount = (count: number | null) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handlePlay = () => {
    if (song) {
      playSong({
        id: song.id,
        title: song.title,
        vtuberName: song.vtuberName,
        thumbnailUrl: song.thumbnailUrl,
        videoUrl: song.videoUrl,
        duration: song.duration,
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert("お気に入りに追加するにはログインが必要です");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavoriteMutation.mutateAsync({ songId });
      } else {
        await addFavoriteMutation.mutateAsync({ songId });
      }
      refetchFavorite();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const renderRelatedSongItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="flex-row bg-surface rounded-lg p-3 mb-3 shadow-sm"
      activeOpacity={0.7}
      onPress={() => router.push(`/song/${item.id}`)}
    >
      <Image
        source={{ uri: item.thumbnailUrl || "https://via.placeholder.com/60" }}
        className="w-16 h-16 rounded-md"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted mt-1" numberOfLines={1}>
          {item.vtuberName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading || !song) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isCurrentlyPlaying = playerState.currentSong?.id === song.id && playerState.isPlaying;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header with back button */}
        <View className="px-6 pt-4 pb-2 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <IconSymbol name="chevron.left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">楽曲詳細</Text>
        </View>

        {/* YouTube Player */}
        <View className="px-6 pt-4 pb-6">
          <YouTubePlayer videoUrl={song.videoUrl} className="w-full" />
        </View>

        {/* Song Cover (Fallback) */}
        {/* Uncomment if you want to show thumbnail as fallback
        <View className="px-6 pt-4 pb-6 items-center">
          <Image
            source={{ uri: song.thumbnailUrl || "https://via.placeholder.com/300" }}
            className="w-80 h-80 rounded-2xl shadow-lg"
            resizeMode="cover"
          />
        </View>
        */}

        {/* Song Info */}
        <View className="px-6 pb-4">
          <Text className="text-2xl font-bold text-foreground">{song.title}</Text>
          <Text className="text-lg text-muted mt-2">{song.vtuberName}</Text>

          {song.originalSong && (
            <View className="mt-3 bg-primary/20 px-3 py-2 rounded-lg self-start">
              <Text className="text-sm text-primary font-medium">
                カバー曲: {song.originalSong}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-4 gap-4">
            <View className="flex-row items-center">
              <IconSymbol name="play.circle" size={16} color="#9CA3AF" />
              <Text className="text-sm text-muted ml-1">
                {formatViewCount(song.viewCount)}回
              </Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="clock" size={16} color="#9CA3AF" />
              <Text className="text-sm text-muted ml-1">
                {formatDuration(song.duration)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="music.note" size={16} color="#9CA3AF" />
              <Text className="text-sm text-muted ml-1 capitalize">{song.genre}</Text>
            </View>
          </View>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <View key={tag.id} className="bg-surface px-3 py-1 rounded-full border border-border">
                  <Text className="text-xs text-foreground">{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-6 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary py-4 rounded-full flex-row items-center justify-center"
            onPress={handlePlay}
          >
            <IconSymbol
              name={isCurrentlyPlaying ? "pause.fill" : "play.fill"}
              size={24}
              color="#FFFFFF"
            />
            <Text className="text-background font-bold text-lg ml-2">
              {isCurrentlyPlaying ? "一時停止" : "再生"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface py-4 px-6 rounded-full border border-border"
            onPress={handleToggleFavorite}
          >
            <IconSymbol
              name={isFavorite ? "heart.fill" : "heart"}
              size={24}
              color={isFavorite ? "#FF6B9D" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Related Songs */}
        {relatedSongs && relatedSongs.length > 0 && (
          <View className="px-6 pb-8">
            <Text className="text-xl font-bold text-foreground mb-4">関連楽曲</Text>
            <FlatList
              data={relatedSongs}
              renderItem={renderRelatedSongItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
