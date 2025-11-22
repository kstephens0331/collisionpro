/**
 * AI Chat Streaming API
 *
 * Real-time streaming responses from Claude
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  streamChatCompletion,
  generateSystemPrompt,
  AI_TOOLS,
} from '@/lib/ai/assistant';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // TODO: Get userId and shopId from authenticated session
    const userId = 'test-user-id';
    const shopId = 'test-shop-id';

    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 });
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
      const { data: newConversation } = await supabase
        .from('AssistantConversation')
        .insert({
          userId,
          shopId,
          title: message.substring(0, 50),
          status: 'active',
        })
        .select()
        .single();
      conversation = newConversation;
    }

    // Get conversation history
    const { data: previousMessages } = await supabase
      .from('AssistantMessage')
      .select('*')
      .eq('conversationId', conversation.id)
      .order('createdAt', { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from('AssistantMessage').insert({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });

    // Build message history
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

    // Get shop context
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

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          // Stream Claude response
          for await (const chunk of streamChatCompletion(messageHistory, {
            model: 'claude-3-5-sonnet-20241022',
            temperature: 0.7,
            maxTokens: 4096,
            systemPrompt,
          })) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          // Save assistant message
          await supabase.from('AssistantMessage').insert({
            conversationId: conversation.id,
            role: 'assistant',
            content: fullContent,
            model: 'claude-3-5-sonnet-20241022',
          });

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`
            )
          );
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
