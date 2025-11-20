"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Phone,
  Mail,
  Car,
  FileText,
  Plus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  estimateCount: number;
  totalSpent: number;
  lastVisit: string;
  vehicles: {
    year: number;
    make: string;
    model: string;
  }[];
}

export default function CustomersContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const SHOP_ID = "shop_demo";

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?shopId=${SHOP_ID}`);
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-600">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer database and history
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => {
                    const lastVisit = new Date(c.lastVisit);
                    const thisMonth = new Date();
                    return lastVisit.getMonth() === thisMonth.getMonth() &&
                           lastVisit.getFullYear() === thisMonth.getFullYear();
                  }).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Per Customer</p>
                <p className="text-2xl font-bold">
                  ${customers.length > 0
                    ? Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toLocaleString()
                    : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery
                ? "No customers found matching your search."
                : "No customers yet. Create an estimate to add your first customer."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {customer.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                            {customer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vehicles */}
                      {customer.vehicles && customer.vehicles.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {customer.vehicles.map((vehicle, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              <Car className="h-3 w-3" />
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">
                        {customer.estimateCount} estimate{customer.estimateCount !== 1 ? "s" : ""}
                      </p>
                      <p className="font-semibold text-gray-900">
                        ${customer.totalSpent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Last: {new Date(customer.lastVisit).toLocaleDateString()}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
