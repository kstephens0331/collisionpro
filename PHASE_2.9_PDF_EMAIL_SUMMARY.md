# Phase 2.9: PDF Generation and Email Delivery - Summary

## Overview
Successfully implemented PDF generation and email delivery functionality for estimates. This allows shops to send professional, branded estimates to customers via email with PDF attachments.

## Files Created

### 1. `src/lib/pdf/estimate-template.tsx`
**Purpose**: Professional PDF template using @react-pdf/renderer

**Features**:
- Blue/white color scheme (similar to Mitchell/CCC ONE industry standards)
- Comprehensive shop header with branding (name, address, contact info)
- Estimate title and number prominently displayed
- Well-organized sections:
  - Customer Information (name, email, phone, address)
  - Vehicle Information (year, make, model, trim, VIN, mileage, color)
  - Insurance Information (company, claim number, policy number, deductible)
  - Damage Description with date of loss
  - Line Items Table with columns:
    - Type (Part/Labor/Paint/Misc)
    - Description (with sub-text for part numbers and labor codes)
    - Part/Code
    - Quantity
    - Unit Price
    - Total
  - Totals Section:
    - Parts Subtotal
    - Labor Subtotal
    - Paint Subtotal
    - Subtotal
    - Tax (with percentage)
    - Grand Total
    - Customer Responsibility (if deductible applies)
  - Notes section for additional information
  - Professional footer with validity period and contact info

**TypeScript Interfaces Defined**:
```typescript
export interface EstimateData {
  // Estimate info, customer, vehicle, insurance, damage, financials, notes
}

export interface EstimateLineItemData {
  // Line item details for parts, labor, paint, etc.
}

export interface ShopSettingsData {
  // Shop branding and contact information
}
```

**Styling**:
- Professional layout with proper spacing and alignment
- Color-coded sections (blue headers, gray info boxes, yellow notes)
- Alternating row colors in table for readability
- Responsive column widths
- Clean typography using Helvetica font family

---

### 2. `src/lib/pdf/generate-estimate-pdf.ts`
**Purpose**: Service to generate PDF buffers from estimate data

**Functions**:

#### `generateEstimatePDF()`
```typescript
async function generateEstimatePDF(
  estimate: EstimateData,
  lineItems: EstimateLineItemData[],
  shopSettings: ShopSettingsData
): Promise<Buffer>
```
- Takes estimate data, line items, and shop settings
- Uses ReactPDF.renderToBuffer() to create PDF
- Returns Buffer for email attachment or download
- Includes error handling with descriptive messages

#### `generateEstimatePDFStream()`
```typescript
async function generateEstimatePDFStream(
  estimate: EstimateData,
  lineItems: EstimateLineItemData[],
  shopSettings: ShopSettingsData
): Promise<NodeJS.ReadableStream>
```
- Alternative method that returns a stream instead of buffer
- Useful for streaming responses or large PDFs

**Error Handling**:
- Try-catch blocks with detailed error messages
- Logs errors to console for debugging
- Throws descriptive errors for upstream handling

---

### 3. `src/app/api/estimates/[id]/send/route.ts`
**Purpose**: API endpoint to send estimates via email

**Endpoint**: `POST /api/estimates/[id]/send`

**Request Body**:
```typescript
{
  recipientEmail?: string,  // Optional, falls back to customer email
  recipientName?: string,   // Optional, falls back to customer name
  message?: string          // Optional custom message to include
}
```

**Process Flow**:
1. **Fetch Estimate Data**: Retrieves estimate from database by ID
2. **Fetch Line Items**: Gets all line items ordered by sequence
3. **Fetch Shop Settings**: Retrieves shop branding and email configuration
4. **Validate Email Configuration**: Ensures shop has senderEmail set up
5. **Generate PDF**: Creates PDF buffer using generateEstimatePDF()
6. **Prepare Email Content**:
   - Professional HTML email template with shop branding
   - Estimate summary with key details
   - Vehicle information
   - Price breakdown
   - Custom message (if provided)
   - Contact information
   - Insurance claim details (if applicable)
7. **Send Email via Resend**:
   - Subject: "Repair Estimate #{estimateNumber} from {shopName}"
   - From: Shop's configured sender email
   - Reply-To: Shop's reply-to email or sender email
   - Attachments: PDF named "estimate-{number}.pdf"
8. **Log to EstimateEmailLog**: Records email send with:
   - Recipient details
   - Email provider info (Resend ID)
   - Status and metadata
9. **Update Estimate Status**: Changes status from 'draft' to 'sent' (first send only)
10. **Log to EstimateHistory**: Audit trail entry

**Email Template Features**:
- Responsive HTML design
- Professional header with gradient background
- Clean summary table with estimate details
- Vehicle and insurance information
- Price breakdown
- Call-to-action for questions
- Shop contact information in footer
- Mobile-friendly styling

