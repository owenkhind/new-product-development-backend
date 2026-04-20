const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function getDatabaseSchema(env: NodeJS.ProcessEnv = process.env): string {
  const schema = env.DB_SCHEMA ?? env.DB_PROMOTER_SCHEMA ?? 'public';

  if (!IDENTIFIER_PATTERN.test(schema)) {
    throw new Error(`Invalid database schema name: ${schema}`);
  }

  return schema;
}

export function qualifyTableName(tableName: string, schema = getDatabaseSchema()): string {
  if (!IDENTIFIER_PATTERN.test(tableName)) {
    throw new Error(`Invalid database table name: ${tableName}`);
  }

  return `"${schema}"."${tableName}"`;
}
