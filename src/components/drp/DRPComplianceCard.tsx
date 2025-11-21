"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Bell,
} from "lucide-react";
import {
  DRPProgram,
  DRPAlert,
  DRPRequirement,
  calculateComplianceScore,
  getComplianceStatus,
  getComplianceStatusColor,
  getAlertSeverityColor,
  getRequirementStatusColor,
  isRequirementOverdue,
  daysUntilDue,
  formatPercentage,
  generateComplianceAlerts,
} from "@/lib/drp-management";

interface DRPComplianceCardProps {
  program: DRPProgram;
  onAcknowledgeAlert?: (alertId: string) => void;
  onCompleteRequirement?: (requirementId: string) => void;
}

export default function DRPComplianceCard({
  program,
  onAcknowledgeAlert,
  onCompleteRequirement,
}: DRPComplianceCardProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllRequirements, setShowAllRequirements] = useState(false);

  // Calculate compliance score
  const complianceScore = calculateComplianceScore(program);
  const complianceStatus = getComplianceStatus(complianceScore);

  // Generate alerts
  const alerts = program.alerts || generateComplianceAlerts(program);
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");

  // Requirements
  const requirements = program.requirements || [];
  const overdueRequirements = requirements.filter(
    (r) => r.status === "overdue" || isRequirementOverdue(r)
  );
  const pendingRequirements = requirements.filter(
    (r) => r.status === "pending" || r.status === "in-progress"
  );

  // Metrics comparison
  const csiStatus = program.minCSIScore && program.currentCSIScore
    ? program.currentCSIScore >= program.minCSIScore
    : null;
  const cycleTimeStatus = program.maxCycleTime && program.avgCycleTime
    ? program.avgCycleTime <= program.maxCycleTime
    : null;
  const volumeStatus = program.minMonthlyJobs
    ? program.completedJobsThisMonth >= program.minMonthlyJobs
    : null;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricIcon = (status: boolean | null) => {
    if (status === null) return null;
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          DRP Compliance Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Score */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Compliance Score</p>
              <div className="flex items-end gap-3">
                <p className={`text-5xl font-bold ${getScoreColor(complianceScore)}`}>
                  {complianceScore}
                </p>
                <p className="text-2xl text-gray-400 mb-1">/ 100</p>
              </div>
            </div>
            <Badge className={getComplianceStatusColor(complianceStatus)}>
              {complianceStatus.toUpperCase()}
            </Badge>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                complianceScore >= 90
                  ? "bg-green-500"
                  : complianceScore >= 70
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${complianceScore}%` }}
            />
          </div>

          <p className="text-sm text-gray-600">
            {complianceScore >= 90
              ? "Excellent! Your shop is fully compliant with all DRP requirements."
              : complianceScore >= 70
              ? "Good standing, but some areas need attention."
              : "Immediate action required to maintain DRP status."}
          </p>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="font-semibold mb-3">Key Performance Indicators</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CSI Score */}
            {program.minCSIScore && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">CSI Score</p>
                  {getMetricIcon(csiStatus)}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">
                    {program.currentCSIScore?.toFixed(1) || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    / {program.minCSIScore.toFixed(1)}
                  </p>
                </div>
                {csiStatus === false && (
                  <p className="text-xs text-red-600 mt-1">
                    {(program.minCSIScore - (program.currentCSIScore || 0)).toFixed(1)} points below minimum
                  </p>
                )}
              </div>
            )}

            {/* Cycle Time */}
            {program.maxCycleTime && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Avg Cycle Time</p>
                  {getMetricIcon(cycleTimeStatus)}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">
                    {program.avgCycleTime?.toFixed(1) || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    / {program.maxCycleTime} days
                  </p>
                </div>
                {cycleTimeStatus === false && (
                  <p className="text-xs text-red-600 mt-1">
                    {((program.avgCycleTime || 0) - program.maxCycleTime).toFixed(1)} days over limit
                  </p>
                )}
              </div>
            )}

            {/* Volume */}
            {program.minMonthlyJobs && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Monthly Volume</p>
                  {getMetricIcon(volumeStatus)}
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold">
                    {program.completedJobsThisMonth}
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    / {program.minMonthlyJobs} jobs
                  </p>
                </div>
                {volumeStatus === false && (
                  <p className="text-xs text-red-600 mt-1">
                    {program.minMonthlyJobs - program.completedJobsThisMonth} jobs short
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Active Alerts ({activeAlerts.length})
                {criticalAlerts.length > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {criticalAlerts.length} Critical
                  </Badge>
                )}
              </h4>
              {activeAlerts.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllAlerts(!showAllAlerts)}
                >
                  {showAllAlerts ? "Show Less" : "Show All"}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {(showAllAlerts ? activeAlerts : activeAlerts.slice(0, 3)).map(
                (alert) => (
                  <div
                    key={alert.id}
                    className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h5 className="font-semibold text-red-900">
                          {alert.title}
                        </h5>
                      </div>
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-red-800 mb-2">{alert.message}</p>
                    {alert.actionRequired && (
                      <p className="text-sm text-red-700 mb-3">
                        <strong>Action Required:</strong> {alert.actionRequired}
                      </p>
                    )}
                    {alert.dueDate && (
                      <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {alert.dueDate.toLocaleDateString()}
                      </p>
                    )}
                    {onAcknowledgeAlert && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Overdue Requirements */}
        {overdueRequirements.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Requirements ({overdueRequirements.length})
            </h4>
            <div className="space-y-2">
              {overdueRequirements.map((req) => (
                <div
                  key={req.id}
                  className="border border-red-200 bg-red-50 p-3 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-red-900">
                        {req.requirement}
                      </p>
                      {req.description && (
                        <p className="text-sm text-red-700">{req.description}</p>
                      )}
                    </div>
                    <Badge className={getRequirementStatusColor(req.status)}>
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>
                  {req.dueDate && (
                    <p className="text-xs text-red-600 mb-2">
                      Due: {req.dueDate.toLocaleDateString()} (
                      {Math.abs(daysUntilDue(req.dueDate))} days overdue)
                    </p>
                  )}
                  {onCompleteRequirement && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteRequirement(req.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requirements */}
        {pendingRequirements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">
                Pending Requirements ({pendingRequirements.length})
              </h4>
              {pendingRequirements.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllRequirements(!showAllRequirements)}
                >
                  {showAllRequirements ? "Show Less" : "Show All"}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllRequirements
                ? pendingRequirements
                : pendingRequirements.slice(0, 5)
              ).map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium">{req.requirement}</p>
                    <Badge className={getRequirementStatusColor(req.status)}>
                      {req.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  {req.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {req.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {req.category && (
                        <span className="mr-3">Category: {req.category}</span>
                      )}
                      {req.dueDate && (
                        <span>
                          Due: {req.dueDate.toLocaleDateString()} (
                          {daysUntilDue(req.dueDate)} days)
                        </span>
                      )}
                    </div>
                    {onCompleteRequirement && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCompleteRequirement(req.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Clear */}
        {activeAlerts.length === 0 &&
          overdueRequirements.length === 0 &&
          pendingRequirements.length === 0 && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-900 mb-2">
                All Requirements Met!
              </h4>
              <p className="text-sm text-green-700">
                Your shop is in full compliance with all DRP program requirements.
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
