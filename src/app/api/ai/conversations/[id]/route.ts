/**
 * AI Conversation Detail API
 *
 * Get conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Get userId from authenticated session
    const userId = 'test-user-id';

    const { id: conversationId } = await params;

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('AssistantConversation')
      .select('*')
      .eq('id', conversationId)
      .eq('userId', userId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('AssistantMessage')
      .select('*')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true });

    if (msgError) throw msgError;

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Get userId from authenticated session
    const userId = 'test-user-id';

    const { id: conversationId } = await params;

    // Verify ownership
    const { data: conversation } = await supabase
      .from('AssistantConversation')
      .select('userId')
      .eq('id', conversationId)
      .single();

    if (!conversation || conversation.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark as deleted
    const { error } = await supabase
      .from('AssistantConversation')
      .update({ status: 'deleted' })
      .eq('id', conversationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
