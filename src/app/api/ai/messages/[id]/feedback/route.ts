/**
 * AI Message Feedback API
 *
 * Record user feedback on AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const { feedback, feedbackNote } = await req.json();

    if (!feedback || !['thumbs_up', 'thumbs_down'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback value' },
        { status: 400 }
      );
    }

    // Update message with feedback
    const { error } = await supabase
      .from('AssistantMessage')
      .update({
        feedback,
        feedbackNote: feedbackNote || null,
      })
      .eq('id', messageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Message feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
