"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Search,
  Eye,
  Send,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface Estimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/estimates");
      const data = await response.json();
      if (data.success) {
        setEstimates(data.estimates);
      }
    } catch (error) {
      console.error("Error fetching estimates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEstimates = estimates.filter((est) =>
    est.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    est.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${est.vehicleYear} ${est.vehicleMake} ${est.vehicleModel}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
      sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
      approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
      declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: XCircle },
      in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage collision repair estimates
          </p>
        </div>
        <Link href="/dashboard/estimates/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by customer, estimate number, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estimates List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-pulse">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading estimates...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredEstimates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No estimates found" : "No estimates yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Create your first estimate to get started"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/estimates/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEstimates.map((estimate) => (
            <Card key={estimate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {estimate.estimateNumber}
                      </h3>
                      {getStatusBadge(estimate.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{estimate.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {estimate.vehicleYear} {estimate.vehicleMake} {estimate.vehicleModel}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-gray-900">
                          ${estimate.total.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-medium text-gray-900">
                          {new Date(estimate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/dashboard/estimates/${estimate.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    {estimate.status === "draft" && (
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
