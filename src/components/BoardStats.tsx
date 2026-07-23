import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';
import { getDueDateUrgency } from '../lib/utils';

interface BoardStatsProps {
  tasks: Task[];
}

export function BoardStats({ tasks }: BoardStatsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue = tasks.filter((t) => {
    const urgency = getDueDateUrgency(t.due_date);
    return urgency === 'overdue' && t.status !== 'done';
  }).length;

  const stats = [
    { label: 'Total', value: total, icon: ListTodo, color: 'text-zinc-400' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-blue-400' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, color: overdue > 0 ? 'text-red-400' : 'text-zinc-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-3.5 py-2.5"
        >
          <Icon className={`h-4 w-4 ${color}`} />
          <div>
            <p className="text-lg font-semibold leading-none text-zinc-100">{value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
