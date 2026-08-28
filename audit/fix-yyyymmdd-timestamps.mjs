import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  statement_timeout: 300000,
});

function parseCorruptedEpoch(sec) {
  const s = Number(sec);
  if (!Number.isFinite(s) || s <= 0) return null;

  // Pattern 1: YYYYMMDD integer (e.g. 20251001 -> Oct 1 2025)
  const asStr = String(Math.round(s));
  if (asStr.length === 8) {
    const y = +asStr.slice(0, 4);
    const mo = +asStr.slice(4, 6);
    const d = +asStr.slice(6, 8);
    if (y >= 2020 && y <= 2030 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return new Date(Date.UTC(y, mo - 1, d, 14, 30, 0));
    }
  }

  // Pattern 2: Unix seconds (e.g. 1787561000 -> 2026)
  if (s > 1e9 && s < 1e12) {
    return new Date(s * 1000);
  }

  // Pattern 3: Already ms (unlikely here but safe)
  if (s >= 1e12) {
    return new Date(s);
  }

  return null;
}

async function main() {
  const r = await pool.query(
    "SELECT id, EXTRACT(EPOCH FROM created_at)::float8 created_sec, " +
    "EXTRACT(EPOCH FROM resolved_at)::float8 resolved_sec " +
    "FROM market_prediction_attempts " +
    "WHERE prediction_source='historical_replay' AND created_at < '2000-01-01'"
  );
  console.log('Rows to inspect:', r.rows.length);

  let fixedCreated = 0, fixedResolved = 0, skipped = 0;
  for (const row of r.rows) {
    const createdDate = parseCorruptedEpoch(row.created_sec);
    if (createdDate) {
      await pool.query('UPDATE market_prediction_attempts SET created_at = $1 WHERE id = $2', [createdDate, row.id]);
      fixedCreated++;
    } else {
      skipped++;
      continue;
    }
    if (row.resolved_sec) {
      const resolvedDate = parseCorruptedEpoch(row.resolved_sec);
      if (resolvedDate) {
        await pool.query('UPDATE market_prediction_attempts SET resolved_at = $1 WHERE id = $2', [resolvedDate, row.id]);
        fixedResolved++;
      }
    }
  }
  console.log('Fixed created_at:', fixedCreated);
  console.log('Fixed resolved_at:', fixedResolved);
  console.log('Skipped (unparseable):', skipped);

  const after = await pool.query(
    "SELECT COUNT(*)::int n FROM market_prediction_attempts WHERE prediction_source='historical_replay' AND created_at < '2000-01-01'"
  );
  console.log('Corrupted remaining:', after.rows[0].n);

  const rng = await pool.query(
    "SELECT MIN(created_at) mn, MAX(created_at) mx FROM market_prediction_attempts WHERE prediction_source='historical_replay'"
  );
  console.log('Replay range now:', rng.rows[0].mn, '->', rng.rows[0].mx);

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
