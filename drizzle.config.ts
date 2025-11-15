import type { Config } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

// Drizzle config for Studio only - we use Supabase migrations instead of Drizzle migrations
export default {
  schema: "./lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
