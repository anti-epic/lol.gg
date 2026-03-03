import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { rateLimit } from "@/lib/rate-limit";

export interface TRPCContext {
  ip: string;
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const allowed = await rateLimit(ctx.ip, 60, 60); // 60 req / 60 s per IP
  if (!allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please slow down.",
    });
  }
  return next();
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(rateLimitMiddleware);
