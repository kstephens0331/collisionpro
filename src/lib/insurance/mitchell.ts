/**
 * Mitchell Cloud API Integration
 * Phase 6.2 - Insurance DRP Integration
 *
 * Mitchell is used by: GEICO, USAA, Nationwide
 */

import {
  PlatformConfig,
  FormattedEstimate,
  SubmissionResponse,
  SubmissionStatus,
  ApprovalRecord,
} from './types';

// Mitchell specific types
interface MitchellAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
}

interface MitchellEstimateResponse {
  assignmentId: string;
  workfileId: string;
  status: string;
  message?: string;
  estimatedCompletionDate?: string;
}

interface MitchellStatusResponse {
  workfileId: string;
  assignmentId: string;
  status: string;
  updatedAt: string;
  approvedTotal?: number;
  reviewerComments?: string;
  modifications?: any[];
}

// Token cache
let mitchellToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Mitchell configuration from environment
 */
export function getMitchellConfig(): PlatformConfig {
  return {
    platform: 'mitchell',
    apiUrl: process.env.MITCHELL_API_URL || 'https://api.mitchell.com/v2',
    clientId: process.env.MITCHELL_CLIENT_ID,
    clientSecret: process.env.MITCHELL_CLIENT_SECRET,
    username: process.env.MITCHELL_USERNAME,
    password: process.env.MITCHELL_PASSWORD,
    shopId: process.env.MITCHELL_SHOP_ID,
  };
}

/**
 * Authenticate with Mitchell API
 */
