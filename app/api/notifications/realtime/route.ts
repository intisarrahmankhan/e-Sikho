import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Notification from '@/models/Notification';
import {
  subscribeUserNotifications,
  RealtimeNotificationPayload,
} from '@/lib/realtime-notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id;

    if (!sessionUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await dbConnect();

    let userQuery: any = { _id: sessionUserId };
    if (typeof sessionUserId === 'string' && sessionUserId.includes('@')) {
      userQuery = { email: sessionUserId };
    }
    const user = (await User.findOne(userQuery).select('_id name email role').lean()) as any;
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userIdStr = user._id.toString();

    // Fetch initial recent notifications to send immediately on connect
    const initialNotifications = await Notification.find({ recipientId: user._id })
      .sort({ priorityWeight: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      isRead: false,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // 1. Initial Handshake
        const handshake = JSON.stringify({
          type: 'CONNECTED',
          userId: userIdStr,
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`event: handshake\ndata: ${handshake}\n\n`));

        // 2. Initial Sync
        const syncPayload = JSON.stringify({
          type: 'INITIAL_SYNC',
          unreadCount,
          notifications: initialNotifications.map((n: any) => ({
            id: n._id.toString(),
            title: n.title,
            message: n.message,
            type: n.type,
            priority: n.priority,
            priorityWeight: n.priorityWeight,
            actionUrl: n.actionUrl || '/contests',
            badgeLabel: n.badgeLabel || '',
            isRead: !!n.isRead,
            createdAt: n.createdAt?.toISOString(),
          })),
        });
        controller.enqueue(encoder.encode(`event: sync\ndata: ${syncPayload}\n\n`));

        // 3. Subscribe to live bus events for this user
        const unsubscribe = subscribeUserNotifications(
          userIdStr,
          (payload: RealtimeNotificationPayload) => {
            try {
              const eventData = JSON.stringify({
                type: 'NOTIFICATION',
                payload,
                timestamp: new Date().toISOString(),
              });
              controller.enqueue(encoder.encode(`event: message\ndata: ${eventData}\n\n`));
            } catch (err) {
              console.error('Failed to stream SSE notification:', err);
            }
          }
        );

        // 4. Heartbeat keepalive every 20 seconds to prevent proxy timeouts
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (err) {
            clearInterval(heartbeat);
          }
        }, 20000);

        // 5. Clean up on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('Error starting notification stream:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
