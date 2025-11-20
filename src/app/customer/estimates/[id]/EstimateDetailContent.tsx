"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Car,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Calendar,
  FileText,
  Camera,
  CreditCard,
  DollarSign,
  Box,
} from "lucide-react";
import { getVehicleType } from "@/lib/3d/vehicle-type-detector";
import type { DamageMarker } from "@/lib/3d/damage-markers";

// Lazy load 3D viewer for customer portal
const VehicleViewer = dynamic(
  () => import('@/components/3d/VehicleViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading 3D viewer...</p>
        </div>
      </div>
    ),
  }
);

interface TimelineEntry {
  id: string;
  status: string;
  notes: string | null;
  timestamp: string;
  label: string;
}

interface PaymentInfo {
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  depositRequired: number | null;
  depositPaid: boolean;
  balanceDue: number;
}

interface EstimateStatus {
  estimate: {
    id: string;
    estimateNumber: string;
    vehicle: string;
    vehicleMake?: string;
    vehicleModel?: string;
    customerName: string;
  };
  currentStatus: string;
  currentStatusLabel: string;
  estimatedCompletion: string | null;
  timeline: TimelineEntry[];
  payment: PaymentInfo;
}

interface Photo {
  id: string;
  url: string;
  category: string;
  caption: string | null;
  createdAt: string;
}

interface GroupedPhotos {
  damage: Photo[];
  progress: Photo[];
  completed: Photo[];
}

// Status order for progress indicator
const STATUS_ORDER = [
  "draft",
  "sent",
  "approved",
  "received",
  "in_progress",
  "waiting_for_parts",
  "ready",
  "completed"
];

