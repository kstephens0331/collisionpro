// SMS Notification System
// Integrated with Twilio for automated customer updates

export type SMSTemplate =
  | "estimate_sent"
  | "estimate_approved"
  | "job_started"
  | "parts_arrived"
  | "job_in_progress"
  | "job_completed"
  | "ready_for_pickup"
  | "payment_received"
  | "appointment_reminder"
  | "custom";

export interface SMSNotification {
  id: string;
  to: string; // Phone number
  from: string; // Shop phone number
  template: SMSTemplate;
  message: string;
  estimateId?: string;
  customerId?: string;
  status: "pending" | "sent" | "delivered" | "failed";
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  createdAt: Date;
}

// SMS Templates (160 characters or less for best results)
export const SMS_TEMPLATES: Record<SMSTemplate, string> = {
  estimate_sent: "Hi {{customerName}}! Your estimate #{{estimateNumber}} for your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} is ready. Total: {{estimateTotal}}. View it here: {{estimateLink}}",

  estimate_approved: "Great news {{customerName}}! We received your approval for estimate #{{estimateNumber}}. We'll schedule your repair and contact you soon. - {{shopName}}",

  job_started: "Good news! We've started working on your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} today. We'll keep you updated on progress. - {{shopName}}",

  parts_arrived: "Update: Parts for your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} have arrived! We'll continue with your repair. - {{shopName}}",

  job_in_progress: "Your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} repair is going well! Current status: {{status}}. Estimated completion: {{completionDate}}. - {{shopName}}",

  job_completed: "Exciting news {{customerName}}! Your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} is complete and ready for pickup! Call us at {{shopPhone}} to schedule. - {{shopName}}",

  ready_for_pickup: "Your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} is ready for pickup! We're open {{shopHours}}. Bring your ID and payment method. See you soon! - {{shopName}}",

  payment_received: "Payment received! Thank you {{customerName}}. Your receipt has been emailed. We appreciate your business! - {{shopName}}",

  appointment_reminder: "Reminder: You have an appointment at {{shopName}} on {{appointmentDate}} at {{appointmentTime}}. Reply CONFIRM or call {{shopPhone}}.",

  custom: "{{message}}",
};

// Format phone number to E.164 format (+1XXXXXXXXXX)
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  } else if (digits.startsWith("+")) {
    return phone.replace(/\D/g, "");
  }

  return null; // Invalid format
}

// Validate phone number
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return formatted !== null;
}

// Replace template variables
export function fillTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let message = template;

  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    message = message.replace(regex, variables[key] || "");
  });

  return message;
}

// Send SMS using Twilio (production) or console.log (development)
export async function sendSMS(
  to: string,
  message: string,
  estimateId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number
    const formattedTo = formatPhoneNumber(to);
    if (!formattedTo) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    // Truncate message to 160 characters (SMS limit)
    const truncatedMessage = message.length > 160
      ? message.substring(0, 157) + "..."
      : message;

    // In development, just log
    if (process.env.NODE_ENV === "development" || !process.env.TWILIO_ACCOUNT_SID) {
      console.log("[SMS] Would send to:", formattedTo);
      console.log("[SMS] Message:", truncatedMessage);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    // Production: Send via Twilio
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: formattedTo,
        message: truncatedMessage,
        estimateId,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Failed to send SMS",
      };
    }

    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send notification using template
export async function sendNotification(
  to: string,
  template: SMSTemplate,
  variables: Record<string, any>,
  estimateId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const templateMessage = SMS_TEMPLATES[template];
  const message = fillTemplate(templateMessage, variables);

  return sendSMS(to, message, estimateId);
}

// Batch send (with rate limiting to avoid spam)
export async function sendBatchSMS(
  notifications: Array<{
    to: string;
    template: SMSTemplate;
    variables: Record<string, any>;
    estimateId?: string;
  }>
): Promise<Array<{ success: boolean; to: string; error?: string }>> {
  const results = [];

  // Rate limit: Send max 10/second to avoid Twilio limits
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    const result = await sendNotification(
      notification.to,
      notification.template,
      notification.variables,
      notification.estimateId
    );

    results.push({
      success: result.success,
      to: notification.to,
      error: result.error,
    });

    // Wait 100ms between sends (10/second rate limit)
    if (i < notifications.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Get opt-out status (customers can opt-out of SMS)
export function isOptedOut(phone: string): boolean {
  // In production, check database for opt-out list
  // For now, return false
  return false;
}

// Add to opt-out list
export async function optOut(phone: string): Promise<void> {
  // In production, add to database opt-out list
  console.log(`[SMS] Opted out: ${phone}`);
}

// Remove from opt-out list
export async function optIn(phone: string): Promise<void> {
  // In production, remove from database opt-out list
  console.log(`[SMS] Opted in: ${phone}`);
}
