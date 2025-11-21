"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  Flag,
} from "lucide-react";
import {
  JobBoard,
  WorkflowStage,
  getStatusColor,
  getPriorityColor,
  formatDuration,
  getChecklistCompletion,
} from "@/lib/job-tracking";

interface JobDetailCardProps {
  job: JobBoard;
  stages: WorkflowStage[];
  onMoveToNextStage?: () => void;
  onAddNote?: () => void;
  onUploadPhoto?: () => void;
  onAssignTechnician?: () => void;
}

export default function JobDetailCard({
  job,
  stages,
  onMoveToNextStage,
  onAddNote,
  onUploadPhoto,
  onAssignTechnician,
}: JobDetailCardProps) {
  const currentStage = stages.find((s) => s.id === job.currentStageId);
  const nextStage = stages.find((s) => s.order === (currentStage?.order || 0) + 1);
  const checklistCompletion = getChecklistCompletion(job.checklist || []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2">
              {job.vehicleInfo || `Estimate #${job.estimateId}`}
            </CardTitle>
            <p className="text-sm text-gray-600">{job.customerName}</p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.toUpperCase()}
            </Badge>
            <Badge className={getPriorityColor(job.priority)}>
              <Flag className="h-3 w-3 mr-1" />
              {job.priority.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Stage */}
        <div>
          <h3 className="font-semibold mb-3">Current Stage</h3>
          <div
            className="border-l-4 bg-gray-50 p-4 rounded-r-lg"
            style={{ borderLeftColor: currentStage?.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-lg">{currentStage?.name}</p>
                <p className="text-sm text-gray-600">
                  {currentStage?.description}
                </p>
              </div>
              {nextStage && onMoveToNextStage && (
                <Button onClick={onMoveToNextStage} size="sm">
                  Move to {nextStage.name}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>
                  In stage: <strong>{formatDuration(job.daysInCurrentStage)}</strong>
                </span>
                {currentStage?.estimatedDays &&
                  job.daysInCurrentStage > currentStage.estimatedDays && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  Total: <strong>{job.totalElapsedDays} days</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Overall Progress</h3>
            <span className="text-sm font-semibold text-blue-600">
              {job.progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                job.progressPercentage >= 90
                  ? "bg-green-500"
                  : job.progressPercentage >= 50
                  ? "bg-blue-500"
                  : "bg-yellow-500"
              }`}
              style={{ width: `${job.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600">
            <span>Started {job.startDate.toLocaleDateString()}</span>
            {job.targetCompletionDate && (
              <span
                className={!job.onSchedule ? "text-red-600 font-semibold" : ""}
              >
                Target: {job.targetCompletionDate.toLocaleDateString()}
                {!job.onSchedule && " (Behind)"}
              </span>
            )}
          </div>
        </div>

        {/* Assigned Technicians */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned Technicians
            </h3>
            {onAssignTechnician && (
              <Button variant="outline" size="sm" onClick={onAssignTechnician}>
                Assign
              </Button>
            )}
          </div>
          {job.assignedTechnicianNames && job.assignedTechnicianNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {job.assignedTechnicianNames.map((name, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  <User className="h-3 w-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No technicians assigned</p>
          )}
        </div>

        {/* Checklist */}
        {job.checklist && job.checklist.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Stage Checklist</h3>
              <span className="text-sm text-gray-600">
                {checklistCompletion}% complete
              </span>
            </div>
            <div className="space-y-2">
              {job.checklist.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 border-2 rounded" />
                  )}
                  <span
                    className={`text-sm flex-1 ${
                      item.isCompleted ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {item.taskName}
                  </span>
                  {item.completedBy && (
                    <span className="text-xs text-gray-500">
                      by {item.completedByName}
                    </span>
                  )}
                </div>
              ))}
              {job.checklist.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{job.checklist.length - 5} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes & Photos */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-gray-50" onClick={onAddNote}>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="font-semibold">Notes</p>
              <p className="text-2xl font-bold text-blue-600">
                {job.notes?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">View or add notes</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={onUploadPhoto}>
            <CardContent className="pt-6 text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="font-semibold">Photos</p>
              <p className="text-2xl font-bold text-purple-600">
                {job.photos?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">View or upload photos</p>
            </CardContent>
          </Card>
        </div>

        {/* Blocked Warning */}
        {job.status === 'on-hold' && job.blockedReason && (
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Job On Hold</p>
                <p className="text-sm text-red-700">{job.blockedReason}</p>
                {job.blockedSince && (
                  <p className="text-xs text-red-600 mt-1">
                    Since: {job.blockedSince.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Behind Schedule Warning */}
        {!job.onSchedule && job.targetCompletionDate && (
          <div className="bg-orange-50 border-2 border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 mb-1">
                  Behind Schedule
                </p>
                <p className="text-sm text-orange-700">
                  This job is behind the target completion date of{" "}
                  {job.targetCompletionDate.toLocaleDateString()}. Consider
                  reassigning resources or updating the customer.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
