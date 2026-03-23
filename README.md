<div align="center">

<br />

```
  ██████╗ ██████╗ ██╗      ██╗      █████╗ ██████╗
 ██╔════╝██╔═══██╗██║      ██║     ██╔══██╗██╔══██╗
 ██║     ██║   ██║██║      ██║     ███████║██████╔╝
 ██║     ██║   ██║██║      ██║     ██╔══██║██╔══██╗
 ╚██████╗╚██████╔╝███████╗███████╗██║  ██║██████╔╝
  ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝
```

### Real-time collaborative code editor

**Multiple users. One document. Zero conflicts.**

<br />

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-818cf8?style=flat-square)](https://github.com/websockets/ws)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/license-MIT-22d3ee?style=flat-square)](LICENSE)

<br />

[**Live Demo**](https://collab-editor.onrender.com) · [**Report Bug**](https://github.com/yourusername/collab-editor/issues) · [**Request Feature**](https://github.com/yourusername/collab-editor/issues)

<br />

</div>

---

## ✨ What is this?

**Collab Editor** is a production-grade real-time code editor that lets multiple developers write in the same file simultaneously — think Google Docs, but for code. Built from scratch with a custom Operational Transform engine, every keystroke is synced across all connected clients with zero conflicts, even when editing the same line at the same time.

It ships with a ghost companion 👻 that reacts to your code — dancing when your code runs successfully, encouraging you when there's an error, and reminding you to take breaks.

<br />

## 🚀 Features

| | Feature | Description |
|---|---|---|
| ⚡ | **Real-time sync** | WebSocket-powered live editing — changes appear instantly for all users |
| 🔀 | **Operational Transform** | Custom OT engine resolves concurrent edits — no keystrokes ever lost |
| 💾 | **Persistent sessions** | PostgreSQL stores snapshots; Redis caches live state for instant join |
| 🔐 | **JWT auth + rooms** | Register, log in, create public/private rooms, invite as editor or viewer |
| 🎨 | **Syntax highlighting** | CodeMirror 6 with JS/TS, Python, Rust, HTML, CSS language support |
| 👥 | **Live presence** | Coloured avatars show exactly who's in the room right now |
| 👻 | **Ghost companion** | Animated buddy reacts to your runs, saves, typing speed, and coding time |
| ▶ | **In-browser JS runner** | Run JavaScript directly in the editor — sandboxed iframe execution |
| 🐳 | **One-command Docker** | Full stack containerised — `docker compose up --build` and you're live |
| 🚀 | **Deploy anywhere** | Ships with Railway and Render configs out of the box |

<br />

## 🛠 Tech stack

```
Frontend                    Backend                     Infrastructure
─────────────────────────   ─────────────────────────   ─────────────────────────
React 18                    Node.js 20                  Docker + Docker Compose
React Router 6              Express 4                   nginx (reverse proxy)
CodeMirror 6                ws (WebSockets)             GitHub Actions CI
Geist Mono + Instrument     PostgreSQL 16               Railway
  Serif (typography)        Redis 7                     Render
CSS Modules                 JWT (jsonwebtoken)
Vite 5                      bcryptjs
                            Custom OT engine
```

<br />

## ⚙️ Quick start

### Prerequisites
- **Node.js** ≥ 20
- **Docker + Docker Compose** (for Postgres & Redis)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/collab-editor.git
cd collab-editor

# 2. Spin up Postgres + Redis
docker compose up postgres redis -d

# 3. Install all dependencies (both workspaces)
npm install

# 4. Set up environment
cp .env.example .env

# 5. Run database migrations + seed demo data
npm run db:migrate
npm run db:seed

# 6. Start dev servers with hot reload
npm run dev
```

> 🌐 App: **http://localhost:5173** · API: **http://localhost:4000**
>
> 🔑 Demo login: `demo@example.com` / `password123`

<br />

## 🐳 Production deploy (Docker)

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET and CLIENT_URL

docker compose up --build -d
```

nginx serves the React app on `:80` and proxies `/api` + `/ws` to the Node server. One command, everything running.

<br />

## 📁 Project structure

```
collab-editor/
│
├── 📂 server/src/
│   ├── index.js                 ← Express + HTTP server bootstrap
│   ├── auth/
│   │   ├── middleware.js         ← JWT sign / verify / requireAuth
│   │   └── router.js             ← POST /register, /login · GET /me
│   ├── rooms/
│   │   ├── router.js             ← REST: list / create / get / invite
│   │   └── ws-server.js          ← WebSocket server + OT orchestration
│   ├── ot/
│   │   └── engine.js             ← Operational Transform (insert / delete)
│   ├── db/
│   │   ├── client.js             ← pg Pool
│   │   ├── migrate.js            ← Schema migrations
│   │   └── seed.js               ← Demo data
│   └── redis/
│       └── client.js             ← Redis client wrapper
│
├── 📂 client/src/
│   ├── App.jsx                  ← React Router setup
│   ├── lib/
│   │   ├── api.js                ← fetch wrapper for REST endpoints
│   │   └── auth-context.jsx      ← Auth state provider
│   ├── hooks/
│   │   └── useCollabSocket.js    ← WS connection + OT client + reconnect
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx     ← Room list + create
│   │   └── EditorPage.jsx        ← CodeMirror + collab glue + JS runner
│   └── components/
│       ├── GhostCompanion.jsx    ← Animated coding buddy 👻
│       ├── PresenceBar.jsx       ← Live collaborator avatars
│       ├── StatusBar.jsx         ← WS status + member count
│       └── InviteModal.jsx       ← Invite user to room
│
├── 📂 nginx/
│   └── nginx.conf               ← Reverse proxy: / → React · /api + /ws → Node
│
├── docker-compose.yml
├── railway.toml                 ← Railway deploy config
├── render.yaml                  ← Render deploy (server + static + Redis + PG)
└── .github/workflows/ci.yml     ← GitHub Actions CI pipeline
```

<br />

## 🧠 How the OT engine works

Every keystroke produces a minimal operation:

```js
{ type: 'insert', pos: 42, chars: 'hello' }   // insert 5 chars at position 42
{ type: 'delete', pos: 42, count: 5 }          // delete 5 chars at position 42
```

When the server receives an op from client A:

```
Client A  ──── op(clientRev=5) ────▶  Server
                                         │
                                    Fetch ops[5..current] from Redis
                                         │
                                    Transform A's op against each
                                    concurrent op using transformOp()
                                         │
                                    Apply transformed op to document
                                         │
                               ┌─────────┴──────────┐
                               ▼                    ▼
                          ACK to A            Broadcast to
                        (new revision)        all others
```

This guarantees **convergence** — every client ends up with the identical document regardless of network latency or message ordering.

<br />

## 📡 WebSocket protocol

| Direction | Message |
|---|---|
| `server → client` | `{ type: 'init', doc, revision, color }` |
| `client → server` | `{ type: 'op', op, clientRev }` |
| `server → client` | `{ type: 'ack', revision }` |
| `server → client` | `{ type: 'op', op, revision, userId }` |
| `client → server` | `{ type: 'cursor', position }` |
| `server → client` | `{ type: 'cursor', userId, username, color, position }` |
| `server → client` | `{ type: 'presence', members: [{userId, username, color}] }` |
| `client → server` | `{ type: 'save' }` |
| `server → client` | `{ type: 'saved' }` |

<br />

## 🌍 Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://collab:collab@localhost/collab` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | `dev-secret-change-in-prod` | ⚠️ Change this in production |
| `JWT_EXPIRES` | `7d` | Token expiry duration |
| `CLIENT_URL` | `http://localhost:5173` | CORS allowed origin |
| `PORT` | `4000` | Server port |
| `VITE_WS_URL` | *(empty — Vite proxy in dev)* | WebSocket URL for production |

<br />

## 🚀 Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Add **PostgreSQL** and **Redis** plugins
4. Set `JWT_SECRET` and `CLIENT_URL` in Variables
5. Railway auto-deploys on every push to `main` ✓

## 🚀 Deploy to Render

1. Update the two URLs in `render.yaml` to match your Railway server URL
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` automatically
4. Click **Apply** — server + static site + Postgres + Redis all spin up ✓

<br />

## 👻 Ghost companion reactions

| Trigger | Reaction |
|---|---|
| Page load | Floats and greets you |
| Typing in editor | Wiggles with excitement |
| ▶ Run → success | Fullscreen celebration + confetti |
| ▶ Run → error | Encouraging fullscreen overlay |
| Save (⌘S) | Spins 360° |
| 30 min coding | Reminds you to hydrate / stretch |
| Login success | Full celebration overlay |
| Wrong password | Gentle encouragement |

<br />

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# open a pull request
```

<br />

## 📄 License

MIT © 2026 — built with ❤️ and too much coffee

<br />

<div align="center">

⭐ **Star this repo if you found it useful!**

</div>
