import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import getDirname from '../utils/fileDir.js';

dotenv.config();

const __dirname = getDirname(import.meta.url);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false },
});

export async function checkAndInitTables() {
  console.log('🔍 Checking Supabase connection & tables status...');
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);

    if (error && (error.code === '42P01' || error.message.includes('Could not find the table'))) {
      console.log('⚠️ Notice: Database tables do not exist yet in your Supabase project.');
      console.log('💡 Run the SQL query from schema.sql in your Supabase SQL Editor (https://supabase.com/dashboard).');
      console.log('📄 SQL file located at: be/src/db/schema.sql');
    } else if (error) {
      console.log('⚠️ Supabase Status:', error.message);
    } else {
      console.log('✅ Supabase database connection verified. Tables are active!');
    }
  } catch (err) {
    console.error('❌ Error during database check:', err.message);
  }
}

if (process.argv[1] && process.argv[1].includes('initDb.js')) {
  checkAndInitTables().then(() => {
    console.log('Done DB check process.');
  });
}
