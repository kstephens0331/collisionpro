"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Edit,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";
import DRPEnrollmentForm from "@/components/drp/DRPEnrollmentForm";
import DRPComplianceCard from "@/components/drp/DRPComplianceCard";
import {
  DRPProgram,
  InsuranceCarrier,
  getProgramStatusColor,
  getComplianceStatusColor,
  calculateComplianceScore,
  formatCurrency,
} from "@/lib/drp-management";

// Mock data
const mockCarriers: InsuranceCarrier[] = [
  {
    id: "carrier-1",
    name: "State Farm",
    abbreviation: "SF",
    claimsPhone: "1-800-STATE-FARM",
    isActive: true,
  },
  {
    id: "carrier-2",
    name: "GEICO",
    abbreviation: "GEICO",
    claimsPhone: "1-800-841-3000",
    isActive: true,
  },
  {
    id: "carrier-3",
    name: "Progressive",
    abbreviation: "PROG",
    claimsPhone: "1-800-274-4499",
    isActive: true,
  },
  {
    id: "carrier-4",
    name: "Allstate",
    abbreviation: "ALL",
    claimsPhone: "1-800-255-7828",
    isActive: true,
  },
];

const mockPrograms: DRPProgram[] = [
  {
    id: "prog-1",
    shopId: "shop-1",
    carrierId: "carrier-1",
    carrierName: "State Farm",
    programName: "Select Service Program",
    enrollmentDate: new Date("2022-01-15"),
    status: "active",
    tierLevel: "Gold",
    minCSIScore: 90.0,
    maxCycleTime: 7,
    requiresPreApproval: false,
    requiresPhotos: true,
    requiresSupplement: false,
    certificationRequired: ["I-CAR Gold Class", "ASE Collision Repair"],
    laborRate: 55.0,
    paintRate: 60.0,
    paintMaterialsRate: 30.0,
    discountPercentage: 0,
    paymentTerms: "Net 30",
    minMonthlyJobs: 15,
    minAnnualJobs: 180,
    currentCSIScore: 92.5,
    avgCycleTime: 6.2,
    completedJobsThisMonth: 18,
    completedJobsThisYear: 145,
    accountManagerName: "Sarah Johnson",
    accountManagerEmail: "sarah.johnson@statefarm.com",
    accountManagerPhone: "(555) 123-4567",
    nextAuditDate: new Date("2025-06-15"),
    complianceStatus: "compliant",
  },
  {
    id: "prog-2",
    shopId: "shop-1",
    carrierId: "carrier-2",
    carrierName: "GEICO",
    programName: "Auto Repair Xpress",
    enrollmentDate: new Date("2021-06-01"),
    status: "active",
    tierLevel: "Premier",
    minCSIScore: 88.0,
    maxCycleTime: 10,
    requiresPreApproval: true,
    requiresPhotos: true,
    requiresSupplement: true,
    certificationRequired: ["I-CAR Platinum"],
    laborRate: 52.0,
    paintRate: 58.0,
    paintMaterialsRate: 28.0,
    discountPercentage: 5,
    paymentTerms: "Net 45",
    minMonthlyJobs: 10,
    minAnnualJobs: 120,
    currentCSIScore: 85.2,
    avgCycleTime: 8.5,
    completedJobsThisMonth: 8,
    completedJobsThisYear: 98,
    accountManagerName: "Mike Chen",
    accountManagerEmail: "mike.chen@geico.com",
    accountManagerPhone: "(555) 234-5678",
    nextAuditDate: new Date("2025-03-20"),
    complianceStatus: "warning",
  },
  {
    id: "prog-3",
    shopId: "shop-1",
    carrierId: "carrier-3",
    carrierName: "Progressive",
    programName: "ProService Network",
    enrollmentDate: new Date("2023-03-10"),
    status: "pending",
    tierLevel: "Silver",
    minCSIScore: 85.0,
    maxCycleTime: 12,
    requiresPreApproval: false,
    requiresPhotos: true,
    requiresSupplement: false,
    laborRate: 50.0,
    paintRate: 55.0,
    paintMaterialsRate: 25.0,
    paymentTerms: "Net 30",
    minMonthlyJobs: 8,
    completedJobsThisMonth: 0,
    completedJobsThisYear: 0,
    accountManagerName: "Jessica Lee",
    accountManagerEmail: "jessica.lee@progressive.com",
    accountManagerPhone: "(555) 345-6789",
    complianceStatus: "compliant",
  },
];

