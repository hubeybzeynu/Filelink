// Script to apply device_context_cache migration to Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ytkylwpbitocnhkyropm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_9cvdGktDmhn5JzOMnVtSSg_GCIYJqxh';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');
    const sql = readFileSync('./supabase/migrations/20260920192000_device_context_cache.sql', 'utf-8');

    console.log('🚀 Applying migration to Supabase...');

    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).select();

    if (error) {
      // Try direct query if exec_sql RPC doesn't exist
      console.log('⚠️  exec_sql RPC not found, trying direct query...');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE')) {
          console.log('📋 Creating device_context_cache table...');
        } else if (statement.includes('CREATE INDEX')) {
          console.log('🔍 Creating indexes...');
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          console.log('⚙️  Creating cleanup function...');
        } else if (statement.includes('COMMENT')) {
          console.log('💬 Adding comments...');
        }

        // Note: Supabase JS client doesn't support raw SQL execution directly
        // We need to use the REST API or a custom RPC function
        console.log(`   Statement: ${statement.substring(0, 60)}...`);
      }

      console.log('\n⚠️  Note: Direct SQL execution via JS client is limited.');
      console.log('📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/ytkylwpbitocnhkyropm/editor');
      console.log('\nOr use: npx supabase db push (when connection is available)');

      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log(data);

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.log('\n📝 Please apply the migration manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/ytkylwpbitocnhkyropm/editor');
    console.log('\n📄 SQL file location: ./supabase/migrations/20260920192000_device_context_cache.sql');
  }
}

applyMigration();
