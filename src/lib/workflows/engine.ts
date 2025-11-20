// Workflow automation engine
// Executes workflows based on triggers and schedules

import {
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowTrigger,
  WorkflowActionConfig,
  substituteVariables,
  extractWorkflowVariables,
  WORKFLOW_TEMPLATES,
} from "./types";

// Check if workflow conditions are met
export function evaluateConditions(
  workflow: WorkflowTemplate,
  context: Record<string, any>
): boolean {
  if (!workflow.conditions || workflow.conditions.length === 0) {
    return true;
  }

  return workflow.conditions.every((condition) => {
    const value = context[condition.field];

    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "not_equals":
        return value !== condition.value;
      case "greater_than":
        return value > condition.value;
      case "less_than":
        return value < condition.value;
      case "contains":
        return String(value).includes(String(condition.value));
      default:
        return false;
    }
  });
}

// Find workflows to trigger
export function findTriggeredWorkflows(
  trigger: WorkflowTrigger,
  context: Record<string, any>
): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((workflow) => {
    if (!workflow.enabled) return false;
    if (workflow.trigger !== trigger) return false;
    return evaluateConditions(workflow, context);
  });
}

// Execute a single workflow action
export async function executeAction(
  action: WorkflowActionConfig,
  variables: Record<string, any>
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    // Substitute variables in template
    const message = substituteVariables(action.template, variables);
    const subject = action.subject
      ? substituteVariables(action.subject, variables)
      : undefined;

    switch (action.type) {
      case "send_email":
        // In production, integrate with SendGrid, AWS SES, etc.
        console.log("[WORKFLOW] Sending email:", {
          to: variables.customerEmail,
          subject,
          message,
        });

        // Placeholder - in real implementation:
        // await sendEmail({
        //   to: variables.customerEmail,
        //   subject,
        //   html: message,
        // });

        return {
          success: true,
          result: {
            type: "email",
            to: variables.customerEmail,
            subject,
            sent: true,
          },
        };

      case "send_sms":
        // In production, integrate with Twilio
        console.log("[WORKFLOW] Sending SMS:", {
          to: variables.customerPhone,
          message,
        });

        // Placeholder - in real implementation:
        // await sendSMS({
        //   to: variables.customerPhone,
        //   body: message,
        // });

        return {
          success: true,
          result: {
            type: "sms",
            to: variables.customerPhone,
            sent: true,
          },
        };

      case "create_task":
        // In production, create task in database
        console.log("[WORKFLOW] Creating task:", { message });

        // Placeholder - in real implementation:
        // await createTask({
        //   title: message,
        //   estimateId: variables.estimateId,
        //   dueDate: new Date(Date.now() + 86400000), // 1 day
        // });

        return {
          success: true,
          result: {
            type: "task",
            title: message,
            created: true,
          },
        };

      case "send_notification":
        // In production, send in-app notification
        console.log("[WORKFLOW] Sending notification:", { message });

        return {
          success: true,
          result: {
            type: "notification",
            message,
            sent: true,
          },
        };

      case "update_status":
        // In production, update estimate/job status
        console.log("[WORKFLOW] Updating status:", action.metadata);

        return {
          success: true,
          result: {
            type: "status_update",
            updated: true,
          },
        };

      case "schedule_followup":
        // In production, schedule another workflow
        console.log("[WORKFLOW] Scheduling follow-up:", action.metadata);

        return {
          success: true,
          result: {
            type: "scheduled",
            scheduledFor: new Date(
              Date.now() + (action.delay || 24) * 3600000
            ),
          },
        };

      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  } catch (error) {
    console.error("[WORKFLOW] Action execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Execute a complete workflow
export async function executeWorkflow(
  workflow: WorkflowTemplate,
  context: Record<string, any>
): Promise<WorkflowExecution> {
  const execution: WorkflowExecution = {
    id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    workflowId: workflow.id,
    estimateId: context.estimateId,
    customerId: context.customerId,
    triggeredAt: new Date(),
    status: "executing",
    results: {},
  };

  try {
    // Extract variables for template substitution
    const variables = extractWorkflowVariables(
      context.estimate,
      context.customer,
      context.shop
    );

    // Add context data to variables
    Object.assign(variables, context);

    // Execute all actions
    const results = await Promise.allSettled(
      workflow.actions.map((action) => executeAction(action, variables))
    );

    // Collect results
    execution.results = {};
    results.forEach((result, index) => {
      const actionId = workflow.actions[index].id;
      if (result.status === "fulfilled") {
        execution.results![actionId] = result.value;
      } else {
        execution.results![actionId] = {
          success: false,
          error: result.reason,
        };
      }
    });

    // Check if any actions failed
    const allSucceeded = results.every(
      (r) => r.status === "fulfilled" && r.value.success
    );

    execution.status = allSucceeded ? "completed" : "failed";
    execution.executedAt = new Date();

    if (!allSucceeded) {
      execution.error = "Some actions failed";
    }
  } catch (error) {
    execution.status = "failed";
    execution.error =
      error instanceof Error ? error.message : "Unknown error";
    execution.executedAt = new Date();
  }

  return execution;
}

// Trigger workflows based on an event
export async function triggerWorkflows(
  trigger: WorkflowTrigger,
  context: Record<string, any>
): Promise<WorkflowExecution[]> {
  // Find all workflows that match this trigger
  const workflows = findTriggeredWorkflows(trigger, context);

  if (workflows.length === 0) {
    console.log(`[WORKFLOW] No workflows found for trigger: ${trigger}`);
    return [];
  }

  console.log(
    `[WORKFLOW] Found ${workflows.length} workflows for trigger: ${trigger}`
  );

  // Execute all workflows
  const executions = await Promise.all(
    workflows.map((workflow) => executeWorkflow(workflow, context))
  );

  return executions;
}

// Schedule a delayed workflow
export function scheduleWorkflow(
  workflow: WorkflowTemplate,
  context: Record<string, any>,
  delayHours?: number
): void {
  const delay = delayHours || workflow.delay || 0;

  if (delay === 0) {
    // Execute immediately
    executeWorkflow(workflow, context);
  } else {
    // Schedule for later
    // In production, use a job queue (Bull, BeeQueue, etc.)
    console.log(
      `[WORKFLOW] Scheduling ${workflow.name} for ${delay} hours from now`
    );

    // Placeholder - in real implementation:
    // await jobQueue.add('execute-workflow', {
    //   workflowId: workflow.id,
    //   context,
    // }, {
    //   delay: delay * 3600000, // Convert hours to ms
    // });
  }
}

// Get workflow status/analytics
export function getWorkflowStats(executions: WorkflowExecution[]) {
  const total = executions.length;
  const completed = executions.filter((e) => e.status === "completed").length;
  const failed = executions.filter((e) => e.status === "failed").length;
  const pending = executions.filter((e) => e.status === "pending").length;

  const successRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    total,
    completed,
    failed,
    pending,
    successRate: successRate.toFixed(1),
  };
}
