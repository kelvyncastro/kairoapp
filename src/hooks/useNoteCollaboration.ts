import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  position: number; // character offset in the doc
  lastUpdate: number;
}

const CURSOR_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6',
  '#ec4899', '#06b6d4', '#eab308',
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export function useNoteCollaboration(pageId: string | null, isShared: boolean) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ userId: string; userName: string; color: string }[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursorTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Join the realtime channel for this note
  useEffect(() => {
    if (!pageId || !user || !isShared) {
      setRemoteCursors([]);
      setActiveUsers([]);
      return;
    }

    const channelName = `note-collab:${pageId}`;
    const userName = profile?.first_name || 'Anônimo';
    const userColor = getColorForUser(user.id);

    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    });

    // Presence: track active users
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: { userId: string; userName: string; color: string }[] = [];
      for (const [userId, presences] of Object.entries(state)) {
        if (userId === user.id) continue;
        const p = (presences as any[])[0];
        users.push({
          userId,
          userName: p?.userName || 'Anônimo',
          color: p?.color || getColorForUser(userId),
        });
      }
      setActiveUsers(users);
    });

    // Broadcast: receive cursor position updates
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      setRemoteCursors(prev => {
        const filtered = prev.filter(c => c.userId !== payload.userId);
        return [...filtered, {
          userId: payload.userId,
          userName: payload.userName,
          color: payload.color,
          position: payload.position,
          lastUpdate: Date.now(),
        }];
      });

      // Auto-remove stale cursors after 10s
      const existing = cursorTimeoutsRef.current.get(payload.userId);
      if (existing) clearTimeout(existing);
      cursorTimeoutsRef.current.set(payload.userId, setTimeout(() => {
        setRemoteCursors(prev => prev.filter(c => c.userId !== payload.userId));
        cursorTimeoutsRef.current.delete(payload.userId);
      }, 10000));
    });

    // Broadcast: receive content updates
    channel.on('broadcast', { event: 'content' }, ({ payload }) => {
      if (payload.userId === user.id) return;
      // Content updates are handled by the parent via onRemoteContentChange callback
      const event = new CustomEvent('note-remote-content', {
        detail: { pageId: payload.pageId, content: payload.content, userId: payload.userId },
      });
      window.dispatchEvent(event);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userName,
          color: userColor,
          online_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      // Clean up timeouts
      cursorTimeoutsRef.current.forEach(t => clearTimeout(t));
      cursorTimeoutsRef.current.clear();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setRemoteCursors([]);
      setActiveUsers([]);
    };
  }, [pageId, user, isShared, profile?.first_name]);

  // Broadcast local cursor position
  const broadcastCursor = useCallback((position: number) => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        userId: user.id,
        userName: profile?.first_name || 'Anônimo',
        color: getColorForUser(user.id),
        position,
      },
    });
  }, [user, profile?.first_name]);

  // Broadcast content change
  const broadcastContent = useCallback((content: string) => {
    if (!channelRef.current || !user || !pageId) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'content',
      payload: {
        userId: user.id,
        pageId,
        content,
      },
    });
  }, [user, pageId]);

  return {
    remoteCursors,
    activeUsers,
    broadcastCursor,
    broadcastContent,
  };
}
