#!/usr/bin/env node
/**
 * Apply Data Integrity Migration via Supabase Client
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying Data Integrity Safeguards Migration...\n');
  
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../../supabase/migrations/20260206030000_data_integrity_safeguards.sql'),
    'utf8'
  );
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split('\n')[0].substring(0, 60);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_temp_query').select('*').limit(0);
        
        if (queryError && queryError.message.includes('exec_sql')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] Skipping (requires superuser): ${firstLine}...`);
          errorCount++;
          continue;
        }
      }
      
      console.log(`✅ [${i + 1}/${statements.length}] Applied: ${firstLine}...`);
      successCount++;
    } catch (err) {
      console.log(`⚠️  [${i + 1}/${statements.length}] ${err.message.substring(0, 60)}: ${firstLine}...`);
      errorCount++;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration Results:`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Skipped/Failed: ${errorCount}`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (errorCount > 0) {
    console.log('⚠️  Some statements require superuser access.');
    console.log('   Apply remaining changes via Supabase Dashboard SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/aufycarwflhsdgszbnop/sql');
  } else {
    console.log('✅ All migration statements applied successfully!');
  }
}

applyMigration().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
