require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the direct PostgreSQL connection
const connectionString = "postgresql://postgres:hopecreed098Q!@db.enomgubgaipyujbufzlq.supabase.co:5432/postgres";

async function setupDatabase() {
  console.log('Connecting to database...');

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database!');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Creating tables...');
    await client.query(sql);
    console.log('✓ Database tables created successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.log('\n⚠ Connection failed. This might be a network/firewall issue.');
      console.log('Please run the SQL manually in Supabase:');
      console.log('1. Go to: https://enomgubgaipyujbufzlq.supabase.co');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New query"');
      console.log('4. Copy and paste the SQL from: backend/supabase-schema.sql');
      console.log('5. Click "Run"');
    }
  } finally {
    await client.end();
  }
}

setupDatabase();
