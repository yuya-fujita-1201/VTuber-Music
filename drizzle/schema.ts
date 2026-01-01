import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// VTuber Music Platform Tables

/**
 * VTubers table - stores information about VTubers
 */
export const vtubers = mysqlTable("vtubers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: text("avatarUrl"),
  channelUrl: text("channelUrl"),
  description: text("description"),
  songCount: int("songCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VTuber = typeof vtubers.$inferSelect;
export type InsertVTuber = typeof vtubers.$inferInsert;

/**
 * Songs table - stores VTuber songs/music videos
 */
export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  vtuberId: int("vtuberId").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  videoUrl: text("videoUrl").notNull(),
  duration: int("duration").notNull(), // in seconds
  genre: varchar("genre", { length: 100 }).notNull(), // cover, original, singing_stream, etc.
  originalSong: varchar("originalSong", { length: 500 }), // for cover songs
  uploadDate: timestamp("uploadDate").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

/**
 * Tags table - stores tags for categorizing songs
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Song Tags junction table - many-to-many relationship between songs and tags
 */
export const songTags = mysqlTable("song_tags", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SongTag = typeof songTags.$inferSelect;
export type InsertSongTag = typeof songTags.$inferInsert;

/**
 * Playlists table - user-created playlists
 */
export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImageUrl: text("coverImageUrl"),
  isPublic: int("isPublic").default(0).notNull(), // 0 = private, 1 = public
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

/**
 * Playlist Songs junction table - many-to-many relationship between playlists and songs
 */
export const playlistSongs = mysqlTable("playlist_songs", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  songId: int("songId").notNull(),
  position: int("position").notNull(), // order in playlist
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type InsertPlaylistSong = typeof playlistSongs.$inferInsert;

/**
 * Favorites table - user's favorite songs
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  songId: int("songId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Play History table - tracks user's listening history
 */
export const playHistory = mysqlTable("play_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  songId: int("songId").notNull(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});

export type PlayHistory = typeof playHistory.$inferSelect;
export type InsertPlayHistory = typeof playHistory.$inferInsert;
