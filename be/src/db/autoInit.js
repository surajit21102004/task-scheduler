import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import getDirname from '../utils/fileDir.js';
import { supabase } from '../config/supabase.js';

dotenv.config();

const __dirname = getDirname(import.meta.url);

export async function runAutoInit() {
  console.log('⚡ Attempting automatic database schema initialization...');
  
  const sqlPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ schema.sql file not found at:', sqlPath);
    return;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Connection string options to try for direct PostgreSQL DDL execution
  const projectRef = 'copluinjkkszxodnbvay';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';

  const connectionStrings = [
    process.env.DATABASE_URL,
    `postgresql://postgres:${secretKey}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${secretKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${secretKey}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  ].filter(Boolean);

  let connected = false;

  for (const connStr of connectionStrings) {
    try {
      console.log(`🔌 Attempting DB connection...`);
      const client = new pg.Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      await client.connect();
      console.log('✅ Connected to PostgreSQL. Executing schema.sql queries...');
      await client.query(sqlContent);
      await client.end();
      console.log('🎉 Schema auto-initialized successfully!');
      connected = true;
      break;
    } catch (err) {
      // Continue to next string
    }
  }

  if (!connected) {
    console.log('ℹ️ Direct PostgreSQL port not accessible via auto-connection.');
    console.log('👉 Please paste the content of `be/src/db/schema.sql` into the Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/copluinjkkszxodnbvay/sql/new');
  }
}

if (process.argv[1] && process.argv[1].includes('autoInit.js')) {
  runAutoInit().then(() => process.exit(0));
}
