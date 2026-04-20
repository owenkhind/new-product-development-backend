import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import { buildDatabaseUrl } from '../config/database-url.util';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly shouldConnect =
    process.env.SKIP_DB_CONNECT !== 'true' && process.env.NODE_ENV !== 'test';
  private readonly pool = new Pool({
    connectionString: buildDatabaseUrl(process.env),
  });

  async onModuleInit(): Promise<void> {
    if (!this.shouldConnect) {
      this.logger.log('Skipping PostgreSQL connection for the current environment.');
      return;
    }

    const client = await this.pool.connect();
    client.release();
    this.logger.log('Connected to PostgreSQL.');
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.shouldConnect) {
      return;
    }

    await this.pool.end();
  }

  query<TResult extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<TResult>> {
    return this.pool.query<TResult>(text, params ? [...params] : undefined);
  }

  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
