# Fitness Tracker

A mobile-friendly Strong-style routine tracker built with React + Vite and
Supabase (Auth + Postgres). It includes routine creation, active workouts with
sets and a rest timer, routine-based progress charts, and exercise guidance.

## Setup

1. Install dependencies: `npm install`
2. Create a Supabase project and copy `.env.example` to `.env`, filling in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the SQL migrations in the Supabase SQL editor (or via the CLI):
   - `schema.sql` — routine schema (`exercises`, `routines`, `routine_exercises`,
     `workout_sessions`, `exercise_logs`, `set_logs`) with row level security,
     exercise guidance metadata, and seeded default exercises.
   - Exercise guidance is enriched from the open-source Wger API. Wger media and
     descriptions are licensed under CC-BY-SA 4.0; each workout guide links to
     its source reference.
4. Start the dev server: `npm run dev`

## Building for GitHub Pages

- `npm run build` outputs static assets to `dist/` using Vite.
- Routing uses `HashRouter`, so deep links (e.g. `#/workout/active`) work on
  GitHub Pages without a custom 404 redirect.
- `vite.config.js` sets `base: '/'` because this repo is deployed to a custom
  domain (see `CNAME`). If you deploy to `https://<user>.github.io/fitness/`
  without a custom domain, change `base` to `/fitness/` instead.
- The `.github/workflows/deploy.yml` workflow builds and publishes `dist` to
  GitHub Pages on every push to `main`, reading `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` from repository secrets.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
