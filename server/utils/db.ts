import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const useDb = () => {
  if (!_db) {
    const config = useRuntimeConfig();

    if (!config.databaseUrl) {
      throw new Error("NUXT_DATABASE_URL is not defined in the environment");
    }

    const client = postgres(config.databaseUrl);
    _db = drizzle(client, { schema });
  }
  return _db;
};

export const db = useDb();
