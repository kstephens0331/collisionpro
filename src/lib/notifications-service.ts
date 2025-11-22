/**
 * Enhanced Notification Service
 *
 * Unified service for sending notifications across all channels
 * Integrates with the new notification database schema
 */

import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';
import { EMAIL_TEMPLATES } from './email-templates';
import { SMS_TEMPLATES } from './sms-templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lazy-load external services
let twilioClient: twilio.Twilio | null = null;
let resendClient: Resend | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      twilioClient = twilio(accountSid, authToken);
    }
  }
  return twilioClient;
}

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export type NotificationType =
  | 'estimate_created'
  | 'estimate_updated'
  | 'estimate_approved'
  | 'estimate_rejected'
  | 'parts_ordered'
  | 'parts_arrived'
  | 'job_started'
  | 'job_completed'
  | 'payment_received'
  | 'message_received'
  | 'technician_assigned'
  | 'supplement_required'
  | 'insurance_approved'
  | 'custom';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationOptions {
  userId?: string;
  shopId: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  imageUrl?: string;
  estimateId?: string;
  customerId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  // For email/SMS
  to?: string; // email address or phone number
  subject?: string; // email subject
}

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Template variable replacement
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  });

  return rendered;
}

/**
 * Check if user should receive notification based on preferences
 */
async function shouldSendNotification(
  userId: string | undefined,
  shopId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  if (!userId) return true; // Broadcast notifications always send

  try {
    const { data: prefs } = await supabase
      .from('NotificationPreference')
      .select('*')
      .eq('userId', userId)
      .eq('shopId', shopId)
      .single();

    if (!prefs) return true; // No preferences = all enabled

    // Check channel-level preferences
    const channelEnabled =
      (channel === 'in_app' && prefs.enableInApp) ||
      (channel === 'email' && prefs.enableEmail) ||
      (channel === 'sms' && prefs.enableSms) ||
      (channel === 'push' && prefs.enablePush);

    if (!channelEnabled) return false;

    // Check type-specific preferences
    const typePrefs = prefs.typePreferences as Record<string, any>;
    if (typePrefs && typePrefs[type]) {
      const typePref = typePrefs[type];
      if (typePref[channel] === false) return false;
    }

    // Check quiet hours
    if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: prefs.quietHoursTimezone,
      });

      // Simplified quiet hours check
      const quietStart = prefs.quietHoursStart;
      const quietEnd = prefs.quietHoursEnd;

      if (currentTime >= quietStart && currentTime <= quietEnd) {
        return false; // In quiet hours
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to allowing notifications on error
  }
}

/**
 * Send notification
 */
