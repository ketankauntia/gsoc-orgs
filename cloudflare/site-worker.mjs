import handler from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";

const worker = {
  async fetch(request, env, ctx) {
    // Catalog data is read internally through env.ASSETS (lib/catalog-data.ts).
    if (new URL(request.url).pathname.startsWith("/_catalog/")) {
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    // Other static assets are served before this handler. Bound only dynamic requests.
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) {
      const pathname = new URL(request.url).pathname;
      const limiter = pathname.startsWith("/api/") ? env.API_RATE_LIMITER : env.PAGE_RATE_LIMITER;
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return new Response("Too many requests. Please try again in a minute.", {
          status: 429,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        });
      }
    }
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
