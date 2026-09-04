export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  GRAPH: DurableObjectNamespace;
  ASSETS: Fetcher;
  CRON_SECRET: string;
};
