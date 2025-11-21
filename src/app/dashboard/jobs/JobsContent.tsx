"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  List,
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import JobKanbanBoard from "@/components/jobs/JobKanbanBoard";
import JobDetailCard from "@/components/jobs/JobDetailCard";
import {
  WorkflowStage,
  JobBoard,
  DEFAULT_STAGES,
  identifyBottlenecks,
  getJobsNeedingAttention,
  calculateCapacityUtilization,
} from "@/lib/job-tracking";

// Mock data
const mockStages: WorkflowStage[] = DEFAULT_STAGES.map((stage, idx) => ({
  ...stage,
  id: `stage-${idx + 1}`,
  shopId: "shop-1",
}));

const mockJobs: JobBoard[] = [
  {
    id: "job-1",
    estimateId: "est-1",
    shopId: "shop-1",
    currentStageId: "stage-1",
    currentStageName: "Check In",
    vehicleInfo: "2022 Honda Accord",
    customerName: "John Smith",
    startDate: new Date("2025-11-18"),
    targetCompletionDate: new Date("2025-11-28"),
    status: "in-progress",
    priority: "normal",
    progressPercentage: 10,
    daysInCurrentStage: 3,
    assignedTechnicians: ["tech-1"],
    assignedTechnicianNames: ["Mike Johnson"],
    customerNotificationsEnabled: true,
    totalElapsedDays: 3,
    onSchedule: true,
  },
  {
    id: "job-2",
    estimateId: "est-2",
    shopId: "shop-1",
    currentStageId: "stage-4",
    currentStageName: "Body Work",
    vehicleInfo: "2021 Toyota Camry",
    customerName: "Sarah Williams",
    startDate: new Date("2025-11-15"),
    targetCompletionDate: new Date("2025-11-25"),
    status: "in-progress",
    priority: "high",
    progressPercentage: 40,
    daysInCurrentStage: 4,
    assignedTechnicians: ["tech-2", "tech-3"],
    assignedTechnicianNames: ["David Martinez", "Jessica Chen"],
    customerNotificationsEnabled: true,
    totalElapsedDays: 6,
    onSchedule: true,
  },
  {
    id: "job-3",
    estimateId: "est-3",
    shopId: "shop-1",
    currentStageId: "stage-3",
    currentStageName: "Waiting for Parts",
    vehicleInfo: "2020 Ford F-150",
    customerName: "Mike Brown",
    startDate: new Date("2025-11-12"),
    targetCompletionDate: new Date("2025-11-22"),
    status: "on-hold",
    priority: "urgent",
    blockedReason: "Waiting for backorder part - ETA Nov 25",
    blockedSince: new Date("2025-11-17"),
    progressPercentage: 30,
    daysInCurrentStage: 5,
    assignedTechnicians: [],
    assignedTechnicianNames: [],
    customerNotificationsEnabled: true,
    totalElapsedDays: 9,
    onSchedule: false,
  },
  {
    id: "job-4",
    estimateId: "est-4",
    shopId: "shop-1",
    currentStageId: "stage-6",
    currentStageName: "Painting",
    vehicleInfo: "2023 Tesla Model 3",
    customerName: "Emily Davis",
    startDate: new Date("2025-11-10"),
    targetCompletionDate: new Date("2025-11-23"),
    status: "in-progress",
    priority: "high",
    progressPercentage: 60,
    daysInCurrentStage: 2,
    assignedTechnicians: ["tech-4"],
    assignedTechnicianNames: ["Robert Taylor"],
    customerNotificationsEnabled: true,
    totalElapsedDays: 11,
    onSchedule: true,
  },
  {
    id: "job-5",
    estimateId: "est-5",
    shopId: "shop-1",
    currentStageId: "stage-8",
    currentStageName: "Quality Control",
    vehicleInfo: "2019 Chevrolet Silverado",
    customerName: "Tom Wilson",
    startDate: new Date("2025-11-05"),
    targetCompletionDate: new Date("2025-11-20"),
    status: "in-progress",
    priority: "normal",
    progressPercentage: 80,
    daysInCurrentStage: 1,
    assignedTechnicians: ["tech-1"],
    assignedTechnicianNames: ["Mike Johnson"],
    customerNotificationsEnabled: true,
    totalElapsedDays: 16,
    onSchedule: true,
  },
];

