# Rewinddit

Rewinddit is a Devvit Web game for Reddit: a daily "time-travel" quiz where players guess the year of 5 historic Reddit moments with identifying details redacted.

Each day:
- Every player gets the same 5 moments.
- They guess years using a slider.
- Submitting reveals the real year and context.
- Score is based on guess proximity.
- Daily and all-time leaderboards update in Redis.

## MVP Features

- Daily puzzle generation (deterministic per UTC date)
- 40+ curated Reddit moments dataset
- 5-question daily quiz with year sliders
- Proximity-based scoring (max 500/day)
- Replay protection (one scored submission per user per day)
- Streak and best streak tracking
- Daily top 10 leaderboard
- All-time top 10 leaderboard
- Share-to-clipboard result summary with Devvit toast
- Daily scheduler job to seed puzzle cache

## Scoring

Per question:
- `delta = |guessYear - actualYear|`
- points:
  - `0` -> `100`
  - `1` -> `90`
  - `2` -> `70`
  - `3` -> `50`
  - `4` -> `30`
  - `5` -> `15`
  - `6+` -> `5`

Maximum daily score: `500`.

## Tech Stack

- Frontend: React 19 + Tailwind CSS 4 + Vite
- Server: Devvit Web server runtime + Hono + tRPC v11
- Persistence: Devvit Redis
- Language: TypeScript

## Project Structure

- `src/client`
  - `splash.tsx`: inline feed view
  - `game.tsx`: expanded gameplay UI
  - `hooks/useGame.ts`: client game state + tRPC calls
  - `trpc.ts`: typed tRPC client
- `src/server`
  - `index.ts`: Hono app + tRPC adapter + internal routes
  - `trpc.ts`: main game API (typed procedures)
  - `routes/scheduler.ts`: daily puzzle seed endpoint
  - `routes/menu.ts`: moderator menu action to create post
  - `data/moments.ts`: curated server-owned moments dataset
  - `core/puzzle.ts`: puzzle generation, scoring, date helpers
- `src/shared`
  - `api.ts`: shared response/type contracts
- `devvit.json`
  - post entrypoints, server entry, menu item, install trigger, scheduler cron

## Data Model

Moment record fields:
- `id: string`
- `year: number`
- `category: "legendary_comment" | "platform_event" | "meme" | "controversy" | "subreddit_moment" | "product_feature"`
- `promptTitle: string`
- `promptTextRedacted: string`
- `revealContext: string`
- `revealLink?: string`

Daily puzzle shape:
- `date: YYYY-MM-DD (UTC)`
- `momentIds: string[5]`
- `seed: string`
- `generatedAt: ISO timestamp`

## Redis Keys

All keys are prefixed with `rewinddit:`.

- `rewinddit:puzzle:<date>` -> cached daily puzzle JSON
- `rewinddit:play:<date>:<userId>` -> saved submission result JSON
- `rewinddit:user:<userId>:lastPlayed` -> date string
- `rewinddit:user:<userId>:streak` -> int
- `rewinddit:user:<userId>:bestStreak` -> int
- `rewinddit:user:<userId>:stats` -> JSON `{ gamesPlayed, totalScore }`
- `rewinddit:user:<userId>:name` -> username
- `rewinddit:lb:daily:<date>` -> sorted set (`member=userId`, `score=dailyScore`)
- `rewinddit:lb:alltime` -> sorted set (`member=userId`, `score=lifetimeScore`)

## API

tRPC procedures (`/trpc`):
- `puzzleToday` (query)
- `submit` (mutation)
- `leaderboards` (query)

REST routes (kept for internal tooling/backward compat):
- `GET /api/puzzle/today`
- `POST /api/submit`
- `GET /api/leaderboards?date=today|YYYY-MM-DD`

Internal endpoints:
- `POST /internal/menu/post-create`
- `POST /internal/triggers/on-app-install`
- `POST /internal/scheduler/rewinddit-daily-seed`

## Scheduler

Configured in `devvit.json`:
- name: `rewinddit-daily-seed`
- cron: `0 0 * * *` (00:00 UTC daily)
- endpoint: `/internal/scheduler/rewinddit-daily-seed`

The handler ensures today's puzzle exists in Redis.

## Local Development

### Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

1. Run `npm create devvit@latest --template=react`
2. Go through the installation wizard. You will need to create a Reddit account and connect it to Reddit developers
3. Copy the command on the success page into your terminal

### Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run build`: Builds your client and server projects
- `npm run deploy`: Uploads a new version of your app
- `npm run launch`: Publishes your app for review
- `npm run login`: Logs your CLI into Reddit
- `npm run type-check`: Type checks, lints, and prettifies your app

### Testing

Unit tests are in:
- `src/server/core/__tests__/puzzle.test.ts`

Current test coverage focuses on:
- deterministic puzzle generation
- scoring correctness
- data integrity constraints
- date helper format