export default function DRPContent() {
  const [programs, setPrograms] = useState<DRPProgram[]>(mockPrograms);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<DRPProgram | undefined>();
  const [selectedProgram, setSelectedProgram] = useState<DRPProgram | null>(null);

  const handleAddProgram = () => {
    setEditingProgram(undefined);
    setShowForm(true);
  };

  const handleEditProgram = (program: DRPProgram) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleSaveProgram = (data: Partial<DRPProgram>) => {
    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id ? { ...p, ...data } : p
        )
      );
    } else {
      const newProgram: DRPProgram = {
        id: `prog-${Date.now()}`,
        ...data,
      } as DRPProgram;
      setPrograms((prev) => [...prev, newProgram]);
    }
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProgram(undefined);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    console.log("Acknowledging alert:", alertId);
    // In production, update via API
  };

  const handleCompleteRequirement = (requirementId: string) => {
    console.log("Completing requirement:", requirementId);
    // In production, update via API
  };

  // Calculate statistics
  const activePrograms = programs.filter((p) => p.status === "active").length;
  const totalMonthlyRevenue = programs
    .filter((p) => p.status === "active")
    .reduce((sum, p) => {
      const avgJobRevenue = 2500; // Estimate
      return sum + p.completedJobsThisMonth * avgJobRevenue;
    }, 0);
  const avgComplianceScore =
    programs.reduce((sum, p) => sum + calculateComplianceScore(p), 0) /
    programs.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {showForm ? (
        <DRPEnrollmentForm
          program={editingProgram}
          carriers={mockCarriers}
          shopId="shop-1"
          onSave={handleSaveProgram}
          onCancel={handleCancel}
        />
      ) : selectedProgram ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {selectedProgram.carrierName} - {selectedProgram.programName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getProgramStatusColor(selectedProgram.status)}>
                  {selectedProgram.status.toUpperCase()}
                </Badge>
                {selectedProgram.tierLevel && (
                  <Badge variant="outline">{selectedProgram.tierLevel}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleEditProgram(selectedProgram)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Program
              </Button>
              <Button variant="outline" onClick={() => setSelectedProgram(null)}>
                Back to All Programs
              </Button>
            </div>
          </div>

          <DRPComplianceCard
            program={selectedProgram}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onCompleteRequirement={handleCompleteRequirement}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6" />
                DRP Programs
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage insurance carrier relationships and compliance
              </p>
            </div>
            <Button onClick={handleAddProgram}>
              <Plus className="h-4 w-4 mr-2" />
              Enroll in New Program
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Programs</p>
                    <p className="text-2xl font-bold">{activePrograms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly DRP Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totalMonthlyRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Compliance</p>
                    <p className="text-2xl font-bold">
                      {avgComplianceScore.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Programs List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your DRP Programs ({programs.length})</h3>

            {programs.map((program) => {
              const complianceScore = calculateComplianceScore(program);

              return (
                <Card
                  key={program.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedProgram(program)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">
                            {program.carrierName}
                          </h4>
                          <Badge className={getProgramStatusColor(program.status)}>
                            {program.status.toUpperCase()}
                          </Badge>
                          <Badge
                            className={getComplianceStatusColor(
                              program.complianceStatus
                            )}
                          >
                            {program.complianceStatus.toUpperCase()}
                          </Badge>
                          {program.tierLevel && (
                            <Badge variant="outline">{program.tierLevel}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {program.programName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Compliance Score</p>
                        <p
                          className={`text-2xl font-bold ${
                            complianceScore >= 90
                              ? "text-green-600"
                              : complianceScore >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {complianceScore}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600">CSI Score</p>
                        <p className="text-sm font-semibold">
                          {program.currentCSIScore?.toFixed(1) || "N/A"}
                          {program.minCSIScore && (
                            <span className="text-gray-400">
                              {" "}
                              / {program.minCSIScore.toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Cycle Time</p>
                        <p className="text-sm font-semibold">
                          {program.avgCycleTime?.toFixed(1) || "N/A"} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">This Month</p>
                        <p className="text-sm font-semibold">
                          {program.completedJobsThisMonth} jobs
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">This Year</p>
                        <p className="text-sm font-semibold">
                          {program.completedJobsThisYear} jobs
                        </p>
                      </div>
                    </div>

                    {program.accountManagerName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>
                          Account Manager: {program.accountManagerName}
                        </span>
                      </div>
                    )}

                    {program.nextAuditDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Next Audit: {program.nextAuditDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
