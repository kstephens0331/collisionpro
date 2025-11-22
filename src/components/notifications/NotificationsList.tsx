/**
 * Full Notifications List Component
 *
 * Comprehensive view of all notifications with filtering
 */

'use client';

import { useState, useMemo } from 'react';
import { Bell, Filter, Check, CheckCheck, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsListProps {
  userId?: string;
  shopId?: string;
}

type FilterType = 'all' | 'unread' | 'estimate' | 'parts' | 'job' | 'payment';

export default function NotificationsList({ userId, shopId }: NotificationsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    notifications,
    unreadCount,
    isConnected,
    error,
    markAsRead,
    markAsClicked,
    clearAll,
  } = useNotifications({
    userId,
    shopId,
    autoConnect: true,
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter((n) => !n.readAt);
        break;
      case 'estimate':
        filtered = notifications.filter((n) =>
          n.type.includes('estimate') || n.estimateId
        );
        break;
      case 'parts':
        filtered = notifications.filter((n) => n.type.includes('parts'));
        break;
      case 'job':
        filtered = notifications.filter((n) =>
          n.type.includes('job') || n.type.includes('technician')
        );
        break;
      case 'payment':
        filtered = notifications.filter((n) => n.type.includes('payment'));
        break;
    }

    return filtered;
  }, [notifications, filter]);

  const handleNotificationClick = (notification: any) => {
    markAsClicked(notification.id);

    if (!notification.readAt) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.readAt);
    await Promise.all(unreadNotifications.map((n) => markAsRead(n.id)));
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} notification(s)?`)) return;

    // TODO: Add API endpoint for deleting notifications
    selectedIds.forEach((id) => {
      // For now, just mark as read
      markAsRead(id);
    });

    setSelectedIds(new Set());
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

  const getTypeIcon = (type: string) => {
    if (type.includes('estimate')) return '📋';
    if (type.includes('parts')) return '🔧';
    if (type.includes('job') || type.includes('technician')) return '👷';
    if (type.includes('payment')) return '💰';
    if (type.includes('message')) return '💬';
    return '🔔';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <div className="flex items-center gap-6 text-blue-100">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-sm">{isConnected ? 'Live' : 'Reconnecting...'}</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-sm">{unreadCount} unread</span>
          )}
          <span className="text-sm">{notifications.length} total</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Connection Error</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex gap-1">
              {(['all', 'unread', 'estimate', 'parts', 'job', 'payment'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {selectedIds.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications</h3>
            <p className="text-sm text-gray-500">
              {filter === 'all'
                ? 'You have no notifications yet'
                : `No ${filter} notifications found`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  !notification.readAt ? 'bg-blue-50/50' : ''
                } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(notification.id)}
                    onChange={() => handleToggleSelect(notification.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Type Icon */}
                  <div className="text-2xl">{getTypeIcon(notification.type)}</div>

                  {/* Image */}
                  {notification.imageUrl && (
                    <img
                      src={notification.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={`text-base font-medium text-gray-900 ${
                            !notification.readAt ? 'font-semibold' : ''
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          {/* Timestamp */}
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>

                          {/* Type Badge */}
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            {notification.type.replace(/_/g, ' ')}
                          </span>

                          {/* Priority Badge */}
                          {notification.priority !== 'normal' && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                notification.priority === 'urgent'
                                  ? 'bg-red-200 text-red-800'
                                  : notification.priority === 'high'
                                  ? 'bg-orange-200 text-orange-800'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {notification.priority}
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        {notification.actionUrl && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {notification.actionLabel || 'View Details'}
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Mark as Read */}
                      {!notification.readAt && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-5 w-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
