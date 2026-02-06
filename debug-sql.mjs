import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('Testing direct SQL insert...\n');

try {
  // Test connection
  const testConn = await pool.query('SELECT NOW() as time');
  console.log('✓ Connection works:', testConn.rows[0].time);
  
  // Try insert with full error detail
  const query = `
    INSERT INTO chess_prediction_attempts (
      game_id, game_name, move_number, fen,
      stockfish_prediction, stockfish_confidence,
      hybrid_prediction, hybrid_confidence, hybrid_archetype,
      actual_result, stockfish_correct, hybrid_correct,
      position_hash, data_quality_tier, data_source,
      engine_version, hybrid_engine, worker_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    ON CONFLICT (game_id) DO NOTHING
    RETURNING game_id
  `;
  
  const values = [
    `debug_test_${Date.now()}`,
    'Debug Test Game',
    20,
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'white_wins', 0.7,
    'draw', 0.6, 'material_advantage',
    'white_wins', true, false,
    '00000000', 'farm_generated', 'debug_test',
    'TCEC Stockfish 17 NNUE', 'En Pensent Universal v2.1', 'debug-worker'
  ];
  
  console.log('Executing INSERT...');
  const result = await pool.query(query, values);
  
  if (result.rowCount === 0) {
    console.log('⚠ Insert returned 0 rows - possible conflict or issue');
  } else {
    console.log('✓ Insert success:', result.rows[0].game_id);
  }
  
  // Verify by querying back
  const check = await pool.query('SELECT COUNT(*) as count FROM chess_prediction_attempts WHERE data_source = $1', ['debug_test']);
  console.log('✓ Records with data_source=debug_test:', check.rows[0].count);
  
} catch (err) {
  console.log('✗ ERROR:', err.message);
  console.log('Code:', err.code);
  console.log('Detail:', err.detail);
} finally {
  await pool.end();
}
