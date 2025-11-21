"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  Play,
  Pause,
  X,
} from "lucide-react";
import {
  Technician,
  JobAssignment,
  formatTechnicianName,
  getAssignmentStatusColor,
  formatHours,
  calculateEfficiency,
  findBestTechnicianForJob,
} from "@/lib/technician-management";

interface JobAssignmentCardProps {
  estimateId: string;
  estimateDescription: string;
  requiredSkills: string[];
  estimatedHours: number;
  technicians: Technician[];
  assignments: JobAssignment[];
  onAssign: (technicianId: string, workType: string) => void;
  onUpdateStatus: (assignmentId: string, status: JobAssignment["status"]) => void;
  onUpdateHours: (assignmentId: string, actualHours: number) => void;
}

export default function JobAssignmentCard({
  estimateId,
  estimateDescription,
  requiredSkills,
  estimatedHours,
  technicians,
  assignments,
  onAssign,
  onUpdateStatus,
  onUpdateHours,
}: JobAssignmentCardProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<string>("");
  const [workType, setWorkType] = useState<string>("Body Repair");

  // Find best technician recommendation
  const recommendedTech = findBestTechnicianForJob(
    technicians,
    requiredSkills,
    estimatedHours
  );

  // Calculate total assigned hours
  const totalAssignedHours = assignments.reduce(
    (sum, a) => sum + a.estimatedHours,
    0
  );

  // Calculate progress
  const completedAssignments = assignments.filter(
    (a) => a.status === "completed"
  ).length;
  const progressPercent =
    assignments.length > 0
      ? (completedAssignments / assignments.length) * 100
      : 0;

  const handleAssign = () => {
    if (selectedTechId) {
      onAssign(selectedTechId, workType);
      setShowAssignModal(false);
      setSelectedTechId("");
      setWorkType("Body Repair");
    }
  };

  const getStatusIcon = (status: JobAssignment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in-progress":
        return <Play className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Job Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Overview */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            {estimateDescription}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div>
              <span className="font-medium">Estimated Hours:</span>{" "}
              {formatHours(estimatedHours)}
            </div>
            <div>
              <span className="font-medium">Assigned Hours:</span>{" "}
              {formatHours(totalAssignedHours)}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Required Skills:</span>{" "}
              {requiredSkills.join(", ")}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {assignments.length > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progress</span>
              <span className="text-gray-600">
                {completedAssignments} / {assignments.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        {recommendedTech && assignments.length === 0 && (
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm text-purple-700 mb-2">
                  {formatTechnicianName(recommendedTech)} is the best match for this
                  job based on skills, efficiency, and quality.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTechId(recommendedTech.id);
                    setShowAssignModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Assign {formatTechnicianName(recommendedTech)}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Current Assignments */}
        {assignments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Assigned Technicians</h4>
            {assignments.map((assignment) => {
              const efficiency = assignment.actualHours
                ? calculateEfficiency(
                    assignment.estimatedHours,
                    assignment.actualHours
                  )
                : null;

              return (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {assignment.technicianName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {assignment.workType}
                      </p>
                    </div>
                    <Badge className={getAssignmentStatusColor(assignment.status)}>
                      {getStatusIcon(assignment.status)}
                      <span className="ml-1">
                        {assignment.status.replace("-", " ").toUpperCase()}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Estimated</p>
                      <p className="font-semibold">
                        {formatHours(assignment.estimatedHours)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Actual</p>
                      <p className="font-semibold">
                        {assignment.actualHours
                          ? formatHours(assignment.actualHours)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Efficiency</p>
                      <p className="font-semibold">
                        {efficiency ? `${efficiency.toFixed(0)}%` : "—"}
                      </p>
                    </div>
                  </div>

                  {assignment.status === "in-progress" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(assignment.id, "paused")}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(assignment.id, "completed")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  )}

                  {assignment.status === "paused" && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(assignment.id, "in-progress")}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}

                  {assignment.status === "assigned" && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(assignment.id, "in-progress")}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Work
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Assign New Technician */}
        {showAssignModal ? (
          <div className="border-2 border-blue-500 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Assign Technician</h4>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Technician
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Choose a technician...</option>
                {technicians
                  .filter((t) => t.status === "active")
                  .map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {formatTechnicianName(tech)} - {tech.skillLevel} (
                      {tech.efficiencyRating.toFixed(0)}% efficiency)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Body Repair">Body Repair</option>
                <option value="Frame Straightening">Frame Straightening</option>
                <option value="Panel Replacement">Panel Replacement</option>
                <option value="Welding">Welding</option>
                <option value="Paint Preparation">Paint Preparation</option>
                <option value="Painting">Painting</option>
                <option value="Reassembly">Reassembly</option>
                <option value="Quality Control">Quality Control</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAssign} disabled={!selectedTechId}>
                Assign Technician
              </Button>
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowAssignModal(true)}
            variant="outline"
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Another Technician
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
