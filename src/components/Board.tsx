import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { BoardFilters, Task, TaskStatus } from '../types';
import { COLUMNS } from '../types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';

interface BoardProps {
  tasks: Task[];
  filters: BoardFilters;
  onMoveTask: (taskId: string, status: TaskStatus, position: number) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

function filterTasks(tasks: Task[], filters: BoardFilters): Task[] {
  return tasks.filter((task) => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assigneeId !== 'all') {
      const hasAssignee = task.assignees?.some((a) => a.id === filters.assigneeId);
      if (!hasAssignee) return false;
    }
    if (filters.labelId !== 'all') {
      const hasLabel = task.labels?.some((l) => l.id === filters.labelId);
      if (!hasLabel) return false;
    }
    return true;
  });
}

export function Board({ tasks, filters, onMoveTask, onTaskClick }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const filtered = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    filtered
      .sort((a, b) => a.position - b.position)
      .forEach((task) => grouped[task.status].push(task));
    return grouped;
  }, [filtered]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newStatus: TaskStatus = task.status;
    let newPosition = task.position;

    const overId = over.id as string;
    const isColumn = COLUMNS.some((c) => c.id === overId);

    if (isColumn) {
      newStatus = overId as TaskStatus;
      newPosition = tasksByColumn[newStatus].length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        const columnTasks = tasksByColumn[newStatus].filter((t) => t.id !== taskId);
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        newPosition = overIndex >= 0 ? overIndex : columnTasks.length;
      }
    }

    if (newStatus !== task.status || newPosition !== task.position) {
      await onMoveTask(taskId, newStatus, newPosition);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            tasks={tasksByColumn[col.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
