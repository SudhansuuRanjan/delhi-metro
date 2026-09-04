import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  GRAPH: DurableObjectNamespace;
  CRON_SECRET: string;
};

export type D1Client = ReturnType<typeof createD1>;

export function createD1(db: D1Database) {
  return drizzle(db, { schema });
}

export { schema };
