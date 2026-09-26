import pg from 'pg';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 20 });
export async function initDb() { const sql = await fs.readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8'); await pool.query(sql); }
export async function tx(fn) { const client = await pool.connect(); try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); } }
