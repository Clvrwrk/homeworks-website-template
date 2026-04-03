// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { validateSession, SESSION_COOKIE } from "@/lib/workos";

export const onRequest = defineMiddleware(async (context, next) => {
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
});
