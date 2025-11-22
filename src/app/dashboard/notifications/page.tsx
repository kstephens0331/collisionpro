/**
 * Notifications Dashboard Page
 *
 * Full page view for managing notifications
 */

import NotificationsList from '@/components/notifications/NotificationsList';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  // TODO: Get userId and shopId from authenticated session
  const userId = 'test-user-id';
  const shopId = 'test-shop-id';

  return <NotificationsList userId={userId} shopId={shopId} />;
}
