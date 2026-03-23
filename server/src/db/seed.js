require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB, getDB } = require('./client');

async function seed() {
  await connectDB();
  const db = getDB();

  const hash = await bcrypt.hash('password123', 10);

  const { rows: [user] } = await db.query(
    `INSERT INTO users (username, email, password) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
     RETURNING id`,
    ['demo', 'demo@example.com', hash]
  );

  const { rows: [room] } = await db.query(
    `INSERT INTO rooms (name, owner_id, language, is_public) VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    ['Demo Room', user.id, 'javascript', true]
  );

  if (room) {
    await db.query(
      `INSERT INTO room_members (room_id, user_id, role) VALUES ($1,$2,'owner') ON CONFLICT DO NOTHING`,
      [room.id, user.id]
    );
    await db.query(
      `INSERT INTO sessions (room_id, snapshot, revision) VALUES ($1,$2,0) ON CONFLICT DO NOTHING`,
      [room.id, '// Welcome to the demo room!\nconsole.log("Hello, world!");\n']
    );
  }

  console.log('✅ Seed complete — demo@example.com / password123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
