import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// VTuber Music Platform Queries
// ============================================================================

import {
  songs,
  vtubers,
  tags,
  songTags,
  playlists,
  playlistSongs,
  favorites,
  playHistory,
  InsertSong,
  InsertVTuber,
  InsertTag,
  InsertPlaylist,
  InsertPlaylistSong,
  InsertFavorite,
  InsertPlayHistory,
} from "../drizzle/schema";
import { and, like, or, desc, sql } from "drizzle-orm";

// VTubers
export async function getAllVTubers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vtubers).orderBy(desc(vtubers.songCount));
}

export async function getVTuberById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vtubers).where(eq(vtubers.id, id));
  return result[0] || null;
}

export async function createVTuber(data: InsertVTuber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(vtubers).values(data);
  return (result as any).insertId;
}

export async function searchVTubers(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(vtubers)
    .where(like(vtubers.name, `%${query}%`))
    .orderBy(desc(vtubers.songCount));
}

// Songs
export async function getAllSongs(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songs)
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .orderBy(desc(songs.uploadDate))
    .limit(limit)
    .offset(offset);
}

export async function getSongById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songs)
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(songs.id, id));
  return result[0] || null;
}

export async function getSongsByVTuberId(vtuberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(songs)
    .where(eq(songs.vtuberId, vtuberId))
    .orderBy(desc(songs.uploadDate));
}

export async function createSong(data: InsertSong) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(songs).values(data);
  return (result as any).insertId;
}

export async function searchSongs(
  query: string,
  filters?: {
    genre?: string;
    vtuberId?: number;
    originalSong?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [
    or(like(songs.title, `%${query}%`), like(songs.originalSong, `%${query}%`)),
  ];

  if (filters?.genre) {
    conditions.push(eq(songs.genre, filters.genre));
  }

  if (filters?.vtuberId) {
    conditions.push(eq(songs.vtuberId, filters.vtuberId));
  }

  if (filters?.originalSong) {
    conditions.push(like(songs.originalSong, `%${filters.originalSong}%`));
  }

  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songs)
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(and(...conditions))
    .orderBy(desc(songs.viewCount));
}

export async function getSongsByGenre(genre: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songs)
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(songs.genre, genre))
    .orderBy(desc(songs.uploadDate))
    .limit(limit);
}

export async function getSongsByOriginalSong(originalSong: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songs)
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(songs.originalSong, originalSong))
    .orderBy(desc(songs.viewCount));
}

// Tags
export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(tags.name);
}

export async function createTag(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values({ name });
  return (result as any).insertId;
}

export async function addTagToSong(songId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(songTags).values({ songId, tagId });
}

export async function getTagsForSong(songId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: tags.id,
      name: tags.name,
    })
    .from(songTags)
    .leftJoin(tags, eq(songTags.tagId, tags.id))
    .where(eq(songTags.songId, songId));
}

export async function getSongsByTagId(tagId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
    })
    .from(songTags)
    .leftJoin(songs, eq(songTags.songId, songs.id))
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(songTags.tagId, tagId))
    .orderBy(desc(songs.uploadDate));
}

// Playlists
export async function getUserPlaylists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.updatedAt));
}

export async function getPlaylistById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(playlists).where(eq(playlists.id, id));
  return result[0] || null;
}

export async function createPlaylist(data: InsertPlaylist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(playlists).values(data);
  return (result as any).insertId;
}

export async function updatePlaylist(
  id: number,
  data: Partial<InsertPlaylist>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(playlists).set(data).where(eq(playlists.id, id));
}

export async function deletePlaylist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, id));
  await db.delete(playlists).where(eq(playlists.id, id));
}

export async function addSongToPlaylist(playlistId: number, songId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`MAX(${playlistSongs.position})` })
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId));

  const maxPosition = maxPositionResult[0]?.maxPosition || 0;
  const newPosition = maxPosition + 1;

  await db.insert(playlistSongs).values({
    playlistId,
    songId,
    position: newPosition,
  });
}

export async function removeSongFromPlaylist(
  playlistId: number,
  songId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(playlistSongs)
    .where(
      and(
        eq(playlistSongs.playlistId, playlistId),
        eq(playlistSongs.songId, songId)
      )
    );
}

