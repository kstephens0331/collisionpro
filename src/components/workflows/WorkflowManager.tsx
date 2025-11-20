"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from "@/lib/workflows/types";

export default function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(WORKFLOW_TEMPLATES);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === workflowId ? { ...w, enabled: !w.enabled } : w
      )
    );
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "estimate_sent":
        return <Mail className="h-4 w-4" />;
      case "job_completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "customer_inactive":
        return <Clock className="h-4 w-4" />;
      case "payment_received":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    return trigger
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Automated Workflows
              </h2>
              <p className="text-gray-600">
                Set up automated customer follow-ups and retention campaigns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              🚀 EXCLUSIVE FEATURE
            </span>
            <span className="text-gray-600">
              Mitchell, CCC ONE, and Audatex don't have this!
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {workflows.filter((w) => w.enabled).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active Workflows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {workflows.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">87%</p>
              <p className="text-sm text-gray-600 mt-1">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">1,247</p>
              <p className="text-sm text-gray-600 mt-1">Total Executions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`p-4 border-2 rounded-lg transition-all ${
                  workflow.enabled
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded ${
                          workflow.enabled
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {getTriggerIcon(workflow.trigger)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {workflow.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {workflow.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-14 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="h-4 w-4" />
                        <span>Trigger: {getTriggerLabel(workflow.trigger)}</span>
                      </div>
                      {workflow.delay && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Delay: {workflow.delay} hours</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{workflow.actions.length} actions</span>
                      </div>
                    </div>

                    {/* Actions Preview */}
                    <div className="ml-14 mt-3 space-y-1">
                      {workflow.actions.map((action, index) => (
                        <div
                          key={action.id}
                          className="text-xs text-gray-500 flex items-center gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span>
                            {action.type === "send_email" && "📧 Email"}
                            {action.type === "send_sms" && "📱 SMS"}
                            {action.type === "create_task" && "✅ Task"}
                            {action.type === "send_notification" &&
                              "🔔 Notification"}
                          </span>
                          {action.subject && (
                            <span className="text-gray-400">
                              - {action.subject}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={workflow.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWorkflow(workflow.id)}
                    >
                      {workflow.enabled ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedWorkflow.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorkflow(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-gray-600 mt-1">
                {selectedWorkflow.description}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Trigger Info */}
              <div>
                <h4 className="font-semibold mb-2">Trigger</h4>
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm">
                    <strong>Event:</strong>{" "}
                    {getTriggerLabel(selectedWorkflow.trigger)}
                  </p>
                  {selectedWorkflow.delay && (
                    <p className="text-sm mt-1">
                      <strong>Delay:</strong> {selectedWorkflow.delay} hours
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="space-y-3">
                  {selectedWorkflow.actions.map((action, index) => (
                    <div
                      key={action.id}
                      className="p-4 bg-gray-50 rounded border"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {action.type === "send_email" && "📧 Send Email"}
                            {action.type === "send_sms" && "📱 Send SMS"}
                            {action.type === "create_task" && "✅ Create Task"}
                          </p>
                          {action.subject && (
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Subject: {action.subject}
                            </p>
                          )}
                          <div className="text-xs text-gray-600 bg-white p-3 rounded border whitespace-pre-wrap">
                            {action.template}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Variables */}
              <div>
                <h4 className="font-semibold mb-2">Available Variables</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    "{{customerName}}",
                    "{{vehicleYear}}",
                    "{{vehicleMake}}",
                    "{{vehicleModel}}",
                    "{{estimateNumber}}",
                    "{{estimateTotal}}",
                    "{{shopName}}",
                    "{{shopPhone}}",
                  ].map((variable) => (
                    <code
                      key={variable}
                      className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-200"
                    >
                      {variable}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  This workflow will execute automatically when triggered
                </p>
                <Button onClick={() => setSelectedWorkflow(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
