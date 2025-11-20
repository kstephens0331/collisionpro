"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams?.get("session_id");

  useEffect(() => {
    // Check if customer is logged in
    const customerData = localStorage.getItem("customer");
    if (!customerData) {
      router.push("/customer/login");
      return;
    }

    // Brief delay to allow webhook processing
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>

          <p className="text-gray-600 mb-6">
            Thank you for your payment. You will receive a confirmation email shortly.
          </p>

          {sessionId && (
            <p className="text-xs text-gray-400 mb-6">
              Reference: {sessionId.substring(0, 20)}...
            </p>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push("/customer/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
