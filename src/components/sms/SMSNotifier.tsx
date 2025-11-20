"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import {
  SMSTemplate,
  SMS_TEMPLATES,
  sendNotification,
  formatPhoneNumber,
} from "@/lib/sms/notifications";

interface SMSNotifierProps {
  customerPhone: string;
  customerName: string;
  estimateId?: string;
  vehicleInfo?: {
    year: number;
    make: string;
    model: string;
  };
  onSent?: () => void;
}

export default function SMSNotifier({
  customerPhone,
  customerName,
  estimateId,
  vehicleInfo,
  onSent,
}: SMSNotifierProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate>("estimate_sent");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const variables = {
        customerName,
        estimateNumber: estimateId || "XXXXX",
        vehicleYear: vehicleInfo?.year || "",
        vehicleMake: vehicleInfo?.make || "",
        vehicleModel: vehicleInfo?.model || "",
        shopName: "CollisionPro Auto Body",
        shopPhone: "(555) 123-4567",
        estimateLink: `https://app.collisionpro.com/customer/estimates/${estimateId}`,
        message: customMessage,
      };

      const result = await sendNotification(
        customerPhone,
        selectedTemplate,
        variables,
        estimateId
      );

      if (result.success) {
        alert("SMS sent successfully!");
        if (onSent) onSent();
      } else {
        alert(`Failed to send SMS: ${result.error}`);
      }
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  const formattedPhone = formatPhoneNumber(customerPhone);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Send SMS Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm">
            <strong>To:</strong> {customerName} ({formattedPhone || customerPhone})
          </p>
          {vehicleInfo && (
            <p className="text-sm mt-1">
              <strong>Vehicle:</strong> {vehicleInfo.year} {vehicleInfo.make}{" "}
              {vehicleInfo.model}
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Message Template</Label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as SMSTemplate)}
          >
            <option value="estimate_sent">Estimate Sent</option>
            <option value="estimate_approved">Estimate Approved</option>
            <option value="job_started">Job Started</option>
            <option value="parts_arrived">Parts Arrived</option>
            <option value="job_completed">Job Completed</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="payment_received">Payment Received</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>

        {/* Custom Message */}
        {selectedTemplate === "custom" && (
          <div className="space-y-2">
            <Label>Custom Message</Label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
              placeholder="Enter your custom message (max 160 characters)"
              maxLength={160}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              {customMessage.length}/160 characters
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="space-y-2">
          <Label>Message Preview</Label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            {selectedTemplate === "custom"
              ? customMessage || "Enter a custom message above..."
              : SMS_TEMPLATES[selectedTemplate]
                  .replace("{{customerName}}", customerName)
                  .replace("{{estimateNumber}}", estimateId || "XXXXX")
                  .replace("{{vehicleYear}}", vehicleInfo?.year.toString() || "")
                  .replace("{{vehicleMake}}", vehicleInfo?.make || "")
                  .replace("{{vehicleModel}}", vehicleInfo?.model || "")
                  .replace("{{shopName}}", "CollisionPro Auto Body")
                  .replace("{{shopPhone}}", "(555) 123-4567")}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sending || !formattedPhone || (selectedTemplate === "custom" && !customMessage)}
          className="w-full"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-gray-600 bg-green-50 p-3 rounded border border-green-200">
          <p className="font-semibold mb-1">📱 SMS Benefits:</p>
          <ul className="ml-4 space-y-0.5">
            <li>• 98% open rate (vs 20% for email)</li>
            <li>• Instant delivery</li>
            <li>• Reduce "where's my car?" calls by 90%</li>
            <li>• Better customer experience</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
