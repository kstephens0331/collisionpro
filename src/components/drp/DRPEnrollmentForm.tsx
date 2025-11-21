"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  DRPProgram,
  InsuranceCarrier,
  DRP_TIERS,
  CERTIFICATIONS,
  PAYMENT_TERMS,
} from "@/lib/drp-management";

interface DRPEnrollmentFormProps {
  program?: DRPProgram;
  carriers: InsuranceCarrier[];
  shopId: string;
  onSave: (data: Partial<DRPProgram>) => void;
  onCancel: () => void;
}

export default function DRPEnrollmentForm({
  program,
  carriers,
  shopId,
  onSave,
  onCancel,
}: DRPEnrollmentFormProps) {
  const [formData, setFormData] = useState<Partial<DRPProgram>>({
    shopId,
    carrierId: program?.carrierId || "",
    programName: program?.programName || "",
    enrollmentDate: program?.enrollmentDate || new Date(),
    status: program?.status || "active",
    tierLevel: program?.tierLevel || "",

    // Requirements
    minCSIScore: program?.minCSIScore || undefined,
    maxCycleTime: program?.maxCycleTime || undefined,
    requiresPreApproval: program?.requiresPreApproval || false,
    requiresPhotos: program?.requiresPhotos || true,
    requiresSupplement: program?.requiresSupplement || false,
    certificationRequired: program?.certificationRequired || [],

    // Financial Terms
    laborRate: program?.laborRate || undefined,
    paintRate: program?.paintRate || undefined,
    paintMaterialsRate: program?.paintMaterialsRate || undefined,
    discountPercentage: program?.discountPercentage || 0,
    paymentTerms: program?.paymentTerms || "Net 30",

    // Volume Requirements
    minMonthlyJobs: program?.minMonthlyJobs || undefined,
    minAnnualJobs: program?.minAnnualJobs || undefined,

    // Contacts
    accountManagerName: program?.accountManagerName || "",
    accountManagerEmail: program?.accountManagerEmail || "",
    accountManagerPhone: program?.accountManagerPhone || "",

    // Compliance
    nextAuditDate: program?.nextAuditDate || undefined,
    complianceStatus: program?.complianceStatus || "compliant",
    complianceNotes: program?.complianceNotes || "",

    completedJobsThisMonth: program?.completedJobsThisMonth || 0,
    completedJobsThisYear: program?.completedJobsThisYear || 0,
  });

  const [newCertification, setNewCertification] = useState("");

  const handleChange = (field: keyof DRPProgram, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCertification = () => {
    if (
      newCertification.trim() &&
      !formData.certificationRequired?.includes(newCertification.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        certificationRequired: [
          ...(prev.certificationRequired || []),
          newCertification.trim(),
        ],
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificationRequired: (prev.certificationRequired || []).filter(
        (c) => c !== cert
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {program ? "Edit DRP Program" : "Enroll in DRP Program"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Program Information */}
          <div>
            <h3 className="font-semibold mb-3">Program Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Insurance Carrier *
                </label>
                <select
                  required
                  value={formData.carrierId}
                  onChange={(e) => handleChange("carrierId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a carrier...</option>
                  {carriers
                    .filter((c) => c.isActive)
                    .map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Program Name *
                </label>
                <Input
                  required
                  value={formData.programName}
                  onChange={(e) => handleChange("programName", e.target.value)}
                  placeholder="Select Service Program"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enrollment Date *
                </label>
                <Input
                  required
                  type="date"
                  value={
                    formData.enrollmentDate instanceof Date
                      ? formData.enrollmentDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange("enrollmentDate", new Date(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tier Level
                </label>
                <select
                  value={formData.tierLevel}
                  onChange={(e) => handleChange("tierLevel", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select tier...</option>
                  {DRP_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    handleChange("status", e.target.value as DRPProgram["status"])
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Program Requirements */}
          <div>
            <h3 className="font-semibold mb-3">Program Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Minimum CSI Score
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.minCSIScore || ""}
                  onChange={(e) =>
                    handleChange(
                      "minCSIScore",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="90.0"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Max Cycle Time (days)
                </label>
                <Input
                  type="number"
                  value={formData.maxCycleTime || ""}
                  onChange={(e) =>
                    handleChange(
                      "maxCycleTime",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="7"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresPreApproval}
                  onChange={(e) =>
                    handleChange("requiresPreApproval", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">
                  Requires Pre-Approval
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresPhotos}
                  onChange={(e) =>
                    handleChange("requiresPhotos", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Requires Photos</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresSupplement}
                  onChange={(e) =>
                    handleChange("requiresSupplement", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">
                  Requires Supplement Authorization
                </label>
              </div>
            </div>

            {/* Certifications */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">
                Required Certifications
              </label>
              <div className="flex gap-2 mb-3">
                <select
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select certification...</option>
                  {CERTIFICATIONS.map((cert) => (
                    <option key={cert} value={cert}>
                      {cert}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={addCertification} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certificationRequired?.map((cert, idx) => (
                  <Badge key={idx} className="flex items-center gap-1">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div>
            <h3 className="font-semibold mb-3">Financial Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Labor Rate ($/hr)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.laborRate || ""}
                  onChange={(e) =>
                    handleChange(
                      "laborRate",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="55.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paint Rate ($/hr)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.paintRate || ""}
                  onChange={(e) =>
                    handleChange(
                      "paintRate",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="60.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paint Materials Rate ($/hr)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.paintMaterialsRate || ""}
                  onChange={(e) =>
                    handleChange(
                      "paintMaterialsRate",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="30.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Discount Percentage (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.discountPercentage || 0}
                  onChange={(e) =>
                    handleChange(
                      "discountPercentage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Payment Terms
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange("paymentTerms", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Volume Requirements */}
          <div>
            <h3 className="font-semibold mb-3">Volume Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Minimum Monthly Jobs
                </label>
                <Input
                  type="number"
                  value={formData.minMonthlyJobs || ""}
                  onChange={(e) =>
                    handleChange(
                      "minMonthlyJobs",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Minimum Annual Jobs
                </label>
                <Input
                  type="number"
                  value={formData.minAnnualJobs || ""}
                  onChange={(e) =>
                    handleChange(
                      "minAnnualJobs",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="120"
                />
              </div>
            </div>
          </div>

          {/* Account Manager */}
          <div>
            <h3 className="font-semibold mb-3">Account Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  value={formData.accountManagerName}
                  onChange={(e) =>
                    handleChange("accountManagerName", e.target.value)
                  }
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.accountManagerEmail}
                  onChange={(e) =>
                    handleChange("accountManagerEmail", e.target.value)
                  }
                  placeholder="john.smith@carrier.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  type="tel"
                  value={formData.accountManagerPhone}
                  onChange={(e) =>
                    handleChange("accountManagerPhone", e.target.value)
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <h3 className="font-semibold mb-3">Compliance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Next Audit Date
                </label>
                <Input
                  type="date"
                  value={
                    formData.nextAuditDate instanceof Date
                      ? formData.nextAuditDate.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleChange(
                      "nextAuditDate",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Compliance Notes
                </label>
                <Input
                  value={formData.complianceNotes}
                  onChange={(e) =>
                    handleChange("complianceNotes", e.target.value)
                  }
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {program ? "Update Program" : "Enroll in Program"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