export default function JobsContent() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedJob, setSelectedJob] = useState<JobBoard | null>(null);

  const handleMoveJob = (jobId: string, newStageId: string) => {
    console.log(`Moving job ${jobId} to stage ${newStageId}`);
    // In production, this would update via API
  };

  const handleJobClick = (job: JobBoard) => {
    setSelectedJob(job);
  };

  // Calculate statistics
  const activeJobs = mockJobs.filter((j) => j.status === "in-progress").length;
  const jobsNeedingAttention = getJobsNeedingAttention(mockJobs);
  const bottlenecks = identifyBottlenecks(mockStages, mockJobs);
  const topBottleneck = bottlenecks[0];
  const capacity = calculateCapacityUtilization(activeJobs, 5); // 5 technicians

  const avgCycleTime =
    mockJobs.reduce((sum, j) => sum + j.totalElapsedDays, 0) / mockJobs.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedJob ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              ← Back to Job Board
            </Button>
          </div>
          <JobDetailCard
            job={selectedJob}
            stages={mockStages}
            onMoveToNextStage={() => console.log("Move to next stage")}
            onAddNote={() => console.log("Add note")}
            onUploadPhoto={() => console.log("Upload photo")}
            onAssignTechnician={() => console.log("Assign technician")}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Job Tracking</h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeJobs} active jobs • {jobsNeedingAttention.behindSchedule.length} behind schedule
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold">{activeJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Cycle Time</p>
                    <p className="text-2xl font-bold">
                      {avgCycleTime.toFixed(1)} days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      capacity.status === "overloaded"
                        ? "bg-red-100"
                        : capacity.status === "high"
                        ? "bg-orange-100"
                        : "bg-green-100"
                    }`}
                  >
                    <Users
                      className={`h-6 w-6 ${
                        capacity.status === "overloaded"
                          ? "text-red-600"
                          : capacity.status === "high"
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-2xl font-bold">{capacity.utilization}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      jobsNeedingAttention.behindSchedule.length > 0
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >
                    <AlertCircle
                      className={`h-6 w-6 ${
                        jobsNeedingAttention.behindSchedule.length > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Need Attention</p>
                    <p className="text-2xl font-bold">
                      {jobsNeedingAttention.behindSchedule.length +
                        jobsNeedingAttention.onHold.length +
                        jobsNeedingAttention.urgent.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(jobsNeedingAttention.behindSchedule.length > 0 ||
            jobsNeedingAttention.onHold.length > 0 ||
            topBottleneck.bottleneckScore > 50) && (
            <div className="space-y-3">
              <h3 className="font-semibold">Alerts & Bottlenecks</h3>

              {jobsNeedingAttention.behindSchedule.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-900">
                          {jobsNeedingAttention.behindSchedule.length} Jobs Behind Schedule
                        </p>
                        <p className="text-sm text-orange-700 mt-1">
                          {jobsNeedingAttention.behindSchedule
                            .map((j) => j.vehicleInfo)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {jobsNeedingAttention.onHold.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">
                          {jobsNeedingAttention.onHold.length} Jobs On Hold
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          Review blocked jobs and resolve issues
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {topBottleneck && topBottleneck.bottleneckScore > 50 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900">
                          Bottleneck Detected: {topBottleneck.stageName}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {topBottleneck.jobsInStage} jobs in stage, averaging{" "}
                          {topBottleneck.avgDaysInStage.toFixed(1)} days
                          {topBottleneck.jobsOverdue > 0 &&
                            ` (${topBottleneck.jobsOverdue} overdue)`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Kanban Board */}
          {view === "kanban" && (
            <JobKanbanBoard
              stages={mockStages}
              jobs={mockJobs}
              onJobClick={handleJobClick}
              onMoveJob={handleMoveJob}
            />
          )}

          {/* List View */}
          {view === "list" && (
            <div className="space-y-3">
              {mockJobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleJobClick(job)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{job.vehicleInfo}</p>
                        <p className="text-sm text-gray-600">{job.customerName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{job.currentStageName}</Badge>
                        {job.priority !== "normal" && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {job.priority.toUpperCase()}
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800">
                          {job.progressPercentage}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
