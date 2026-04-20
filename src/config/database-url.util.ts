export function buildDatabaseUrl(env: NodeJS.ProcessEnv): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.DB_HOST;
  const port = env.DB_PORT ?? '5432';
  const database = env.DB_DATABASE;
  const username = env.DB_USERNAME;
  const password = env.DB_PASSWORD;

  if (!host || !database || !username || password === undefined) {
    throw new Error(
      'Database configuration is missing. Set DATABASE_URL or provide the DB_* fallback variables.',
    );
  }

  const params = new URLSearchParams();

  const schema = env.DB_SCHEMA ?? env.DB_PROMOTER_SCHEMA;

  if (schema) {
    params.set('schema', schema);
  }

  if (env.DB_SSLMODE) {
    params.set('sslmode', env.DB_SSLMODE);
  }

  const query = params.toString();

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}${query ? `?${query}` : ''}`;
}
