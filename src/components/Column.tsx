import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { EmptyColumn } from './EmptyColumn';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function Column({ id, title, color, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col lg:w-80">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
        <span className="rounded-md bg-zinc-800/80 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-xl p-2 transition-colors ${
          isOver ? 'bg-indigo-500/5 ring-1 ring-indigo-500/20' : 'bg-zinc-900/40'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyColumn title={title} />
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
