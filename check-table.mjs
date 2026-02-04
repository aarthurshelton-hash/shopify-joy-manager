#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    // Try to insert a test record to see if table exists
    const { error: insertError } = await supabase
      .from('chess_benchmark_games')
      .insert({
        id: 'test_game',
        pgn: '1. e4 e5 2. Nf3 Nc6 1-0',
        result: '1-0',
        move_count: 4
      });

    if (insertError && insertError.code === 'PGRST205') {
      console.log('Table does not exist. Please create it in Supabase Dashboard SQL Editor:');
      console.log(`
-- Run this in Supabase Dashboard → SQL Editor:
CREATE TABLE public.chess_benchmark_games (
  id TEXT PRIMARY KEY,
  pgn TEXT NOT NULL,
  result TEXT CHECK (result IN ('1-0', '0-1', '1/2-1/2')),
  move_count INTEGER DEFAULT 0,
  benchmarked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chess_benchmark_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on benchmark games" ON public.chess_benchmark_games;
CREATE POLICY "Allow all operations on benchmark games"
ON public.chess_benchmark_games
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_chess_benchmark_games_benchmarked 
ON public.chess_benchmark_games(benchmarked_at) 
WHERE benchmarked_at IS NULL;
      `);
    } else if (insertError) {
      console.error('Error:', insertError);
    } else {
      console.log('Table exists and test insert succeeded!');
      // Delete test record
      await supabase.from('chess_benchmark_games').delete().eq('id', 'test_game');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTable();
