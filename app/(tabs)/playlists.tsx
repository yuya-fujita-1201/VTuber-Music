import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
};

export default function PlaylistsScreen() {
  const { isAuthenticated, user } = useAuth();
  const { data: playlists, isLoading, refetch } = trpc.playlists.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createPlaylistMutation = trpc.playlists.create.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert("成功", "プレイリストを作成しました");
    },
    onError: (error) => {
      Alert.alert("エラー", "プレイリストの作成に失敗しました");
    },
  });

  const handleCreatePlaylist = () => {
    Alert.prompt(
      "新規プレイリスト",
      "プレイリスト名を入力してください",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "作成",
          onPress: (name?: string) => {
            if (name && name.trim()) {
              createPlaylistMutation.mutate({
                name: name.trim(),
                description: "",
              });
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity
      className="bg-surface rounded-lg p-4 mb-3 shadow-sm flex-row items-center"
      activeOpacity={0.7}
    >
      <View className="w-16 h-16 bg-primary/20 rounded-lg items-center justify-center">
        <IconSymbol name="music.note.list" size={32} color="#1DB954" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text className="text-sm text-muted mt-1" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text className="text-xs text-muted mt-2">
          作成日: {new Date(item.createdAt).toLocaleDateString("ja-JP")}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#9CA3AF" />
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
            プレイリストを作成・管理するにはログインしてください
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-3 rounded-full mt-6"
            onPress={() => {
              // ログイン処理はauth hookで実装される
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
        <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-foreground">プレイリスト</Text>
            <Text className="text-sm text-muted mt-1">
              {user?.name || "ゲスト"}のプレイリスト
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary w-12 h-12 rounded-full items-center justify-center"
            onPress={handleCreatePlaylist}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Playlists List */}
        <View className="flex-1 px-6">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted">読み込み中...</Text>
            </View>
          ) : playlists && playlists.length > 0 ? (
            <FlatList
              data={playlists}
              renderItem={renderPlaylistItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <IconSymbol name="music.note.list" size={64} color="#9CA3AF" />
              <Text className="text-lg text-muted mt-4">
                プレイリストがありません
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-8">
                右上の + ボタンから新しいプレイリストを作成できます
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
