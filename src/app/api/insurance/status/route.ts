import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  checkStatus,
  InsurancePlatform,
  getPlatformStatus,
  getPlatformDisplayName,
  INSURANCE_COMPANIES,
} from '@/lib/insurance';

export const dynamic = 'force-dynamic';

/**
 * Check insurance submission status
 * GET /api/insurance/status?estimateId=xxx
 * GET /api/insurance/status?externalId=xxx&platform=ccc_one
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get('estimateId');
    const externalId = searchParams.get('externalId');
    const platform = searchParams.get('platform') as InsurancePlatform;

    // If no parameters, return platform status
    if (!estimateId && !externalId) {
      const status = getPlatformStatus();
      return NextResponse.json({
        success: true,
        data: {
          platforms: {
            ccc_one: {
              configured: status.ccc_one,
              name: 'CCC ONE',
              companies: INSURANCE_COMPANIES.filter(c => c.platform === 'ccc_one').map(c => c.name),
            },
            mitchell: {
              configured: status.mitchell,
              name: 'Mitchell',
              companies: INSURANCE_COMPANIES.filter(c => c.platform === 'mitchell').map(c => c.name),
            },
            audatex: {
              configured: status.audatex,
              name: 'Audatex',
              companies: INSURANCE_COMPANIES.filter(c => c.platform === 'audatex').map(c => c.name),
            },
          },
          allCompanies: INSURANCE_COMPANIES,
        },
      });
    }

    // Check by estimate ID
    if (estimateId) {
      const { data: estimate, error } = await supabaseAdmin
        .from('estimates')
        .select(`
          id,
          insurance_claim_number,
          insurance_company,
          insurance_platform,
          insurance_status,
          insurance_external_id,
          insurance_submitted_at,
          insurance_approved_at,
          insurance_approved_amount,
          insurance_adjuster_name,
          insurance_adjuster_notes
        `)
        .eq('id', estimateId)
        .single();

      if (error || !estimate) {
        return NextResponse.json(
          { success: false, error: 'Estimate not found' },
          { status: 404 }
        );
      }

      if (!estimate.insurance_external_id || !estimate.insurance_platform) {
        return NextResponse.json({
          success: true,
          data: {
            submitted: false,
            message: 'Estimate has not been submitted to insurance',
          },
        });
      }

      // Get latest status from insurance platform
      const approvalRecord = await checkStatus(
        estimate.insurance_platform as InsurancePlatform,
        estimate.insurance_external_id
      );

      // Update estimate with latest status
      await supabaseAdmin
        .from('estimates')
        .update({
          insurance_status: approvalRecord.status,
          insurance_approved_amount: approvalRecord.approvedAmount || null,
          insurance_adjuster_notes: approvalRecord.adjusterNotes || null,
          insurance_last_checked_at: new Date().toISOString(),
        })
        .eq('id', estimateId);

      return NextResponse.json({
        success: true,
        data: {
          submitted: true,
          claimNumber: estimate.insurance_claim_number,
          company: estimate.insurance_company,
          platform: estimate.insurance_platform,
          platformName: getPlatformDisplayName(estimate.insurance_platform as InsurancePlatform),
          externalId: estimate.insurance_external_id,
          status: approvalRecord.status,
          submittedAt: estimate.insurance_submitted_at,
          approvedAmount: approvalRecord.approvedAmount,
          adjuster: estimate.insurance_adjuster_name,
          adjusterNotes: approvalRecord.adjusterNotes,
          changes: approvalRecord.changes,
          requiresAction: approvalRecord.requiresAction,
          lastChecked: new Date().toISOString(),
        },
      });
    }

    // Check by external ID and platform
    if (externalId && platform) {
      const approvalRecord = await checkStatus(platform, externalId);

      return NextResponse.json({
        success: true,
        data: {
          externalId,
          platform,
          platformName: getPlatformDisplayName(platform),
          ...approvalRecord,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters',
        usage: {
          byEstimate: 'GET /api/insurance/status?estimateId=xxx',
          byExternal: 'GET /api/insurance/status?externalId=xxx&platform=ccc_one',
          platformStatus: 'GET /api/insurance/status',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Insurance status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