export async function authenticate(): Promise<string> {
  const config = getMitchellConfig();

  // Check cached token
  if (mitchellToken && Date.now() < mitchellToken.expiresAt) {
    return mitchellToken.token;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Mitchell credentials not configured. Set MITCHELL_CLIENT_ID and MITCHELL_CLIENT_SECRET');
  }

  try {
    const response = await fetch(`${config.apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        username: config.username,
        password: config.password,
        grantType: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data: MitchellAuthResponse = await response.json();

    // Cache token
    mitchellToken = {
      token: data.accessToken,
      expiresAt: Date.now() + (data.expiresIn - 60) * 1000,
    };

    return data.accessToken;
  } catch (error) {
    console.error('Mitchell auth error:', error);
    throw new Error(`Mitchell authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Submit estimate to Mitchell WorkCenter
 */
export async function submitEstimate(
  estimate: FormattedEstimate,
  claimNumber: string
): Promise<SubmissionResponse> {
  const config = getMitchellConfig();

  // Check if credentials are configured
  if (!config.clientId || !config.clientSecret) {
    console.log('Mitchell not configured, returning demo response');
    return getDemoSubmissionResponse(claimNumber);
  }

  try {
    const token = await authenticate();

    // Transform estimate to Mitchell format
    const mitchellEstimate = transformToMitchellFormat(estimate, claimNumber);

    const response = await fetch(`${config.apiUrl}/workfiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Shop-ID': config.shopId || '',
      },
      body: JSON.stringify(mitchellEstimate),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Submission failed: ${response.status} - ${error}`);
    }

    const data: MitchellEstimateResponse = await response.json();

    return {
      success: true,
      externalId: data.workfileId,
      status: mapMitchellStatus(data.status),
      message: data.message || 'Estimate submitted to Mitchell WorkCenter',
      estimatedReviewTime: data.estimatedCompletionDate,
      additionalInfo: {
        assignmentId: data.assignmentId,
        workfileId: data.workfileId,
      },
    };
  } catch (error) {
    console.error('Mitchell submission error:', error);
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
export async function checkStatus(workfileId: string): Promise<ApprovalRecord> {
  const config = getMitchellConfig();

  if (!config.clientId || !config.clientSecret) {
    return getDemoApprovalRecord(workfileId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/workfiles/${workfileId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data: MitchellStatusResponse = await response.json();

    return {
      id: `approval_${Date.now()}`,
      submissionId: workfileId,
      status: mapMitchellStatus(data.status),
      timestamp: data.updatedAt,
      approvedAmount: data.approvedTotal,
      changes: data.modifications?.map(parseModification) || [],
      adjusterNotes: data.reviewerComments,
      requiresAction: ['approved_with_changes', 'rejected', 'supplement_requested'].includes(mapMitchellStatus(data.status)),
    };
  } catch (error) {
    console.error('Mitchell status check error:', error);
    throw error;
  }
}

/**
 * Get workfile details from Mitchell
 */
export async function getWorkfileDetails(workfileId: string): Promise<any> {
  const config = getMitchellConfig();

  if (!config.clientId || !config.clientSecret) {
    return getDemoWorkfileDetails(workfileId);
  }

  try {
    const token = await authenticate();

    const response = await fetch(`${config.apiUrl}/workfiles/${workfileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workfile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Mitchell get workfile error:', error);
    throw error;
  }
}

/**
 * Transform estimate to Mitchell format
 */
function transformToMitchellFormat(estimate: FormattedEstimate, claimNumber: string): any {
  return {
    claim: {
      claimNumber,
      dateOfLoss: estimate.claimInfo.dateOfLoss,
      policyNumber: estimate.claimInfo.policyNumber,
      deductible: estimate.claimInfo.deductible,
    },
    vehicle: {
      vin: estimate.vehicleInfo.vin,
      year: estimate.vehicleInfo.year,
      make: estimate.vehicleInfo.make,
      model: estimate.vehicleInfo.model,
      subModel: estimate.vehicleInfo.trim,
      exteriorColor: estimate.vehicleInfo.color,
      odometer: estimate.vehicleInfo.mileage,
      licensePlate: estimate.vehicleInfo.plateNumber,
    },
    owner: {
      name: estimate.customerInfo.name,
      phoneNumber: estimate.customerInfo.phone,
      emailAddress: estimate.customerInfo.email,
      address: estimate.customerInfo.address,
    },
    repairFacility: {
      name: estimate.shopInfo.name,
      address: estimate.shopInfo.address,
      phoneNumber: estimate.shopInfo.phone,
      emailAddress: estimate.shopInfo.email,
      federalTaxId: estimate.shopInfo.taxId,
      licenseNumber: estimate.shopInfo.licenseNumber,
    },
    damageLines: estimate.lineItems.map(item => ({
      type: mapLineToMitchellType(item.type),
      operationCode: item.operationCode,
      description: item.description,
      panelCode: item.panelLocation,
      quantity: item.quantity,
      rate: item.unitPrice,
      hours: item.hours,
      paintHours: item.paintHours,
      amount: item.totalPrice,
      part: item.partNumber ? {
        partNumber: item.partNumber,
        vendor: item.manufacturer,
        type: mapPartType(item.partType),
        price: item.unitPrice,
      } : undefined,
    })),
    summary: {
      laborAmount: estimate.totals.laborTotal,
      partsAmount: estimate.totals.partsTotal,
      paintAmount: estimate.totals.paintTotal,
      subtotalAmount: estimate.totals.subtotal,
      taxRate: estimate.totals.taxRate,
      taxAmount: estimate.totals.taxAmount,
      totalAmount: estimate.totals.total,
    },
    attachments: estimate.photos?.map(url => ({ url, type: 'PHOTO' })),
    notes: estimate.notes,
  };
}

/**
 * Map line item type to Mitchell format
 */
function mapLineToMitchellType(type: string): string {
  const mapping: Record<string, string> = {
    labor: 'LBR',
    parts: 'PRT',
    paint: 'REF',
    other: 'OTH',
  };
  return mapping[type] || 'OTH';
}

/**
 * Map part type to Mitchell format
 */
function mapPartType(type?: string): string {
  if (!type) return 'OEM';
  const mapping: Record<string, string> = {
    OEM: 'OEM',
    aftermarket: 'AFM',
    recycled: 'REC',
    remanufactured: 'REM',
  };
  return mapping[type] || 'OEM';
}

/**
 * Map Mitchell status to our status
 */
function mapMitchellStatus(mitchellStatus: string): SubmissionStatus {
  const mapping: Record<string, SubmissionStatus> = {
    'DRAFT': 'pending',
    'SUBMITTED': 'submitted',
    'ASSIGNED': 'received',
    'IN_PROGRESS': 'in_review',
    'COMPLETED': 'approved',
    'APPROVED_WITH_CHANGES': 'approved_with_changes',
    'RETURNED': 'rejected',
    'SUPPLEMENT_REQUIRED': 'supplement_requested',
    'CLOSED': 'closed',
  };
  return mapping[mitchellStatus.toUpperCase()] || 'pending';
}

/**
 * Parse modification from Mitchell format
 */
function parseModification(mod: any): any {
  return {
    id: mod.id || `mod_${Date.now()}`,
    field: mod.field,
    itemId: mod.lineId,
    originalValue: mod.before,
    newValue: mod.after,
    reason: mod.comment,
    category: mod.lineType?.toLowerCase() || 'other',
    changeType: mod.action?.toLowerCase() || 'modified',
    dollarImpact: mod.difference || 0,
  };
}

/**
 * Demo submission response
 */
function getDemoSubmissionResponse(claimNumber: string): SubmissionResponse {
  const workfileId = `MITCH_${Date.now()}_${claimNumber}`;
  return {
    success: true,
    externalId: workfileId,
    status: 'submitted',
    message: 'Estimate submitted to Mitchell WorkCenter (Demo Mode)',
    estimatedReviewTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    additionalInfo: {
      demo: true,
      platform: 'Mitchell',
      workfileId,
      assignmentId: `ASSGN_${Date.now()}`,
      note: 'Configure MITCHELL_CLIENT_ID and MITCHELL_CLIENT_SECRET for real submissions',
    },
  };
}

/**
 * Demo approval record
 */
function getDemoApprovalRecord(workfileId: string): ApprovalRecord {
  return {
    id: `approval_${Date.now()}`,
    submissionId: workfileId,
    status: 'in_review',
    timestamp: new Date().toISOString(),
    adjusterNotes: 'Workfile is being reviewed (Demo Mode)',
    requiresAction: false,
  };
}

/**
 * Demo workfile details
 */
function getDemoWorkfileDetails(workfileId: string): any {
  return {
    workfileId,
    status: 'IN_PROGRESS',
    demo: true,
    message: 'This is demo data. Configure Mitchell credentials for real data.',
  };
}

export default {
  authenticate,
  submitEstimate,
  checkStatus,
  getWorkfileDetails,
  getMitchellConfig,
};
