import { Pool, types } from 'pg';
import { config } from '../config/env';

// BIGINT (OID 20) по умолчанию возвращается как string в node-postgres —
// это нам и нужно, чтобы не терять точность MAX user ID. Явно фиксируем.
types.setTypeParser(20, (val) => val);

/**
 * Управляемые PostgreSQL (Render, Railway, Neon, Supabase и т.п.) требуют TLS.
 * Локальный Postgres (docker-compose host "db", localhost) — без TLS.
 * Логику можно принудительно переопределить переменной PGSSL=true|false.
 */
function resolveSsl(): false | { rejectUnauthorized: boolean } {
  const forced = (process.env.PGSSL || '').toLowerCase();
  if (forced === 'true' || forced === '1') return { rejectUnauthorized: false };
  if (forced === 'false' || forced === '0') return false;

  const url = config.databaseUrl || '';
  const isLocal = /@(db|localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('@db:');
  return url && !isLocal ? { rejectUnauthorized: false } : false;
}

export const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
  ssl: resolveSsl(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  // Ошибка простаивающего клиента — логируем, но не роняем процесс.
  console.error('[db] Непредвиденная ошибка пула PostgreSQL:', err);
});

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query(text, params as never);
  return res.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Выполнить набор запросов в одной транзакции. */
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
