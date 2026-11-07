import pg from "pg";

export function createDatabasePool(connectionString, options = {}) {
  const hostname = new URL(connectionString).hostname;
  const useTls = process.env.NODE_ENV === "production" ||
    hostname.endsWith(".supabase.co") ||
    hostname.endsWith(".pooler.supabase.com");

  return new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    ssl: useTls ? { rejectUnauthorized: true } : undefined,
    ...options
  });
}
