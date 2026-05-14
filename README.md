# Wordle

A pixel-perfect, production-ready clone of the original New York Times Wordle, built as a single-page Next.js 15 app with optional cloud sync.

> _Screenshot placeholder — drop a `docs/screenshot.png` in here once the app is running locally and reference it in this section._

## Features

- 🎯 **Faithful gameplay** — the same daily 5-letter puzzle for every player worldwide, derived deterministically from the UTC date.
- 💚 **NYT-accurate evaluator** — two-pass duplicate-letter handling so guesses like _BOBBY_ → _ROBOT_ behave exactly like the original.
- 🌗 **Three themes** — dark (default), light, and colour-blind-friendly high-contrast (orange / blue).
- 🧠 **Hard Mode** — revealed hints must be reused in subsequent guesses; locked once the first guess is in.
- 🔁 **Optional cloud sync** — Supabase + Google OAuth with conflict-resolving local-first storage. The game works offline regardless.
- 📈 **Stats** — Played / Win % / Current & Max streak, plus a 1–6 distribution chart.
- 📤 **Share** — emoji grid copied to clipboard or shared via the Web Share API.
- ⌨️ **Full keyboard support** — physical keyboard, on-screen keyboard, mobile haptics, focus management, ARIA live regions.
- 🪶 **PWA** — installable, manifested, offline-ready, safe-area-aware.
- 🧪 **Unit-tested core** — 30 Vitest tests cover the evaluator, engine, hard-mode rules and streak logic.

## Tech Stack

