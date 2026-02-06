import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } }
);

console.log('Testing insert...');
const { data, error } = await supabase
  .from('chess_prediction_attempts')
  .insert({
    game_id: 'status_test_' + Date.now(),
    game_name: 'Status Test',
    move_number: 20,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    stockfish_prediction: 'draw',
    actual_result: 'draw',
    hybrid_prediction: 'draw',
    hybrid_correct: true,
    stockfish_correct: true,
    data_source: 'worker_test'
  })
  .select('game_id');

if (error) {
  console.log('ERROR:', error.code, error.message);
  process.exit(1);
} else {
  console.log('SUCCESS:', data[0].game_id);
}
