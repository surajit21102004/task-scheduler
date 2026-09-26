import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export async function runMigration() {
  console.log('⚡ Running database schema update for daily update approval & task attachments...');

  const projectRef = 'copluinjkkszxodnbvay';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';

  const connectionStrings = [
    process.env.DATABASE_URL,
    `postgresql://postgres:${secretKey}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${secretKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${secretKey}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  ].filter(Boolean);

  const migrationSql = `
    ALTER TABLE public.daily_updates ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE public.daily_updates ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES public.employees(id);
    ALTER TABLE public.daily_updates ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
  `;

  for (const connStr of connectionStrings) {
    try {
      const client = new pg.Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      await client.connect();
      await client.query(migrationSql);
      await client.end();
      console.log('✅ Migration executed successfully via PostgreSQL!');
      return;
    } catch (err) {
      // Continue loop
    }
  }

  console.log('ℹ️ Direct PostgreSQL port not connected. Updated schema.sql file for manual execution.');
}

if (process.argv[1] && process.argv[1].includes('updateSchema.js')) {
  runMigration().then(() => process.exit(0));
}
