/**
 * Insurance DRP Integration Types
 * Phase 6 - Support for CCC ONE, Mitchell, Audatex
 */

// Supported insurance platforms
export type InsurancePlatform = 'ccc_one' | 'mitchell' | 'audatex';

// Submission status
export type SubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'received'
  | 'in_review'
  | 'approved'
  | 'approved_with_changes'
  | 'rejected'
  | 'supplement_requested'
  | 'closed';

// Insurance claim information
export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyNumber?: string;
  insuranceCompany: string;
  platform: InsurancePlatform;
  adjusterName?: string;
  adjusterEmail?: string;
  adjusterPhone?: string;
  dateOfLoss: string;
  deductible?: number;
}

// Estimate submission request
export interface EstimateSubmission {
  id: string;
  estimateId: string;
  platform: InsurancePlatform;
  claimNumber: string;
  status: SubmissionStatus;
  submittedAt: string;
  submittedBy: string;
  externalId?: string; // ID from insurance platform
  responseData?: any;
  errorMessage?: string;
  lastCheckedAt?: string;
  approvedAmount?: number;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

// Submission response from insurance platform
export interface SubmissionResponse {
  success: boolean;
  externalId?: string;
  status: SubmissionStatus;
  message?: string;
  estimatedReviewTime?: string;
  additionalInfo?: Record<string, any>;
}

// Approval tracking
export interface ApprovalRecord {
  id: string;
  submissionId: string;
  status: SubmissionStatus;
  timestamp: string;
  approvedAmount?: number;
  changes?: EstimateChange[];
  adjusterNotes?: string;
  requiresAction: boolean;
}

// Changes made by adjuster
export interface EstimateChange {
  id: string;
  field: string;
  itemId?: string;
  originalValue: any;
  newValue: any;
  reason?: string;
  category: 'labor' | 'parts' | 'paint' | 'other';
  changeType: 'added' | 'removed' | 'modified';
  dollarImpact: number;
}

// Supplement request
export interface SupplementRequest {
  id: string;
  estimateId: string;
  submissionId: string;
  reason: string;
  items: SupplementItem[];
  totalAmount: number;
  status: SubmissionStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedAmount?: number;
  adjusterNotes?: string;
}

// Supplement line item
export interface SupplementItem {
  id: string;
  type: 'labor' | 'parts' | 'paint' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
  photos?: string[];
}

// Platform-specific configuration
export interface PlatformConfig {
  platform: InsurancePlatform;
  apiUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  shopId?: string;
  additionalConfig?: Record<string, string>;
}

// Estimate data formatted for submission
export interface FormattedEstimate {
  shopInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId?: string;
    licenseNumber?: string;
  };
  vehicleInfo: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    color?: string;
    mileage?: number;
    plateNumber?: string;
  };
  claimInfo: {
    claimNumber: string;
    policyNumber?: string;
    dateOfLoss: string;
    deductible?: number;
  };
  customerInfo: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  lineItems: FormattedLineItem[];
  totals: {
    laborTotal: number;
    partsTotal: number;
    paintTotal: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
  photos?: string[];
  notes?: string;
}

// Formatted line item for submission
export interface FormattedLineItem {
  id: string;
  type: 'labor' | 'parts' | 'paint' | 'other';
  operationCode?: string;
  description: string;
  panelLocation?: string;
  quantity: number;
  unitPrice: number;
  hours?: number;
  laborRate?: number;
  paintHours?: number;
  totalPrice: number;
  partNumber?: string;
  manufacturer?: string;
  partType?: 'OEM' | 'aftermarket' | 'recycled' | 'remanufactured';
}

// Webhook event from insurance platform
export interface InsuranceWebhookEvent {
  platform: InsurancePlatform;
  eventType: 'status_update' | 'approval' | 'rejection' | 'change' | 'message';
  externalId: string;
  timestamp: string;
  data: any;
}

// Insurance company presets
export interface InsuranceCompanyPreset {
  id: string;
  name: string;
  platform: InsurancePlatform;
  apiEndpoint?: string;
  requiresPreAuth: boolean;
  averageReviewDays: number;
  drpPartner: boolean;
}

// Common insurance companies
export const INSURANCE_COMPANIES: InsuranceCompanyPreset[] = [
  {
    id: 'state_farm',
    name: 'State Farm',
    platform: 'ccc_one',
    requiresPreAuth: false,
    averageReviewDays: 3,
    drpPartner: true,
  },
  {
    id: 'geico',
    name: 'GEICO',
    platform: 'mitchell',
    requiresPreAuth: false,
    averageReviewDays: 2,
    drpPartner: true,
  },
  {
    id: 'progressive',
    name: 'Progressive',
    platform: 'ccc_one',
    requiresPreAuth: false,
    averageReviewDays: 2,
    drpPartner: true,
  },
  {
    id: 'allstate',
    name: 'Allstate',
    platform: 'ccc_one',
    requiresPreAuth: true,
    averageReviewDays: 3,
    drpPartner: true,
  },
  {
    id: 'usaa',
    name: 'USAA',
    platform: 'mitchell',
    requiresPreAuth: false,
    averageReviewDays: 2,
    drpPartner: true,
  },
  {
    id: 'liberty_mutual',
    name: 'Liberty Mutual',
    platform: 'ccc_one',
    requiresPreAuth: false,
    averageReviewDays: 3,
    drpPartner: false,
  },
  {
    id: 'farmers',
    name: 'Farmers',
    platform: 'audatex',
    requiresPreAuth: true,
    averageReviewDays: 4,
    drpPartner: true,
  },
  {
    id: 'nationwide',
    name: 'Nationwide',
    platform: 'mitchell',
    requiresPreAuth: false,
    averageReviewDays: 3,
    drpPartner: false,
  },
  {
    id: 'travelers',
    name: 'Travelers',
    platform: 'ccc_one',
    requiresPreAuth: true,
    averageReviewDays: 4,
    drpPartner: false,
  },
  {
    id: 'american_family',
    name: 'American Family',
    platform: 'audatex',
    requiresPreAuth: false,
    averageReviewDays: 3,
    drpPartner: true,
  },
];

export default {
  INSURANCE_COMPANIES,
};
