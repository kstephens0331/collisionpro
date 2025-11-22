/**
 * SMS Templates
 *
 * Concise SMS message templates (keep under 160 characters when possible)
 */

interface TemplateVariables {
  [key: string]: string | number;
}

export function estimateCreatedSMS(variables: TemplateVariables): string {
  const { customer_name, estimate_number, total_amount, shop_name, view_url } = variables;

  return `Hi ${customer_name}, your estimate #${estimate_number} is ready! Total: $${total_amount}. View it here: ${view_url} - ${shop_name}`;
}

export function jobStartedSMS(variables: TemplateVariables): string {
  const { customer_name, vehicle, estimated_completion, shop_name } = variables;

  return `Hi ${customer_name}, great news! We've started work on your ${vehicle}. Estimated completion: ${estimated_completion}. - ${shop_name}`;
}

export function jobCompletedSMS(variables: TemplateVariables): string {
  const { customer_name, vehicle, shop_name, shop_phone } = variables;

  return `Hi ${customer_name}, your ${vehicle} is ready for pickup! Call us at ${shop_phone} to schedule. - ${shop_name}`;
}

export function partsArrivedSMS(variables: TemplateVariables): string {
  const { customer_name, vehicle, shop_name } = variables;

  return `Hi ${customer_name}, parts for your ${vehicle} have arrived! We'll begin work soon. - ${shop_name}`;
}

export function supplementRequiredSMS(variables: TemplateVariables): string {
  const { customer_name, shop_phone, shop_name } = variables;

  return `Hi ${customer_name}, we found additional damage that needs repair. Please call us at ${shop_phone} to discuss. - ${shop_name}`;
}

export function estimateApprovedSMS(variables: TemplateVariables): string {
  const { customer_name, estimate_number, shop_name } = variables;

  return `Hi ${customer_name}, estimate #${estimate_number} has been approved! We'll schedule your repair soon. - ${shop_name}`;
}

export function paymentReminderSMS(variables: TemplateVariables): string {
  const { customer_name, amount_due, shop_phone, shop_name } = variables;

  return `Hi ${customer_name}, friendly reminder: balance of $${amount_due} is due. Call ${shop_phone} to arrange payment. - ${shop_name}`;
}

// Export all templates
export const SMS_TEMPLATES = {
  estimate_created: estimateCreatedSMS,
  job_started: jobStartedSMS,
  job_completed: jobCompletedSMS,
  parts_arrived: partsArrivedSMS,
  supplement_required: supplementRequiredSMS,
  estimate_approved: estimateApprovedSMS,
  payment_reminder: paymentReminderSMS,
};
