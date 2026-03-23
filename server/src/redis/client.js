const { createClient } = require('redis');

let client;

async function connectRedis() {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  client.on('error', err => console.error('Redis error:', err));
  await client.connect();
  console.log('✅ Redis connected');
}

function getRedis() {
  if (!client) throw new Error('Redis not initialised — call connectRedis() first');
  return client;
}

module.exports = { connectRedis, getRedis };
