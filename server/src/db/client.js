const { Pool } = require('pg');

let pool;

function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  return pool.query('SELECT 1').then(() => console.log('✅ PostgreSQL connected'));
}

function getDB() {
  if (!pool) throw new Error('DB not initialised — call connectDB() first');
  return pool;
}

module.exports = { connectDB, getDB };