| Layer       | Choice                                                                           |
| ----------- | -------------------------------------------------------------------------------- |
| Framework   | [Next.js 15](https://nextjs.org/) (App Router, RSC)                              |
| Language    | [TypeScript 5.9](https://www.typescriptlang.org/) (strict, `noUncheckedIndexedAccess`) |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first `@theme`, no JS config)   |
| Animations  | [Framer Motion 11](https://www.framer.com/motion/)                               |
| State       | [Zustand 5](https://zustand-demo.pmnd.rs/) with persist middleware               |
| Auth + DB   | [Supabase](https://supabase.com/) (Auth, Postgres)                               |
| ORM         | [Drizzle ORM](https://orm.drizzle.team/)                                         |
| Icons       | [Lucide React](https://lucide.dev/)                                              |
| Fonts       | Geist Sans + Geist Mono (`next/font/google`)                                     |
| Tests       | [Vitest 2](https://vitest.dev/)                                                  |
| Deployment  | [Vercel](https://vercel.com/)                                                    |
| Package mgr | [pnpm](https://pnpm.io/)                                                         |

## Project Structure

```
wordle-game/
├── app/                       # Next.js App Router
│   ├── (auth)/login/          # /login page + Supabase Google OAuth button
│   ├── (auth)/callback/       # OAuth code exchange + profile upsert
│   ├── api/sync/              # POST {push|pull} for cloud sync
│   ├── globals.css            # Tailwind v4 theme tokens + animations
│   ├── icon.svg               # PWA icon
│   ├── layout.tsx             # Root layout, fonts, FOUC-safe theme bootstrap
│   └── page.tsx               # Renders <GameApp/>
├── components/
│   ├── game/                  # Board, Row, Tile, Keyboard, KeyboardKey, GameResult, GameApp
│   ├── modals/                # Modal shell + Help / Stats / Settings
│   ├── layout/                # Header / Navbar (modal owner) / Toast
│   └── auth/                  # AuthButton / UserMenu (header badge)
├── hooks/                     # useGame, useKeyboard, useLocalStorage, useSync, useTheme
├── lib/
│   ├── game/                  # engine.ts, evaluator.ts, words.ts (daily selector)
│   ├── db/                    # Drizzle schema, queries, lazy postgres client
│   ├── supabase/              # browser + server clients
│   ├── types.ts               # ClassValue helper
│   └── utils.ts               # cn, applyGameResult, buildShareGrid, shareOrCopy
├── store/                     # gameStore, settingsStore, toastStore (Zustand)
├── public/
│   ├── words/valid-words.json # 14,855 accepted guesses
│   ├── words/answers.json     # 2,309 answer words
│   ├── favicon.svg            # tile-style W
│   └── manifest.webmanifest
├── supabase/migrations/001_init.sql   # full schema + RLS + triggers
├── scripts/build-word-lists.mjs       # regenerate word lists from canonical sources
├── tests/                     # Vitest unit tests (engine + evaluator)
├── types/index.ts             # shared TS types
├── drizzle.config.ts          # drizzle-kit config
├── vercel.json                # security headers + framework hints
└── package.json
```

## Local Setup

### 1. Prerequisites

- **Node.js** ≥ 18.18 (tested with 24.x)
- **pnpm** ≥ 9 — `npm install -g pnpm`
- A **Supabase** project (free tier is fine) — only required for sign-in / cloud sync. The game works without it.

### 2. Install

```bash
git clone <your-fork-url> wordle-game
cd wordle-game
pnpm install
```

### 3. Generate fresh word lists (optional)

The repo already ships with the curated lists; regenerate them only if you want to update the source:

```bash
node scripts/build-word-lists.mjs
```

### 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

| Variable                          | Required for          | Where to find it                                              |
| --------------------------------- | --------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Sign-in & sync        | Supabase → _Project Settings_ → _API_ → _Project URL_         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Sign-in & sync        | Supabase → _Project Settings_ → _API_ → _anon public_         |
| `SUPABASE_SERVICE_ROLE_KEY`       | Privileged server ops | Supabase → _Project Settings_ → _API_ → _service_role secret_ |
| `DATABASE_URL`                    | Drizzle migrations    | Supabase → _Project Settings_ → _Database_ → _Connection string_ |
| `NEXT_PUBLIC_APP_URL`             | OAuth redirect URLs   | `http://localhost:3000` for dev                               |

> The app starts without any of these — it'll just disable sign-in and fall back to local-only storage.

### 5. Run

```bash
pnpm dev          # http://localhost:3000
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
pnpm build        # production build
```


## Supabase Setup

The game runs purely from `localStorage` if Supabase is not configured. Sign-in adds cross-device sync.

### 1. Create a project

1. Sign in at <https://supabase.com> → **New project**.
2. Name it `wordle` (or whatever you prefer), set a strong DB password, choose the region closest to you, and click **Create**.

### 2. Run the migration

The SQL migration in `supabase/migrations/001_init.sql` creates `profiles`, `game_states`, `user_stats`, sets up RLS policies, and installs a trigger that mirrors `auth.users` rows into `public.profiles`.

You have two options:

- **Easiest** — copy the contents of `supabase/migrations/001_init.sql` into the Supabase SQL editor and **Run**.
- **Or** with the Supabase CLI installed:

  ```bash
  supabase link --project-ref <your-project-ref>
  supabase db push
  ```

Verify in the Table editor that `profiles`, `game_states`, and `user_stats` exist with RLS enabled.

### 3. Configure Google OAuth

1. **Authentication → Providers → Google** in the Supabase dashboard. Enable it.
2. In Google Cloud Console, create an OAuth 2.0 Client (Web application).
   - **Authorized JavaScript origins**: `http://localhost:3000` and your production URL.
   - **Authorized redirect URIs**: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the Client ID and Secret back into Supabase and **Save**.
4. Under **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (set to production URL when deployed).
   - **Redirect URLs**: add `http://localhost:3000/callback` and your production callback (`https://your-domain.com/callback`).

### 4. Test sign-in locally

```bash
pnpm dev
# open http://localhost:3000
# click the cloud icon in the header (or open Settings → Sign in with Google)
```

After signing in, refresh — the avatar should appear in the header. Open the SQL editor and run `select * from public.profiles;` to confirm the row was created.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Click **New Project** in Vercel and import the repo.
3. Vercel will detect Next.js automatically. Set the framework preset to **Next.js** if it isn't already.
4. Add the environment variables from `.env.production.example` in **Settings → Environment Variables**.
5. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://wordle.your-team.vercel.app`).
6. In Supabase, add the production URL to:
   - **Authentication → URL Configuration → Site URL**
   - **Authentication → URL Configuration → Redirect URLs** (`https://your-vercel-url/callback`)
   - The Google OAuth credentials' authorised origins / redirect URIs.
7. **Deploy**.

The bundled `vercel.json` adds security headers (CSP-friendly defaults, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser                                             │
│  ┌──────────────┐   ┌────────────┐   ┌────────────┐ │
│  │   GameApp    │──▶│  useGame   │──▶│  engine.ts │ │
│  │  (RSC root)  │   │  useSync   │   │ evaluator  │ │
│  └──────┬───────┘   └─────┬──────┘   └─────┬──────┘ │
│         │                 │                │        │
│         ▼                 ▼                ▼        │
│  ┌──────────────────────────────────────────────┐  │
│  │     Zustand stores (persist → localStorage)  │  │
│  │  gameStore  •  settingsStore  •  toastStore  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────┘
                             │  POST /api/sync
                             ▼
┌─────────────────────────────────────────────────────┐
│  Next.js Route Handlers                              │
│  ┌──────────────────────┐   ┌────────────────────┐ │
│  │ (auth)/callback      │   │   api/sync         │ │
│  │  exchange OAuth code │   │  push/pull state   │ │
│  └─────────┬────────────┘   └──────────┬─────────┘ │
│            │                           │            │
│            ▼                           ▼            │
│   ┌───────────────────────────────────────────┐    │
│   │  Supabase                                  │    │
│   │  Auth (Google) + Postgres (Drizzle ORM)    │    │
│   │  RLS-scoped tables: profiles / game_states │    │
│   │  / user_stats                              │    │
│   └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Key design decisions

- **Local-first**. The Zustand `gameStore` persists to `localStorage`. Sync is purely additive — every interaction works offline, and a successful login simply layers cloud sync on top.
- **Pure game core**. `lib/game/{engine,evaluator,words}.ts` are framework-agnostic and 100% unit-tested. The engine's `submitGuess` returns a discriminated union for the React layer to consume — making the UI simple to reason about.
- **NYT-faithful duplicate handling**. The evaluator uses two passes: first marks all `correct` matches and consumes them from a "remaining letters" pool; the second pass only marks `present` for letters still in the pool. See `tests/evaluator.test.ts` for the canonical edge cases (`bobby` vs `robot`, `hello` vs `world`).
- **Daily selection**. `dayOffsetForDate(d)` returns `floor((utcMidnight(d) - PUZZLE_EPOCH_UTC) / day)`. Index into the answer list with that offset and every player worldwide gets the same word for the same UTC date.
- **Theme-as-data-attributes**. Themes are pure CSS — `[data-theme]` and `[data-high-contrast]` flip token sets defined in `app/globals.css`. An inline boot script in `app/layout.tsx` applies them before paint to avoid FOUC.
- **Animations are CSS-only for the board** so they survive `prefers-reduced-motion` and don't depend on JS. Framer Motion drives modals and toasts where the orchestration matters more than perf.
- **Sync conflict resolution** keeps the more "complete" state — server wins for finished games, local wins when there's no server record yet for today's date.

## Regenerating Word Lists

The build script downloads the canonical lists from public sources (`tabatkins/wordle-list` for accepted guesses, `3b1b/videos` for the original 2,309 answer set), normalises them, and writes them to `public/words/`:

```bash
node scripts/build-word-lists.mjs
```

## License

This is a learning / portfolio clone. The original Wordle game and trademarks belong to The New York Times Company. Do not use this project for commercial purposes.
