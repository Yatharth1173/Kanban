import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskPriority, TaskStatus } from '../types';

interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  status?: TaskStatus;
  assigneeIds?: string[];
  labelIds?: string[];
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  status?: TaskStatus;
  position?: number;
}

async function fetchTasksWithRelations(): Promise<Task[]> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  if (!tasks?.length) return [];

  const taskIds = tasks.map((t) => t.id);

  const [{ data: assigneeRows }, { data: labelRows }] = await Promise.all([
    supabase
      .from('task_assignees')
      .select('task_id, team_members(*)')
      .in('task_id', taskIds),
    supabase
      .from('task_labels')
      .select('task_id, labels(*)')
      .in('task_id', taskIds),
  ]);

  return tasks.map((task) => ({
    ...task,
    assignees: assigneeRows
      ?.filter((r) => r.task_id === task.id)
      .map((r) => r.team_members)
      .filter(Boolean) ?? [],
    labels: labelRows
      ?.filter((r) => r.task_id === task.id)
      .map((r) => r.labels)
      .filter(Boolean) ?? [],
  }));
}

async function logActivity(
  taskId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>,
) {
  await supabase.from('activity_log').insert({
    task_id: taskId,
    user_id: userId,
    action,
    details: details ?? null,
  });
}

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await fetchTasksWithRelations();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = async (input: CreateTaskInput) => {
    if (!userId) return;

    const status = input.status ?? 'todo';
    const statusTasks = tasks.filter((t) => t.status === status);
    const position = statusTasks.length;

    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? 'normal',
        due_date: input.due_date ?? null,
        status,
        position,
      })
      .select()
      .single();

    if (createError) throw createError;

    if (input.assigneeIds?.length) {
      await supabase.from('task_assignees').insert(
        input.assigneeIds.map((id) => ({ task_id: task.id, team_member_id: id })),
      );
    }

    if (input.labelIds?.length) {
      await supabase.from('task_labels').insert(
        input.labelIds.map((id) => ({ task_id: task.id, label_id: id })),
      );
    }

    await logActivity(task.id, userId, 'created', { title: task.title });
    await load();
    return task;
  };

  const updateTask = async (taskId: string, input: UpdateTaskInput) => {
    if (!userId) return;

    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return;

    const { error: updateError } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', taskId);

    if (updateError) throw updateError;

    if (input.status && input.status !== existing.status) {
      await logActivity(taskId, userId, 'status_changed', {
        from: existing.status,
        to: input.status,
      });
    } else if (input.title || input.description !== undefined || input.priority || input.due_date !== undefined) {
      await logActivity(taskId, userId, 'updated', input as Record<string, unknown>);
    }

    await load();
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    if (!userId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    const updates: { id: string; status: TaskStatus; position: number }[] = [];

    const sourceTasks = tasks
      .filter((t) => t.status === oldStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);
    sourceTasks.forEach((t, i) => updates.push({ id: t.id, status: oldStatus, position: i }));

    const destTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);
    destTasks.splice(newPosition, 0, { ...task, status: newStatus });
    destTasks.forEach((t, i) => updates.push({ id: t.id, status: newStatus, position: i }));

    setTasks((prev) =>
      prev.map((t) => {
        const update = updates.find((u) => u.id === t.id);
        return update ? { ...t, status: update.status, position: update.position } : t;
      }),
    );

    try {
      await Promise.all(
        updates.map((u) =>
          supabase.from('tasks').update({ status: u.status, position: u.position }).eq('id', u.id),
        ),
      );

      if (oldStatus !== newStatus) {
        await logActivity(taskId, userId, 'status_changed', { from: oldStatus, to: newStatus });
      }
    } catch (err) {
      await load();
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);
    if (deleteError) throw deleteError;
    await load();
  };

  const setAssignees = async (taskId: string, assigneeIds: string[]) => {
    if (!userId) return;

    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    if (assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map((id) => ({ task_id: taskId, team_member_id: id })),
      );
    }
    await logActivity(taskId, userId, 'assignees_changed', { assigneeIds });
    await load();
  };

  const setLabels = async (taskId: string, labelIds: string[]) => {
    if (!userId) return;

    await supabase.from('task_labels').delete().eq('task_id', taskId);
    if (labelIds.length) {
      await supabase.from('task_labels').insert(
        labelIds.map((id) => ({ task_id: taskId, label_id: id })),
      );
    }
    await logActivity(taskId, userId, 'labels_changed', { labelIds });
    await load();
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    setAssignees,
    setLabels,
    refresh: load,
  };
}
