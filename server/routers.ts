import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // VTuber Music Platform API Routes
  vtubers: router({
    list: publicProcedure.query(() => db.getAllVTubers()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getVTuberById(input.id)),
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(({ input }) => db.searchVTubers(input.query)),
  }),

  songs: router({
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().optional(),
            offset: z.number().optional(),
          })
          .optional()
      )
      .query(({ input }) =>
        db.getAllSongs(input?.limit || 50, input?.offset || 0)
      ),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getSongById(input.id)),
    search: publicProcedure
      .input(
        z.object({
          query: z.string(),
          genre: z.string().optional(),
          vtuberId: z.number().optional(),
          originalSong: z.string().optional(),
        })
      )
      .query(({ input }) =>
        db.searchSongs(input.query, {
          genre: input.genre,
          vtuberId: input.vtuberId,
          originalSong: input.originalSong,
        })
      ),
    byGenre: publicProcedure
      .input(z.object({ genre: z.string(), limit: z.number().optional() }))
      .query(({ input }) => db.getSongsByGenre(input.genre, input.limit)),
    byOriginalSong: publicProcedure
      .input(z.object({ originalSong: z.string() }))
      .query(({ input }) => db.getSongsByOriginalSong(input.originalSong)),
    related: publicProcedure
      .input(z.object({ songId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getRelatedSongs(input.songId, input.limit)),
  }),

  playlists: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserPlaylists(ctx.user.id)
    ),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getPlaylistById(input.id)),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          coverImageUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createPlaylist({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          coverImageUrl: input.coverImageUrl,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          coverImageUrl: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updatePlaylist(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deletePlaylist(input.id)),
    getSongs: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(({ input }) => db.getPlaylistSongs(input.playlistId)),
    addSong: protectedProcedure
      .input(z.object({ playlistId: z.number(), songId: z.number() }))
      .mutation(({ input }) =>
        db.addSongToPlaylist(input.playlistId, input.songId)
      ),
    removeSong: protectedProcedure
      .input(z.object({ playlistId: z.number(), songId: z.number() }))
      .mutation(({ input }) =>
        db.removeSongFromPlaylist(input.playlistId, input.songId)
      ),
  }),

  favorites: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getUserFavorites(ctx.user.id)
    ),
    add: protectedProcedure
      .input(z.object({ songId: z.number() }))
      .mutation(({ ctx, input }) =>
        db.addFavorite(ctx.user.id, input.songId)
      ),
    remove: protectedProcedure
      .input(z.object({ songId: z.number() }))
      .mutation(({ ctx, input }) =>
        db.removeFavorite(ctx.user.id, input.songId)
      ),
    check: protectedProcedure
      .input(z.object({ songId: z.number() }))
      .query(({ ctx, input }) => db.isFavorite(ctx.user.id, input.songId)),
  }),

  history: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) =>
        db.getUserPlayHistory(ctx.user.id, input?.limit)
      ),
    add: protectedProcedure
      .input(z.object({ songId: z.number() }))
      .mutation(({ ctx, input }) =>
        db.addPlayHistory(ctx.user.id, input.songId)
      ),
  }),

  tags: router({
    list: publicProcedure.query(() => db.getAllTags()),
    forSong: publicProcedure
      .input(z.object({ songId: z.number() }))
      .query(({ input }) => db.getTagsForSong(input.songId)),
    songsByTag: publicProcedure
      .input(z.object({ tagId: z.number() }))
      .query(({ input }) => db.getSongsByTagId(input.tagId)),
  }),
});

export type AppRouter = typeof appRouter;
