"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, FileText, User, LogOut, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface Estimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function DashboardContent() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if customer is logged in
    const customerData = localStorage.getItem("customer");
    if (!customerData) {
      router.push("/customer/login");
      return;
    }

    try {
      const parsedCustomer = JSON.parse(customerData);
      setCustomer(parsedCustomer);
      fetchEstimates(parsedCustomer.id);
    } catch (error) {
      console.error("Error parsing customer data:", error);
      router.push("/customer/login");
    }
  }, [router]);

  const fetchEstimates = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customer/estimates?customerId=${customerId}`);
      const data = await response.json();

      if (data.success) {
        setEstimates(data.estimates || []);
      }
    } catch (error) {
      console.error("Error fetching estimates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customer");
    router.push("/customer/login");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {customer?.firstName}!
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Estimates</p>
                  <p className="text-3xl font-bold text-gray-900">{estimates.length}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {estimates.filter(e => e.status === "in_progress").length}
                  </p>
                </div>
                <Car className="h-10 w-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {estimates.filter(e => e.status === "completed").length}
                  </p>
                </div>
                <User className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estimates List */}
        <Card>
          <CardHeader>
            <CardTitle>My Repair Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            {estimates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No estimates found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Your repair estimates will appear here once created by your shop
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {estimates.map((estimate) => (
                  <div
                    key={estimate.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/customer/estimates/${estimate.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {estimate.vehicleYear} {estimate.vehicleMake} {estimate.vehicleModel}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(estimate.status)}`}>
                            {estimate.status.replace("_", " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Estimate #{estimate.estimateNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(estimate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${estimate.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
