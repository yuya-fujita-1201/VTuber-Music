import { View, Text, Image, TouchableOpacity, Platform } from "react-native";
import { usePlayer } from "@/lib/player-context";
import { IconSymbol } from "./ui/icon-symbol";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MiniPlayer() {
  const { state, pause, resume, playNext } = usePlayer();
  const insets = useSafeAreaInsets();

  if (!state.currentSong) {
    return null;
  }

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleOpenDetail = () => {
    if (state.currentSong) {
      router.push(`/song/${state.currentSong.id}`);
    }
  };

  return (
    <View
      className="absolute left-0 right-0 bg-surface border-t border-border"
      style={{ bottom: tabBarHeight }}
    >
      <TouchableOpacity
        className="flex-row items-center px-4 py-3"
        activeOpacity={0.8}
        onPress={handleOpenDetail}
      >
        {/* Thumbnail */}
        <Image
          source={{
            uri: state.currentSong.thumbnailUrl || "https://via.placeholder.com/50",
          }}
          className="w-12 h-12 rounded-md"
          resizeMode="cover"
        />

        {/* Song Info */}
        <View className="flex-1 mx-3">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {state.currentSong.title}
          </Text>
          <Text className="text-xs text-muted mt-1" numberOfLines={1}>
            {state.currentSong.vtuberName}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={handlePlayPause} activeOpacity={0.6}>
            <IconSymbol
              name={state.isPlaying ? "pause.fill" : "play.fill"}
              size={28}
              color="#1DB954"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} activeOpacity={0.6}>
            <IconSymbol name="forward.fill" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View className="h-1 bg-border">
        <View
          className="h-full bg-primary"
          style={{
            width: `${state.duration > 0 ? (state.position / state.duration) * 100 : 0}%`,
          }}
        />
      </View>
    </View>
  );
}