export default function EstimateDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [statusData, setStatusData] = useState<EstimateStatus | null>(null);
  const [photos, setPhotos] = useState<GroupedPhotos>({ damage: [], progress: [], completed: [] });
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    // Check if customer is logged in
    const customerData = localStorage.getItem("customer");
    if (!customerData) {
      router.push("/customer/login");
      return;
    }

    try {
      const customer = JSON.parse(customerData);
      setCustomerId(customer.id);
      fetchStatus(customer.id);
      fetchPhotos(customer.id);
      fetchDamageMarkers();
    } catch {
      router.push("/customer/login");
    }
  }, [router, id]);

  const fetchStatus = async (customerId: string) => {
    try {
      const response = await fetch(
        `/api/customer/estimates/${id}/status?customerId=${customerId}`
      );
      const data = await response.json();

      if (data.success) {
        setStatusData(data);
      } else {
        setError(data.error || "Failed to load estimate");
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setError("Failed to load estimate status");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (customerId: string) => {
    try {
      const response = await fetch(
        `/api/customer/estimates/${id}/photos?customerId=${customerId}`
      );
      const data = await response.json();

      if (data.success && data.groupedPhotos) {
        setPhotos(data.groupedPhotos);
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
    }
  };

  const fetchDamageMarkers = async () => {
    try {
      const response = await fetch(`/api/damage-annotations?estimateId=${id}`);
      const data = await response.json();
      if (data.success && data.data?.markers) {
        setDamageMarkers(data.data.markers);
      }
    } catch (err) {
      console.error("Error fetching damage markers:", err);
    }
  };

  const getStatusIndex = (status: string) => {
    return STATUS_ORDER.indexOf(status);
  };

  const getStatusColor = (status: string, currentStatus: string) => {
    const statusIndex = getStatusIndex(status);
    const currentIndex = getStatusIndex(currentStatus);

    if (status === "cancelled") {
      return "text-red-500";
    }
    if (statusIndex <= currentIndex) {
      return "text-green-500";
    }
    return "text-gray-300";
  };

  const handlePayment = async (depositOnly: boolean = false) => {
    if (!customerId || !statusData) return;

    setProcessingPayment(true);
    try {
      const amount = depositOnly && statusData.payment.depositRequired
        ? statusData.payment.depositRequired
        : statusData.payment.balanceDue;

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: id,
          customerId,
          amount,
          depositOnly,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate payment");
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !statusData) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/customer/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Repair Status
              </h1>
              <p className="text-sm text-gray-600">
                Estimate #{statusData.estimate.estimateNumber}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {statusData.estimate.vehicle}
                </h2>
                <p className="text-sm text-gray-600">
                  {statusData.estimate.customerName}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusData.currentStatus === "completed"
                    ? "bg-green-100 text-green-800"
                    : statusData.currentStatus === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {statusData.currentStatusLabel}
                </span>
              </div>
            </div>

            {statusData.estimatedCompletion && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Estimated completion: {new Date(statusData.estimatedCompletion).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {["received", "in_progress", "ready", "completed"].map((status, index) => {
                const isActive = getStatusIndex(statusData.currentStatus) >= getStatusIndex(status);
                const isCurrent = statusData.currentStatus === status;

                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? "bg-green-500" : "bg-gray-200"
                    }`}>
                      {isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      isCurrent ? "font-semibold text-blue-600" : "text-gray-600"
                    }`}>
                      {status === "received" && "Received"}
                      {status === "in_progress" && "In Progress"}
                      {status === "ready" && "Ready"}
                      {status === "completed" && "Completed"}
                    </span>
                    {index < 3 && (
                      <div className={`absolute h-1 w-full ${
                        getStatusIndex(statusData.currentStatus) > getStatusIndex(status)
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`} style={{ top: "50%", left: "50%", transform: "translateY(-50%)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        {statusData.payment && statusData.payment.totalAmount > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Payment Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold">${statusData.payment.totalAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-lg font-semibold text-green-600">${statusData.payment.amountPaid.toFixed(2)}</p>
                  </div>
                </div>

                {/* Balance Due */}
                {statusData.payment.balanceDue > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Balance Due</p>
                        <p className="text-2xl font-bold text-gray-900">${statusData.payment.balanceDue.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* Show deposit button if deposit required and not paid */}
                        {statusData.payment.depositRequired && !statusData.payment.depositPaid && (
                          <Button
                            onClick={() => handlePayment(true)}
                            disabled={processingPayment}
                            variant="outline"
                            size="sm"
                          >
                            {processingPayment ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            Pay Deposit (${statusData.payment.depositRequired.toFixed(2)})
                          </Button>
                        )}
                        <Button
                          onClick={() => handlePayment(false)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paid in Full */}
                {statusData.payment.paymentStatus === "paid" && (
                  <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Paid in Full</p>
                      <p className="text-sm text-green-600">Thank you for your payment!</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.timeline.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No status updates yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {statusData.timeline.slice().reverse().map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-blue-500" : "bg-gray-300"
                      }`} />
                      {index < statusData.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          getStatusColor(entry.status, statusData.currentStatus)
                        }`}>
                          {entry.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3D Damage Visualization */}
        {damageMarkers.length > 0 && statusData.estimate.vehicleMake && statusData.estimate.vehicleModel && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="h-5 w-5" />
                3D Damage Visualization
                <span className="ml-auto text-sm font-normal text-gray-500">
                  {damageMarkers.length} {damageMarkers.length === 1 ? 'Marker' : 'Markers'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Interactive 3D View:</strong> Use your mouse to rotate, zoom, and pan around the vehicle to see damage locations.
                </p>
              </div>
              <VehicleViewer
                vehicleType={getVehicleType(statusData.estimate.vehicleMake, statusData.estimate.vehicleModel)}
                mode="view"
                estimateId={id}
              />
            </CardContent>
          </Card>
        )}

        {/* Photos Gallery */}
        {(photos.damage.length > 0 || photos.progress.length > 0 || photos.completed.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Repair Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Damage Photos */}
                {photos.damage.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Damage Photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.damage.map((photo) => (
                        <div key={photo.id} className="rounded-lg overflow-hidden border">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Damage photo"}
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90"
                            onClick={() => window.open(photo.url, '_blank')}
                          />
                          {photo.caption && (
                            <p className="text-xs p-2 bg-gray-50 truncate">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Photos */}
                {photos.progress.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Repair Progress</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.progress.map((photo) => (
                        <div key={photo.id} className="rounded-lg overflow-hidden border">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Progress photo"}
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90"
                            onClick={() => window.open(photo.url, '_blank')}
                          />
                          {photo.caption && (
                            <p className="text-xs p-2 bg-gray-50 truncate">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Photos */}
                {photos.completed.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Completed Work</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.completed.map((photo) => (
                        <div key={photo.id} className="rounded-lg overflow-hidden border">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Completed photo"}
                            className="w-full h-32 object-cover cursor-pointer hover:opacity-90"
                            onClick={() => window.open(photo.url, '_blank')}
                          />
                          {photo.caption && (
                            <p className="text-xs p-2 bg-gray-50 truncate">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
