# Primeshot Monorepo

A modern AI-powered headshot generator built with a **Turborepo**.  
This repository contains:

| Package      | Path                 | Description                                  |
|--------------|----------------------|----------------------------------------------|
| **webapp**   | `webapp/`            | Main customer-facing Next.js 15 application   |
| **website**  | `website/`           | Marketing site (static Next.js app)          |
| **common**   | `common/`            | Shared React components, hooks & utilities   |

---

## Prerequisites

```bash
# install dependencies for all workspaces
npm install
```

## Development workflow

Start every workspace that has a `dev` script (webapp, website **and** the TypeScript watcher for the shared `common` package) in one shot:

```bash
npx turbo run dev          # parallel, cached, cross-workspace
```

**Note**: The webapp dev server now automatically starts the Stripe webhook listener alongside Next.js for complete local development.

Common scenarios:

| Command                                   | What it does                                   |
|-------------------------------------------|------------------------------------------------|
| `npx turbo run dev --filter=webapp`       | Run webapp with Next.js + Stripe webhook listener |
| `npm run dev:no-stripe --workspace=webapp` | Run only webapp Next.js dev server (no webhooks) |
| `npm run watch --workspace=@primeshot/common` | Re-compile `common` on file save               |
| `npx turbo run build`                     | Production build for every package             |

### How hot-reloading works

* `common` is compiled to `dist/` via **TypeScript in watch mode** (`npm run watch`).  
* The apps (`webapp`, `website`) import from the compiled output, so any change in `common/` triggers an incremental rebuild and Next.js automatically refreshes the browser.

---

## Env files

Each Next.js project keeps its own `.env.local`. See `webapp/.env.example` for required variables.  
Secrets are **not** committed.

---

## Task-Master driven workflow

This repo still uses the AI-assisted Task-Master CLI for planning & tracking.  
The full documentation was moved to [`docs/task-master.md`](docs/task-master.md).