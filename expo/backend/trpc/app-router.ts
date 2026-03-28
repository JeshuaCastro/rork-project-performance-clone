import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import syncWhoopRoute from "./routes/whoop/sync/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  whoop: createTRPCRouter({
    sync: syncWhoopRoute,
  }),
});

export type AppRouter = typeof appRouter;