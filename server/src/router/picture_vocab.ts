import { desc, eq, and, inArray, isNull, count } from "drizzle-orm";
import { z } from "zod";
import {
  category,
  db,
  pictureVocab,
  subscription,
  user,
} from "@package/drizzle";
import { loggedInProcedure, publicProcedure, router } from "../trpc.js";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { FREE_LIMIT } from "@package/shared";
import { TRPCError } from "@trpc/server";

export const pictureVocabRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        categoryId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(pictureVocab)
        .where(
          and(
            isNull(pictureVocab.deletedAt),
            input.status !== undefined
              ? eq(pictureVocab.status, input.status)
              : undefined,
            input.userId !== undefined
              ? eq(pictureVocab.userId, input.userId)
              : undefined,
            input.categoryId !== undefined
              ? eq(pictureVocab.categoryId, input.categoryId)
              : undefined
          )
        )
        .orderBy(desc(pictureVocab.createdAt));

      const userIds = [
        ...new Set(rows.map((row) => row.userId).filter(Boolean)),
      ];
      const userRows = await db
        .select()
        .from(user)
        .where(inArray(user.id, userIds));

      const userMap = Object.fromEntries(
        userRows.map((user) => [user.id, user.name])
      );
      return rows.map((row) => ({
        ...row,
        username: userMap[row.userId] || "Anonymous",
      }));
    }),

  create: loggedInProcedure
    .input(
      z.object({
        id: z.string().length(16),
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
        categoryId: z.number(),
        thumbnail: z.string().max(255),
        preview: z.string().max(255),
        content: z.json().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [subscriptionStatus] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.referenceId, ctx.user.id))
        .limit(1);

      const isPro =
        subscriptionStatus && subscriptionStatus.status === "active";

      if (!isPro) {
        const [{ total }] = await db
          .select({ total: count() })
          .from(pictureVocab)
          .where(
            and(
              eq(pictureVocab.userId, ctx.user.id),
              isNull(pictureVocab.deletedAt)
            )
          );

        if (Number(total) >= FREE_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You've reached the free plan limit. Upgrade to Pro to create more vocabs.",
          });
        }
      }

      const [row] = await db
        .insert(pictureVocab)
        .values({
          id: input.id,
          userId: ctx.user.id,
          title: input.title,
          slug: input.slug,
          description: input.description,
          status: input.status,
          categoryId: input.categoryId,
          thumbnail: input.thumbnail,
          preview: input.preview,
          content: input.content,
        })
        .returning();

      return row;
    }),

  toggle: loggedInProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        description: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
        categoryId: z.number(),
        thumbnail: z.string().max(255),
        preview: z.string().max(255),
        content: z.json().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [existedRow] = await db
        .select()
        .from(pictureVocab)
        .where(eq(pictureVocab.id, input.id))
        .limit(1);
      const [row] = await db
        .update(pictureVocab)
        .set({
          title: input.title,
          slug: input.slug,
          description: input.description,
          status: input.status,
          categoryId: input.categoryId,
          thumbnail: input.thumbnail,
          preview: input.preview,
          content: input.content,
          ...(existedRow?.moderationStatus === "rejected"
            ? { moderationStatus: "pending" }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(pictureVocab.id, input.id))
        .returning();

      return row;
    }),

  remove: loggedInProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(pictureVocab)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(pictureVocab.id, input.id));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(pictureVocab)
        .where(
          and(isNull(pictureVocab.deletedAt), eq(pictureVocab.id, input.id))
        );

      return row;
    }),

  getByIdAndSlug: publicProcedure
    .input(z.object({ id: z.string(), slug: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select()
        .from(pictureVocab)
        .where(
          and(
            isNull(pictureVocab.deletedAt),
            eq(pictureVocab.id, input.id),
            eq(pictureVocab.slug, input.slug)
          )
        );

      if (!row) {
        return null;
      }

      const [userRow] = await db
        .select()
        .from(user)
        .where(eq(user.id, row.userId));

      const [categoryRow] = await db
        .select({
          id: category.id,
          name: category.name,
          slug: category.slug,
        })
        .from(category)
        .where(eq(category.id, row.categoryId));

      return {
        ...row,
        username: userRow ? userRow.name : "Anonymous",
        currentCateory: categoryRow || null,
      };
    }),

  authored: loggedInProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published"]).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(48).default(12),
      })
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, status } = input;
      const offset = (page - 1) * limit;

      const whereCondition = and(
        eq(pictureVocab.userId, ctx.user.id),
        isNull(pictureVocab.deletedAt),
        input.status ? eq(pictureVocab.status, input.status) : undefined
      );

      const rows = await db
        .select()
        .from(pictureVocab)
        .where(whereCondition)
        .orderBy(desc(pictureVocab.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ total }] = await db
        .select({ total: count() })
        .from(pictureVocab)
        .where(whereCondition);

      return {
        data: rows,
        total: Number(total),
        page,
        limit,
      };
    }),

  preview: loggedInProcedure
    .input(z.object({ id: z.string(), slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const [row] = await db
        .select()
        .from(pictureVocab)
        .where(
          and(
            isNull(pictureVocab.deletedAt),
            eq(pictureVocab.id, input.id),
            eq(pictureVocab.slug, input.slug),
            eq(pictureVocab.userId, ctx.user.id)
          )
        );

      return row;
    }),
});
