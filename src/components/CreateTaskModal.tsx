import { useState } from 'react';
import { X } from 'lucide-react';
import type { Label, TaskPriority, TaskStatus, TeamMember } from '../types';
import { COLUMNS, PRIORITY_CONFIG } from '../types';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    due_date: string | null;
    status: TaskStatus;
    assigneeIds: string[];
    labelIds: string[];
  }) => Promise<void>;
  members: TeamMember[];
  labels: Label[];
}

export function CreateTaskModal({ open, onClose, onSubmit, members, labels }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('normal');
    setDueDate('');
    setStatus('todo');
    setAssigneeIds([]);
    setLabelIds([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        status,
        assigneeIds,
        labelIds,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleId = (ids: string[], id: string, setter: (v: string[]) => void) => {
    setter(ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#12121a] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Create Task</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500/50 focus:outline-none"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500/50 focus:outline-none"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
              >
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Column</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>

          {members.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleId(assigneeIds, m.id, setAssigneeIds)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      assigneeIds.includes(m.id)
                        ? 'text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                    style={assigneeIds.includes(m.id) ? { backgroundColor: m.color } : undefined}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {labels.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleId(labelIds, l.id, setLabelIds)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      labelIds.includes(l.id) ? 'ring-2 ring-offset-1 ring-offset-[#12121a]' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${l.color}25`,
                      color: l.color,
                      ['--tw-ring-color' as string]: l.color,
                    }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
