"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  suggestion: string;
  rejectionRisk: "high" | "medium" | "low";
  category: string;
}

interface ValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  qualityScore: number;
  rejectionRisk: "high" | "medium" | "low";
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

interface ValidationReportProps {
  validation: ValidationResult;
  onClose?: () => void;
  onProceed?: () => void;
}

export default function ValidationReport({
  validation,
  onClose,
  onProceed,
}: ValidationReportProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["error"])
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group issues by severity
  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const infos = validation.issues.filter((i) => i.severity === "info");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRiskColor = (risk: string) => {
    if (risk === "high") return "text-red-600 bg-red-50 border-red-200";
    if (risk === "medium") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getRiskLabel = (risk: string) => {
    if (risk === "high") return "High Risk of Rejection";
    if (risk === "medium") return "Medium Rejection Risk";
    return "Low Rejection Risk";
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "error") return <XCircle className="h-4 w-4 text-red-500" />;
    if (severity === "warning")
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const renderIssueList = (issues: ValidationIssue[], severity: string) => {
    if (issues.length === 0) return null;

    const isExpanded = expandedCategories.has(severity);

    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleCategory(severity)}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {getSeverityIcon(severity)}
            <span className="font-medium capitalize">
              {severity}s ({issues.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t bg-gray-50 p-3 space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 bg-white rounded-lg border shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityIcon(issue.severity)}
                      <span className="font-medium text-sm">{issue.message}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{issue.field}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      issue.rejectionRisk === "high"
                        ? "bg-red-100 text-red-700"
                        : issue.rejectionRisk === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {issue.rejectionRisk} risk
                  </span>
                </div>
                <div className="ml-6 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <span className="font-medium">💡 Suggestion:</span> {issue.suggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Pre-Submission Validation Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Score & Risk */}
        <div className="grid grid-cols-2 gap-4">
          {/* Quality Score */}
          <div className={`p-4 border-2 rounded-lg ${getScoreColor(validation.qualityScore)}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Quality Score</span>
            </div>
            <div className="text-4xl font-bold">
              {validation.qualityScore}
              <span className="text-2xl">/100</span>
            </div>
            <p className="text-sm mt-2 opacity-80">
              {validation.qualityScore >= 90
                ? "Excellent - Ready to submit"
                : validation.qualityScore >= 75
                ? "Good - Minor improvements recommended"
                : validation.qualityScore >= 50
                ? "Fair - Address warnings before submitting"
                : "Needs work - Fix errors before submitting"}
            </p>
          </div>

          {/* Rejection Risk */}
          <div className={`p-4 border-2 rounded-lg ${getRiskColor(validation.rejectionRisk)}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Rejection Risk</span>
            </div>
            <div className="text-2xl font-bold mb-2">
              {getRiskLabel(validation.rejectionRisk)}
            </div>
            <p className="text-sm opacity-80">
              {validation.rejectionRisk === "high"
                ? "High probability of rejection - fix critical issues"
                : validation.rejectionRisk === "medium"
                ? "Some risk - address warnings to improve chances"
                : "Minimal risk - estimate meets insurance standards"}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {validation.summary.errors}
            </div>
            <div className="text-sm text-gray-600">Critical Errors</div>
            <div className="text-xs text-gray-500 mt-1">Must fix</div>
          </div>
          <div className="text-center border-x">
            <div className="text-2xl font-bold text-yellow-600">
              {validation.summary.warnings}
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
            <div className="text-xs text-gray-500 mt-1">Should fix</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {validation.summary.infos}
            </div>
            <div className="text-sm text-gray-600">Suggestions</div>
            <div className="text-xs text-gray-500 mt-1">Optional</div>
          </div>
        </div>

        {/* Cannot Submit Warning */}
        {!validation.canSubmit && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-700 mb-1">
                  Submission Blocked
                </h3>
                <p className="text-sm text-red-600">
                  This estimate cannot be submitted to insurance until all critical
                  errors are resolved. Fix the errors below and validate again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Can Submit with Warnings */}
        {validation.canSubmit && validation.summary.warnings > 0 && (
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-700 mb-1">
                  Ready to Submit (with warnings)
                </h3>
                <p className="text-sm text-yellow-600">
                  You can submit this estimate, but addressing the {validation.summary.warnings} warning
                  {validation.summary.warnings !== 1 ? "s" : ""} below will reduce the chance of questions or
                  delays from the insurance adjuster.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Clear */}
        {validation.canSubmit && validation.summary.warnings === 0 && validation.summary.errors === 0 && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-700 mb-1">
                  Ready to Submit
                </h3>
                <p className="text-sm text-green-600">
                  This estimate meets all insurance requirements and has a high probability
                  of smooth approval. You're good to go!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Issues Lists */}
        <div className="space-y-3">
          {errors.length > 0 && renderIssueList(errors, "error")}
          {warnings.length > 0 && renderIssueList(warnings, "warning")}
          {infos.length > 0 && renderIssueList(infos, "info")}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Go Back & Fix Issues
            </Button>
          )}
          {onProceed && (
            <Button
              onClick={onProceed}
              disabled={!validation.canSubmit}
              className={`flex-1 ${
                validation.canSubmit
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {validation.canSubmit ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Proceed to Submit
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cannot Submit (Fix Errors)
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">💡 Validation Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Errors</strong> (red) must be fixed before submission</li>
            <li><strong>Warnings</strong> (yellow) should be addressed to reduce rejection risk</li>
            <li><strong>Info</strong> (blue) items are suggestions for best practices</li>
            <li>Higher quality scores lead to faster approvals and fewer questions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
