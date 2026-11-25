// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

export const onRequest = defineMiddleware(async (context, next) => {
  const hwaPreview = (process.env.HWA_ENV ?? "") === "preview";
  if (hwaPreview && context.url.pathname === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" },
    });
  }
  if (hwaPreview) {
    const res = await (context.url.pathname.startsWith("/admin") ? handleAdmin(context, next) : (context.locals.user = null, next()));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  if (!context.url.pathname.startsWith("/admin")) {
    context.locals.user = null;
    return next();
  }
  return handleAdmin(context, next);
});

async function handleAdmin(context: any, next: any) {
  // Only protect /admin/* routes
  if (!context.url.pathname.startsWith("/admin")) {
    context.locals.user = null;
    return next();
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return context.redirect("/auth/login");
  }

  const user = await validateSession(sessionCookie.value);

  if (!user) {
    // Invalid/expired session — clear cookie and redirect
    context.cookies.delete(SESSION_COOKIE, { path: "/" });
    return context.redirect("/auth/login");
  }

  context.locals.user = user;
  return next();
}
