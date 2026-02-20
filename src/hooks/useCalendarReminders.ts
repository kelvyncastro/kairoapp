import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInMinutes } from 'date-fns';

const REMINDER_INTERVALS = [30, 15, 1] as const;
const CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds
const STORAGE_KEY = 'kairo_sent_reminders';

interface UpcomingBlock {
  id: string;
  title: string;
  start_time: string;
  status: string;
}

function getSentReminders(): Record<string, number[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Clean entries older than 24h
    const now = Date.now();
    const cleaned: Record<string, number[]> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (key.startsWith('_ts_')) continue;
      const ts = (parsed as any)[`_ts_${key}`];
      if (!ts || now - ts < 86_400_000) {
        cleaned[key] = val as number[];
        cleaned[`_ts_${key}`] = ts || now;
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

function markReminderSent(blockId: string, minutes: number) {
  const reminders = getSentReminders();
  const existing = (reminders[blockId] as number[] | undefined) || [];
  if (!existing.includes(minutes)) {
    existing.push(minutes);
  }
  reminders[blockId] = existing;
  (reminders as any)[`_ts_${blockId}`] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

function wasReminderSent(blockId: string, minutes: number): boolean {
  const reminders = getSentReminders();
  return ((reminders[blockId] as number[] | undefined) || []).includes(minutes);
}

function getReminderMessage(minutes: number, title: string): { title: string; body: string } {
  if (minutes === 30) {
    return {
      title: '📅 Evento em 30 minutos',
      body: `"${title}" começa em 30 minutos. Prepare-se!`,
    };
  }
  if (minutes === 15) {
    return {
      title: '⏰ Evento em 15 minutos',
      body: `"${title}" começa em 15 minutos!`,
    };
  }
  return {
    title: '🔔 Evento em 1 minuto!',
    body: `"${title}" está prestes a começar!`,
  };
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `kairo-reminder-${Date.now()}`,
      requireInteraction: true,
    });
  } catch (e) {
    console.warn('Failed to send notification:', e);
  }
}

async function createInAppNotification(userId: string, title: string, message: string, blockId: string) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'calendar_reminder',
      title,
      message,
      data: { block_id: blockId },
    });
  } catch (e) {
    console.warn('Failed to create in-app notification:', e);
  }
}

export function useCalendarReminders() {
  const { user } = useAuth();
  const permissionRequested = useRef(false);

  // Request permission once
  useEffect(() => {
    if (!user || permissionRequested.current) return;
    permissionRequested.current = true;
    requestNotificationPermission();
  }, [user]);

  const checkUpcomingBlocks = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const thirtyFiveMinLater = new Date(now.getTime() + 35 * 60_000);

    try {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .select('id, title, start_time, status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .gte('start_time', now.toISOString())
        .lte('start_time', thirtyFiveMinLater.toISOString());

      if (error || !data) return;

      for (const block of data as UpcomingBlock[]) {
        const minutesUntil = differenceInMinutes(new Date(block.start_time), now);

        for (const threshold of REMINDER_INTERVALS) {
          // Check if we're within the window for this reminder
          // e.g. for 30min reminder, trigger when minutesUntil is between 29.5 and 30.5
          if (minutesUntil <= threshold && minutesUntil >= threshold - 1) {
            if (wasReminderSent(block.id, threshold)) continue;

            const msg = getReminderMessage(threshold, block.title);
            
            // Send browser notification
            sendBrowserNotification(msg.title, msg.body);
            
            // Create in-app notification
            await createInAppNotification(user.id, msg.title, msg.body, block.id);
            
            // Mark as sent
            markReminderSent(block.id, threshold);
          }
        }
      }
    } catch (e) {
      console.warn('Calendar reminder check failed:', e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Initial check
    checkUpcomingBlocks();

    // Set interval
    const interval = setInterval(checkUpcomingBlocks, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, checkUpcomingBlocks]);
}
