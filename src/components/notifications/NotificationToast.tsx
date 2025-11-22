/**
 * Notification Toast Component
 *
 * Pop-up toast notifications for real-time alerts
 */

'use client';

import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationToastProps {
  userId?: string;
  shopId?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  autoHideDuration?: number;
}

interface ToastNotification extends Notification {
  toastId: string;
  isVisible: boolean;
}

export default function NotificationToast({
  userId,
  shopId,
  position = 'top-right',
  maxVisible = 3,
  autoHideDuration = 5000,
}: NotificationToastProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const { notifications } = useNotifications({
    userId,
    shopId,
    autoConnect: true,
    onNotification: (notification) => {
      // Add new toast
      const toast: ToastNotification = {
        ...notification,
        toastId: `toast-${notification.id}-${Date.now()}`,
        isVisible: true,
      };

      setToasts((prev) => {
        const newToasts = [toast, ...prev];
        // Keep only the most recent maxVisible toasts
        return newToasts.slice(0, maxVisible);
      });

      // Auto-hide after duration
      if (autoHideDuration > 0) {
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) =>
              t.toastId === toast.toastId ? { ...t, isVisible: false } : t
            )
          );

          // Remove after animation
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId));
          }, 300);
        }, autoHideDuration);
      }
    },
  });

  const handleDismiss = (toastId: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.toastId === toastId ? { ...t, isVisible: false } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (priority === 'high') return <AlertTriangle className="h-5 w-5 text-orange-500" />;

    if (type.includes('completed') || type.includes('approved')) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (type.includes('error') || type.includes('failed') || type.includes('rejected')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }

    return <Bell className="h-5 w-5 text-blue-500" />;
  };

  const getColorClasses = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'low':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-md`}
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.toastId}
          className={`bg-white rounded-lg shadow-2xl border-l-4 overflow-hidden transition-all duration-300 ${
            toast.isVisible
              ? 'opacity-100 translate-x-0'
              : position.includes('right')
              ? 'opacity-0 translate-x-full'
              : 'opacity-0 -translate-x-full'
          } ${getColorClasses(toast.priority)}`}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type, toast.priority)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">{toast.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{toast.message}</p>

                {/* Action Button */}
                {toast.actionUrl && (
                  <a
                    href={toast.actionUrl}
                    className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {toast.actionLabel || 'View Details'} →
                  </a>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleDismiss(toast.toastId)}
                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Progress Bar (if auto-hide) */}
            {autoHideDuration > 0 && toast.isVisible && (
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    animation: `shrink ${autoHideDuration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
