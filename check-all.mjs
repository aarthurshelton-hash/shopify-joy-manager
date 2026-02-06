import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } }
);

console.log('Checking all recent records by data_source:\n');

const { data, error } = await supabase
  .from('chess_prediction_attempts')
  .select('data_source, count:id')
  .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
  .group('data_source');

if (error) {
  console.log('ERROR:', error.message);
} else {
  console.log('Records in last hour by source:');
  data.forEach(row => console.log(`  ${row.data_source || 'null'}: ${row.count}`));
}

// Also check for debug_test
const { data: debug } = await supabase
  .from('chess_prediction_attempts')
  .select('game_id, created_at')
  .eq('data_source', 'debug_test')
  .order('created_at', { ascending: false })
  .limit(3);

console.log('\nDebug test records:', debug?.length || 0);
