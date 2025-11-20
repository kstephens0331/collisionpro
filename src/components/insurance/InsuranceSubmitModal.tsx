"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ValidationReport from "./ValidationReport";
import {
  Shield,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  X,
  Search,
} from "lucide-react";

interface InsuranceCompany {
  id: string;
  name: string;
  platform: string;
  requiresPreAuth: boolean;
  averageReviewDays: number;
  drpPartner: boolean;
}

interface InsuranceSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
  estimateTotal: number;
  onSubmitted?: (result: any) => void;
}

export default function InsuranceSubmitModal({
  isOpen,
  onClose,
  estimateId,
  estimateTotal,
  onSubmitted,
}: InsuranceSubmitModalProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [claimNumber, setClaimNumber] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [deductible, setDeductible] = useState("");
  const [adjusterName, setAdjusterName] = useState("");
  const [adjusterEmail, setAdjusterEmail] = useState("");
  const [adjusterPhone, setAdjusterPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/insurance/status");
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data.allCompanies || []);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setError(null);

    try {
      const company = companies.find((c) => c.id === selectedCompany);

      const response = await fetch("/api/insurance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          platform: company?.platform || "ccc_one",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setValidation(data.data);
        setShowValidation(true);
      } else {
        setError(data.error || "Validation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const company = companies.find((c) => c.id === selectedCompany);

      const response = await fetch("/api/insurance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          platform: company?.platform || "ccc_one",
          claimNumber,
          insuranceCompanyId: selectedCompany,
          policyNumber: policyNumber || undefined,
          dateOfLoss: dateOfLoss || undefined,
          deductible: deductible ? parseFloat(deductible) : undefined,
          adjusterName: adjusterName || undefined,
          adjusterEmail: adjusterEmail || undefined,
          adjusterPhone: adjusterPhone || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onSubmitted?.(data.data);
      } else {
        setError(data.error || "Submission failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Submit to Insurance</h2>
              <p className="text-sm text-gray-500">
                Send estimate for insurance approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Result */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700">
                    Submitted Successfully
                  </h3>
                  <p className="text-sm text-green-600 mt-1">{result.message}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Submission ID:</span>{" "}
                      <span className="font-mono">{result.submissionId}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Status:</span>{" "}
                      <span className="capitalize">{result.status.replace(/_/g, " ")}</span>
                    </p>
                    {result.estimatedReviewTime && (
                      <p>
                        <span className="text-gray-600">Est. Review:</span>{" "}
                        {new Date(result.estimatedReviewTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    className="mt-4"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700">Submission Failed</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Validation Report */}
          {showValidation && validation && !result && (
            <div className="mb-6">
              <ValidationReport
                validation={validation}
                onClose={() => setShowValidation(false)}
                onProceed={() => {
                  setShowValidation(false);
                  // Submit form
                  handleSubmit(new Event('submit') as any);
                }}
              />
            </div>
          )}

          {/* Form */}
          {!result && !showValidation && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Estimate Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estimate Total</span>
                  <span className="text-xl font-bold">
                    ${estimateTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Insurance Company */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Insurance Company *
                </Label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select insurance company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.platform.replace("_", " ").toUpperCase()})
                      {company.drpPartner ? " - DRP Partner" : ""}
                    </option>
                  ))}
                </select>
                {selectedCompanyData && (
                  <p className="text-xs text-gray-500">
                    Avg review time: {selectedCompanyData.averageReviewDays} days
                    {selectedCompanyData.requiresPreAuth && " • Requires pre-authorization"}
                  </p>
                )}
              </div>

              {/* Claim Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Claim Number *
                </Label>
                <Input
                  value={claimNumber}
                  onChange={(e) => setClaimNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., CLM-2024-123456"
                  required
                  className="font-mono"
                />
              </div>

              {/* Policy & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Loss
                  </Label>
                  <Input
                    type="date"
                    value={dateOfLoss}
                    onChange={(e) => setDateOfLoss(e.target.value)}
                  />
                </div>
              </div>

              {/* Deductible */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Deductible
                </Label>
                <Input
                  type="number"
                  value={deductible}
                  onChange={(e) => setDeductible(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Adjuster Info */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Adjuster Information (Optional)
                </h3>
                <div className="space-y-3">
                  <Input
                    value={adjusterName}
                    onChange={(e) => setAdjusterName(e.target.value)}
                    placeholder="Adjuster Name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        value={adjusterEmail}
                        onChange={(e) => setAdjusterEmail(e.target.value)}
                        placeholder="Email"
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="tel"
                        value={adjusterPhone}
                        onChange={(e) => setAdjusterPhone(e.target.value)}
                        placeholder="Phone"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting || validating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidate}
                  disabled={validating || submitting || !selectedCompany}
                  className="flex-1"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Validate Estimate
                    </>
                  )}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || validating || !selectedCompany || !claimNumber}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit to Insurance
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
