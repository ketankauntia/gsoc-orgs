import handler from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";

// A limiter outage should not take the site down, so errors let the request through.
async function withinLimit(limiter, ip) {
  try {
    return (await limiter.limit({ key: ip })).success;
  } catch (error) {
    console.error("[rate limit] limiter unavailable, allowing request", error);
    return true;
  }
}

const worker = {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    // Catalog data is read internally through env.ASSETS (lib/catalog-data.ts).
    if (pathname.startsWith("/_catalog/")) {
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    // Other static assets are served before this handler. Bound only dynamic requests.
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) {
      const limiter = pathname.startsWith("/api/") ? env.API_RATE_LIMITER : env.PAGE_RATE_LIMITER;
      if (!(await withinLimit(limiter, ip))) {
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
