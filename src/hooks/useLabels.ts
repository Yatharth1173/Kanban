import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../types';

const DEFAULT_LABELS = [
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#3b82f6' },
  { name: 'Design', color: '#a855f7' },
];

export function useLabels(boardUserId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!boardUserId) return;
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('user_id', boardUserId)
      .order('created_at', { ascending: true });

    if (error) {
      setLoading(false);
      return;
    }

    if (!data?.length) {
      const { data: created } = await supabase
        .from('labels')
        .insert(DEFAULT_LABELS.map((l) => ({ ...l, user_id: boardUserId })))
        .select();
      setLabels(created ?? []);
    } else {
      setLabels(data);
    }
    setLoading(false);
  }, [boardUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const addLabel = async (name: string, color: string) => {
    if (!boardUserId) return;
    const { data, error } = await supabase
      .from('labels')
      .insert({ user_id: boardUserId, name, color })
      .select()
      .single();
    if (error) throw error;
    setLabels((prev) => [...prev, data]);
    return data;
  };

  return { labels, loading, addLabel, refresh: load };
}
