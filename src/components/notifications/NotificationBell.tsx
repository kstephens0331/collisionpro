/**
 * Notification Bell Component
 *
 * Bell icon with unread count badge and dropdown
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  userId?: string;
  shopId?: string;
}

export default function NotificationBell({ userId, shopId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAsClicked,
    requestPermission,
  } = useNotifications({
    userId,
    shopId,
    autoConnect: true,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleNotificationClick = (notification: any) => {
    markAsClicked(notification.id);

    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    setIsOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'normal':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-yellow-500" title="Reconnecting..." />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-100 mt-1">{unreadCount} unread</p>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  You'll see updates about your shop here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                      !notification.readAt ? 'bg-blue-50' : ''
                    } ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Image */}
                      {notification.imageUrl && (
                        <img
                          src={notification.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium text-gray-900 ${
                              !notification.readAt ? 'font-semibold' : ''
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.readAt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3 text-gray-600" />
                            </button>
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Action Button */}
                        {notification.actionUrl && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                              {notification.actionLabel || 'View Details'}
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <button
                onClick={() => {
                  // TODO: Navigate to full notifications page
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
