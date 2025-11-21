/**
 * AI Assistant Library - Claude Edition
 *
 * Claude-powered conversational assistant for collision shop management
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface AssistantConversation {
  id: string;
  userId: string;
  shopId?: string;
  title?: string;
  context: Record<string, any>;
  status: 'active' | 'archived' | 'deleted';
  messageCount: number;
  lastMessageAt?: Date;
  totalTokens: number;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  tokens?: number;
  cost?: number;
  toolCalls?: any[];
  toolResults?: any[];
  feedback?: 'thumbs_up' | 'thumbs_down';
  feedbackNote?: string;
  createdAt: Date;
}

export interface ChatCompletionOptions {
  model?: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-haiku-20240307';
  temperature?: number;
  maxTokens?: number;
  tools?: Anthropic.Tool[];
  systemPrompt?: string;
}

/**
 * Generate system prompt with context injection
 */
export function generateSystemPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let prompt = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
  });

  return prompt;
}

/**
 * Get chat completion from Claude
 */
export async function getChatCompletion(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ChatCompletionOptions = {}
): Promise<{
  content: string;
  toolCalls?: any[];
  tokens: number;
  cost: number;
  model: string;
}> {
  const {
    model = 'claude-3-5-sonnet-20241022',
    temperature = 0.7,
    maxTokens = 4096,
    tools,
    systemPrompt,
  } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools,
  });

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as Anthropic.TextBlock).text)
    .join('\n');

  const toolCalls = response.content
    .filter((block) => block.type === 'tool_use')
    .map((block) => block as Anthropic.ToolUseBlock);

  // Calculate cost (approximate rates as of 2024)
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  let costPer1kInput = 0.003; // Claude 3.5 Sonnet
  let costPer1kOutput = 0.015;

  if (model.includes('opus')) {
    costPer1kInput = 0.015;
    costPer1kOutput = 0.075;
  } else if (model.includes('haiku')) {
    costPer1kInput = 0.00025;
    costPer1kOutput = 0.00125;
  }

  const cost =
    (inputTokens / 1000) * costPer1kInput +
    (outputTokens / 1000) * costPer1kOutput;

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    tokens: inputTokens + outputTokens,
    cost,
    model,
  };
}

/**
 * Stream chat completion (for real-time responses)
 */
export async function* streamChatCompletion(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ChatCompletionOptions = {}
): AsyncGenerator<string> {
  const {
    model = 'claude-3-5-sonnet-20241022',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}

/**
 * Available AI tools/functions for Claude
 */
export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_parts',
    description:
      'Search for automotive parts across multiple suppliers (RockAuto, AutoZone, NAPA, O\'Reilly, LKQ)',
    input_schema: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description: 'Vehicle year (e.g., 2022)',
        },
        make: {
          type: 'string',
          description: 'Vehicle make (e.g., "Honda", "Toyota")',
        },
        model: {
          type: 'string',
          description: 'Vehicle model (e.g., "Accord", "Camry")',
        },
        part_type: {
          type: 'string',
          description:
            'Type of part (e.g., "front bumper", "headlight", "door panel")',
        },
        quality: {
          type: 'string',
          enum: ['oem', 'aftermarket', 'used'],
          description: 'Part quality preference',
        },
      },
      required: ['year', 'make', 'model', 'part_type'],
    },
  },
  {
    name: 'create_estimate',
    description: 'Create a new collision repair estimate',
    input_schema: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer full name',
        },
        vehicle_vin: {
          type: 'string',
          description: 'Vehicle VIN (if available)',
        },
        vehicle_year: {
          type: 'number',
          description: 'Vehicle year',
        },
        vehicle_make: {
          type: 'string',
          description: 'Vehicle make',
        },
        vehicle_model: {
          type: 'string',
          description: 'Vehicle model',
        },
        damage_description: {
          type: 'string',
          description: 'Description of damage',
        },
      },
      required: [
        'customer_name',
        'vehicle_year',
        'vehicle_make',
        'vehicle_model',
      ],
    },
  },
  {
    name: 'get_shop_analytics',
    description: 'Get shop performance analytics and metrics',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['revenue', 'jobs', 'customers', 'efficiency', 'financial'],
          description: 'Type of analytics to retrieve',
        },
        period: {
          type: 'string',
          enum: ['today', 'week', 'month', 'quarter', 'year'],
          description: 'Time period for analytics',
        },
      },
      required: ['metric', 'period'],
    },
  },
  {
    name: 'assign_technician',
    description: 'Assign a technician to a job',
    input_schema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'string',
          description: 'Job/estimate ID',
        },
        technician_name: {
          type: 'string',
          description: 'Technician name or ID',
        },
        estimated_hours: {
          type: 'number',
          description: 'Estimated hours for the job',
        },
      },
      required: ['job_id', 'technician_name'],
    },
  },
  {
    name: 'calculate_tax_deduction',
    description:
      'Calculate potential tax deductions for collision shop expenses',
    input_schema: {
      type: 'object',
      properties: {
        expense_type: {
          type: 'string',
          enum: [
            'equipment',
            'supplies',
            'rent',
            'utilities',
            'marketing',
            'payroll',
          ],
          description: 'Type of expense',
        },
        amount: {
          type: 'number',
          description: 'Expense amount',
        },
        date: {
          type: 'string',
          description: 'Expense date (YYYY-MM-DD)',
        },
      },
      required: ['expense_type', 'amount'],
    },
  },
  {
    name: 'generate_financial_report',
    description: 'Generate financial reports (P&L, Balance Sheet, etc.)',
    input_schema: {
      type: 'object',
      properties: {
        report_type: {
          type: 'string',
          enum: ['profit-loss', 'balance-sheet', 'cash-flow', 'budget-variance'],
          description: 'Type of financial report',
        },
        period_start: {
          type: 'string',
          description: 'Report start date (YYYY-MM-DD)',
        },
        period_end: {
          type: 'string',
          description: 'Report end date (YYYY-MM-DD)',
        },
      },
      required: ['report_type'],
    },
  },
  {
    name: 'send_notification',
    description: 'Send SMS or email notification to customer',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
        },
        type: {
          type: 'string',
          enum: ['sms', 'email'],
          description: 'Notification type',
        },
        template: {
          type: 'string',
          enum: [
            'estimate_ready',
            'job_started',
            'job_completed',
            'payment_reminder',
          ],
          description: 'Notification template',
        },
      },
      required: ['customer_id', 'type', 'template'],
    },
  },
];

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Claude tokens are roughly 3.5 characters per token
  return Math.ceil(text.length / 3.5);
}

/**
 * Truncate conversation to fit token limit
 */
export function truncateConversation(
  messages: AssistantMessage[],
  maxTokens: number = 100000 // Claude 3.5 Sonnet context window
): AssistantMessage[] {
  let totalTokens = 0;
  const truncatedMessages: AssistantMessage[] = [];

  // Add messages from newest to oldest until we hit token limit
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokenCount(messages[i].content);

    if (totalTokens + msgTokens > maxTokens) {
      break;
    }

    truncatedMessages.unshift(messages[i]);
    totalTokens += msgTokens;
  }

  return truncatedMessages;
}

/**
 * Format messages for Claude API
 */
export function formatMessagesForClaude(
  messages: AssistantMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
