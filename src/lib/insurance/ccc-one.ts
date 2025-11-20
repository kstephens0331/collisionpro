/**
 * CCC ONE API Integration
 * Phase 6.1 - Insurance DRP Integration
 *
 * CCC ONE is used by: State Farm, Progressive, Allstate, Liberty Mutual, Travelers
 */

import {
  PlatformConfig,
  FormattedEstimate,
  SubmissionResponse,
  SubmissionStatus,
  ApprovalRecord,
} from './types';

// CCC ONE specific types
interface CCCAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface CCCEstimateResponse {
  estimateId: string;
  status: string;
  message?: string;
  reviewDueDate?: string;
  assignedAdjuster?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface CCCStatusResponse {
  estimateId: string;
  status: string;
  lastUpdated: string;
  approvalAmount?: number;
  adjusterNotes?: string;
  changes?: any[];
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get CCC ONE configuration from environment
 */
export function getCCCConfig(): PlatformConfig {
  return {
    platform: 'ccc_one',
    apiUrl: process.env.CCC_ONE_API_URL || 'https://api.cccis.com/v1',
    clientId: process.env.CCC_ONE_CLIENT_ID,
    clientSecret: process.env.CCC_ONE_CLIENT_SECRET,
    shopId: process.env.CCC_ONE_SHOP_ID,
  };
}

/**
 * Authenticate with CCC ONE API
 */
export async function authenticate(): Promise<string> {
  const config = getCCCConfig();

  // Check cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('CCC ONE credentials not configured. Set CCC_ONE_CLIENT_ID and CCC_ONE_CLIENT_SECRET');
  }

  try {
    const response = await fetch(`${config.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: 'estimates.write estimates.read',
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: CCCAuthResponse = await response.json();

    // Cache token
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Buffer 60 seconds
    };

    return data.access_token;
  } catch (error) {
    console.error('CCC ONE auth error:', error);
    throw new Error(`CCC ONE authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit estimate to CCC ONE
 */
export async function submitEstimate(
  estimate: FormattedEstimate,
  claimNumber: string
): Promise<SubmissionResponse> {
  const config = getCCCConfig();

  // Check if credentials are configured
  if (!config.clientId || !config.clientSecret) {
    // Return demo response
    console.log('CCC ONE not configured, returning demo response');
    return getDemoSubmissionResponse(claimNumber);
  }

  try {
    const token = await authenticate();

    // Transform estimate to CCC ONE format
    const cccEstimate = transformToCCCFormat(estimate, claimNumber);

    const response = await fetch(`${config.apiUrl}/estimates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Shop-ID': config.shopId || '',
      },
      body: JSON.stringify(cccEstimate),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Submission failed: ${response.status} - ${error}`);
    }

    const data: CCCEstimateResponse = await response.json();

    return {
      success: true,
      externalId: data.estimateId,
      status: mapCCCStatus(data.status),
      message: data.message || 'Estimate submitted successfully',
      estimatedReviewTime: data.reviewDueDate,
      additionalInfo: {
        adjuster: data.assignedAdjuster,
      },
    };
  } catch (error) {
    console.error('CCC ONE submission error:', error);
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
export async function checkStatus(externalId: string): Promise<ApprovalRecord> {
  const config = getCCCConfig();

  // Check if credentials are configured
  if (!config.clientId || !config.clientSecret) {
    // Return demo status
    return getDemoApprovalRecord(externalId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/estimates/${externalId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data: CCCStatusResponse = await response.json();

    return {
      id: `approval_${Date.now()}`,
      submissionId: externalId,
      status: mapCCCStatus(data.status),
      timestamp: data.lastUpdated,
      approvedAmount: data.approvalAmount,
      changes: data.changes?.map(parseChange) || [],
      adjusterNotes: data.adjusterNotes,
      requiresAction: ['approved_with_changes', 'rejected', 'supplement_requested'].includes(mapCCCStatus(data.status)),
    };
  } catch (error) {
    console.error('CCC ONE status check error:', error);
    throw error;
  }
}

/**
 * Get estimate details from CCC ONE
 */
export async function getEstimateDetails(externalId: string): Promise<any> {
  const config = getCCCConfig();

  if (!config.clientId || !config.clientSecret) {
    return getDemoEstimateDetails(externalId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/estimates/${externalId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get estimate: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('CCC ONE get estimate error:', error);
    throw error;
  }
}

/**
 * Transform estimate to CCC ONE format
 */
function transformToCCCFormat(estimate: FormattedEstimate, claimNumber: string): any {
  return {
    claimNumber,
    vehicle: {
      vin: estimate.vehicleInfo.vin,
      year: estimate.vehicleInfo.year,
      make: estimate.vehicleInfo.make,
      model: estimate.vehicleInfo.model,
      trim: estimate.vehicleInfo.trim,
      color: estimate.vehicleInfo.color,
      mileage: estimate.vehicleInfo.mileage,
      plateNumber: estimate.vehicleInfo.plateNumber,
    },
    customer: {
      name: estimate.customerInfo.name,
      phone: estimate.customerInfo.phone,
      email: estimate.customerInfo.email,
      address: estimate.customerInfo.address,
    },
    shop: {
      name: estimate.shopInfo.name,
      address: estimate.shopInfo.address,
      phone: estimate.shopInfo.phone,
      email: estimate.shopInfo.email,
      taxId: estimate.shopInfo.taxId,
      license: estimate.shopInfo.licenseNumber,
    },
    claim: {
      dateOfLoss: estimate.claimInfo.dateOfLoss,
      policyNumber: estimate.claimInfo.policyNumber,
      deductible: estimate.claimInfo.deductible,
    },
    lines: estimate.lineItems.map(item => ({
      lineType: mapLineToCCCType(item.type),
      operationCode: item.operationCode,
      description: item.description,
      panel: item.panelLocation,
      quantity: item.quantity,
      unitAmount: item.unitPrice,
      laborHours: item.hours,
      laborRate: item.laborRate,
      paintHours: item.paintHours,
      amount: item.totalPrice,
      partNumber: item.partNumber,
      manufacturer: item.manufacturer,
      partType: item.partType,
    })),
    totals: {
      labor: estimate.totals.laborTotal,
      parts: estimate.totals.partsTotal,
      paint: estimate.totals.paintTotal,
      subtotal: estimate.totals.subtotal,
      taxRate: estimate.totals.taxRate,
      tax: estimate.totals.taxAmount,
      total: estimate.totals.total,
    },
    photos: estimate.photos,
    notes: estimate.notes,
  };
}

/**
 * Map line item type to CCC format
 */
function mapLineToCCCType(type: string): string {
  const mapping: Record<string, string> = {
    labor: 'LABOR',
    parts: 'PARTS',
    paint: 'REFINISH',
    other: 'OTHER',
  };
  return mapping[type] || 'OTHER';
}

/**
 * Map CCC status to our status
 */
function mapCCCStatus(cccStatus: string): SubmissionStatus {
  const mapping: Record<string, SubmissionStatus> = {
    'PENDING': 'pending',
    'SUBMITTED': 'submitted',
    'RECEIVED': 'received',
    'IN_REVIEW': 'in_review',
    'APPROVED': 'approved',
    'APPROVED_MODIFIED': 'approved_with_changes',
    'REJECTED': 'rejected',
    'SUPPLEMENT': 'supplement_requested',
    'CLOSED': 'closed',
  };
  return mapping[cccStatus.toUpperCase()] || 'pending';
}

/**
 * Parse change from CCC format
 */
function parseChange(change: any): any {
  return {
    id: change.id || `change_${Date.now()}`,
    field: change.field,
    itemId: change.lineId,
    originalValue: change.originalValue,
    newValue: change.newValue,
    reason: change.reason,
    category: change.type?.toLowerCase() || 'other',
    changeType: change.action?.toLowerCase() || 'modified',
    dollarImpact: change.impact || 0,
  };
}

/**
 * Demo submission response
 */
function getDemoSubmissionResponse(claimNumber: string): SubmissionResponse {
  return {
    success: true,
    externalId: `CCC_${Date.now()}_${claimNumber}`,
    status: 'submitted',
    message: 'Estimate submitted successfully (Demo Mode)',
    estimatedReviewTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    additionalInfo: {
      demo: true,
      platform: 'CCC ONE',
      note: 'Configure CCC_ONE_CLIENT_ID and CCC_ONE_CLIENT_SECRET for real submissions',
    },
  };
}

/**
 * Demo approval record
 */
function getDemoApprovalRecord(externalId: string): ApprovalRecord {
  return {
    id: `approval_${Date.now()}`,
    submissionId: externalId,
    status: 'in_review',
    timestamp: new Date().toISOString(),
    adjusterNotes: 'Estimate is being reviewed by adjuster (Demo Mode)',
    requiresAction: false,
  };
}

/**
 * Demo estimate details
 */
function getDemoEstimateDetails(externalId: string): any {
  return {
    id: externalId,
    status: 'IN_REVIEW',
    demo: true,
    message: 'This is demo data. Configure CCC ONE credentials for real data.',
  };
}

export default {
  authenticate,
  submitEstimate,
  checkStatus,
  getEstimateDetails,
  getCCCConfig,
};
