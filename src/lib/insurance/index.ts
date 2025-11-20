/**
 * Insurance DRP Integration - Unified Service
 * Phase 6 - Support for CCC ONE, Mitchell, Audatex
 */

import * as cccOne from './ccc-one';
import * as mitchell from './mitchell';
import * as audatex from './audatex';
import {
  InsurancePlatform,
  FormattedEstimate,
  SubmissionResponse,
  ApprovalRecord,
  INSURANCE_COMPANIES,
  InsuranceCompanyPreset,
} from './types';

// Re-export types
export * from './types';

/**
 * Submit estimate to insurance platform
 */
export async function submitEstimate(
  platform: InsurancePlatform,
  estimate: FormattedEstimate,
  claimNumber: string
): Promise<SubmissionResponse> {
  switch (platform) {
    case 'ccc_one':
      return cccOne.submitEstimate(estimate, claimNumber);
    case 'mitchell':
      return mitchell.submitEstimate(estimate, claimNumber);
    case 'audatex':
      return audatex.submitEstimate(estimate, claimNumber);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Check submission status
 */
export async function checkStatus(
  platform: InsurancePlatform,
  externalId: string
): Promise<ApprovalRecord> {
  switch (platform) {
    case 'ccc_one':
      return cccOne.checkStatus(externalId);
    case 'mitchell':
      return mitchell.checkStatus(externalId);
    case 'audatex':
      return audatex.checkStatus(externalId);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get details from insurance platform
 */
export async function getDetails(
  platform: InsurancePlatform,
  externalId: string
): Promise<any> {
  switch (platform) {
    case 'ccc_one':
      return cccOne.getEstimateDetails(externalId);
    case 'mitchell':
      return mitchell.getWorkfileDetails(externalId);
    case 'audatex':
      return audatex.getCaseDetails(externalId);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get platform configuration status
 */
export function getPlatformStatus(): {
  ccc_one: boolean;
  mitchell: boolean;
  audatex: boolean;
} {
  const cccConfig = cccOne.getCCCConfig();
  const mitchellConfig = mitchell.getMitchellConfig();
  const audatexConfig = audatex.getAudatexConfig();

  return {
    ccc_one: !!(cccConfig.clientId && cccConfig.clientSecret),
    mitchell: !!(mitchellConfig.clientId && mitchellConfig.clientSecret),
    audatex: !!(audatexConfig.apiKey || (audatexConfig.username && audatexConfig.password)),
  };
}

/**
 * Get insurance company by ID
 */
export function getInsuranceCompany(id: string): InsuranceCompanyPreset | undefined {
  return INSURANCE_COMPANIES.find(company => company.id === id);
}

/**
 * Get insurance companies by platform
 */
export function getCompaniesByPlatform(platform: InsurancePlatform): InsuranceCompanyPreset[] {
  return INSURANCE_COMPANIES.filter(company => company.platform === platform);
}

/**
 * Get all DRP partner companies
 */
export function getDRPPartners(): InsuranceCompanyPreset[] {
  return INSURANCE_COMPANIES.filter(company => company.drpPartner);
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: InsurancePlatform): string {
  const names: Record<InsurancePlatform, string> = {
    ccc_one: 'CCC ONE',
    mitchell: 'Mitchell',
    audatex: 'Audatex',
  };
  return names[platform] || platform;
}

/**
 * Validate claim number format
 */
export function validateClaimNumber(claimNumber: string): boolean {
  // Most claim numbers are alphanumeric with possible dashes
  const pattern = /^[A-Z0-9\-]{5,25}$/i;
  return pattern.test(claimNumber.trim());
}

/**
 * Format claim number for display
 */
export function formatClaimNumber(claimNumber: string): string {
  return claimNumber.trim().toUpperCase();
}

export default {
  submitEstimate,
  checkStatus,
  getDetails,
  getPlatformStatus,
  getInsuranceCompany,
  getCompaniesByPlatform,
  getDRPPartners,
  getPlatformDisplayName,
  validateClaimNumber,
  formatClaimNumber,
  INSURANCE_COMPANIES,
};
