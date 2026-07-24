import { LayoutGrid, Link2, Plus, Users } from 'lucide-react';

interface HeaderProps {
  onCreateTask: () => void;
  onToggleTeam: () => void;
  showTeam: boolean;
  isSharedView?: boolean;
  shareUrl?: string | null;
  copied?: boolean;
  onCopyShareLink?: () => void;
}

export function Header({
  onCreateTask,
  onToggleTeam,
  showTeam,
  isSharedView = false,
  shareUrl,
  copied = false,
  onCopyShareLink,
}: HeaderProps) {
  return (
    <header className="space-y-3">
      {isSharedView && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5">
          <p className="text-sm text-indigo-200">You are viewing a shared board.</p>
          <a
            href="/"
            className="text-sm font-medium text-indigo-300 underline-offset-2 hover:text-indigo-200 hover:underline"
          >
            Go to my board
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
          <LayoutGrid className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Taskflow</h1>
          <p className="text-xs text-zinc-500">{isSharedView ? 'Shared kanban board' : 'Kanban board'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isSharedView && shareUrl && onCopyShareLink && (
          <button
            onClick={onCopyShareLink}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <Link2 className="h-4 w-4" />
            {copied ? 'Link copied!' : 'Share board'}
          </button>
        )}
        <button
          onClick={onToggleTeam}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            showTeam
              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
              : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Team
        </button>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>
      </div>
    </header>
  );
}