export async function getPlaylistSongs(playlistId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
      position: playlistSongs.position,
    })
    .from(playlistSongs)
    .leftJoin(songs, eq(playlistSongs.songId, songs.id))
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(playlistSongs.playlistId, playlistId))
    .orderBy(playlistSongs.position);
}

// Favorites
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .leftJoin(songs, eq(favorites.songId, songs.id))
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function addFavorite(userId: number, songId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(favorites).values({ userId, songId });
}

export async function removeFavorite(userId: number, songId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.songId, songId)));
}

export async function isFavorite(userId: number, songId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.songId, songId)));
  return result.length > 0;
}

// Play History
export async function getUserPlayHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: songs.id,
      title: songs.title,
      vtuberId: songs.vtuberId,
      vtuberName: vtubers.name,
      vtuberAvatar: vtubers.avatarUrl,
      thumbnailUrl: songs.thumbnailUrl,
      videoUrl: songs.videoUrl,
      duration: songs.duration,
      genre: songs.genre,
      originalSong: songs.originalSong,
      uploadDate: songs.uploadDate,
      viewCount: songs.viewCount,
      playedAt: playHistory.playedAt,
    })
    .from(playHistory)
    .leftJoin(songs, eq(playHistory.songId, songs.id))
    .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
    .where(eq(playHistory.userId, userId))
    .orderBy(desc(playHistory.playedAt))
    .limit(limit);
}

export async function addPlayHistory(userId: number, songId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(playHistory).values({ userId, songId });
}

// Related Songs
export async function getRelatedSongs(songId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const currentSong = await getSongById(songId);
  if (!currentSong) return [];

  let relatedSongs: any[] = [];

  if (currentSong.originalSong) {
    relatedSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        vtuberId: songs.vtuberId,
        vtuberName: vtubers.name,
        vtuberAvatar: vtubers.avatarUrl,
        thumbnailUrl: songs.thumbnailUrl,
        videoUrl: songs.videoUrl,
        duration: songs.duration,
        genre: songs.genre,
        originalSong: songs.originalSong,
        uploadDate: songs.uploadDate,
        viewCount: songs.viewCount,
      })
      .from(songs)
      .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
      .where(
        and(
          eq(songs.originalSong, currentSong.originalSong),
          sql`${songs.id} != ${songId}`
        )
      )
      .orderBy(desc(songs.viewCount))
      .limit(limit);
  }

  if (relatedSongs.length < limit) {
    const sameVTuberSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        vtuberId: songs.vtuberId,
        vtuberName: vtubers.name,
        vtuberAvatar: vtubers.avatarUrl,
        thumbnailUrl: songs.thumbnailUrl,
        videoUrl: songs.videoUrl,
        duration: songs.duration,
        genre: songs.genre,
        originalSong: songs.originalSong,
        uploadDate: songs.uploadDate,
        viewCount: songs.viewCount,
      })
      .from(songs)
      .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
      .where(
        and(
          eq(songs.vtuberId, currentSong.vtuberId),
          sql`${songs.id} != ${songId}`
        )
      )
      .orderBy(desc(songs.viewCount))
      .limit(limit - relatedSongs.length);

    relatedSongs = [...relatedSongs, ...sameVTuberSongs];
  }

  if (relatedSongs.length < limit) {
    const sameGenreSongs = await db
      .select({
        id: songs.id,
        title: songs.title,
        vtuberId: songs.vtuberId,
        vtuberName: vtubers.name,
        vtuberAvatar: vtubers.avatarUrl,
        thumbnailUrl: songs.thumbnailUrl,
        videoUrl: songs.videoUrl,
        duration: songs.duration,
        genre: songs.genre,
        originalSong: songs.originalSong,
        uploadDate: songs.uploadDate,
        viewCount: songs.viewCount,
      })
      .from(songs)
      .leftJoin(vtubers, eq(songs.vtuberId, vtubers.id))
      .where(
        and(eq(songs.genre, currentSong.genre), sql`${songs.id} != ${songId}`)
      )
      .orderBy(desc(songs.viewCount))
      .limit(limit - relatedSongs.length);

    relatedSongs = [...relatedSongs, ...sameGenreSongs];
  }

  return relatedSongs;
}
