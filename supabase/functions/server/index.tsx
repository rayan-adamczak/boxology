import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Restrict CORS to known front-ends rather than "*", so that a browser on an
// unrelated origin cannot call this function with a visitor's credentials.
// ALLOWED_ORIGINS is a comma-separated list set in the Supabase dashboard;
// localhost stays allowed so `npm run dev` keeps working.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (allowedOrigins.includes(origin)) return origin;
      if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
      return null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-38e4ee68/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);