export async function sendNotification(
  options: NotificationOptions
): Promise<SendNotificationResult> {
  try {
    // Check if should send based on user preferences
    const shouldSend = await shouldSendNotification(
      options.userId,
      options.shopId,
      options.type,
      options.channel
    );

    if (!shouldSend) {
      return {
        success: true,
        notificationId: undefined, // Not sent due to preferences
      };
    }

    // Create notification record
    const { data: notification, error } = await supabase
      .from('Notification')
      .insert({
        userId: options.userId,
        shopId: options.shopId,
        type: options.type,
        channel: options.channel,
        priority: options.priority || 'normal',
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl,
        actionLabel: options.actionLabel,
        metadata: options.metadata || {},
        imageUrl: options.imageUrl,
        estimateId: options.estimateId,
        customerId: options.customerId,
        status: options.scheduledFor ? 'pending' : 'sent',
        sentAt: options.scheduledFor ? null : new Date().toISOString(),
        expiresAt: options.expiresAt?.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // If scheduled, add to queue
    if (options.scheduledFor) {
      await supabase.from('NotificationQueue').insert({
        notificationId: notification.id,
        scheduledFor: options.scheduledFor.toISOString(),
        status: 'queued',
      });
    } else {
      // Send immediately based on channel
      await deliverNotification(notification.id, options);
    }

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deliver notification via specific channel
 */
async function deliverNotification(
  notificationId: string,
  options: NotificationOptions
): Promise<void> {
  try {
    switch (options.channel) {
      case 'in_app':
        // In-app notifications are stored in DB and shown in UI
        await supabase
          .from('Notification')
          .update({
            status: 'delivered',
            deliveredAt: new Date().toISOString(),
          })
          .eq('id', notificationId);
        break;

      case 'email':
        await sendEmailNotification(options);
        await supabase
          .from('Notification')
          .update({
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
          .eq('id', notificationId);
        break;

      case 'sms':
        await sendSMSNotification(options);
        await supabase
          .from('Notification')
          .update({
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
          .eq('id', notificationId);
        break;

      case 'push':
        await sendPushNotification(options);
        await supabase
          .from('Notification')
          .update({
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
          .eq('id', notificationId);
        break;

      case 'webhook':
        await sendWebhook(options);
        break;
    }

    // Broadcast real-time event for in-app updates
    if (options.channel === 'in_app') {
      await broadcastRealtimeEvent('notification_received', {
        notificationId,
        type: options.type,
        title: options.title,
      }, {
        userId: options.userId,
        shopId: options.shopId,
      });
    }
  } catch (error: any) {
    console.error(`Error delivering ${options.channel} notification:`, error);

    // Mark as failed
    await supabase
      .from('Notification')
      .update({
        status: 'failed',
        errorMessage: error.message,
      })
      .eq('id', notificationId);

    throw error;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(options: NotificationOptions): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    console.warn('Resend API key not configured, skipping email notification');
    return;
  }

  if (!options.to) {
    throw new Error('Email address required for email notifications');
  }

  try {
    // Use professional template if available and metadata exists
    let emailHtml = '';
    let emailText = '';
    let emailSubject = options.subject || options.title;

    if (options.metadata && EMAIL_TEMPLATES[options.type as keyof typeof EMAIL_TEMPLATES]) {
      const templateFn = EMAIL_TEMPLATES[options.type as keyof typeof EMAIL_TEMPLATES];
      const template = templateFn(options.metadata);
      emailHtml = template.html;
      emailText = template.text;
      emailSubject = template.subject;
    } else {
      // Fallback to simple template
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${options.title}</h2>
          <p style="color: #374151; line-height: 1.6;">${options.message.replace(/\n/g, '<br>')}</p>
          ${options.actionUrl ? `
            <a href="${options.actionUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
              ${options.actionLabel || 'View Details'}
            </a>
          ` : ''}
          ${options.imageUrl ? `<img src="${options.imageUrl}" alt="Notification image" style="max-width: 100%; margin-top: 16px; border-radius: 8px;">` : ''}
        </div>
      `;
      emailText = `${options.title}\n\n${options.message}${options.actionUrl ? `\n\n${options.actionLabel || 'View Details'}: ${options.actionUrl}` : ''}`;
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CollisionPro <notifications@collisionpro.com>',
      to: options.to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    console.log('Email sent successfully to:', options.to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(options: NotificationOptions): Promise<void> {
  const twilio = getTwilioClient();

  if (!twilio) {
    console.warn('Twilio not configured, skipping SMS notification');
    return;
  }

  if (!options.to) {
    throw new Error('Phone number required for SMS notifications');
  }

  try {
    // Use SMS template if available and metadata exists
    let smsBody = options.message;

    if (options.metadata && SMS_TEMPLATES[options.type as keyof typeof SMS_TEMPLATES]) {
      const templateFn = SMS_TEMPLATES[options.type as keyof typeof SMS_TEMPLATES];
      smsBody = templateFn(options.metadata);
    }

    await twilio.messages.create({
      body: smsBody,
      to: options.to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log('SMS sent successfully to:', options.to);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(options: NotificationOptions): Promise<void> {
  console.log('Push notification:', options.title);
  // TODO: Integrate with FCM, APNs, or OneSignal
}

/**
 * Send webhook notification
 */
async function sendWebhook(options: NotificationOptions): Promise<void> {
  console.log('Webhook notification:', options);
  // TODO: Send POST request to configured webhook URL
}

/**
 * Send notification using template
 */
export async function sendNotificationFromTemplate(
  type: NotificationType,
  channel: NotificationChannel,
  variables: Record<string, any>,
  options: Partial<NotificationOptions>
): Promise<SendNotificationResult> {
  try {
    // Get template
    const { data: template } = await supabase
      .from('NotificationTemplate')
      .select('*')
      .eq('type', type)
      .eq('channel', channel)
      .eq('isActive', true)
      .eq('isDefault', true)
      .single();

    if (!template) {
      throw new Error(`No template found for ${type}/${channel}`);
    }

    // Render template
    const title = renderTemplate(template.subject || template.name, variables);
    const message = renderTemplate(template.template, variables);

    // Send notification
    return await sendNotification({
      type,
      channel,
      title,
      message,
      subject: template.subject ? renderTemplate(template.subject, variables) : undefined,
      ...options,
    } as NotificationOptions);
  } catch (error: any) {
    console.error('Error sending templated notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('Notification')
    .update({
      status: 'read',
      readAt: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Mark notification as clicked
 */
export async function markNotificationAsClicked(notificationId: string): Promise<void> {
  await supabase
    .from('Notification')
    .update({
      clickedAt: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId: string, shopId: string) {
  const { data, error } = await supabase
    .from('Notification')
    .select('*')
    .eq('userId', userId)
    .eq('shopId', shopId)
    .eq('channel', 'in_app')
    .is('readAt', null)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Broadcast real-time event
 */
export async function broadcastRealtimeEvent(
  eventType: string,
  payload: Record<string, any>,
  options: {
    userId?: string;
    shopId: string;
  }
): Promise<void> {
  await supabase.from('RealtimeEvent').insert({
    userId: options.userId,
    shopId: options.shopId,
    eventType,
    payload,
    broadcasted: false,
  });
}

/**
 * Helper: Notify estimate created
 */
export async function notifyEstimateCreated(
  estimateId: string,
  customerEmail: string,
  customerPhone: string,
  shopId: string,
  variables: Record<string, any>
): Promise<void> {
  // Send email
  await sendNotificationFromTemplate('estimate_created', 'email', variables, {
    shopId,
    estimateId,
    to: customerEmail,
  });

  // Send SMS if phone provided
  if (customerPhone) {
    await sendNotificationFromTemplate('estimate_created', 'sms', variables, {
      shopId,
      estimateId,
      to: customerPhone,
    });
  }

  // In-app notification for shop users
  await sendNotification({
    shopId,
    type: 'estimate_created',
    channel: 'in_app',
    title: `New Estimate #${variables.estimate_number}`,
    message: `Estimate created for ${variables.customer_name} - ${variables.vehicle}`,
    actionUrl: `/dashboard/estimates/${estimateId}`,
    actionLabel: 'View Estimate',
    estimateId,
  });
}

/**
 * Helper: Notify job status change
 */
export async function notifyJobStatusChange(
  estimateId: string,
  status: 'started' | 'completed',
  customerPhone: string,
  shopId: string,
  variables: Record<string, any>
): Promise<void> {
  const type = status === 'started' ? 'job_started' : 'job_completed';

  // Send SMS notification
  if (customerPhone) {
    await sendNotificationFromTemplate(type, 'sms', variables, {
      shopId,
      estimateId,
      to: customerPhone,
    });
  }

  // Broadcast real-time event
  await broadcastRealtimeEvent(`job_${status}`, { estimateId, status }, { shopId });
}
