require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { connectDB, getDB } = require('./client');

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  language    TEXT NOT NULL DEFAULT 'javascript',
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id     UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor',  -- 'owner' | 'editor' | 'viewer'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID REFERENCES rooms(id) ON DELETE CASCADE,
  snapshot    TEXT NOT NULL DEFAULT '',
  revision    INTEGER NOT NULL DEFAULT 0,
  saved_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_room_id_idx ON sessions(room_id);
`;

async function migrate() {
  await connectDB();
  const db = getDB();
  await db.query(SQL);
  console.log('✅ Migrations applied');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
