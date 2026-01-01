import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";

type Song = {
  id: number;
  title: string;
  vtuberName: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
  duration: number;
};

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: Song[];
};

type PlayerContextType = {
  state: PlayerState;
  playSong: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    queue: [],
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentIndexRef = useRef<number>(0);

  // Configure audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSong = useCallback(async (song: Song) => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Update state with the new song
      // The YouTube player in the mini player will handle actual playback
      soundRef.current = null;

      setState((prev) => ({
        ...prev,
        currentSong: song,
        isPlaying: true,
        position: 0,
        duration: song.duration,
      }));
    } catch (error) {
      console.error("Error playing song:", error);
    }
  }, []);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
      } catch (error) {
        console.log("Pause error (ignored):", error);
      }
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
      } catch (error) {
        console.log("Resume error (ignored):", error);
      }
    }
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const seekTo = useCallback(async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position * 1000);
      } catch (error) {
        console.log("Seek error (ignored):", error);
      }
    }
    setState((prev) => ({ ...prev, position }));
  }, []);

  const playNext = useCallback(async () => {
    if (state.queue.length > 0) {
      const nextIndex = (currentIndexRef.current + 1) % state.queue.length;
      currentIndexRef.current = nextIndex;
      await playSong(state.queue[nextIndex]);
    }
  }, [state.queue, playSong]);

  const playPrevious = useCallback(async () => {
    if (state.queue.length > 0) {
      const prevIndex =
        currentIndexRef.current === 0
          ? state.queue.length - 1
          : currentIndexRef.current - 1;
      currentIndexRef.current = prevIndex;
      await playSong(state.queue[prevIndex]);
    }
  }, [state.queue, playSong]);

  const addToQueue = useCallback((song: Song) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, song],
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      queue: [],
    }));
    currentIndexRef.current = 0;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        state,
        playSong,
        pause,
        resume,
        seekTo,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}
