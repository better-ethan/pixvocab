import { account, db, user } from "@package/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { eq, and, inArray } from "drizzle-orm";
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
        page: z.number().optional().default(1),
      })
    )
    .query(async ({ input, ctx }) => {
      const LIMIT = 20;
      const users = await auth.api.listUsers({
        query: {
          searchField: "email",
          searchValue: input.email || "",
          searchOperator: "contains",
          limit: LIMIT,
          offset: (input.page - 1) * LIMIT,
          sortBy: "createdAt",
          sortDirection: "desc",
        },
        headers: fromNodeHeaders(ctx.req.headers),
      });

      const totalPages = Math.ceil(users.total / LIMIT);

      return {
        ...users,
        totalPages,
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
      };
    }),
});
