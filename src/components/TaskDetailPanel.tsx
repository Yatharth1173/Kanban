import { useEffect, useState } from 'react';
import {
  X, Trash2, MessageSquare, Activity, Calendar, Flag,
} from 'lucide-react';
import type { Label, Task, TaskPriority, TaskStatus, TeamMember } from '../types';
import { COLUMNS, PRIORITY_CONFIG, STATUS_LABELS } from '../types';
import { useComments, useActivity } from '../hooks/useTaskDetail';
import { formatRelativeTime, getInitials } from '../lib/utils';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onSetAssignees: (taskId: string, ids: string[]) => Promise<void>;
  onSetLabels: (taskId: string, ids: string[]) => Promise<void>;
  members: TeamMember[];
  labels: Label[];
  userId: string;
}

function formatActivity(entry: { action: string; details: Record<string, unknown> | null }): string {
  switch (entry.action) {
    case 'created':
      return `Created task "${entry.details?.title ?? ''}"`;
    case 'status_changed':
      return `Moved from ${STATUS_LABELS[entry.details?.from as TaskStatus] ?? '?'} → ${STATUS_LABELS[entry.details?.to as TaskStatus] ?? '?'}`;
    case 'updated':
      return 'Updated task details';
    case 'assignees_changed':
      return 'Changed assignees';
    case 'labels_changed':
      return 'Changed labels';
    case 'comment_added':
      return `Added comment: "${entry.details?.preview ?? ''}"`;
    default:
      return entry.action.replace(/_/g, ' ');
  }
}

export function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
  onSetAssignees,
  onSetLabels,
  members,
  labels,
  userId,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [saving, setSaving] = useState(false);

  const { comments, addComment } = useComments(task?.id ?? null);
  const { activity } = useActivity(task?.id ?? null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.due_date ?? '');
      setStatus(task.status);
    }
  }, [task]);

  if (!task) return null;

  const assigneeIds = task.assignees?.map((a) => a.id) ?? [];
  const labelIds = task.labels?.map((l) => l.id) ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        status,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await onDelete(task.id);
      onClose();
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(comment.trim(), userId);
    setComment('');
  };

  const toggleAssignee = async (id: string) => {
    const next = assigneeIds.includes(id)
      ? assigneeIds.filter((i) => i !== id)
      : [...assigneeIds, id];
    await onSetAssignees(task.id, next);
  };

  const toggleLabel = async (id: string) => {
    const next = labelIds.includes(id)
      ? labelIds.filter((i) => i !== id)
      : [...labelIds, id];
    await onSetLabels(task.id, next);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto flex h-full w-full flex-col border-l border-zinc-800 bg-[#0e0e14] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-400">Task Details</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="w-full bg-transparent text-lg font-semibold text-zinc-100 focus:outline-none"
          />

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={3}
              placeholder="Add a description..."
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Flag className="h-3 w-3" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value as TaskPriority); }}
                onBlur={handleSave}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200"
              >
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={handleSave}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Status</label>
            <select
              value={status}
              onChange={async (e) => {
                const newStatus = e.target.value as TaskStatus;
                setStatus(newStatus);
                await onUpdate(task.id, { status: newStatus });
              }}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>

          {members.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleAssignee(m.id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      assigneeIds.includes(m.id) ? 'text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                    style={assigneeIds.includes(m.id) ? { backgroundColor: m.color } : undefined}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: assigneeIds.includes(m.id) ? 'rgba(255,255,255,0.2)' : m.color }}
                    >
                      {getInitials(m.name)}
                    </span>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {labels.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      labelIds.includes(l.id) ? 'ring-2 ring-offset-1 ring-offset-[#0e0e14]' : 'opacity-50'
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

          <div>
            <div className="mb-3 flex gap-1 rounded-lg bg-zinc-900/60 p-1">
              <button
                onClick={() => setTab('comments')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
                  tab === 'comments' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setTab('activity')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
                  tab === 'activity' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Activity
              </button>
            </div>

            {tab === 'comments' ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">
                    <p className="text-sm text-zinc-300">{c.content}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">{formatRelativeTime(c.created_at)}</p>
                  </div>
                ))}
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <div>
                      <p className="text-sm text-zinc-400">{formatActivity(entry)}</p>
                      <p className="text-[10px] text-zinc-600">{formatRelativeTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <p className="text-sm text-zinc-600">No activity yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {saving && (
          <div className="border-t border-zinc-800 px-5 py-2 text-xs text-zinc-500">Saving...</div>
        )}
      </div>
    </div>
  );
}
