/**
 * Real-time Notifications Hook
 *
 * React hook for subscribing to real-time notifications via SSE
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  userId?: string;
  shopId: string;
  type: string;
  channel: string;
  priority: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  imageUrl?: string;
  estimateId?: string;
  customerId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  clickedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeEvent {
  eventType: string;
  payload: Record<string, any>;
  timestamp: string;
}

interface NotificationStreamMessage {
  type: 'connected' | 'notification' | 'event' | 'unread_count';
  notification?: Notification;
  event?: RealtimeEvent;
  count?: number;
  timestamp?: string;
}

interface UseNotificationsOptions {
  userId?: string;
  shopId?: string;
  autoConnect?: boolean;
  onNotification?: (notification: Notification) => void;
  onEvent?: (event: RealtimeEvent) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function useNotifications({
  userId,
  shopId,
  autoConnect = true,
  onNotification,
  onEvent,
  onUnreadCountChange,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!userId || !shopId) {
      console.warn('Cannot connect to notifications stream: userId and shopId required');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = new URL('/api/notifications/stream', window.location.origin);
    url.searchParams.set('userId', userId);
    url.searchParams.set('shopId', shopId);

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
      console.log('Connected to notifications stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const message: NotificationStreamMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            console.log('Notifications stream connected at:', message.timestamp);
            break;

          case 'notification':
            if (message.notification) {
              setNotifications((prev) => [message.notification!, ...prev]);
              onNotification?.(message.notification);

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification(message.notification.title, {
                  body: message.notification.message,
                  icon: message.notification.imageUrl || '/logo.png',
                  tag: message.notification.id,
                });
              }
            }
            break;

          case 'event':
            if (message.event) {
              onEvent?.(message.event);
            }
            break;

          case 'unread_count':
            if (typeof message.count === 'number') {
              setUnreadCount(message.count);
              onUnreadCountChange?.(message.count);
            }
            break;
        }
      } catch (err) {
        console.error('Error parsing notification message:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      // Exponential backoff reconnection
      const maxAttempts = 5;
      if (reconnectAttemptsRef.current < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`Reconnecting to notifications stream in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        setError('Failed to connect to notifications stream. Please refresh the page.');
      }
    };

    eventSourceRef.current = eventSource;
  }, [userId, shopId, onNotification, onEvent, onUnreadCountChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, readAt: new Date().toISOString(), status: 'read' }
              : notif
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAsClicked = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/clicked`, {
        method: 'PATCH',
      });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, clickedAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as clicked:', err);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId && shopId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, shopId, connect, disconnect]);

  return {
    notifications,
    unreadCount,
    isConnected,
    error,
    connect,
    disconnect,
    markAsRead,
    markAsClicked,
    clearAll,
    requestPermission,
  };
}
