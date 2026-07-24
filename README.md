# Taskflow — Kanban Task Board

A polished, full-featured Kanban board built for the Next Play Games SDE internship assessment.

## Live Demo

> Deploy to Vercel/Netlify and add your URL here.

## Features

### Required
- Kanban board with **To Do**, **In Progress**, **In Review**, **Done** columns
- Drag-and-drop between columns with optimistic updates
- Supabase persistence with **Row Level Security (RLS)**
- **Anonymous guest auth** — each visitor gets their own isolated task board, with session persistence across visits
- **Shareable board links** — copy a link from your board and others can view and collaborate on the same tasks
- Create tasks with title, description, priority, and due date
- Loading and error states

### Advanced
- **Team members & assignees** — add members, assign to tasks, avatar chips on cards
- **Task comments** — chronological comments in task detail panel
- **Activity log** — timeline of status changes, edits, assignments
- **Labels/tags** — Bug, Feature, Design (auto-seeded) with multi-label support
- **Due date indicators** — color-coded urgency badges (overdue, today, soon)
- **Search & filtering** — by title, priority, assignee, label
- **Board summary stats** — total, in progress, completed, overdue

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** — dark theme inspired by Linear
- **@dnd-kit** — smooth drag-and-drop
- **Supabase** — PostgreSQL, anonymous auth, RLS
- **date-fns** + **lucide-react**

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd kanban-task-board
npm install
```

### 2. Supabase project

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers** and enable **Anonymous sign-ins**
3. Open the **SQL Editor** and run the full schema from [`supabase/schema.sql`](./supabase/schema.sql)
   - If you already ran an older version of the schema, also run [`supabase/migration-board-shares.sql`](./supabase/migration-board-shares.sql)
4. Copy your project URL and anon key from **Settings → API**

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> **Never** commit `.env` or use the service role key in the frontend.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Deploy (Vercel)

```bash
npm run build
```

Push to GitHub, import in [Vercel](https://vercel.com), and add the same env vars.

## Database Schema

See [`supabase/schema.sql`](./supabase/schema.sql) for the complete SQL including RLS policies.

**Tables:** `tasks`, `team_members`, `task_assignees`, `task_labels`, `labels`, `comments`, `activity_log`, `board_shares`

### Sharing your board

1. Open your board (the default URL with no query params).
2. Click **Share board** in the header to copy your link.
3. Send the link (`?board=<token>`) to teammates — they'll see and can edit the same board.

Your session is remembered in the browser, so returning to the same URL keeps your personal board. Shared links open the board owner's tasks instead.

## Project Structure

```
src/
├── components/     # UI components (Board, TaskCard, modals, panels)
├── hooks/          # Data hooks (auth, tasks, team, labels, comments)
├── lib/            # Supabase client, utilities
└── types/          # TypeScript types and constants
```

## Tradeoffs & Future Improvements

- **Direct Supabase calls** from the frontend (no Go API) — simpler for this scope; a backend would help with complex validation
- **Optimistic drag-and-drop** — fast UX but rolls back on failure
- **No real-time subscriptions** — would add `supabase.channel()` for multi-tab sync
- **No offline support** — could add IndexedDB caching
- **Mobile drag-and-drop** — works on desktop; touch sensors could be tuned further

## License

MIT
