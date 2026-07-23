import { Calendar, Flag } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { PRIORITY_CONFIG } from '../types';
import { cn, formatDueDate, getDueDateUrgency, getInitials } from '../lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const URGENCY_STYLES = {
  overdue: 'text-red-400 bg-red-500/10 border-red-500/20',
  today: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  tomorrow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  soon: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  normal: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/50',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const urgency = getDueDateUrgency(task.due_date);
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group cursor-grab rounded-xl border border-zinc-800/80 bg-zinc-900/80 p-3.5 shadow-sm backdrop-blur-sm transition-all active:cursor-grabbing',
        'hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-md hover:shadow-black/20',
        isDragging && 'z-50 rotate-1 scale-[1.02] border-indigo-500/50 opacity-90 shadow-xl shadow-indigo-500/10',
      )}
    >
      {task.labels && task.labels.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-sm font-medium leading-snug text-zinc-100">{task.title}</h3>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.priority !== 'normal' && (
            <span
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${priority.color}15`, color: priority.color }}
            >
              <Flag className="h-2.5 w-2.5" />
              {priority.label}
            </span>
          )}

          {task.due_date && urgency && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                URGENCY_STYLES[urgency],
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((member) => (
              <div
                key={member.id}
                title={member.name}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-900 text-[9px] font-bold text-white"
                style={{ backgroundColor: member.color }}
              >
                {getInitials(member.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-700 text-[9px] font-medium text-zinc-300">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
