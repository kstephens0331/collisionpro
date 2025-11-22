/**
 * Real-time Notification Stream API
 *
 * Server-Sent Events (SSE) endpoint for live notification delivery
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // TODO: Get userId and shopId from authenticated session
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'test-user-id';
    const shopId = searchParams.get('shopId') || 'test-shop-id';

    if (!userId || !shopId) {
      return new Response('userId and shopId are required', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
        );

        // Set up Supabase real-time subscription
        const channel = supabase
          .channel(`notifications:${shopId}:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'Notification',
              filter: `userId=eq.${userId}`,
            },
            (payload) => {
              const notification = payload.new;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'notification',
                  notification
                })}\n\n`)
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'RealtimeEvent',
              filter: `shopId=eq.${shopId}`,
            },
            (payload) => {
              const event = payload.new;
              // Only send to specific user if userId matches, otherwise broadcast to all shop users
              if (!event.userId || event.userId === userId) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'event',
                    event: {
                      eventType: event.eventType,
                      payload: event.payload,
                      timestamp: event.createdAt,
                    }
                  })}\n\n`)
                );
              }
            }
          )
          .subscribe();

        // Poll for unread notifications every 30 seconds (fallback)
        const pollInterval = setInterval(async () => {
          try {
            const { data: unreadCount } = await supabase
              .from('Notification')
              .select('id', { count: 'exact', head: true })
              .eq('userId', userId)
              .eq('shopId', shopId)
              .eq('channel', 'in_app')
              .is('readAt', null);

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'unread_count',
                count: unreadCount || 0,
                timestamp: new Date().toISOString()
              })}\n\n`)
            );
          } catch (error) {
            console.error('Error polling unread notifications:', error);
          }
        }, 30000);

        // Keep-alive ping every 15 seconds
        const pingInterval = setInterval(() => {
          controller.enqueue(
            encoder.encode(`: ping\n\n`)
          );
        }, 15000);

        // Clean up on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          clearInterval(pingInterval);
          supabase.removeChannel(channel);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error: any) {
    console.error('SSE stream error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
