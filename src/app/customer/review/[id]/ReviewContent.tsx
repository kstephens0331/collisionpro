"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  Loader2,
  CheckCircle2,
  Car,
  MessageSquare,
  Clock,
  Wrench,
  ThumbsUp,
} from "lucide-react";

interface EstimateInfo {
  id: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  customerName: string;
  reviewId: string | null;
}

export default function ReviewContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [estimate, setEstimate] = useState<EstimateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceQuality, setServiceQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if customer is logged in
    const customerData = localStorage.getItem("customer");
    if (!customerData) {
      router.push(`/customer/login?redirect=/customer/review/${id}`);
      return;
    }

    try {
      const customer = JSON.parse(customerData);
      setCustomerId(customer.id);
      fetchEstimate(customer.id);
    } catch {
      router.push("/customer/login");
    }
  }, [router, id]);

  const fetchEstimate = async (custId: string) => {
    try {
      const response = await fetch(
        `/api/customer/estimates/${id}/status?customerId=${custId}`
      );
      const data = await response.json();

      if (data.success) {
        // Extract vehicle info from the response
        const [year, make, ...modelParts] = data.estimate.vehicle.split(" ");
        setEstimate({
          id: data.estimate.id,
          vehicleYear: year,
          vehicleMake: make,
          vehicleModel: modelParts.join(" "),
          customerName: data.estimate.customerName,
          reviewId: null, // We'd need to fetch this from the estimate directly
        });
      } else {
        setError(data.error || "Failed to load estimate");
      }
    } catch (err) {
      console.error("Error fetching estimate:", err);
      setError("Failed to load estimate");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      alert("Please select an overall rating");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          estimateId: id,
          rating,
          comment: comment || undefined,
          serviceQuality: serviceQuality || undefined,
          communication: communication || undefined,
          timeliness: timeliness || undefined,
          wouldRecommend,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = "lg",
  }: {
    value: number;
    onChange: (value: number) => void;
    size?: "sm" | "lg";
  }) => {
    const [hover, setHover] = useState(0);
    const starSize = size === "lg" ? "h-8 w-8" : "h-5 w-5";

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star
              className={`${starSize} ${
                star <= (hover || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || "Estimate not found"}</p>
            <Button onClick={() => router.push("/customer/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your review has been submitted successfully. We appreciate your feedback!
            </p>
            <Button onClick={() => router.push("/customer/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leave a Review
          </h1>
          <p className="text-gray-600">
            How was your experience with us?
          </p>
        </div>

        {/* Vehicle Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {estimate.vehicleYear} {estimate.vehicleMake} {estimate.vehicleModel}
                </p>
                <p className="text-sm text-gray-600">{estimate.customerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Overall Rating *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Ratings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Rate Your Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Service Quality</span>
                </div>
                <StarRating value={serviceQuality} onChange={setServiceQuality} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Communication</span>
                </div>
                <StarRating value={communication} onChange={setCommunication} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Timeliness</span>
                </div>
                <StarRating value={timeliness} onChange={setTimeliness} size="sm" />
              </div>
            </CardContent>
          </Card>

          {/* Would Recommend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Would you recommend us?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={wouldRecommend === true ? "default" : "outline"}
                  onClick={() => setWouldRecommend(true)}
                  className="flex-1"
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wouldRecommend === false ? "default" : "outline"}
                  onClick={() => setWouldRecommend(false)}
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Additional Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting || !rating}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
