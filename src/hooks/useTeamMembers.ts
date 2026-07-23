import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamMember } from '../types';
import { MEMBER_COLORS } from '../types';

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setMembers(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const addMember = async (name: string) => {
    if (!userId) return;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    const { data, error } = await supabase
      .from('team_members')
      .insert({ user_id: userId, name, color })
      .select()
      .single();
    if (error) throw error;
    setMembers((prev) => [...prev, data]);
    return data;
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw error;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return { members, loading, addMember, removeMember, refresh: load };
}
