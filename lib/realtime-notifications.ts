import { EventEmitter } from 'events';

// Global singleton event emitter across Next.js dev & production server instances
declare global {
  // eslint-disable-next-line no-var
  var __realtimeEmitter: EventEmitter | undefined;
}

const realtimeEmitter: EventEmitter =
  globalThis.__realtimeEmitter || new EventEmitter();

// Allow unlimited listeners for multi-client SSE connections
realtimeEmitter.setMaxListeners(0);

if (process.env.NODE_ENV !== 'production') {
  globalThis.__realtimeEmitter = realtimeEmitter;
}

export interface RealtimeNotificationPayload {
  id?: string;
  recipientId?: string;
  title: string;
  message: string;
  type:
    | 'CONTEST_ANNOUNCEMENT'
    | 'CONTEST_REMINDER'
    | 'ELO_UPDATE'
    | 'COURSE_COMPLETION'
    | 'LIVE_CLASS_STARTING'
    | 'LIVE_CLASS_RECORDING_READY'
    | 'REVISION_ACCESS_UPDATE'
    | 'EXAM_REMINDER'
    | 'SYSTEM';
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  actionUrl?: string;
  badgeLabel?: string;
  createdAt?: string;
  meta?: Record<string, any>;
}

/**
 * Dispatches a real-time notification to a specific user via SSE
 */
export function sendRealtimeNotification(
  recipientId: string,
  payload: RealtimeNotificationPayload
) {
  const eventName = `user:${recipientId}`;
  realtimeEmitter.emit(eventName, payload);
  // Also emit to wildcard listener
  realtimeEmitter.emit('notification:all', { recipientId, ...payload });
}

/**
 * Broadcasts an announcement to all connected platform users in real-time
 */
export function broadcastRealtimeEvent(payload: RealtimeNotificationPayload) {
  realtimeEmitter.emit('broadcast:all', payload);
}

/**
 * Subscribes a client stream to real-time events for a specific user ID
 */
export function subscribeUserNotifications(
  userId: string,
  onNotification: (data: RealtimeNotificationPayload) => void
): () => void {
  const userEvent = `user:${userId}`;
  const broadcastEvent = 'broadcast:all';

  const userListener = (data: RealtimeNotificationPayload) => {
    try {
      onNotification(data);
    } catch (e) {
      console.error('Error forwarding SSE notification:', e);
    }
  };

  const broadcastListener = (data: RealtimeNotificationPayload) => {
    try {
      onNotification(data);
    } catch (e) {
      console.error('Error forwarding broadcast SSE:', e);
    }
  };

  realtimeEmitter.on(userEvent, userListener);
  realtimeEmitter.on(broadcastEvent, broadcastListener);

  return () => {
    realtimeEmitter.off(userEvent, userListener);
    realtimeEmitter.off(broadcastEvent, broadcastListener);
  };
}
