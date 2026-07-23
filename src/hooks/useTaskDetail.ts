import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment, ActivityEntry } from '../types';

export function useComments(taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (!error) setComments(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const addComment = async (content: string, userId: string) => {
    if (!taskId) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, content })
      .select()
      .single();
    if (error) throw error;
    setComments((prev) => [...prev, data]);
    await supabase.from('activity_log').insert({
      task_id: taskId,
      user_id: userId,
      action: 'comment_added',
      details: { preview: content.slice(0, 80) },
    });
    return data;
  };

  return { comments, loading, addComment, refresh: load };
}

export function useActivity(taskId: string | null) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) {
      setActivity([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (!error) setActivity(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  return { activity, loading, refresh: load };
}
