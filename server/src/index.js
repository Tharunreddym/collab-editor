require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initWebSocket } = require('./rooms/ws-server');
const { connectRedis } = require('./redis/client');
const { connectDB } = require('./db/client');
const authRouter = require('./auth/router');
const roomsRouter = require('./rooms/router');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

async function start() {
  await connectDB();
  await connectRedis();
  initWebSocket(server);
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`🚀 Server running on :${PORT}`));
}

start().catch(err => { console.error(err); process.exit(1); });
