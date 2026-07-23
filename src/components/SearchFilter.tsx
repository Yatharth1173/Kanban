import { Search, X } from 'lucide-react';
import type { BoardFilters, Label, TaskPriority, TeamMember } from '../types';
import { PRIORITY_CONFIG } from '../types';

interface SearchFilterProps {
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
  members: TeamMember[];
  labels: Label[];
}

export function SearchFilter({ filters, onChange, members, labels }: SearchFilterProps) {
  const hasFilters =
    filters.search ||
    filters.priority !== 'all' ||
    filters.assigneeId !== 'all' ||
    filters.labelId !== 'all';

  const clearFilters = () => {
    onChange({ search: '', priority: 'all', assigneeId: 'all', labelId: 'all' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
      </div>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as TaskPriority | 'all' })}
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
      >
        <option value="all">All priorities</option>
        {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
          <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
        ))}
      </select>

      <select
        value={filters.assigneeId}
        onChange={(e) => onChange({ ...filters, assigneeId: e.target.value })}
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
      >
        <option value="all">All assignees</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <select
        value={filters.labelId}
        onChange={(e) => onChange({ ...filters, labelId: e.target.value })}
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
      >
        <option value="all">All labels</option>
        {labels.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
