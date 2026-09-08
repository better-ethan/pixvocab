import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const createContext = ({ req, res }: CreateFastifyContextOptions) => {
  return { req, res };
};

const t = initTRPC.context<typeof createContext>().create({
  errorFormatter({ shape, error }) {
    return {
      code: -1,
      message:
        error.cause instanceof ZodError
          ? error.cause.issues.map((issue) => issue.message).join("")
          : shape.message,
      data: null,
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const loggedInProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(ctx.req.headers),
  });

  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return next({
    ctx: {
      user: session.user,
    },
  });
});

export const adminProcedure = loggedInProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.user.role;

  if (userRole !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return next();
});
