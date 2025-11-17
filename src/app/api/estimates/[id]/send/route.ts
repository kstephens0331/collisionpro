import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateEstimatePDF } from '@/lib/pdf/generate-estimate-pdf';
import {
  EstimateData,
  EstimateLineItemData,
  ShopSettingsData,
} from '@/lib/pdf/estimate-template';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Lazy-initialize Resend to avoid errors during build when API key is not set
let resend: Resend | null = null;
function getResendClient() {
  if (!resend) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resend = new Resend(resendApiKey);
  }
  return resend;
}

/**
 * POST /api/estimates/[id]/send
 * Send estimate via email to customer
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipientEmail, recipientName, message } = body;

    // 1. Fetch estimate data
    const { data: estimate, error: estimateError } = await supabaseAdmin
      .from('Estimate')
      .select('*')
      .eq('id', id)
      .single();

    if (estimateError || !estimate) {
      console.error('Error fetching estimate:', estimateError);
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // 2. Fetch line items
    const { data: lineItems, error: lineItemsError } = await supabaseAdmin
      .from('EstimateLineItem')
      .select('*')
      .eq('estimateId', id)
      .order('sequence', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch line items' },
        { status: 500 }
      );
    }

    // 3. Fetch shop settings
    const { data: shopSettings, error: shopSettingsError } = await supabaseAdmin
      .from('ShopSettings')
      .select('*')
      .eq('shopId', estimate.shopId)
      .single();

    if (shopSettingsError || !shopSettings) {
      console.error('Error fetching shop settings:', shopSettingsError);
      return NextResponse.json(
        { success: false, error: 'Shop settings not found' },
        { status: 500 }
      );
    }

    // Check if shop has configured email settings
    if (!shopSettings.senderEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shop email not configured. Please set up sender email in shop settings.',
        },
        { status: 400 }
      );
    }

    // Determine recipient email (use provided or fall back to customer email)
    const toEmail = recipientEmail || estimate.customerEmail;
    const toName = recipientName || estimate.customerName;

    if (!toEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient email is required. No email address found for customer.',
        },
        { status: 400 }
      );
    }

    // 4. Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateEstimatePDF(
        estimate as EstimateData,
        (lineItems || []) as EstimateLineItemData[],
        shopSettings as ShopSettingsData
      );
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate PDF',
          details: pdfError instanceof Error ? pdfError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // 5. Prepare email content
    const shopName = shopSettings.companyName || 'Auto Collision Shop';
    const emailSubject = `Repair Estimate #${estimate.estimateNumber} from ${shopName}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
    }
    .content {
      background: #ffffff;
      padding: 30px 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .estimate-details {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .estimate-details h2 {
      margin: 0 0 15px;
      color: #1e40af;
      font-size: 18px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
    }
    .total {
      font-size: 20px;
      color: #1e40af;
    }
    .message {
      margin: 20px 0;
      padding: 15px;
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
      color: #6b7280;
      font-size: 14px;
    }
    .footer p {
      margin: 5px 0;
    }
    .button {
      display: inline-block;
      background: #1e40af;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .contact-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${shopName}</h1>
    <p>Repair Estimate</p>
  </div>

  <div class="content">
    <p>Dear ${toName},</p>

    <p>Thank you for choosing ${shopName} for your vehicle repair needs. Please find attached your detailed repair estimate for your <strong>${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}</strong>.</p>

    ${message ? `<div class="message"><p>${message}</p></div>` : ''}

    <div class="estimate-details">
      <h2>Estimate Summary</h2>
      <div class="detail-row">
        <span class="detail-label">Estimate Number:</span>
        <span class="detail-value">${estimate.estimateNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vehicle:</span>
        <span class="detail-value">${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}</span>
      </div>
      ${estimate.vehicleVin ? `
      <div class="detail-row">
        <span class="detail-label">VIN:</span>
        <span class="detail-value">${estimate.vehicleVin}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Parts:</span>
        <span class="detail-value">$${estimate.partsSubtotal.toFixed(2)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Labor:</span>
        <span class="detail-value">$${estimate.laborSubtotal.toFixed(2)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Paint:</span>
        <span class="detail-value">$${estimate.paintSubtotal.toFixed(2)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tax:</span>
        <span class="detail-value">$${estimate.taxAmount.toFixed(2)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label total">TOTAL:</span>
        <span class="detail-value total">$${estimate.total.toFixed(2)}</span>
      </div>
    </div>

    <p>The attached PDF contains a complete breakdown of all parts, labor, and materials required for your repair. Please review it carefully and contact us if you have any questions.</p>

    <p><strong>This estimate is valid for 30 days from the date of issue.</strong></p>

    ${estimate.insuranceCompany ? `
    <p style="background: #fffbeb; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b;">
      <strong>Insurance Claim:</strong> This estimate has been prepared for your claim with ${estimate.insuranceCompany}${estimate.claimNumber ? ` (Claim #${estimate.claimNumber})` : ''}.
    </p>
    ` : ''}

    <div class="contact-info">
      <p><strong>Questions or ready to schedule?</strong></p>
      <p>Contact us at:</p>
      ${shopSettings.phone ? `<p>Phone: ${shopSettings.phone}</p>` : ''}
      ${shopSettings.email ? `<p>Email: ${shopSettings.email}</p>` : ''}
      ${shopSettings.address ? `<p>${shopSettings.address}${shopSettings.city ? `, ${shopSettings.city}` : ''}${shopSettings.state ? `, ${shopSettings.state}` : ''}</p>` : ''}
    </div>
  </div>

  <div class="footer">
    <p>This is an automated message from ${shopName}.</p>
    <p>Please do not reply directly to this email.</p>
    ${shopSettings.phone ? `<p>For assistance, please call ${shopSettings.phone}</p>` : ''}
  </div>
</body>
</html>
    `;

    // 6. Send email via Resend
    let emailResult;
    try {
      const resendClient = getResendClient();
      emailResult = await resendClient.emails.send({
        from: shopSettings.senderName
          ? `${shopSettings.senderName} <${shopSettings.senderEmail}>`
          : shopSettings.senderEmail,
        to: toEmail,
        replyTo: shopSettings.replyToEmail || shopSettings.senderEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `estimate-${estimate.estimateNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (!emailResult.data) {
        throw new Error('Email sending failed - no data returned');
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email',
          details: emailError instanceof Error ? emailError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // 7. Log email to EstimateEmailLog table
    try {
      await supabaseAdmin.from('EstimateEmailLog').insert({
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        estimateId: id,
        recipientEmail: toEmail,
        recipientName: toName,
        subject: emailSubject,
        sentBy: 'user_demo', // TODO: Get from session
        sentAt: new Date().toISOString(),
        emailProvider: 'resend',
        emailId: emailResult.data.id,
        status: 'sent',
        metadata: {
          shopId: estimate.shopId,
          estimateNumber: estimate.estimateNumber,
          vehicleInfo: `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`,
        },
      });
    } catch (logError) {
      // Log error but don't fail the request since email was sent successfully
      console.error('Error logging email to database:', logError);
    }

    // 8. Update estimate status to 'sent' if it was 'draft'
    if (estimate.status === 'draft') {
      try {
        await supabaseAdmin
          .from('Estimate')
          .update({
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
          .eq('id', id);

        // Log to history
        await supabaseAdmin.from('EstimateHistory').insert({
          id: `history_${Date.now()}`,
          estimateId: id,
          action: 'sent',
          description: `Estimate sent to ${toEmail}`,
          userId: 'user_demo', // TODO: Get from session
          userName: 'User',
          metadata: {
            recipientEmail: toEmail,
            recipientName: toName,
          },
        });
      } catch (updateError) {
        console.error('Error updating estimate status:', updateError);
      }
    }

    // 9. Return success
    return NextResponse.json({
      success: true,
      message: 'Estimate sent successfully',
      data: {
        emailId: emailResult.data.id,
        recipientEmail: toEmail,
        estimateNumber: estimate.estimateNumber,
      },
    });
  } catch (error: any) {
    console.error('Error in send estimate endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
