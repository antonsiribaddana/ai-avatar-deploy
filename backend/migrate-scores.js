require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function createScoresTable() {
  console.log('Creating scores table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS scores (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mode VARCHAR(50) NOT NULL,
        confidence_score INTEGER NOT NULL,
        fluency_score INTEGER NOT NULL,
        accuracy_score INTEGER NOT NULL,
        final_score INTEGER NOT NULL,
        duration INTEGER,
        responses INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  });

  if (error) {
    console.error('Error creating scores table:', error);
    // Try alternative method using direct SQL
    console.log('Trying alternative method...');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL,
  confidence_score INTEGER NOT NULL,
  fluency_score INTEGER NOT NULL,
  accuracy_score INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  duration INTEGER,
  responses INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
    `);
  } else {
    console.log('✓ Scores table created successfully!');
  }
}

createScoresTable();
