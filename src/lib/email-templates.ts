/**
 * Email Templates
 *
 * Professional HTML email templates for notifications
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface TemplateVariables {
  [key: string]: string | number;
}

const baseEmailStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
      margin: 0 0 20px 0;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin: 0 0 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
`;

export function estimateCreatedEmail(variables: TemplateVariables): EmailTemplate {
  const {
    customer_name,
    estimate_number,
    vehicle,
    total_amount,
    shop_name,
    shop_phone,
    view_url,
  } = variables;

  return {
    subject: `Your Estimate #${estimate_number} is Ready`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseEmailStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CollisionPro</h1>
            </div>
            <div class="content">
              <h2 class="title">Your Estimate is Ready!</h2>
              <p class="message">
                Hi ${customer_name},
              </p>
              <p class="message">
                We've completed your estimate for the ${vehicle}. Here are the details:
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Estimate Number:</span>
                  <span class="info-value">#${estimate_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${vehicle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Estimate:</span>
                  <span class="info-value">$${total_amount}</span>
                </div>
              </div>

              <p class="message">
                Please review your estimate and let us know if you have any questions.
              </p>

              <a href="${view_url}" class="button">View Full Estimate</a>

              <p class="message" style="margin-top: 30px;">
                Questions? Contact us at <strong>${shop_phone}</strong>
              </p>
            </div>
            <div class="footer">
              <p>${shop_name}</p>
              <p>
                You're receiving this email because you requested an estimate from us.
                <br>
                <a href="${view_url}">View Online</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Your Estimate is Ready!

Hi ${customer_name},

We've completed your estimate for the ${vehicle}. Here are the details:

Estimate Number: #${estimate_number}
Vehicle: ${vehicle}
Total Estimate: $${total_amount}

Please review your estimate and let us know if you have any questions.

View your estimate: ${view_url}

Questions? Contact us at ${shop_phone}

${shop_name}
    `,
  };
}

export function jobStartedEmail(variables: TemplateVariables): EmailTemplate {
  const {
    customer_name,
    estimate_number,
    vehicle,
    estimated_completion,
    shop_name,
    shop_phone,
  } = variables;

  return {
    subject: `Work Started on Your ${vehicle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseEmailStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CollisionPro</h1>
            </div>
            <div class="content">
              <h2 class="title">Work Has Started! 🔧</h2>
              <p class="message">
                Hi ${customer_name},
              </p>
              <p class="message">
                Great news! Our technicians have started working on your ${vehicle}.
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Estimate Number:</span>
                  <span class="info-value">#${estimate_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${vehicle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Estimated Completion:</span>
                  <span class="info-value">${estimated_completion}</span>
                </div>
              </div>

              <p class="message">
                We'll keep you updated on the progress. If we discover any additional damage that requires attention, we'll contact you right away.
              </p>

              <p class="message" style="margin-top: 30px;">
                Questions? Contact us at <strong>${shop_phone}</strong>
              </p>
            </div>
            <div class="footer">
              <p>${shop_name}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Work Has Started!

Hi ${customer_name},

Great news! Our technicians have started working on your ${vehicle}.

Estimate Number: #${estimate_number}
Vehicle: ${vehicle}
Estimated Completion: ${estimated_completion}

We'll keep you updated on the progress. If we discover any additional damage that requires attention, we'll contact you right away.

Questions? Contact us at ${shop_phone}

${shop_name}
    `,
  };
}

export function jobCompletedEmail(variables: TemplateVariables): EmailTemplate {
  const {
    customer_name,
    estimate_number,
    vehicle,
    final_amount,
    pickup_instructions,
    shop_name,
    shop_phone,
    shop_address,
  } = variables;

  return {
    subject: `Your ${vehicle} is Ready for Pickup!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseEmailStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CollisionPro</h1>
            </div>
            <div class="content">
              <h2 class="title">Your Vehicle is Ready! ✅</h2>
              <p class="message">
                Hi ${customer_name},
              </p>
              <p class="message">
                Excellent news! We've completed the repairs on your ${vehicle} and it's ready for pickup.
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Estimate Number:</span>
                  <span class="info-value">#${estimate_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${vehicle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Final Amount:</span>
                  <span class="info-value">$${final_amount}</span>
                </div>
              </div>

              <p class="message">
                <strong>Pickup Instructions:</strong><br>
                ${pickup_instructions}
              </p>

              <p class="message">
                <strong>Our Location:</strong><br>
                ${shop_address}
              </p>

              <p class="message" style="margin-top: 30px;">
                Questions? Contact us at <strong>${shop_phone}</strong>
              </p>
            </div>
            <div class="footer">
              <p>${shop_name}</p>
              <p>Thank you for choosing us for your collision repair needs!</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Your Vehicle is Ready!

Hi ${customer_name},

Excellent news! We've completed the repairs on your ${vehicle} and it's ready for pickup.

Estimate Number: #${estimate_number}
Vehicle: ${vehicle}
Final Amount: $${final_amount}

Pickup Instructions:
${pickup_instructions}

Our Location:
${shop_address}

Questions? Contact us at ${shop_phone}

${shop_name}
Thank you for choosing us for your collision repair needs!
    `,
  };
}

export function partsOrderedEmail(variables: TemplateVariables): EmailTemplate {
  const {
    customer_name,
    estimate_number,
    vehicle,
    parts_count,
    estimated_arrival,
    shop_name,
  } = variables;

  return {
    subject: `Parts Ordered for Your ${vehicle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseEmailStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CollisionPro</h1>
            </div>
            <div class="content">
              <h2 class="title">Parts on the Way! 📦</h2>
              <p class="message">
                Hi ${customer_name},
              </p>
              <p class="message">
                We've ordered the parts needed to repair your ${vehicle}. Here's what you need to know:
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Estimate Number:</span>
                  <span class="info-value">#${estimate_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Parts Ordered:</span>
                  <span class="info-value">${parts_count} items</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Estimated Arrival:</span>
                  <span class="info-value">${estimated_arrival}</span>
                </div>
              </div>

              <p class="message">
                We'll notify you as soon as the parts arrive and we can begin work on your vehicle.
              </p>
            </div>
            <div class="footer">
              <p>${shop_name}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Parts on the Way!

Hi ${customer_name},

We've ordered the parts needed to repair your ${vehicle}. Here's what you need to know:

Estimate Number: #${estimate_number}
Parts Ordered: ${parts_count} items
Estimated Arrival: ${estimated_arrival}

We'll notify you as soon as the parts arrive and we can begin work on your vehicle.

${shop_name}
    `,
  };
}

export function paymentReceivedEmail(variables: TemplateVariables): EmailTemplate {
  const {
    customer_name,
    estimate_number,
    amount_paid,
    payment_method,
    receipt_url,
    shop_name,
  } = variables;

  return {
    subject: `Payment Received - Receipt #${estimate_number}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${baseEmailStyles}
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">CollisionPro</h1>
            </div>
            <div class="content">
              <h2 class="title">Payment Received ✓</h2>
              <p class="message">
                Hi ${customer_name},
              </p>
              <p class="message">
                Thank you! We've received your payment.
              </p>

              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Receipt Number:</span>
                  <span class="info-value">#${estimate_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount Paid:</span>
                  <span class="info-value">$${amount_paid}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${payment_method}</span>
                </div>
              </div>

              ${receipt_url ? `<a href="${receipt_url}" class="button">Download Receipt</a>` : ''}

              <p class="message" style="margin-top: 30px;">
                Thank you for your business!
              </p>
            </div>
            <div class="footer">
              <p>${shop_name}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Payment Received

Hi ${customer_name},

Thank you! We've received your payment.

Receipt Number: #${estimate_number}
Amount Paid: $${amount_paid}
Payment Method: ${payment_method}

${receipt_url ? `Download Receipt: ${receipt_url}` : ''}

Thank you for your business!

${shop_name}
    `,
  };
}

// Export all templates
export const EMAIL_TEMPLATES = {
  estimate_created: estimateCreatedEmail,
  job_started: jobStartedEmail,
  job_completed: jobCompletedEmail,
  parts_ordered: partsOrderedEmail,
  payment_received: paymentReceivedEmail,
};
