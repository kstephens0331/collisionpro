import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Submit feedback for a recommendation (for machine learning)
 * POST /api/supplements/feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recommendationId,
      action, // 'accept' | 'dismiss' | 'submit' | 'outcome'
      feedback,
      actualAmount,
      wasApproved,
      submissionId,
    } = body;

    if (!recommendationId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['recommendationId', 'action'],
        },
        { status: 400 }
      );
    }

    const updates: any = {};

    switch (action) {
      case 'accept':
        updates.was_accepted = true;
        updates.accepted_at = new Date().toISOString();
        break;

      case 'dismiss':
        updates.was_accepted = false;
        updates.dismissed_at = new Date().toISOString();
        break;

      case 'submit':
        updates.was_submitted = true;
        if (submissionId) {
          updates.actual_submission_id = submissionId;
        }
        break;

      case 'outcome':
        if (wasApproved !== undefined) {
          updates.was_approved = wasApproved;
        }
        if (actualAmount !== undefined) {
          updates.actual_amount = actualAmount;
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (feedback) {
      updates.feedback = feedback;
    }

    // Update recommendation
    const { data: recommendation, error: updateError } = await supabaseAdmin
      .from('supplement_recommendations')
      .update(updates)
      .eq('id', recommendationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update recommendation' },
        { status: 500 }
      );
    }

    // If outcome provided and patterns exist, update pattern confidence
    if (action === 'outcome' && recommendation.related_patterns) {
      try {
        const patternIds = JSON.parse(recommendation.related_patterns as any);

        for (const patternId of patternIds) {
          if (wasApproved === true) {
            // Increase approval count
            await supabaseAdmin.rpc('increment_pattern_approval', {
              pattern_id: patternId,
            });
          } else if (wasApproved === false) {
            // Increase rejection count
            await supabaseAdmin.rpc('increment_pattern_rejection', {
              pattern_id: patternId,
            });
          }
        }
      } catch (err) {
        console.error('Error updating pattern confidence:', err);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        message: `Feedback recorded: ${action}`,
      },
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