**Environment Variables Required**:
```
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

**Response**:
```typescript
{
  success: true,
  message: "Estimate sent successfully",
  data: {
    emailId: string,           // Resend email ID
    recipientEmail: string,
    estimateNumber: string
  }
}
```

**Error Handling**:
- 404: Estimate not found
- 400: Missing email configuration or recipient
- 500: PDF generation, email sending, or database errors
- Detailed error messages and logging for debugging

---

### 4. `scripts/create-estimate-email-log.sql`
**Purpose**: Database schema for email logging

**Table**: `EstimateEmailLog`

**Columns**:
- `id`: Unique identifier
- `estimateId`: Reference to Estimate (CASCADE DELETE)
- `recipientEmail`: Email address sent to
- `recipientName`: Recipient name
- `subject`: Email subject line
- `sentBy`: User ID who sent the email
- `sentAt`: Timestamp when sent
- `emailProvider`: Email service used (default: 'resend')
- `emailId`: Provider's tracking ID
- `status`: Email status (sent, failed, bounced, opened, clicked)
- `errorMessage`: Error details if failed
- `openedAt`: When email was opened (webhook tracking)
- `clickedAt`: When links were clicked (webhook tracking)
- `metadata`: JSONB for additional tracking data
- `createdAt`: Record creation timestamp

**Indexes**:
- `idx_email_log_estimate`: On estimateId for quick lookups
- `idx_email_log_recipient`: On recipientEmail for recipient history
- `idx_email_log_sent_at`: On sentAt for date-based queries
- `idx_email_log_status`: On status for filtering by delivery status

**To Apply Schema**:
```bash
# Using Supabase CLI or SQL editor
psql -h your_supabase_host -U postgres -d postgres -f scripts/create-estimate-email-log.sql
```

---

## Integration Points

### Database Tables Used
1. **Estimate**: Source data for PDF
2. **EstimateLineItem**: Line items for estimate
3. **ShopSettings**: Branding and email configuration
4. **EstimateEmailLog**: Email tracking (NEW - needs to be created)
5. **EstimateHistory**: Audit trail for estimate actions
6. **User**: Reference for who sent the email

### External Services
1. **Resend**: Email delivery service
   - Requires API key in environment variables
   - Provides email tracking and delivery status
   - Supports attachments up to 40MB

2. **@react-pdf/renderer**: PDF generation
   - Already installed (version 4.3.1)
   - No additional configuration needed

### Shop Settings Required Fields
For email sending to work, shops must configure:
- `senderEmail` (required): Email address to send from
- `senderName` (optional): Display name for sender
- `replyToEmail` (optional): Email for customer replies
- `companyName`, `address`, `phone`, etc. (optional but recommended for branding)

---

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the EstimateEmailLog table:
```sql
-- Execute scripts/create-estimate-email-log.sql in your Supabase SQL editor
```

### 2. Environment Variables
Add to your `.env` file:
```bash
RESEND_API_KEY=re_your_api_key_here
```

### 3. Resend Configuration
1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Generate API key
4. Add API key to environment variables

### 4. Shop Settings Configuration
Ensure each shop has configured their email settings in the database:
```sql
UPDATE "ShopSettings"
SET
  "senderEmail" = 'estimates@yourshop.com',
  "senderName" = 'Your Shop Name',
  "replyToEmail" = 'info@yourshop.com',
  "emailDomainVerified" = true
WHERE "shopId" = 'your_shop_id';
```

---

## Usage Examples

### Frontend Integration

#### 1. Send Email Button Component
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function SendEstimateButton({ estimateId }: { estimateId: string }) {
  const [sending, setSending] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Optional: override recipient
          // recipientEmail: 'customer@example.com',
          // recipientName: 'John Doe',
          message: 'Thank you for choosing our shop!',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Estimate sent successfully!');
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (error) {
      alert('Error sending estimate');
    } finally {
      setSending(false);
    }
  };

  return (
    <Button onClick={handleSendEmail} disabled={sending}>
      <Send className="h-4 w-4 mr-2" />
      {sending ? 'Sending...' : 'Send to Customer'}
    </Button>
  );
}
```

#### 2. Download PDF (Future Enhancement)
```typescript
// Add GET endpoint to /api/estimates/[id]/pdf for direct downloads
```

---

## Testing Checklist

### PDF Generation
- [ ] PDF generates without errors
- [ ] All sections display correctly
- [ ] Shop branding appears correctly
- [ ] Customer information is accurate
- [ ] Vehicle details are complete
- [ ] Line items table is formatted properly
- [ ] Totals calculate correctly
- [ ] Insurance info displays when present
- [ ] Notes section appears when included
- [ ] Footer shows validity period and contact info

