/**
 * Audatex/Qapter API Integration
 * Phase 6.3 - Insurance DRP Integration
 *
 * Audatex is used by: Farmers, American Family
 * Qapter is their web-based estimating system
 */

import {
  PlatformConfig,
  FormattedEstimate,
  SubmissionResponse,
  SubmissionStatus,
  ApprovalRecord,
} from './types';

// Audatex specific types
interface AudatexAuthResponse {
  token: string;
  type: string;
  expires: number;
}

interface AudatexEstimateResponse {
  caseId: string;
  estimateNumber: string;
  status: string;
  message?: string;
  expectedReviewDate?: string;
}

interface AudatexStatusResponse {
  caseId: string;
  estimateNumber: string;
  status: string;
  lastModified: string;
  approvedAmount?: number;
  adjusterRemarks?: string;
  lineChanges?: any[];
}

// Token cache
let audatexToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Audatex configuration from environment
 */
export function getAudatexConfig(): PlatformConfig {
  return {
    platform: 'audatex',
    apiUrl: process.env.AUDATEX_API_URL || 'https://api.audatex.com/v1',
    apiKey: process.env.AUDATEX_API_KEY,
    username: process.env.AUDATEX_USERNAME,
    password: process.env.AUDATEX_PASSWORD,
    shopId: process.env.AUDATEX_SHOP_ID,
  };
}

/**
 * Authenticate with Audatex API
 */
