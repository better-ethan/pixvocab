import { account, db, pictureVocab, user } from "@package/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { eq, and, inArray, isNull, desc, count } from "drizzle-orm";
import z from "zod";
import { auth } from "../lib/auth.js";
import {
  adminProcedure,
  loggedInProcedure,
  publicProcedure,
  router,
} from "../trpc.js";
import { decodeJwt } from "jose";

export const adminRouter = router({
  listUsers: adminProcedure
    .input(
      z.object({
        email: z.string().optional(),
        name: z.string().optional(),
        banned: z.boolean().optional(),
        page: z.number().optional().default(1),
      })
    )
    .query(async ({ input, ctx }) => {
      const LIMIT = 5;

      const query: Record<string, any> = {
        limit: LIMIT,
        offset: (input.page - 1) * LIMIT,
        sortBy: "createdAt",
        sortDirection: "desc",
      };

      if (input.email) {
        query.searchField = "email";
        query.searchValue = input.email;
        query.searchOperator = "contains";
      }
      if (input.name) {
        query.searchField = "name";
        query.searchValue = input.name;
        query.searchOperator = "contains";
      }
      if (input.banned !== undefined) {
        query.filterField = "banned";
        query.filterValue = input.banned;
        query.filterOperator = "eq";
      }

      const users = await auth.api.listUsers({
        query,
        headers: fromNodeHeaders(ctx.req.headers),
      });

      const pageCount = Math.ceil(users.total / LIMIT);

      return {
        data: users.users,
        total: users.total,
        pageSize: LIMIT,
        pageCount,
      };
    }),
  getUserById: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [userRow] = await db
        .select()
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);

      if (!userRow) {
        return null;
      }

      return {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        description: userRow.description,
        image: userRow.image,
        role: userRow.role,
        banned: userRow.banned,
        bandReason: userRow.banReason,
        bandExpires: userRow.banExpires,
        emailVerified: userRow.emailVerified,
        createdAt: userRow.createdAt,
      };
    }),
  banUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await auth.api.banUser({
        body: {
          userId: input.id,
          banReason: input.reason,
        },
        headers: fromNodeHeaders(ctx.req.headers),
      });

      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await auth.api.unbanUser({
        body: {
          userId: input.id,
        },
        headers: fromNodeHeaders(ctx.req.headers),
      });

      return { success: true };
    }),
  listVocabs: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        categoryId: z.number().optional(),
        title: z.string().optional(),
        page: z.number().optional().default(1),
      })
    )
    .query(async ({ input }) => {
      const LIMIT = 5;

      const condition = and(
        input.status !== undefined
          ? eq(pictureVocab.status, input.status)
          : undefined,
        input.userId !== undefined
          ? eq(pictureVocab.userId, input.userId)
          : undefined,
        input.categoryId !== undefined
          ? eq(pictureVocab.categoryId, input.categoryId)
          : undefined,
        input.title !== undefined
          ? eq(pictureVocab.title, input.title)
          : undefined
      );

      const rows = await db
        .select()
        .from(pictureVocab)
        .where(condition)
        .limit(LIMIT)
        .offset((input.page - 1) * LIMIT)
        .orderBy(desc(pictureVocab.createdAt));

      const total = await db
        .select({ count: count() })
        .from(pictureVocab)
        .where(condition);

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

      const rowsWithUser = rows.map((row) => ({
        ...row,
        username: userMap[row.userId] || "Anonymous",
      }));

      const pageCount = Math.ceil((total[0]?.count || 0) / LIMIT);

      return {
        data: rowsWithUser,
        total: total[0]?.count || 0,
        pageSize: LIMIT,
        pageCount,
      };
    }),
});
