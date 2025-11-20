import { NextRequest, NextResponse } from "next/server";

// Twilio SMS API endpoint
// In production, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, estimateId } = body;

    // Validate inputs
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: "Phone number and message are required" },
        { status: 400 }
      );
    }

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      // Development mode - just log
      console.log("[SMS] Twilio not configured. Would send:");
      console.log(`[SMS] To: ${to}`);
      console.log(`[SMS] Message: ${message}`);

      return NextResponse.json({
        success: true,
        messageId: `dev-${Date.now()}`,
        note: "Twilio not configured - message logged only",
      });
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", fromPhone);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Failed to send SMS",
        },
        { status: response.status }
      );
    }

    // Log successful send (in production, save to database)
    console.log(`[SMS] Sent to ${to}: ${data.sid}`);

    return NextResponse.json({
      success: true,
      messageId: data.sid,
      status: data.status,
    });
  } catch (error) {
    console.error("SMS send error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send SMS",
      },
      { status: 500 }
    );
  }
}
