import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } }
);

console.log('Fetching recent records from chess_prediction_attempts...\n');

const { data, error } = await supabase
  .from('chess_prediction_attempts')
  .select('game_id, game_name, data_source, created_at, stockfish_prediction, hybrid_prediction, actual_result')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.log('ERROR:', error.message);
} else if (!data || data.length === 0) {
  console.log('NO DATA FOUND');
} else {
  console.log(`Found ${data.length} recent records:\n`);
  data.forEach((row, i) => {
    const age = Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000);
    console.log(`${i + 1}. ${row.game_id}`);
    console.log(`   Source: ${row.data_source}`);
    console.log(`   Created: ${row.created_at} (${age} mins ago)`);
    console.log(`   Predictions: Stockfish=${row.stockfish_prediction}, Hybrid=${row.hybrid_prediction}, Actual=${row.actual_result}`);
    console.log('');
  });
}
