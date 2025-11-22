/**
 * Messaging Service
 *
 * Unified customer communication across SMS, email, and in-app messaging
 */

import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

export type MessageType = 'sms' | 'email' | 'in_app' | 'phone_call';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageDirection = 'inbound' | 'outbound';

export interface SendMessageOptions {
  customerId: string;
  shopId: string;
  type: MessageType;
  subject?: string;
  body: string;
  htmlBody?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  senderId?: string;
  senderName?: string;
  estimateId?: string;
  appointmentId?: string;
  conversationId?: string;
  attachments?: Array<{
    url: string;
    filename: string;
    size?: number;
    type?: string;
  }>;
}

export interface Message {
  id: string;
  conversationId?: string;
  customerId: string;
  shopId: string;
  type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  subject?: string;
  body: string;
  htmlBody?: string;
  senderId?: string;
  senderName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  errorMessage?: string;
  attachments?: any[];
  createdAt: string;
}

/**
 * Send a message to a customer
 */
export async function sendMessage(options: SendMessageOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Get or create conversation
    let conversationId = options.conversationId;

    if (!conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('Conversation')
        .insert({
          customerId: options.customerId,
          shopId: options.shopId,
          estimateId: options.estimateId,
          status: 'active',
          subject: options.subject,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
      } else {
        conversationId = conversation.id;
      }
    }

    // Create message record
    const { data: message, error: msgError } = await supabase
      .from('Message')
      .insert({
        conversationId,
        customerId: options.customerId,
        shopId: options.shopId,
        type: options.type,
        direction: 'outbound',
        status: 'pending',
        subject: options.subject,
        body: options.body,
        htmlBody: options.htmlBody,
        recipientEmail: options.recipientEmail,
        recipientPhone: options.recipientPhone,
        senderId: options.senderId,
        senderName: options.senderName,
        estimateId: options.estimateId,
        appointmentId: options.appointmentId,
        attachments: options.attachments || [],
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Send message via appropriate channel
    try {
      await deliverMessage(message.id, options);

      return {
        success: true,
        messageId: message.id,
      };
    } catch (deliveryError: any) {
      // Mark message as failed
      await supabase
        .from('Message')
        .update({
          status: 'failed',
          failedAt: new Date().toISOString(),
          errorMessage: deliveryError.message,
        })
        .eq('id', message.id);

      return {
        success: false,
        messageId: message.id,
        error: deliveryError.message,
      };
    }
  } catch (error: any) {
    console.error('Send message error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deliver message via specific channel
 */
async function deliverMessage(messageId: string, options: SendMessageOptions): Promise<void> {
  switch (options.type) {
    case 'sms':
      await sendSMS(messageId, options);
      break;

    case 'email':
      await sendEmail(messageId, options);
      break;

    case 'in_app':
      await sendInAppMessage(messageId, options);
      break;

    default:
      throw new Error(`Unsupported message type: ${options.type}`);
  }
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(messageId: string, options: SendMessageOptions): Promise<void> {
  const twilio = getTwilioClient();

  if (!twilio) {
    throw new Error('Twilio not configured');
  }

  if (!options.recipientPhone) {
    throw new Error('Recipient phone number required for SMS');
  }

  try {
    await twilio.messages.create({
      body: options.body,
      to: options.recipientPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    await supabase
      .from('Message')
      .update({
        status: 'sent',
        sentAt: new Date().toISOString(),
      })
      .eq('id', messageId);

    console.log(`SMS sent to ${options.recipientPhone}`);
  } catch (error) {
    console.error('SMS delivery error:', error);
    throw error;
  }
}

/**
 * Send email via Resend
 */
async function sendEmail(messageId: string, options: SendMessageOptions): Promise<void> {
  const resend = getResendClient();

  if (!resend) {
    throw new Error('Resend not configured');
  }

  if (!options.recipientEmail) {
    throw new Error('Recipient email required for email');
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'CollisionPro <notifications@collisionpro.com>',
      to: options.recipientEmail,
      subject: options.subject || 'Message from CollisionPro',
      html: options.htmlBody || options.body.replace(/\n/g, '<br>'),
      text: options.body,
    });

    await supabase
      .from('Message')
      .update({
        status: 'sent',
        sentAt: new Date().toISOString(),
      })
      .eq('id', messageId);

    console.log(`Email sent to ${options.recipientEmail}`);
  } catch (error) {
    console.error('Email delivery error:', error);
    throw error;
  }
}

/**
 * Send in-app message
 */
async function sendInAppMessage(messageId: string, options: SendMessageOptions): Promise<void> {
  // In-app messages are already stored in database
  // Just update status to delivered
  await supabase
    .from('Message')
    .update({
      status: 'delivered',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString(),
    })
    .eq('id', messageId);

  // Broadcast real-time event for live updates
  await supabase.from('RealtimeEvent').insert({
    userId: options.customerId,
    shopId: options.shopId,
    eventType: 'new_message',
    payload: { messageId },
  });

  console.log(`In-app message delivered to customer ${options.customerId}`);
}

/**
 * Get conversation history
 */
export async function getConversation(conversationId: string): Promise<{
  conversation: any;
  messages: Message[];
}> {
  try {
    const { data: conversation, error: convError } = await supabase
      .from('Conversation')
      .select(`
        *,
        customer:Customer(*),
        estimate:Estimate(*)
      `)
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    const { data: messages, error: msgError } = await supabase
      .from('Message')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true });

    if (msgError) throw msgError;

    return {
      conversation,
      messages: messages || [],
    };
  } catch (error: any) {
    console.error('Get conversation error:', error);
    throw error;
  }
}

/**
 * Get all conversations for a customer
 */
export async function getCustomerConversations(customerId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('Conversation')
      .select(`
        *,
        shop:Shop(id, name, logo)
      `)
      .eq('customerId', customerId)
      .order('lastMessageAt', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get customer conversations error:', error);
    return [];
  }
}

/**
 * Get all conversations for a shop
 */
export async function getShopConversations(
  shopId: string,
  filters?: {
    status?: string;
    unreadOnly?: boolean;
    limit?: number;
  }
): Promise<any[]> {
  try {
    let query = supabase
      .from('Conversation')
      .select(`
        *,
        customer:Customer(*)
      `)
      .eq('shopId', shopId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.unreadOnly) {
      query = query.gt('unreadCount', 0);
    }

    query = query.order('lastMessageAt', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get shop conversations error:', error);
    return [];
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    await supabase
      .from('Message')
      .update({
        status: 'read',
        readAt: new Date().toISOString(),
      })
      .eq('id', messageId);
  } catch (error: any) {
    console.error('Mark message as read error:', error);
  }
}

/**
 * Mark conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  try {
    await supabase
      .from('Conversation')
      .update({
        unreadCount: 0,
      })
      .eq('id', conversationId);

    // Mark all unread messages as read
    await supabase
      .from('Message')
      .update({
        status: 'read',
        readAt: new Date().toISOString(),
      })
      .eq('conversationId', conversationId)
      .is('readAt', null);
  } catch (error: any) {
    console.error('Mark conversation as read error:', error);
  }
}

/**
 * Send message from template
 */
export async function sendMessageFromTemplate(
  templateId: string,
  customerId: string,
  shopId: string,
  variables: Record<string, any>,
  recipientEmail?: string,
  recipientPhone?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Get template
    const { data: template, error } = await supabase
      .from('CommunicationTemplate')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    // Render template with variables
    let body = template.body;
    let subject = template.subject || '';

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, String(value));
      if (subject) {
        subject = subject.replace(regex, String(value));
      }
    });

    // Send message
    return await sendMessage({
      customerId,
      shopId,
      type: template.type,
      subject,
      body,
      htmlBody: template.htmlBody ? template.htmlBody.replace(/{{(\w+)}}/g, (_match: string, key: string) => String(variables[key] || '')) : undefined,
      recipientEmail,
      recipientPhone,
    });
  } catch (error: any) {
    console.error('Send message from template error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(customerId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('Message')
      .select('id', { count: 'exact', head: true })
      .eq('customerId', customerId)
      .eq('direction', 'inbound')
      .is('readAt', null);

    if (error) throw error;
    return (data as unknown as number) || 0;
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return 0;
  }
}
