import type { QueryResult, QueryResultRow } from 'pg';

export type DatabaseQueryable = {
  query<TResult extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<TResult>>;
};
