import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only instantiate when env vars are present (skips build-time / missing config)
function getRatelimiter() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "30 d"),
    analytics: false,
    prefix: "lsa:audit-v2",
  });
}

export async function proxy(req: NextRequest) {
  if (req.method !== "POST" || !req.nextUrl.pathname.startsWith("/api/audit")) {
    return NextResponse.next();
  }

  const ratelimiter = getRatelimiter();
  if (!ratelimiter) return NextResponse.next(); // skip if Redis not configured

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success, limit, remaining, reset } = await ratelimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error:
          "You've already run all your free audits this month. Come back in 30 days.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
        },
      },
    );
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());
  return res;
}

export const config = {
  matcher: "/api/audit",
};
