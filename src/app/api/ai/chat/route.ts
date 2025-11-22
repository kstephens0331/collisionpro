/**
 * AI Chat API Endpoint
 *
 * Handle Claude AI conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getChatCompletion,
  formatMessagesForClaude,
  AI_TOOLS,
  generateSystemPrompt,
  type AssistantMessage,
} from '@/lib/ai/assistant';
import { executeAction } from '@/lib/ai/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // TODO: Get userId and shopId from authenticated session
    // For now, use test values
    const userId = 'test-user-id';
    const shopId = 'test-shop-id';

    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('AssistantConversation')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
    }

    if (!conversation) {
      // Create new conversation
      const { data: newConversation, error} = await supabase
        .from('AssistantConversation')
        .insert({
          userId,
          shopId,
          title: message.substring(0, 50),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      conversation = newConversation;
    }

    // Get conversation history
    const { data: previousMessages } = await supabase
      .from('AssistantMessage')
      .select('*')
      .eq('conversationId', conversation.id)
      .order('createdAt', { ascending: true })
      .limit(20); // Last 20 messages for context

    // Save user message
    const { data: userMessageRecord, error: userMsgError } = await supabase
      .from('AssistantMessage')
      .insert({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Build message history for Claude
    const messageHistory = [
      ...(previousMessages || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Get shop context for system prompt
    let shopName = 'your shop';
    if (shopId) {
      const { data: shop } = await supabase
        .from('Shop')
        .select('name')
        .eq('id', shopId)
        .single();
      if (shop) shopName = shop.name;
    }

    // Get system prompt
    const { data: systemPromptData } = await supabase
      .from('AssistantPrompt')
      .select('template, variables')
      .eq('name', 'Main System Prompt')
      .eq('isActive', true)
      .single();

    const systemPrompt = generateSystemPrompt(
      systemPromptData?.template ||
        'You are an AI assistant for CollisionPro, a collision repair shop management system.',
      {
        shop_name: shopName,
        user_name: 'User',
        current_date: new Date().toLocaleDateString(),
      }
    );

    // Get Claude response
    const completion = await getChatCompletion(messageHistory, {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4096,
      tools: AI_TOOLS,
      systemPrompt,
    });

    // Execute tool calls if any
    let toolResults;
    if (completion.toolCalls && completion.toolCalls.length > 0) {
      toolResults = await Promise.all(
        completion.toolCalls.map(async (toolCall) => {
          // Log the action
          const { data: actionRecord } = await supabase
            .from('AssistantAction')
            .insert({
              conversationId: conversation.id,
              userId,
              shopId,
              actionType: toolCall.name,
              actionName: toolCall.name,
              parameters: toolCall.input,
              status: 'pending',
            })
            .select()
            .single();

          const startTime = Date.now();

          try {
            // Execute the action
            const result = await executeAction(toolCall.name, toolCall.input);

            // Update action record
            if (actionRecord) {
              await supabase
                .from('AssistantAction')
                .update({
                  result: result.data,
                  status: result.success ? 'success' : 'error',
                  error: result.error,
                  executionTime: Date.now() - startTime,
                  completedAt: new Date().toISOString(),
                })
                .eq('id', actionRecord.id);
            }

            return {
              toolCall,
              result,
            };
          } catch (error: any) {
            // Update action record with error
            if (actionRecord) {
              await supabase
                .from('AssistantAction')
                .update({
                  status: 'error',
                  error: error.message,
                  executionTime: Date.now() - startTime,
                  completedAt: new Date().toISOString(),
                })
                .eq('id', actionRecord.id);
            }

            return {
              toolCall,
              result: {
                success: false,
                error: error.message,
              },
            };
          }
        })
      );
    }

    // Append tool results to content if applicable
    let finalContent = completion.content;
    if (toolResults && toolResults.length > 0) {
      const resultsText = toolResults
        .map((tr) => {
          if (tr.result.success && 'message' in tr.result && tr.result.message) {
            return `\n\n${tr.result.message}`;
          }
          return '';
        })
        .join('');
      finalContent += resultsText;
    }

    // Save assistant message
    const { data: assistantMessageRecord, error: assistantMsgError } =
      await supabase
        .from('AssistantMessage')
        .insert({
          conversationId: conversation.id,
          role: 'assistant',
          content: finalContent,
          model: completion.model,
          tokens: completion.tokens,
          cost: completion.cost,
          toolCalls: completion.toolCalls,
          toolResults: toolResults?.map((tr) => tr.result),
        })
        .select()
        .single();

    if (assistantMsgError) throw assistantMsgError;

    return NextResponse.json({
      conversationId: conversation.id,
      messageId: assistantMessageRecord.id,
      content: finalContent,
      toolCalls: completion.toolCalls,
      tokens: completion.tokens,
      cost: completion.cost,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
