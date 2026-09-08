import { account, db, user } from "@package/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { eq, and, inArray } from "drizzle-orm";
import z from "zod";
import { auth } from "../lib/auth.js";
import { loggedInProcedure, publicProcedure, router } from "../trpc.js";
import { decodeJwt } from "jose";

export const userRouter = router({
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(ctx.req.headers),
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id as string,
      name: session.user.name as string,
      email: session.user.email as string,
      description: session.user.description as string | null,
      image: session.user.image as string | null,
      role: session.user.role as string,
    };
  }),
  getUserById: publicProcedure
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
      };
    }),
  updateProfile: loggedInProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await auth.api.updateUser({
        body: input,
        headers: fromNodeHeaders(ctx.req.headers),
      });

      return { success: true };
    }),
  listLinkedAccount: loggedInProcedure.query(async ({ ctx, input }) => {
    const linkedAccount = await db
      .select({
        accountId: account.accountId,
        providerId: account.providerId,
        idToken: account.idToken,
      })
      .from(account)
      .where(
        and(
          inArray(account.providerId, ["google"]),
          eq(account.userId, ctx.user.id)
        )
      );

    if (!linkedAccount) {
      return [];
    }

    return linkedAccount.map((account) => {
      const decodedToken = account.idToken ? decodeJwt(account.idToken) : null;

      return {
        accountId: account.accountId,
        provider: account.providerId,
        email: decodedToken?.email as string | null,
      };
    });
  }),
});
