/**
 * Execute the audit view setup SQL via direct Postgres connection.
 * Creates the public verification views and grants access.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const sqlPath = join(__dirname, 'setup-public-view.sql');
const sql = readFileSync(sqlPath, 'utf8');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 30000,
});

async function main() {
  const client = await pool.connect();
  try {
    // Split on semicolons followed by newline. Keep all statements
    // (including ones that start with comments — the comments are valid SQL).
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Get first non-comment line for logging
      const firstLine = stmt.split('\n').find(l => !l.trim().startsWith('--') && l.trim().length > 0) || stmt.substring(0, 80);
      const label = firstLine.substring(0, 80).replace(/\s+/g, ' ');

      try {
        await client.query(stmt);
        console.log(`  [${i + 1}/${statements.length}] OK: ${label}`);
      } catch (e) {
        // GRANT to anon/authenticated may fail if roles don't exist — that's OK
        if (e.message.includes('role') && (e.message.includes('anon') || e.message.includes('authenticated'))) {
          console.log(`  [${i + 1}/${statements.length}] SKIP (role not found): ${label}`);
        } else {
          console.error(`  [${i + 1}/${statements.length}] FAIL: ${label}`);
          console.error(`    ${e.message}`);
        }
      }
    }

    // Verify views exist
    console.log('\nVerifying views...');
    const views = await client.query(`
      SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'audit_%' OR viewname = 'predictions_public'
      ORDER BY viewname
    `);
    for (const row of views.rows) {
      console.log(`  ✓ ${row.viewname}`);
    }

    // Test the headline view
    console.log('\nTesting audit_headline_stats...');
    try {
      const stats = await client.query('SELECT * FROM public.audit_headline_stats');
      if (stats.rows.length > 0) {
        const s = stats.rows[0];
        console.log(`  total_predictions: ${s.total_predictions}`);
        console.log(`  ep_accuracy: ${s.ep_accuracy_pct}%`);
        console.log(`  sf_accuracy: ${s.sf_accuracy_pct}%`);
        console.log(`  ep_edge: +${s.ep_edge_pp}pp`);
      }
    } catch (e) {
      console.error(`  FAIL: ${e.message}`);
    }

    // Test phase view
    console.log('\nTesting audit_phase_stats...');
    try {
      const phases = await client.query('SELECT * FROM public.audit_phase_stats');
      for (const p of phases.rows) {
        console.log(`  ${p.phase_zone}: n=${p.total_predictions} EP=${p.ep_accuracy_pct}% SF=${p.sf_accuracy_pct}% edge=+${p.ep_edge_pp}pp`);
      }
    } catch (e) {
      console.error(`  FAIL: ${e.message}`);
    }

    console.log('\nDone.');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
