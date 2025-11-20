import twilio from "twilio";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Twilio client (lazy initialization)
let twilioClient: twilio.Twilio | null = null;

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

// Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Status messages for SMS
const STATUS_MESSAGES: Record<string, string> = {
  received: "Your vehicle has been received at the shop. We'll keep you updated on the repair progress.",
  in_progress: "Great news! Repairs on your vehicle have begun. We're working hard to get you back on the road.",
  waiting_for_parts: "We're waiting for parts to arrive for your vehicle. We'll notify you when repairs resume.",
  ready: "Your vehicle is ready for pickup! Please come at your convenience during business hours.",
  completed: "Your repair has been completed. Thank you for choosing us!",
};

export interface SendSMSOptions {
  to: string;
  message: string;
  customerId?: string;
  estimateId?: string;
  channel?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  customerId?: string;
  estimateId?: string;
  channel?: string;
}

// Send SMS via Twilio
export async function sendSMS(options: SendSMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    console.log("Twilio not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    // Format phone number (ensure it has country code)
    let phoneNumber = options.to.replace(/\D/g, "");
    if (phoneNumber.length === 10) {
      phoneNumber = `+1${phoneNumber}`;
    } else if (!phoneNumber.startsWith("+")) {
      phoneNumber = `+${phoneNumber}`;
    }

    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: phoneNumber,
    });

    // Log notification
    await logNotification({
      type: "sms",
      channel: options.channel || "general",
      recipient: phoneNumber,
      message: options.message,
      status: "sent",
      externalId: message.sid,
      customerId: options.customerId,
      estimateId: options.estimateId,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);

    // Log failed notification
    await logNotification({
      type: "sms",
      channel: options.channel || "general",
      recipient: options.to,
      message: options.message,
      status: "failed",
      customerId: options.customerId,
      estimateId: options.estimateId,
    });

    return { success: false, error: (error as Error).message };
  }
}

// Send Email via Resend
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.log("Resend not configured, skipping email");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CollisionPro <noreply@collisionpro.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Log notification
    await logNotification({
      type: "email",
      channel: options.channel || "general",
      recipient: options.to,
      message: options.subject,
      status: "sent",
      externalId: data?.id,
      customerId: options.customerId,
      estimateId: options.estimateId,
    });

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending email:", error);

    // Log failed notification
    await logNotification({
      type: "email",
      channel: options.channel || "general",
      recipient: options.to,
      message: options.subject,
      status: "failed",
      customerId: options.customerId,
      estimateId: options.estimateId,
    });

    return { success: false, error: (error as Error).message };
  }
}

// Log notification to database
async function logNotification(data: {
  type: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  externalId?: string;
  customerId?: string;
  estimateId?: string;
}) {
  try {
    await supabase.from("Notification").insert({
      id: nanoid(),
      type: data.type,
      channel: data.channel,
      recipient: data.recipient,
      message: data.message,
      status: data.status,
      externalId: data.externalId || null,
      customerId: data.customerId || null,
      estimateId: data.estimateId || null,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

// Send status update notification to customer
export async function sendStatusUpdateNotification(
  customerId: string,
  estimateId: string,
  status: string,
  vehicleInfo: string,
  shopName: string = "CollisionPro"
): Promise<void> {
  // Get customer info
  const { data: customer } = await supabase
    .from("Customer")
    .select("email, phoneNumber, firstName")
    .eq("id", customerId)
    .single();

  if (!customer) {
    console.error("Customer not found for notification");
    return;
  }

  const statusMessage = STATUS_MESSAGES[status];
  if (!statusMessage) {
    // Don't send notifications for statuses without messages (draft, sent, approved, cancelled)
    return;
  }

  // Send SMS if phone number available
  if (customer.phoneNumber) {
    const smsMessage = `${shopName}: ${statusMessage} (${vehicleInfo})`;
    await sendSMS({
      to: customer.phoneNumber,
      message: smsMessage,
      customerId,
      estimateId,
      channel: "status_update",
    });
  }

  // Send Email
  if (customer.email) {
    const statusLabel = status.replace(/_/g, " ").toUpperCase();
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${shopName}</h1>
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #1e293b; margin-top: 0;">Repair Status Update</h2>
          <p style="color: #475569;">Hi ${customer.firstName},</p>
          <p style="color: #475569;">${statusMessage}</p>
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Vehicle</p>
            <p style="margin: 5px 0 0 0; color: #1e293b; font-weight: bold;">${vehicleInfo}</p>
            <p style="margin: 15px 0 0 0; color: #64748b; font-size: 14px;">Current Status</p>
            <p style="margin: 5px 0 0 0; color: #2563eb; font-weight: bold;">${statusLabel}</p>
          </div>
          <p style="color: #475569;">Log in to your customer portal to view more details and photos.</p>
          <p style="color: #475569; margin-top: 30px;">Thank you,<br>${shopName} Team</p>
        </div>
        <div style="background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">This is an automated message from ${shopName}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: `Repair Status Update: ${statusLabel} - ${vehicleInfo}`,
      html: emailHtml,
      customerId,
      estimateId,
      channel: "status_update",
    });
  }
}
