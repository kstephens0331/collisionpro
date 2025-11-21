"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import {
  WorkflowStage,
  JobBoard,
  getStatusColor,
  getPriorityColor,
  formatDuration,
} from "@/lib/job-tracking";

interface JobKanbanBoardProps {
  stages: WorkflowStage[];
  jobs: JobBoard[];
  onJobClick?: (job: JobBoard) => void;
  onMoveJob?: (jobId: string, newStageId: string) => void;
}

export default function JobKanbanBoard({
  stages,
  jobs,
  onJobClick,
  onMoveJob,
}: JobKanbanBoardProps) {
  const [draggedJob, setDraggedJob] = useState<string | null>(null);

  const handleDragStart = (jobId: string) => {
    setDraggedJob(jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: string) => {
    if (draggedJob && onMoveJob) {
      onMoveJob(draggedJob, stageId);
    }
    setDraggedJob(null);
  };

  const getJobsForStage = (stageId: string) => {
    return jobs.filter((j) => j.currentStageId === stageId && j.status !== 'completed' && j.status !== 'cancelled');
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages
        .sort((a, b) => a.order - b.order)
        .map((stage) => {
          const stageJobs = getJobsForStage(stage.id);
          const avgDaysInStage =
            stageJobs.length > 0
              ? stageJobs.reduce((sum, j) => sum + j.daysInCurrentStage, 0) /
                stageJobs.length
              : 0;

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <Card className="h-full">
                <CardHeader
                  className="pb-3"
                  style={{ borderLeftWidth: 4, borderLeftColor: stage.color }}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-base">{stage.name}</span>
                    </div>
                    <Badge variant="outline">{stageJobs.length}</Badge>
                  </CardTitle>
                  {stageJobs.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Avg: {avgDaysInStage.toFixed(1)} days in stage
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {stageJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No jobs in this stage
                    </div>
                  ) : (
                    stageJobs.map((job) => (
                      <Card
                        key={job.id}
                        className="cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(job.id)}
                        onClick={() => onJobClick && onJobClick(job)}
                      >
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm mb-1">
                                {job.vehicleInfo || `Estimate #${job.estimateId.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-600">
                                {job.customerName || "Customer"}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {job.priority !== 'normal' && (
                              <Badge className={getPriorityColor(job.priority)}>
                                {job.priority.toUpperCase()}
                              </Badge>
                            )}
                            {job.status === 'on-hold' && (
                              <Badge className={getStatusColor(job.status)}>
                                ON HOLD
                              </Badge>
                            )}
                            {!job.onSchedule && (
                              <Badge className="bg-red-100 text-red-800">
                                BEHIND
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(job.daysInCurrentStage)}</span>
                              {stage.estimatedDays &&
                                job.daysInCurrentStage > stage.estimatedDays && (
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                )}
                            </div>

                            {job.assignedTechnicianNames &&
                              job.assignedTechnicianNames.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">
                                    {job.assignedTechnicianNames.join(", ")}
                                  </span>
                                </div>
                              )}

                            {job.targetCompletionDate && (
                              <div className="text-xs">
                                Target:{" "}
                                {job.targetCompletionDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${job.progressPercentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {job.progressPercentage}% complete
                            </p>
                          </div>

                          {job.blockedReason && (
                            <div className="mt-2 bg-red-50 border border-red-200 p-2 rounded text-xs text-red-800">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              {job.blockedReason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
    </div>
  );
}
