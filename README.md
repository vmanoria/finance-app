# Market Dashboard — Finance Analytics Lab

A React application that tracks **IBM and four competitors** (MSFT, ORCL, SAP, CRM) using Yahoo Finance data, presented across three time-window views.

Built as part of the [IBM Bob GitHub SDLC Automation](../README.md) workshop to demonstrate AI-assisted application development and GitHub-driven feature evolution.

---

## Views

| Tab | What it shows |
|---|---|
| **Current Day** | Live quote cards with price, change, 52-week range bar, volume, market cap, and market-state badge |
| **Last 7 Days** | Multi-series absolute price line chart + per-company 7-day % change summary strip |
| **Last Quarter** | Normalised % change area comparison chart + ranked performance table with calendar-quarter label |

---

## Quick start

```bash
# 1. Install dependencies
cd finance-app
npm install

# 2. Copy the env example (mock mode enabled by default)
cp .env.example .env

# 3. Start the dev server
npm run dev          # http://localhost:5173
```

`VITE_USE_MOCK=true` (the default) routes all data to deterministic offline fixtures — no Yahoo Finance account or network required.

To use live Yahoo Finance data, set `VITE_USE_MOCK=false` in `.env`. Note that `yahoo-finance2` is a Node.js library and requires a server-side proxy for browser use; see `src/services/yahooAdapter.js` for the proxy integration point.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle → `dist/` |
| `npm run lint` | oxlint across `src/` |
| `npm test` | Jest (all suites) |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report + threshold check |
| `npm run validate` | **Full gate**: lint → test → build (run before every commit) |

---

## Project structure

```
finance-app/
├── src/
│   ├── services/
│   │   ├── companies.js        ← COMPANY_META, TICKERS (single source of truth)
│   │   ├── financeService.js   ← public data API (getQuotes, getHistory, …)
│   │   ├── yahooAdapter.js     ← Node-only Yahoo Finance wrapper + ServiceError
│   │   └── mockData.js         ← deterministic offline fixtures
│   ├── utils/
│   │   ├── normalise.js        ← NormalisedQuote, normaliseHistory, summariseSeries
│   │   ├── dateHelpers.js      ← rangeParams (calendar-quarter), isMarketOpen
│   │   └── env.js              ← USE_MOCK flag (Vite + Jest compatible)
│   ├── store/
│   │   ├── dashboardSlice.js   ← Redux Toolkit slice, thunks, selectors
│   │   └── store.js
│   ├── hooks/
│   │   ├── useQuotes.js
│   │   └── useHistory.js
│   └── components/
│       ├── common/             ← Card, ErrorBanner, LoadingSpinner
│       ├── charts/             ← QuoteCard, PriceLineChart, ComparisonChart
│       └── dashboard/          ← ViewTabs, DayView, WeekView, QuarterView
└── tests/
    ├── unit/                   ← pure-function and component unit tests
    ├── integration/            ← financeService public API tests
    └── smoke/                  ← full view render tests
```

---

## Adding a company

1. Add one entry to `COMPANY_META` in [`src/services/companies.js`](src/services/companies.js).
2. That is the only required code change — `TICKERS` is derived automatically and all views iterate it.

---

## Tech stack

| Concern | Choice |
|---|---|
| App framework | React 19 + Vite 8 |
| State | Redux Toolkit |
| Charts | Recharts |
| Data source | yahoo-finance2 (Node) / mock fixtures (browser/CI) |
| Linter | oxlint |
| Tests | Jest 30 + React Testing Library + jsdom |

---

## CI

GitHub Actions workflow at [`.github/workflows/finance-app-ci.yml`](../.github/workflows/finance-app-ci.yml) runs on every push to `main`, `feature/**`, and `bob/**` branches:

```
install → lint → test → build
```

All steps run against mock data (`VITE_USE_MOCK=true`), so no credentials are required in CI.
