import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  out: "./server/db/migrations",
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL!,
  },
});
