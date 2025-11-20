// Workflow automation system types
// Enables automated customer follow-ups and retention

export type WorkflowTrigger =
  | "estimate_sent"
  | "estimate_approved"
  | "job_started"
  | "job_completed"
  | "payment_received"
  | "customer_inactive"
  | "vehicle_service_due"
  | "time_delay"
  | "manual";

export type WorkflowAction =
  | "send_email"
  | "send_sms"
  | "create_task"
  | "send_notification"
  | "update_status"
  | "schedule_followup";

export type WorkflowChannel = "email" | "sms" | "in_app" | "task";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  enabled: boolean;
  delay?: number; // Delay in hours before executing
  conditions?: WorkflowCondition[];
  actions: WorkflowActionConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: any;
}

export interface WorkflowActionConfig {
  id: string;
  type: WorkflowAction;
  channel: WorkflowChannel;
  template: string; // Template with variables like {{customerName}}
  subject?: string; // For emails
  delay?: number; // Delay this specific action (in hours)
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  estimateId?: string;
  customerId?: string;
  triggeredAt: Date;
  executedAt?: Date;
  status: "pending" | "executing" | "completed" | "failed" | "cancelled";
  error?: string;
  results?: Record<string, any>;
}

// Built-in workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "estimate-followup-24h",
    name: "Estimate Follow-up (24 hours)",
    description: "Follow up with customer 24 hours after sending estimate",
    trigger: "estimate_sent",
    enabled: true,
    delay: 24,
    conditions: [
      {
        field: "status",
        operator: "equals",
        value: "pending",
      },
    ],
    actions: [
      {
        id: "email-1",
        type: "send_email",
        channel: "email",
        subject: "Quick Question About Your Estimate",
        template: `Hi {{customerName}},

I wanted to follow up on the estimate we sent you for your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}.

Estimate #{{estimateNumber}}
Total: {{estimateTotal}}

Do you have any questions about the estimate? I'm here to help!

Best regards,
{{shopName}}`,
      },
      {
        id: "task-1",
        type: "create_task",
        channel: "task",
        template: "Call {{customerName}} about estimate #{{estimateNumber}}",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "job-completed-review",
    name: "Request Review (3 days after completion)",
    description: "Ask for review 3 days after job completion",
    trigger: "job_completed",
    enabled: true,
    delay: 72, // 3 days
    actions: [
      {
        id: "email-1",
        type: "send_email",
        channel: "email",
        subject: "How Did We Do? Leave a Review",
        template: `Hi {{customerName}},

We hope you're loving your repaired {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}!

We'd really appreciate it if you could take 2 minutes to leave us a review. Your feedback helps us improve and helps other customers find us.

{{reviewLink}}

Thank you for choosing {{shopName}}!

Best regards,
{{shopName}} Team`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "customer-inactive-6months",
    name: "Re-engagement (6 months inactive)",
    description: "Re-engage customers who haven't returned in 6 months",
    trigger: "customer_inactive",
    enabled: true,
    conditions: [
      {
        field: "daysSinceLastVisit",
        operator: "greater_than",
        value: 180,
      },
    ],
    actions: [
      {
        id: "email-1",
        type: "send_email",
        channel: "email",
        subject: "We Miss You! Special Offer Inside",
        template: `Hi {{customerName}},

It's been a while since we last saw your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}}!

We'd love to see you again. Here's a special offer just for you:

🎁 15% OFF your next service

Use code: WELCOME-BACK

Schedule your appointment today!

Best regards,
{{shopName}}`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "payment-received-thank-you",
    name: "Payment Thank You",
    description: "Thank customer immediately after payment",
    trigger: "payment_received",
    enabled: true,
    delay: 0,
    actions: [
      {
        id: "email-1",
        type: "send_email",
        channel: "email",
        subject: "Payment Received - Thank You!",
        template: `Hi {{customerName}},

Thank you for your payment of {{paymentAmount}}!

Your receipt is attached. If you have any questions, please don't hesitate to reach out.

We appreciate your business!

Best regards,
{{shopName}}`,
      },
      {
        id: "sms-1",
        type: "send_sms",
        channel: "sms",
        template: "Thanks for your payment, {{customerName}}! Your receipt has been emailed to you. - {{shopName}}",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "estimate-approved-start",
    name: "Estimate Approved - Schedule Work",
    description: "When customer approves estimate, schedule the work",
    trigger: "estimate_approved",
    enabled: true,
    delay: 0,
    actions: [
      {
        id: "task-1",
        type: "create_task",
        channel: "task",
        template: "Schedule work for {{customerName}} - Estimate #{{estimateNumber}}",
      },
      {
        id: "email-1",
        type: "send_email",
        channel: "email",
        subject: "Estimate Approved - Let's Schedule!",
        template: `Hi {{customerName}},

Great news! Your estimate has been approved.

Estimate #{{estimateNumber}}
Total: {{estimateTotal}}

Let's get your {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} scheduled for repair.

Please call us at {{shopPhone}} or reply to this email with your preferred dates.

Best regards,
{{shopName}}`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Template variable substitution
export function substituteVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace all {{variable}} with actual values
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, variables[key] || "");
  });

  return result;
}

// Extract variables from estimate data
export function extractWorkflowVariables(
  estimate: any,
  customer?: any,
  shop?: any
): Record<string, any> {
  return {
    // Customer info
    customerName: customer?.name || estimate?.customerName || "Valued Customer",
    customerEmail: customer?.email || estimate?.customerEmail || "",
    customerPhone: customer?.phone || estimate?.customerPhone || "",

    // Estimate info
    estimateNumber: estimate?.estimateNumber || "",
    estimateTotal: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(estimate?.total || 0),
    estimateSubtotal: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(estimate?.subtotal || 0),

    // Vehicle info
    vehicleYear: estimate?.vehicleYear || "",
    vehicleMake: estimate?.vehicleMake || "",
    vehicleModel: estimate?.vehicleModel || "",
    vehicleVin: estimate?.vehicleVin || "",

    // Shop info
    shopName: shop?.name || "Our Shop",
    shopPhone: shop?.phone || "",
    shopEmail: shop?.email || "",
    shopAddress: shop?.address || "",

    // Links (use relative paths to avoid build-time env issues)
    reviewLink: `/customer/review/${estimate?.id}`,
    estimateLink: `/customer/estimates/${estimate?.id}`,
    paymentLink: `/customer/estimates/${estimate?.id}#payment`,
  };
}
