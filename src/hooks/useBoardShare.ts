import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function getShareTokenFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('board');
}

export function useBoardShare(authUserId: string | undefined) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharedBoardOwnerId, setSharedBoardOwnerId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const urlToken = getShareTokenFromUrl();

  useEffect(() => {
    let mounted = true;

    async function resolveSharedBoard() {
      if (!urlToken) {
        if (mounted) setResolving(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_board_owner_by_token', {
          token: urlToken,
        });

        if (error) throw error;
        if (!data) {
          if (mounted) setShareError('This shared board link is invalid or has expired.');
          return;
        }

        if (mounted) setSharedBoardOwnerId(data);
      } catch (err) {
        if (mounted) {
          setShareError(err instanceof Error ? err.message : 'Failed to open shared board');
        }
      } finally {
        if (mounted) setResolving(false);
      }
    }

    void resolveSharedBoard();

    return () => {
      mounted = false;
    };
  }, [urlToken]);

  useEffect(() => {
    if (!authUserId || urlToken) return;

    let mounted = true;

    async function ensureShareToken() {
      const { data: existing, error: readError } = await supabase
        .from('board_shares')
        .select('share_token')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (readError) return;

      if (existing?.share_token) {
        if (mounted) setShareToken(existing.share_token);
        return;
      }

      const { data: created, error: createError } = await supabase
        .from('board_shares')
        .insert({ user_id: authUserId })
        .select('share_token')
        .single();

      if (!createError && created && mounted) {
        setShareToken(created.share_token);
      }
    }

    void ensureShareToken();

    return () => {
      mounted = false;
    };
  }, [authUserId, urlToken]);

  const boardUserId = sharedBoardOwnerId ?? authUserId;
  const isSharedView = Boolean(sharedBoardOwnerId && authUserId && sharedBoardOwnerId !== authUserId);
  const shareUrl = shareToken ? `${window.location.origin}?board=${shareToken}` : null;

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return false;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, [shareUrl]);

  return {
    boardUserId,
    shareUrl,
    isSharedView,
    resolving,
    shareError,
    copied,
    copyShareLink,
  };
}