### Email Sending
- [ ] Email sends successfully to customer email
- [ ] Email sends to custom recipient email
- [ ] PDF attachment is included and opens correctly
- [ ] Email HTML renders properly in various clients (Gmail, Outlook, etc.)
- [ ] Shop branding appears in email
- [ ] Estimate summary is accurate
- [ ] Custom message is included when provided
- [ ] Reply-to email is set correctly
- [ ] Email logs to EstimateEmailLog table
- [ ] Estimate status updates from 'draft' to 'sent'
- [ ] History entry is created

### Error Handling
- [ ] Handles missing estimate gracefully
- [ ] Validates shop email configuration
- [ ] Reports PDF generation errors
- [ ] Reports email sending errors
- [ ] Logs errors appropriately
- [ ] Returns helpful error messages to frontend

---

## Known Limitations & Future Enhancements

### Current Limitations
1. No email webhook handling for open/click tracking
2. No retry mechanism for failed emails
3. Single PDF page (may need pagination for large estimates)
4. No PDF preview before sending
5. No bulk email sending capability

### Recommended Enhancements
1. **Email Webhooks**:
   - Add POST /api/webhooks/resend to handle delivery status
   - Update EstimateEmailLog with opens, clicks, bounces

2. **PDF Download Endpoint**:
   - Add GET /api/estimates/[id]/pdf
   - Allow direct PDF downloads without emailing

3. **Email Templates**:
   - Create customizable email templates per shop
   - Support template variables and custom branding

4. **Batch Email Sending**:
   - Send estimates to multiple recipients
   - BCC insurance adjusters

5. **PDF Customization**:
   - Shop logo upload and display
   - Custom color schemes per shop
   - Terms and conditions section

6. **Email Scheduling**:
   - Schedule emails for later sending
   - Follow-up email automation

7. **Analytics Dashboard**:
   - Email open rates
   - Time to customer response
   - Conversion tracking (sent → approved)

---

## Troubleshooting

### PDF Generation Fails
**Issue**: Error generating PDF
**Solutions**:
- Check that all required data fields are present
- Verify @react-pdf/renderer is installed
- Check console logs for specific error messages
- Ensure data types match interface definitions

### Email Sending Fails
**Issue**: Email not sending
**Solutions**:
- Verify RESEND_API_KEY is set in environment
- Check shop has senderEmail configured
- Verify sender domain is verified in Resend
- Check Resend dashboard for error details
- Ensure recipient email is valid

### Email Not Received
**Issue**: Email sent but customer didn't receive
**Solutions**:
- Check spam/junk folder
- Verify recipient email address is correct
- Check Resend dashboard for delivery status
- Verify sender domain SPF/DKIM records
- Check EstimateEmailLog for status

### Database Errors
**Issue**: Cannot log email or update estimate
**Solutions**:
- Verify EstimateEmailLog table exists
- Check database permissions
- Review Supabase logs for specific errors
- Ensure referential integrity (estimate exists, user exists)

---

## Security Considerations

### Email Security
- Sender email must be verified domain (prevents spoofing)
- Reply-to email validation recommended
- No sensitive data in email subject line
- Use HTTPS for all API calls

### PDF Security
- PDFs generated server-side only (not exposed to client)
- No sensitive internal notes in customer PDFs
- Consider password-protecting PDFs with VIN (future)

### API Security
- Validate estimate ownership before sending
- Rate limiting recommended (prevent email spam)
- Authenticate user before allowing email send
- Sanitize custom message input

---

## Dependencies Confirmed

✅ **@react-pdf/renderer@4.3.1** - Installed
✅ **resend@6.4.2** - Installed
✅ **@supabase/supabase-js@2.81.1** - Installed
✅ **react@19.2.0** - Installed

---

## Conclusion

Phase 2.9 PDF Generation and Email Delivery is **COMPLETE**.

All three requested files have been created and are ready for use:
1. ✅ Professional PDF template with full styling and branding
2. ✅ PDF generation service with buffer/stream support
3. ✅ Email sending endpoint with comprehensive error handling

The EstimateEmailLog table schema has been provided and needs to be applied to the database.

**Next Steps**:
1. Apply the SQL schema for EstimateEmailLog
2. Configure shop email settings in ShopSettings table
3. Set up Resend account and add API key to environment
4. Integrate send button into estimate detail page UI
5. Test email sending with real estimates
6. Monitor EstimateEmailLog for delivery tracking

**Files to Review**:
- `src/lib/pdf/estimate-template.tsx` - PDF template
- `src/lib/pdf/generate-estimate-pdf.ts` - PDF generation service
- `src/app/api/estimates/[id]/send/route.ts` - Email endpoint
- `scripts/create-estimate-email-log.sql` - Database schema
