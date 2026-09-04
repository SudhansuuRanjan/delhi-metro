# 🚇 Delhi Metro - Smart Route Planner

A modern, sleek web application for planning Delhi Metro journeys. Find the optimal route between any two stations with live data on travel time, distance, fare, and transfers.

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-black?logo=cloudflare)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![D1](https://img.shields.io/badge/D1-SQLite-orange)

## ✨ Features

- **🔍 Smart Route Finding** - Find the optimal route between any two Delhi Metro stations (Dijkstra over the real network graph)
- **⏱️ Journey Details** - View travel time, distance, real fare, and number of transfers
- **🔄 Easy Station Swap** - Quickly swap origin and destination with one click
- **❤️ Favorite Routes** - Save frequently used routes for quick access
- **🕐 Recent Searches** - Access your recent route searches instantly
- **🔗 Shareable Links** - Share route links with friends and family
- **🗺️ Line Explorer** - Browse every metro line's stations in order
- **🚉 Station Pages** - Station details, lines served, and nearby stations
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **🎨 Modern UI** - Beautiful glassmorphism design with smooth animations

## 🏗️ Architecture

**Live data, synced on a schedule — no upstream API calls at request time.**

```
Cron trigger (every 4h)
        │
        ▼
scheduled() handler ──> DMRC backend API (browser headers)
        │                     │
        │                     ▼
        │            transform + validate
        │                     │
        │                     ▼
        │            D1 writes (Drizzle ORM) + Graph Durable Object + KV cache
        │
        ▼
Browser SPA (React Query) ──> Hono API routes ──> D1 / Graph DO (reads only)
```

- **Cloudflare Workers** runs the Hono API and the cron-synced data pipeline
- **D1 (SQLite)** is the durable source of truth: stations, lines, edges (with real times + haversine distances), and calibrated fare brackets
- **Graph Durable Object** keeps the compiled network graph in memory for instant Dijkstra routing
- **KV** caches the station/line catalogs and route results
- **React Query** powers the client data fetching
- **react-router-dom** handles SPA routing (`/`, `/line/:code`, `/station/:code`)

The sync pipeline (`src/lib/sync/`) fetches from `api_endpoints.md` endpoints, derives per-hop travel times from real route data, computes haversine distances, and calibrates the DMRC fare brackets — all stored in D1 and served entirely from there.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account (for deployment) — or just run locally with the dev server

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd delhi_metro_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Apply D1 migrations locally:
   ```bash
   npm run db:migrate:local
   ```

4. Run the development server (Worker + SPA with HMR):
   ```bash
   npm run dev
   ```

5. Trigger the first data sync:
   ```bash
   curl -X POST http://localhost:5173/api/internal/sync \
     -H "x-cron-secret: dev-sync-secret"
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Project Structure

```
delhi_metro_app/
├── src/
│   ├── worker.ts            # Hono app + scheduled() cron handler
│   ├── worker/graph.ts      # Graph Durable Object (in-memory Dijkstra)
│   ├── db/                  # Drizzle schema + D1 client
│   ├── lib/
│   │   ├── dmrc.ts          # DMRC API client (browser headers, retries)
│   │   ├── dmrcTypes.ts     # DMRC response types
│   │   ├── geo.ts           # Haversine + time parsing
│   │   └── sync/            # catalog fetch, fare calibration, orchestrator
│   └── client/              # React SPA (react-router, React Query)
│       ├── pages/           # HomePage (planner), LinePage, StationPage
│       ├── api.ts           # client API helpers
│       └── hooks.ts         # React Query hooks
├── drizzle/                 # Generated SQL migrations
├── wrangler.toml            # Worker config: D1, KV, DO, cron, assets
└── api_endpoints.md         # DMRC upstream endpoints reference
```

## 🛠️ Tech Stack

- **Runtime**: Cloudflare Workers (Hono)
- **Database**: D1 (SQLite) via Drizzle ORM
- **Cache**: Cloudflare KV
- **In-memory graph**: Durable Objects
- **Frontend**: React 19, react-router-dom, TanStack React Query, TailwindCSS 4, react-select
- **Build**: Vite + @cloudflare/vite-plugin

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Worker + SPA, HMR) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:migrate:remote` | Apply migrations to remote D1 |

## 🎯 Usage

1. **Select Origin** - Choose your starting station from the dropdown
2. **Select Destination** - Choose where you want to go
3. **Plan Journey** - Click "Plan My Journey" to find the best route
4. **View Results** - See detailed route information including:
   - Total travel time (from real per-hop times)
   - Distance covered (haversine-accurate)
   - Real fare (calibrated DMRC fare brackets)
   - Number of transfers
   - Step-by-step station list with line changes
5. **Explore** - Click any line badge or station to browse the network

## 💾 Data Persistence

- **D1**: stations, lines, edges, fare brackets (synced every 4h)
- **localStorage**: Recent searches + favorites (`delhiMetro_v2_*` keys)

## 🔄 The 4-Hour Sync

The cron trigger `0 */4 * * *` (UTC) runs `scheduled()`, which:
1. Fetches all lines, their ordered stations, and every station's detail
2. Derives per-hop travel times from real route samples (path_time split across hops)
3. Computes haversine distances between adjacent stations
4. Calibrates the DMRC fare brackets from sampled route fares
5. Writes everything to D1, publishes the compiled graph to the Graph DO, and warms KV

A KV lock prevents overlapping runs. If a run fails mid-way, the previous data stays intact (writes are idempotent).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and not licensed for public distribution.

---

Made with ❤️ for Delhi Metro commuters
