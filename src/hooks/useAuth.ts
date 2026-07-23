import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signingIn = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function ensureSession() {
      if (signingIn.current) return;
      signingIn.current = true;

      try {
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
        if (mounted) setUser(data.user);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to authenticate');
        }
      } finally {
        signingIn.current = false;
        if (mounted) setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        return;
      }

      void ensureSession();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
}
