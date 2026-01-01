import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

type Song = {
  id: number | null;
  title: string | null;
  vtuberName: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number | null;
  favoritedAt?: Date;
  playedAt?: Date;
};

export default function LibraryScreen() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");

  const { data: favorites, isLoading: favoritesLoading } = trpc.favorites.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const { data: history, isLoading: historyLoading } = trpc.history.list.useQuery(
    { limit: 50 },
    {
      enabled: isAuthenticated,
    }
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

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      className="flex-row bg-surface rounded-lg p-3 mb-3 shadow-sm"
      activeOpacity={0.7}
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
        </View>
      </View>
      <View className="justify-center">
        <IconSymbol name="ellipsis" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <IconSymbol name="person.crop.circle" size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold text-foreground mt-4">
            ログインが必要です
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            お気に入りや再生履歴を表示するにはログインしてください
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-3 rounded-full mt-6"
            onPress={() => {
              Alert.alert("ログイン", "ログイン機能は実装中です");
            }}
          >
            <Text className="text-background font-semibold">ログイン</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">ライブラリ</Text>
          <Text className="text-sm text-muted mt-1">
            {user?.name || "ゲスト"}のライブラリ
          </Text>
        </View>

        {/* Tab Selector */}
        <View className="px-6 mb-4">
          <View className="flex-row bg-surface rounded-full p-1">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full ${
                activeTab === "favorites" ? "bg-primary" : ""
              }`}
              onPress={() => setActiveTab("favorites")}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "favorites" ? "text-background" : "text-foreground"
                }`}
              >
                お気に入り
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full ${
                activeTab === "history" ? "bg-primary" : ""
              }`}
              onPress={() => setActiveTab("history")}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "history" ? "text-background" : "text-foreground"
                }`}
              >
                再生履歴
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6">
          {activeTab === "favorites" ? (
            favoritesLoading ? (
              <View className="flex-1 items-center justify-center">
                <Text className="text-muted">読み込み中...</Text>
              </View>
            ) : favorites && favorites.length > 0 ? (
              <FlatList
                data={favorites}
                renderItem={renderSongItem}
                keyExtractor={(item) => (item.id || 0).toString()}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <IconSymbol name="heart" size={64} color="#9CA3AF" />
                <Text className="text-lg text-muted mt-4">
                  お気に入りがありません
                </Text>
                <Text className="text-sm text-muted text-center mt-2 px-8">
                  楽曲をお気に入りに追加すると、ここに表示されます
                </Text>
              </View>
            )
          ) : historyLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted">読み込み中...</Text>
            </View>
          ) : history && history.length > 0 ? (
            <FlatList
              data={history}
              renderItem={renderSongItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <IconSymbol name="clock" size={64} color="#9CA3AF" />
              <Text className="text-lg text-muted mt-4">
                再生履歴がありません
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-8">
                楽曲を再生すると、ここに履歴が表示されます
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
