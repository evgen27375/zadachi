import fs from 'fs';
import path from 'path';
import { pool } from './pool';

/**
 * Простой раннер миграций: применяет *.sql из папки migrations по порядку
 * имён, фиксируя применённые в таблице schema_migrations. Идемпотентно.
 */
async function migrate(): Promise<void> {
  const dir = path.join(__dirname, 'migrations');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const already = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
    if (already.rowCount && already.rowCount > 0) {
      console.log(`[migrate] пропуск (уже применена): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[migrate] применена: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] ОШИБКА в ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('[migrate] готово.');
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] провал миграции:', err);
    pool.end().finally(() => process.exit(1));
  });