export async function authenticate(): Promise<string> {
  const config = getAudatexConfig();

  // Check cached token
  if (audatexToken && Date.now() < audatexToken.expiresAt) {
    return audatexToken.token;
  }

  if (!config.apiKey && (!config.username || !config.password)) {
    throw new Error('Audatex credentials not configured. Set AUDATEX_API_KEY or AUDATEX_USERNAME/PASSWORD');
  }

  try {
    const response = await fetch(`${config.apiUrl}/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: AudatexAuthResponse = await response.json();

    // Cache token
    audatexToken = {
      token: data.token,
      expiresAt: Date.now() + (data.expires - 60) * 1000,
    };

    return data.token;
  } catch (error) {
    console.error('Audatex auth error:', error);
    throw new Error(`Audatex authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit estimate to Audatex/Qapter
 */
export async function submitEstimate(
  estimate: FormattedEstimate,
  claimNumber: string
): Promise<SubmissionResponse> {
  const config = getAudatexConfig();

  // Check if credentials are configured
  if (!config.apiKey && (!config.username || !config.password)) {
    console.log('Audatex not configured, returning demo response');
    return getDemoSubmissionResponse(claimNumber);
  }

  try {
    const token = await authenticate();

    // Transform estimate to Audatex format
    const audatexEstimate = transformToAudatexFormat(estimate, claimNumber);

    const response = await fetch(`${config.apiUrl}/cases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Shop-ID': config.shopId || '',
      },
      body: JSON.stringify(audatexEstimate),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Submission failed: ${response.status} - ${error}`);
    }

    const data: AudatexEstimateResponse = await response.json();

    return {
      success: true,
      externalId: data.caseId,
      status: mapAudatexStatus(data.status),
      message: data.message || 'Estimate submitted to Audatex',
      estimatedReviewTime: data.expectedReviewDate,
      additionalInfo: {
        caseId: data.caseId,
        estimateNumber: data.estimateNumber,
      },
    };
  } catch (error) {
    console.error('Audatex submission error:', error);
    return {
      success: false,
      status: 'pending',
      message: error instanceof Error ? error.message : 'Submission failed',
    };
  }
}

/**
 * Check status of submitted estimate
 */
export async function checkStatus(caseId: string): Promise<ApprovalRecord> {
  const config = getAudatexConfig();

  if (!config.apiKey && (!config.username || !config.password)) {
    return getDemoApprovalRecord(caseId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/cases/${caseId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data: AudatexStatusResponse = await response.json();

    return {
      id: `approval_${Date.now()}`,
      submissionId: caseId,
      status: mapAudatexStatus(data.status),
      timestamp: data.lastModified,
      approvedAmount: data.approvedAmount,
      changes: data.lineChanges?.map(parseLineChange) || [],
      adjusterNotes: data.adjusterRemarks,
      requiresAction: ['approved_with_changes', 'rejected', 'supplement_requested'].includes(mapAudatexStatus(data.status)),
    };
  } catch (error) {
    console.error('Audatex status check error:', error);
    throw error;
  }
}

/**
 * Get case details from Audatex
 */
export async function getCaseDetails(caseId: string): Promise<any> {
  const config = getAudatexConfig();

  if (!config.apiKey && (!config.username || !config.password)) {
    return getDemoCaseDetails(caseId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/cases/${caseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get case: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Audatex get case error:', error);
    throw error;
  }
}

/**
 * Transform estimate to Audatex format
 */
function transformToAudatexFormat(estimate: FormattedEstimate, claimNumber: string): any {
  return {
    claimReference: claimNumber,
    lossDate: estimate.claimInfo.dateOfLoss,
    policyNumber: estimate.claimInfo.policyNumber,
    excessAmount: estimate.claimInfo.deductible,
    vehicle: {
      vin: estimate.vehicleInfo.vin,
      registrationYear: estimate.vehicleInfo.year,
      manufacturer: estimate.vehicleInfo.make,
      model: estimate.vehicleInfo.model,
      variant: estimate.vehicleInfo.trim,
      colour: estimate.vehicleInfo.color,
      mileage: estimate.vehicleInfo.mileage,
      registrationNumber: estimate.vehicleInfo.plateNumber,
    },
    claimant: {
      fullName: estimate.customerInfo.name,
      telephone: estimate.customerInfo.phone,
      email: estimate.customerInfo.email,
      address: estimate.customerInfo.address,
    },
    repairer: {
      name: estimate.shopInfo.name,
      address: estimate.shopInfo.address,
      telephone: estimate.shopInfo.phone,
      email: estimate.shopInfo.email,
      vatNumber: estimate.shopInfo.taxId,
      licenceNumber: estimate.shopInfo.licenseNumber,
    },
    operations: estimate.lineItems.map(item => ({
      type: mapLineToAudatexType(item.type),
      code: item.operationCode,
      description: item.description,
      zone: item.panelLocation,
      qty: item.quantity,
      rate: item.unitPrice,
      time: item.hours,
      paintTime: item.paintHours,
      value: item.totalPrice,
      part: item.partNumber ? {
        number: item.partNumber,
        supplier: item.manufacturer,
        category: mapPartCategory(item.partType),
        unitPrice: item.unitPrice,
      } : undefined,
    })),
    totals: {
      labour: estimate.totals.laborTotal,
      parts: estimate.totals.partsTotal,
      paint: estimate.totals.paintTotal,
      subTotal: estimate.totals.subtotal,
      vatRate: estimate.totals.taxRate,
      vat: estimate.totals.taxAmount,
      grandTotal: estimate.totals.total,
    },
    images: estimate.photos?.map(url => ({ url, category: 'DAMAGE' })),
    remarks: estimate.notes,
  };
}

/**
 * Map line item type to Audatex format
 */
function mapLineToAudatexType(type: string): string {
  const mapping: Record<string, string> = {
    labor: 'LABOUR',
    parts: 'PARTS',
    paint: 'PAINT',
    other: 'MISCELLANEOUS',
  };
  return mapping[type] || 'MISCELLANEOUS';
}

/**
 * Map part category to Audatex format
 */
function mapPartCategory(type?: string): string {
  if (!type) return 'OE';
  const mapping: Record<string, string> = {
    OEM: 'OE',
    aftermarket: 'AM',
    recycled: 'USED',
    remanufactured: 'RECO',
  };
  return mapping[type] || 'OE';
}

/**
 * Map Audatex status to our status
 */
function mapAudatexStatus(audatexStatus: string): SubmissionStatus {
  const mapping: Record<string, SubmissionStatus> = {
    'NEW': 'pending',
    'SENT': 'submitted',
    'RECEIVED': 'received',
    'UNDER_REVIEW': 'in_review',
    'AUTHORISED': 'approved',
    'AUTHORISED_MODIFIED': 'approved_with_changes',
    'DECLINED': 'rejected',
    'SUPPLEMENT': 'supplement_requested',
    'FINALISED': 'closed',
  };
  return mapping[audatexStatus.toUpperCase()] || 'pending';
}

/**
 * Parse line change from Audatex format
 */
function parseLineChange(change: any): any {
  return {
    id: change.id || `change_${Date.now()}`,
    field: change.property,
    itemId: change.operationId,
    originalValue: change.originalValue,
    newValue: change.modifiedValue,
    reason: change.justification,
    category: change.type?.toLowerCase() || 'other',
    changeType: change.changeType?.toLowerCase() || 'modified',
    dollarImpact: change.valueDifference || 0,
  };
}

/**
 * Demo submission response
 */
function getDemoSubmissionResponse(claimNumber: string): SubmissionResponse {
  const caseId = `ADX_${Date.now()}_${claimNumber}`;
  return {
    success: true,
    externalId: caseId,
    status: 'submitted',
    message: 'Estimate submitted to Audatex (Demo Mode)',
    estimatedReviewTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    additionalInfo: {
      demo: true,
      platform: 'Audatex',
      caseId,
      estimateNumber: `EST_${Date.now()}`,
      note: 'Configure AUDATEX_API_KEY or AUDATEX_USERNAME/PASSWORD for real submissions',
    },
  };
}

/**
 * Demo approval record
 */
function getDemoApprovalRecord(caseId: string): ApprovalRecord {
  return {
    id: `approval_${Date.now()}`,
    submissionId: caseId,
    status: 'in_review',
    timestamp: new Date().toISOString(),
    adjusterNotes: 'Case is under review (Demo Mode)',
    requiresAction: false,
  };
}

/**
 * Demo case details
 */
function getDemoCaseDetails(caseId: string): any {
  return {
    caseId,
    status: 'UNDER_REVIEW',
    demo: true,
    message: 'This is demo data. Configure Audatex credentials for real data.',
  };
}

export default {
  authenticate,
  submitEstimate,
  checkStatus,
  getCaseDetails,
  getAudatexConfig,
};
