#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // First, let's try to list tables
  const { data, error } = await supabase
    .from('chess_benchmark_games')
    .select('*')
    .limit(1);
    
  console.log('Query result:', { data, error });
  
  if (error) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    // Try inserting
    const { error: insertError } = await supabase
      .from('chess_benchmark_games')
      .insert({
        id: 'test_' + Date.now(),
        pgn: '1. e4 e5 1-0',
        result: '1-0',
        move_count: 2
      });
      
    console.log('Insert error:', insertError);
  }
}

test();
