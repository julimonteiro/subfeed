# SubFeed

A personal website to track the latest videos from your favorite YouTube channels. Add a channel URL and see new videos in a timeline feed with thumbnails, titles, channel names, and direct links to YouTube.

Fully responsive -- works on both desktop and mobile.

## Features

- **Feed filters** -- toggle between All, Unwatched, and Watched videos
- **Search** -- find videos by title or channel name with the collapsible search bar
- **Grid / List view** -- switch between a detailed list and a compact thumbnail grid (persisted in localStorage)
- **Channel preview** -- see the channel name, avatar, and handle before confirming the add
- **Video descriptions** -- expand the description preview below each video title
- **Mark all as watched** -- batch-mark all visible unwatched videos with one click
- **Scheduled updates** -- feed refreshes automatically at 8 AM and 8 PM (BRT), with a next-update indicator in the toolbar
- **Skeleton loading** -- animated placeholder cards while content loads
- **Password protection** -- optional shared password to restrict access
- **Dark theme** -- Bluesky-inspired dark UI

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** (dark mode, Bluesky-inspired design)
- **Cloudflare Pages** (hosting)
- **Cloudflare D1** (SQLite database at the edge)
- **YouTube RSS Feeds** (no API key required)

---

## Deploying to Cloudflare -- Step by Step

### 1. Prerequisites

- **Node.js 18+** (includes npm) -- [download here](https://nodejs.org/)
  - On macOS you can also install via Homebrew: `brew install node`
  - On Ubuntu/Debian: `sudo apt install nodejs npm`
  - On Windows: download the installer from the link above
  - Verify installation: `node -v && npm -v`
- **Cloudflare account** (free tier) -- [sign up here](https://dash.cloudflare.com/sign-up)
- **Git** installed -- [download here](https://git-scm.com/downloads)

### 2. Clone the repository and install dependencies

```bash
git clone <YOUR_REPOSITORY_URL>
cd subfeed
npm install
```

> `npm install` downloads all project dependencies into the `node_modules/` folder. This is a one-time step (re-run only if `package.json` changes).

### 3. Log in to Cloudflare

`wrangler` is the official Cloudflare CLI. It is already installed as a project dependency.

```bash
npx wrangler login
```

This will open your browser for authorization. Click **Allow** and you are done.

### 4. Create the D1 database

```bash
npx wrangler d1 create subfeed-db
```

The command will return something like this:

```
Successfully created DB 'subfeed-db'

[[d1_databases]]
binding = "DB"
database_name = "subfeed-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 5. Update `wrangler.toml`

Open the `wrangler.toml` file at the project root and replace `YOUR_D1_DATABASE_ID_HERE` with the `database_id` from the previous step:

```toml
[[d1_databases]]
binding = "DB"
database_name = "subfeed-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"
```

### 6. Run database migrations

This creates the `channels` table in D1.

**Remote (production):**

```bash
npm run db:migrate:remote
```

**Local (development):**

```bash
npm run db:migrate:local
```

### 7. Test locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can:

1. Go to **Channels** and add a channel (e.g. `https://www.youtube.com/@MichaelReeves`)
2. Go back to **Feed** to see the channel's latest videos

> **Note:** In local development mode (`next dev`), D1 is emulated locally by wrangler. Data is stored in `.wrangler/state/`.

### 8. Deploy to Cloudflare

```bash
npm run cf:deploy
```

This command does two things:
1. `@opennextjs/cloudflare build` -- compiles the Next.js app for Cloudflare Workers
2. `wrangler pages deploy` -- uploads to Cloudflare Pages

On the first run, wrangler will ask for a project name. You can use `subfeed`.

After deployment, it will show the site URL:

```
Deployment complete! https://subfeed.pages.dev
```

### 9. Access your site

Done! Your site is live. Open the URL shown in the previous step.

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Run the site locally (port 3000) |
| `npm run cf:dev` | Run using local Cloudflare Workers |
| `npm run cf:build` | Build for Cloudflare (no deploy) |
| `npm run cf:deploy` | Build and deploy to Cloudflare |
| `npm run db:migrate:local` | Run migrations on local D1 |
| `npm run db:migrate:remote` | Run migrations on production D1 |

## Password Protection (optional)

You can restrict access to the app with a single shared password. When enabled, all pages and API routes require authentication via a login screen.

**Production (Cloudflare secret):**

```bash
npx wrangler secret put SITE_PASSWORD
```

Enter the desired password when prompted.

**Local development:**

Create a `.dev.vars` file at the project root:

```
SITE_PASSWORD=your-password
```

If `SITE_PASSWORD` is not set, the app is publicly accessible (no login required).

---

## Custom Domain (optional)

To use a custom domain (e.g. `feed.yourdomain.com`):

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > your project > **Custom domains**
3. Click **Set up a custom domain**
4. Follow the instructions to point your domain

---

## How It Works

- Videos are fetched via **public YouTube RSS feeds** (no API key needed)
- Each channel has an RSS feed at `https://www.youtube.com/feeds/videos.xml?channel_id=...`
- The feed returns the ~15 most recent videos from each channel
- **Feed updates are scheduled at 8 AM and 8 PM (America/Sao_Paulo timezone)**. Between windows, the server returns cached data. The client automatically re-fetches when the next window arrives.
- Subscribed channels are stored in **Cloudflare D1** (SQLite at the edge)
- Watched video IDs are tracked in a separate D1 table

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/feed` | GET | Aggregated feed from all channels |
| `/api/channels` | GET | List all channels |
| `/api/channels` | POST | Add a channel (by URL or pre-resolved data) |
| `/api/channels/resolve` | POST | Resolve a YouTube URL to channel metadata (preview) |
| `/api/channels/[id]` | DELETE | Remove a channel |
| `/api/watched` | GET | List watched video IDs |
| `/api/watched` | POST | Mark video(s) as watched (single or batch) |
| `/api/auth` | GET/POST/DELETE | Authentication (check, login, logout) |
