"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  FileEdit,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface EstimateChange {
  id: string;
  field: string;
  originalValue: any;
  newValue: any;
  reason?: string;
  category: string;
  changeType: string;
  dollarImpact: number;
}

interface InsuranceStatusData {
  submitted: boolean;
  claimNumber?: string;
  company?: string;
  platform?: string;
  platformName?: string;
  externalId?: string;
  status?: string;
  submittedAt?: string;
  approvedAmount?: number;
  adjuster?: string;
  adjusterNotes?: string;
  changes?: EstimateChange[];
  requiresAction?: boolean;
  lastChecked?: string;
}

interface InsuranceStatusProps {
  estimateId: string;
  onOpenSubmit?: () => void;
  onOpenSupplement?: () => void;
}

export default function InsuranceStatus({
  estimateId,
  onOpenSubmit,
  onOpenSupplement,
}: InsuranceStatusProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<InsuranceStatusData | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, [estimateId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/insurance/status?estimateId=${estimateId}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "approved_with_changes":
        return <FileEdit className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "supplement_requested":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "in_review":
      case "received":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-green-200 text-green-700";
      case "approved_with_changes":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "rejected":
        return "bg-red-50 border-red-200 text-red-700";
      case "supplement_requested":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "in_review":
      case "received":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const formatStatus = (status?: string) => {
    if (!status) return "Unknown";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading insurance status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not submitted yet
  if (!data?.submitted) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center">
            <Shield className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 mb-4">
              This estimate has not been submitted to insurance yet.
            </p>
            {onOpenSubmit && (
              <Button onClick={onOpenSubmit} className="bg-blue-600 hover:bg-blue-700">
                <Shield className="h-4 w-4 mr-2" />
                Submit to Insurance
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Insurance Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className={`p-3 rounded-lg border ${getStatusColor(data.status)}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon(data.status)}
            <span className="font-medium">{formatStatus(data.status)}</span>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Insurance</p>
            <p className="font-medium">{data.company}</p>
          </div>
          <div>
            <p className="text-gray-500">Platform</p>
            <p className="font-medium">{data.platformName}</p>
          </div>
          <div>
            <p className="text-gray-500">Claim #</p>
            <p className="font-mono text-xs">{data.claimNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p>{data.submittedAt ? new Date(data.submittedAt).toLocaleDateString() : "-"}</p>
          </div>
        </div>

        {/* Approved Amount */}
        {data.approvedAmount !== undefined && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Approved Amount</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              ${data.approvedAmount.toLocaleString()}
            </p>
          </div>
        )}

        {/* Adjuster Notes */}
        {data.adjusterNotes && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Adjuster Notes</span>
            </div>
            <p className="text-sm text-gray-700">{data.adjusterNotes}</p>
            {data.adjuster && (
              <p className="text-xs text-gray-500 mt-1">- {data.adjuster}</p>
            )}
          </div>
        )}

        {/* Changes */}
        {data.changes && data.changes.length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => setShowChanges(!showChanges)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">
                  {data.changes.length} Change{data.changes.length !== 1 ? "s" : ""}
                </span>
              </div>
              {showChanges ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showChanges && (
              <div className="border-t p-3 space-y-2">
                {data.changes.map((change) => (
                  <div
                    key={change.id}
                    className="p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {change.field}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          change.dollarImpact < 0
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {change.dollarImpact >= 0 ? "+" : ""}
                        ${change.dollarImpact}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-1">
                      <span className="line-through">{change.originalValue}</span>
                      {" → "}
                      <span className="text-gray-900">{change.newValue}</span>
                    </div>
                    {change.reason && (
                      <p className="text-xs text-gray-500 mt-1">
                        {change.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Required */}
        {data.requiresAction && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Action Required</span>
            </div>
            <div className="flex gap-2">
              {data.status === "supplement_requested" && onOpenSupplement && (
                <Button
                  size="sm"
                  onClick={onOpenSupplement}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Create Supplement
                </Button>
              )}
              {data.status === "approved_with_changes" && (
                <Button size="sm" variant="outline">
                  Review Changes
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Last Checked */}
        {data.lastChecked && (
          <p className="text-xs text-gray-400 text-right">
            Last updated: {new Date(data.lastChecked).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
