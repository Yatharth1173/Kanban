import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { TeamMember } from '../types';
import { getInitials } from '../lib/utils';

interface TeamPanelProps {
  open: boolean;
  onClose: () => void;
  members: TeamMember[];
  onAdd: (name: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function TeamPanel({ open, onClose, members, onAdd, onRemove }: TeamPanelProps) {
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  if (!open) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd(name.trim());
      setName('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full flex-col border-l border-zinc-800 bg-[#0e0e14] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-200">Team Members</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="border-b border-zinc-800 p-4">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add team member..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-4">
          {members.length === 0 ? (
            <p className="text-center text-sm text-zinc-500">
              No team members yet. Add someone to assign tasks.
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{member.name}</span>
                  </div>
                  <button
                    onClick={() => onRemove(member.id)}
                    className="rounded p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
