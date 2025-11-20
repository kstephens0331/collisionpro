/**
 * Insurance Claim Validation & Quality Checks
 * Prevents rejections by validating estimate quality before submission
 */

import { FormattedEstimate } from './types';

// Validation result types
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  field: string;
  message: string;
  suggestion: string;
  rejectionRisk: 'high' | 'medium' | 'low';
  category: 'vehicle' | 'claim' | 'customer' | 'shop' | 'pricing' | 'documentation';
}

export interface ValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  qualityScore: number; // 0-100
  rejectionRisk: 'high' | 'medium' | 'low';
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

// Industry-standard validation rules
const VALIDATION_RULES = {
  // VIN validation
  VIN_LENGTH: 17,
  VIN_PATTERN: /^[A-HJ-NPR-Z0-9]{17}$/i,

  // Pricing thresholds (flags for manual review)
  MAX_LABOR_RATE: 150, // Per hour
  MIN_LABOR_RATE: 35,
  MAX_PAINT_HOURS_PER_PANEL: 8,
  MAX_TOTAL_ESTIMATE: 50000, // Flags for total loss consideration

  // Required fields
  REQUIRED_VEHICLE_FIELDS: ['vin', 'year', 'make', 'model'],
  REQUIRED_CLAIM_FIELDS: ['claimNumber', 'dateOfLoss'],
  REQUIRED_CUSTOMER_FIELDS: ['name', 'phone'],

  // Date validations
  MAX_DAYS_SINCE_LOSS: 365, // Older claims need special handling
  MAX_FUTURE_DAYS: 7, // Date of loss can't be too far in future

  // Line item validations
  MIN_LINE_ITEMS: 1,
  MAX_DESCRIPTION_LENGTH: 255,
  MIN_QUANTITY: 0.01,
  MAX_QUANTITY_PARTS: 99,
  MAX_QUANTITY_LABOR: 99,
};

/**
 * Comprehensive estimate validation before insurance submission
 */
export function validateEstimateForInsurance(
  estimate: FormattedEstimate,
  platform: string
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Run all validation checks
  validateVehicleInfo(estimate, issues);
  validateClaimInfo(estimate, issues);
  validateCustomerInfo(estimate, issues);
  validateShopInfo(estimate, issues);
  validateLineItems(estimate, issues);
  validatePricing(estimate, issues);
  validateTotals(estimate, issues);
  validatePhotos(estimate, issues);
  validatePlatformSpecific(estimate, platform, issues);

  // Calculate quality score
  const qualityScore = calculateQualityScore(estimate, issues);

  // Determine rejection risk
  const rejectionRisk = calculateRejectionRisk(issues, qualityScore);

  // Determine if can submit
  const errors = issues.filter(i => i.severity === 'error').length;
  const highRiskIssues = issues.filter(i => i.rejectionRisk === 'high').length;

  return {
    isValid: errors === 0,
    canSubmit: errors === 0 && highRiskIssues === 0,
    qualityScore,
    rejectionRisk,
    issues: issues.sort((a, b) => {
      // Sort by severity, then rejection risk
      const severityOrder = { error: 0, warning: 1, info: 2 };
      const riskOrder = { high: 0, medium: 1, low: 2 };

      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return riskOrder[a.rejectionRisk] - riskOrder[b.rejectionRisk];
    }),
    summary: {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      infos: issues.filter(i => i.severity === 'info').length,
    },
  };
}

/**
 * Validate vehicle information
 */
function validateVehicleInfo(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { vehicleInfo } = estimate;

  // VIN validation
  if (!vehicleInfo.vin) {
    issues.push({
      id: 'vehicle_no_vin',
      severity: 'error',
      field: 'vehicleInfo.vin',
      message: 'VIN is required',
      suggestion: 'Enter the 17-character Vehicle Identification Number',
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  } else if (vehicleInfo.vin.length !== VALIDATION_RULES.VIN_LENGTH) {
    issues.push({
      id: 'vehicle_vin_length',
      severity: 'error',
      field: 'vehicleInfo.vin',
      message: `VIN must be exactly ${VALIDATION_RULES.VIN_LENGTH} characters`,
      suggestion: `Current VIN is ${vehicleInfo.vin.length} characters. Verify the VIN is complete`,
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  } else if (!VALIDATION_RULES.VIN_PATTERN.test(vehicleInfo.vin)) {
    issues.push({
      id: 'vehicle_vin_invalid',
      severity: 'error',
      field: 'vehicleInfo.vin',
      message: 'VIN contains invalid characters',
      suggestion: 'VIN should only contain letters (except I, O, Q) and numbers',
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  }

  // Year validation
  const currentYear = new Date().getFullYear();
  if (!vehicleInfo.year) {
    issues.push({
      id: 'vehicle_no_year',
      severity: 'error',
      field: 'vehicleInfo.year',
      message: 'Vehicle year is required',
      suggestion: 'Enter the model year of the vehicle',
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  } else if (vehicleInfo.year < 1981 || vehicleInfo.year > currentYear + 2) {
    issues.push({
      id: 'vehicle_year_invalid',
      severity: 'warning',
      field: 'vehicleInfo.year',
      message: 'Vehicle year seems unusual',
      suggestion: `Year ${vehicleInfo.year} is outside typical range (1981-${currentYear + 1}). Verify this is correct`,
      rejectionRisk: 'medium',
      category: 'vehicle',
    });
  }

  // Make/Model validation
  if (!vehicleInfo.make || vehicleInfo.make.trim().length < 2) {
    issues.push({
      id: 'vehicle_no_make',
      severity: 'error',
      field: 'vehicleInfo.make',
      message: 'Vehicle make is required',
      suggestion: 'Enter the manufacturer (e.g., Toyota, Ford, Honda)',
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  }

  if (!vehicleInfo.model || vehicleInfo.model.trim().length < 2) {
    issues.push({
      id: 'vehicle_no_model',
      severity: 'error',
      field: 'vehicleInfo.model',
      message: 'Vehicle model is required',
      suggestion: 'Enter the model name (e.g., Camry, F-150, Accord)',
      rejectionRisk: 'high',
      category: 'vehicle',
    });
  }

  // Mileage validation
  if (vehicleInfo.mileage && vehicleInfo.mileage < 0) {
    issues.push({
      id: 'vehicle_negative_mileage',
      severity: 'error',
      field: 'vehicleInfo.mileage',
      message: 'Mileage cannot be negative',
      suggestion: 'Enter the current odometer reading',
      rejectionRisk: 'medium',
      category: 'vehicle',
    });
  } else if (vehicleInfo.mileage && vehicleInfo.mileage > 500000) {
    issues.push({
      id: 'vehicle_high_mileage',
      severity: 'warning',
      field: 'vehicleInfo.mileage',
      message: 'Very high mileage',
      suggestion: `${vehicleInfo.mileage.toLocaleString()} miles is unusually high. Verify accuracy`,
      rejectionRisk: 'low',
      category: 'vehicle',
    });
  }

  // Color - helpful but not always required
  if (!vehicleInfo.color) {
    issues.push({
      id: 'vehicle_no_color',
      severity: 'info',
      field: 'vehicleInfo.color',
      message: 'Vehicle color not specified',
      suggestion: 'Adding color helps insurance identify the vehicle',
      rejectionRisk: 'low',
      category: 'vehicle',
    });
  }
}

/**
 * Validate claim information
 */
function validateClaimInfo(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { claimInfo } = estimate;

  // Claim number validation
  if (!claimInfo.claimNumber || claimInfo.claimNumber.trim().length < 5) {
    issues.push({
      id: 'claim_no_number',
      severity: 'error',
      field: 'claimInfo.claimNumber',
      message: 'Valid claim number is required',
      suggestion: 'Enter the insurance company claim number (minimum 5 characters)',
      rejectionRisk: 'high',
      category: 'claim',
    });
  }

  // Date of loss validation
  if (!claimInfo.dateOfLoss) {
    issues.push({
      id: 'claim_no_date',
      severity: 'error',
      field: 'claimInfo.dateOfLoss',
      message: 'Date of loss is required',
      suggestion: 'Enter the date when the damage occurred',
      rejectionRisk: 'high',
      category: 'claim',
    });
  } else {
    const lossDate = new Date(claimInfo.dateOfLoss);
    const now = new Date();
    const daysSinceLoss = Math.floor((now.getTime() - lossDate.getTime()) / (1000 * 60 * 60 * 24));

    if (lossDate > now) {
      if (daysSinceLoss < -VALIDATION_RULES.MAX_FUTURE_DAYS) {
        issues.push({
          id: 'claim_future_date',
          severity: 'error',
          field: 'claimInfo.dateOfLoss',
          message: 'Date of loss cannot be in the future',
          suggestion: 'Verify the date is correct. Date is more than a week in the future',
          rejectionRisk: 'high',
          category: 'claim',
        });
      } else {
        issues.push({
          id: 'claim_future_date_warning',
          severity: 'warning',
          field: 'claimInfo.dateOfLoss',
          message: 'Date of loss is in the future',
          suggestion: 'Verify this is the correct date',
          rejectionRisk: 'medium',
          category: 'claim',
        });
      }
    } else if (daysSinceLoss > VALIDATION_RULES.MAX_DAYS_SINCE_LOSS) {
      issues.push({
        id: 'claim_old_date',
        severity: 'warning',
        field: 'claimInfo.dateOfLoss',
        message: 'Claim is over 1 year old',
        suggestion: 'Old claims may require additional documentation or supervisor approval',
        rejectionRisk: 'medium',
        category: 'claim',
      });
    }
  }

  // Deductible validation
  if (claimInfo.deductible !== undefined) {
    if (claimInfo.deductible < 0) {
      issues.push({
        id: 'claim_negative_deductible',
        severity: 'error',
        field: 'claimInfo.deductible',
        message: 'Deductible cannot be negative',
        suggestion: 'Enter the deductible amount or leave blank if unknown',
        rejectionRisk: 'medium',
        category: 'claim',
      });
    } else if (claimInfo.deductible > 5000) {
      issues.push({
        id: 'claim_high_deductible',
        severity: 'warning',
        field: 'claimInfo.deductible',
        message: 'Unusually high deductible',
        suggestion: `$${claimInfo.deductible} deductible is higher than typical. Verify this is correct`,
        rejectionRisk: 'low',
        category: 'claim',
      });
    }
  }

  // Policy number - recommended but not always required
  if (!claimInfo.policyNumber) {
    issues.push({
      id: 'claim_no_policy',
      severity: 'info',
      field: 'claimInfo.policyNumber',
      message: 'Policy number not provided',
      suggestion: 'Including policy number helps prevent delays in processing',
      rejectionRisk: 'low',
      category: 'claim',
    });
  }
}

/**
 * Validate customer information
 */
function validateCustomerInfo(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { customerInfo } = estimate;

  // Name validation
  if (!customerInfo.name || customerInfo.name.trim().length < 2) {
    issues.push({
      id: 'customer_no_name',
      severity: 'error',
      field: 'customerInfo.name',
      message: 'Customer name is required',
      suggestion: 'Enter the full name of the vehicle owner or policyholder',
      rejectionRisk: 'high',
      category: 'customer',
    });
  }

  // Phone validation
  if (!customerInfo.phone) {
    issues.push({
      id: 'customer_no_phone',
      severity: 'warning',
      field: 'customerInfo.phone',
      message: 'Customer phone number missing',
      suggestion: 'Adding contact information helps insurance adjusters reach the customer',
      rejectionRisk: 'medium',
      category: 'customer',
    });
  } else {
    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      issues.push({
        id: 'customer_invalid_phone',
        severity: 'warning',
        field: 'customerInfo.phone',
        message: 'Phone number appears incomplete',
        suggestion: 'US phone numbers should have 10 digits',
        rejectionRisk: 'low',
        category: 'customer',
      });
    }
  }

  // Email validation
  if (customerInfo.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customerInfo.email)) {
      issues.push({
        id: 'customer_invalid_email',
        severity: 'warning',
        field: 'customerInfo.email',
        message: 'Email address appears invalid',
        suggestion: 'Verify email format (e.g., customer@example.com)',
        rejectionRisk: 'low',
        category: 'customer',
      });
    }
  }
}

/**
 * Validate shop information
 */
function validateShopInfo(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { shopInfo } = estimate;

  if (!shopInfo.name || shopInfo.name.trim().length < 2) {
    issues.push({
      id: 'shop_no_name',
      severity: 'error',
      field: 'shopInfo.name',
      message: 'Shop name is required',
      suggestion: 'Enter your collision repair shop name',
      rejectionRisk: 'high',
      category: 'shop',
    });
  }

  if (!shopInfo.phone) {
    issues.push({
      id: 'shop_no_phone',
      severity: 'warning',
      field: 'shopInfo.phone',
      message: 'Shop phone number missing',
      suggestion: 'Insurance adjusters need to be able to contact your shop',
      rejectionRisk: 'medium',
      category: 'shop',
    });
  }

  if (!shopInfo.address) {
    issues.push({
      id: 'shop_no_address',
      severity: 'warning',
      field: 'shopInfo.address',
      message: 'Shop address missing',
      suggestion: 'Shop address helps insurance verify location',
      rejectionRisk: 'medium',
      category: 'shop',
    });
  }

  // Tax ID and License recommended for DRP
  if (!shopInfo.taxId) {
    issues.push({
      id: 'shop_no_tax_id',
      severity: 'info',
      field: 'shopInfo.taxId',
      message: 'Tax ID not provided',
      suggestion: 'Tax ID may be required for DRP claims or payment processing',
      rejectionRisk: 'low',
      category: 'shop',
    });
  }

  if (!shopInfo.licenseNumber) {
    issues.push({
      id: 'shop_no_license',
      severity: 'info',
      field: 'shopInfo.licenseNumber',
      message: 'Shop license number not provided',
      suggestion: 'License number may be required for state reporting',
      rejectionRisk: 'low',
      category: 'shop',
    });
  }
}

/**
 * Validate line items
 */
function validateLineItems(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { lineItems } = estimate;

  if (!lineItems || lineItems.length === 0) {
    issues.push({
      id: 'items_none',
      severity: 'error',
      field: 'lineItems',
      message: 'No line items in estimate',
      suggestion: 'Add at least one repair operation, part, or paint item',
      rejectionRisk: 'high',
      category: 'pricing',
    });
    return;
  }

  lineItems.forEach((item, index) => {
    const itemPrefix = `lineItems[${index}]`;

    // Description validation
    if (!item.description || item.description.trim().length < 3) {
      issues.push({
        id: `item_${index}_no_description`,
        severity: 'error',
        field: `${itemPrefix}.description`,
        message: `Line item ${index + 1}: Missing description`,
        suggestion: 'Provide a clear description of the repair operation or part',
        rejectionRisk: 'high',
        category: 'pricing',
      });
    } else if (item.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
      issues.push({
        id: `item_${index}_long_description`,
        severity: 'warning',
        field: `${itemPrefix}.description`,
        message: `Line item ${index + 1}: Description too long`,
        suggestion: `Keep descriptions under ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} characters`,
        rejectionRisk: 'low',
        category: 'pricing',
      });
    }

    // Quantity validation
    if (item.quantity <= 0) {
      issues.push({
        id: `item_${index}_invalid_quantity`,
        severity: 'error',
        field: `${itemPrefix}.quantity`,
        message: `Line item ${index + 1}: Invalid quantity`,
        suggestion: 'Quantity must be greater than 0',
        rejectionRisk: 'high',
        category: 'pricing',
      });
    }

    // Price validation
    if (item.unitPrice < 0) {
      issues.push({
        id: `item_${index}_negative_price`,
        severity: 'error',
        field: `${itemPrefix}.unitPrice`,
        message: `Line item ${index + 1}: Negative price`,
        suggestion: 'Unit price cannot be negative',
        rejectionRisk: 'high',
        category: 'pricing',
      });
    } else if (item.unitPrice === 0 && item.type === 'parts') {
      issues.push({
        id: `item_${index}_zero_part_price`,
        severity: 'warning',
        field: `${itemPrefix}.unitPrice`,
        message: `Line item ${index + 1}: Zero-cost part`,
        suggestion: 'Parts with $0 cost may be questioned by insurance. Add note if this is intentional',
        rejectionRisk: 'medium',
        category: 'pricing',
      });
    }

    // Labor-specific validation
    if (item.type === 'labor') {
      if (item.hours && item.hours <= 0) {
        issues.push({
          id: `item_${index}_invalid_hours`,
          severity: 'error',
          field: `${itemPrefix}.hours`,
          message: `Line item ${index + 1}: Invalid labor hours`,
          suggestion: 'Labor hours must be greater than 0',
          rejectionRisk: 'high',
          category: 'pricing',
        });
      }

      if (item.laborRate) {
        if (item.laborRate < VALIDATION_RULES.MIN_LABOR_RATE) {
          issues.push({
            id: `item_${index}_low_labor_rate`,
            severity: 'warning',
            field: `${itemPrefix}.laborRate`,
            message: `Line item ${index + 1}: Unusually low labor rate`,
            suggestion: `$${item.laborRate}/hr is below typical market rate ($${VALIDATION_RULES.MIN_LABOR_RATE}-${VALIDATION_RULES.MAX_LABOR_RATE}/hr)`,
            rejectionRisk: 'low',
            category: 'pricing',
          });
        } else if (item.laborRate > VALIDATION_RULES.MAX_LABOR_RATE) {
          issues.push({
            id: `item_${index}_high_labor_rate`,
            severity: 'warning',
            field: `${itemPrefix}.laborRate`,
            message: `Line item ${index + 1}: High labor rate`,
            suggestion: `$${item.laborRate}/hr exceeds typical range. Insurance may require justification`,
            rejectionRisk: 'medium',
            category: 'pricing',
          });
        }
      }

      // Operation code recommended
      if (!item.operationCode) {
        issues.push({
          id: `item_${index}_no_op_code`,
          severity: 'info',
          field: `${itemPrefix}.operationCode`,
          message: `Line item ${index + 1}: No operation code`,
          suggestion: 'Using industry-standard operation codes reduces questions from adjusters',
          rejectionRisk: 'low',
          category: 'pricing',
        });
      }
    }

    // Parts-specific validation
    if (item.type === 'parts') {
      if (!item.partNumber) {
        issues.push({
          id: `item_${index}_no_part_number`,
          severity: 'warning',
          field: `${itemPrefix}.partNumber`,
          message: `Line item ${index + 1}: No part number`,
          suggestion: 'Including part numbers speeds approval and prevents questions',
          rejectionRisk: 'medium',
          category: 'pricing',
        });
      }

      if (!item.partType) {
        issues.push({
          id: `item_${index}_no_part_type`,
          severity: 'info',
          field: `${itemPrefix}.partType`,
          message: `Line item ${index + 1}: Part type not specified`,
          suggestion: 'Specify if part is OEM, aftermarket, recycled, or remanufactured',
          rejectionRisk: 'low',
          category: 'pricing',
        });
      }
    }

    // Paint-specific validation
    if (item.type === 'paint') {
      if (item.paintHours && item.paintHours > VALIDATION_RULES.MAX_PAINT_HOURS_PER_PANEL) {
        issues.push({
          id: `item_${index}_high_paint_hours`,
          severity: 'warning',
          field: `${itemPrefix}.paintHours`,
          message: `Line item ${index + 1}: High paint hours`,
          suggestion: `${item.paintHours} hours exceeds typical panel refinish time. May need explanation`,
          rejectionRisk: 'medium',
          category: 'pricing',
        });
      }
    }
  });
}

/**
 * Validate pricing and totals
 */
function validatePricing(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { totals } = estimate;

  // Check for negative totals
  if (totals.laborTotal < 0 || totals.partsTotal < 0 || totals.paintTotal < 0 || totals.total < 0) {
    issues.push({
      id: 'pricing_negative_total',
      severity: 'error',
      field: 'totals',
      message: 'Negative totals detected',
      suggestion: 'Review line items for negative prices',
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }

  // Warn on very high estimates (potential total loss)
  if (totals.total > VALIDATION_RULES.MAX_TOTAL_ESTIMATE) {
    issues.push({
      id: 'pricing_high_total',
      severity: 'warning',
      field: 'totals.total',
      message: 'Estimate exceeds typical repair threshold',
      suggestion: `$${totals.total.toLocaleString()} may trigger total loss evaluation. Confirm vehicle value supports repair`,
      rejectionRisk: 'medium',
      category: 'pricing',
    });
  }

  // Check tax calculation
  if (totals.taxRate > 0) {
    const expectedTax = totals.subtotal * (totals.taxRate / 100);
    const taxDifference = Math.abs(expectedTax - totals.taxAmount);

    if (taxDifference > 1) { // Allow $1 rounding difference
      issues.push({
        id: 'pricing_tax_mismatch',
        severity: 'warning',
        field: 'totals.taxAmount',
        message: 'Tax calculation may be incorrect',
        suggestion: `Expected tax: $${expectedTax.toFixed(2)}, Current: $${totals.taxAmount.toFixed(2)}`,
        rejectionRisk: 'medium',
        category: 'pricing',
      });
    }
  }

  // Verify total calculation
  const calculatedTotal = totals.subtotal + totals.taxAmount;
  const totalDifference = Math.abs(calculatedTotal - totals.total);

  if (totalDifference > 1) {
    issues.push({
      id: 'pricing_total_mismatch',
      severity: 'error',
      field: 'totals.total',
      message: 'Total does not match subtotal + tax',
      suggestion: `Subtotal ($${totals.subtotal}) + Tax ($${totals.taxAmount}) should equal $${calculatedTotal.toFixed(2)}`,
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }
}

/**
 * Validate totals match line items
 */
function validateTotals(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { lineItems, totals } = estimate;

  // Calculate totals from line items
  let calculatedLabor = 0;
  let calculatedParts = 0;
  let calculatedPaint = 0;

  lineItems.forEach(item => {
    const total = item.totalPrice || (item.quantity * item.unitPrice);

    switch (item.type) {
      case 'labor':
        calculatedLabor += total;
        break;
      case 'parts':
        calculatedParts += total;
        break;
      case 'paint':
        calculatedPaint += total;
        break;
    }
  });

  const calculatedSubtotal = calculatedLabor + calculatedParts + calculatedPaint;

  // Check labor total
  if (Math.abs(calculatedLabor - totals.laborTotal) > 1) {
    issues.push({
      id: 'totals_labor_mismatch',
      severity: 'error',
      field: 'totals.laborTotal',
      message: 'Labor total does not match line items',
      suggestion: `Line items sum to $${calculatedLabor.toFixed(2)}, but total shows $${totals.laborTotal.toFixed(2)}`,
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }

  // Check parts total
  if (Math.abs(calculatedParts - totals.partsTotal) > 1) {
    issues.push({
      id: 'totals_parts_mismatch',
      severity: 'error',
      field: 'totals.partsTotal',
      message: 'Parts total does not match line items',
      suggestion: `Line items sum to $${calculatedParts.toFixed(2)}, but total shows $${totals.partsTotal.toFixed(2)}`,
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }

  // Check paint total
  if (Math.abs(calculatedPaint - totals.paintTotal) > 1) {
    issues.push({
      id: 'totals_paint_mismatch',
      severity: 'error',
      field: 'totals.paintTotal',
      message: 'Paint total does not match line items',
      suggestion: `Line items sum to $${calculatedPaint.toFixed(2)}, but total shows $${totals.paintTotal.toFixed(2)}`,
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }

  // Check subtotal
  if (Math.abs(calculatedSubtotal - totals.subtotal) > 1) {
    issues.push({
      id: 'totals_subtotal_mismatch',
      severity: 'error',
      field: 'totals.subtotal',
      message: 'Subtotal does not match sum of labor, parts, and paint',
      suggestion: `Should be $${calculatedSubtotal.toFixed(2)}, shows $${totals.subtotal.toFixed(2)}`,
      rejectionRisk: 'high',
      category: 'pricing',
    });
  }
}

/**
 * Validate photos and documentation
 */
function validatePhotos(estimate: FormattedEstimate, issues: ValidationIssue[]): void {
  const { photos } = estimate;

  if (!photos || photos.length === 0) {
    issues.push({
      id: 'docs_no_photos',
      severity: 'warning',
      field: 'photos',
      message: 'No photos attached',
      suggestion: 'Photos of damage significantly speed approval and reduce questions',
      rejectionRisk: 'medium',
      category: 'documentation',
    });
  } else if (photos.length < 4) {
    issues.push({
      id: 'docs_few_photos',
      severity: 'info',
      field: 'photos',
      message: 'Limited photo documentation',
      suggestion: 'Insurance typically requests 4+ photos showing all damage angles',
      rejectionRisk: 'low',
      category: 'documentation',
    });
  }
}

/**
 * Platform-specific validation
 */
function validatePlatformSpecific(
  estimate: FormattedEstimate,
  platform: string,
  issues: ValidationIssue[]
): void {
  // CCC ONE specific
  if (platform === 'ccc_one') {
    // CCC ONE requires operation codes for labor
    const laborWithoutCodes = estimate.lineItems.filter(
      item => item.type === 'labor' && !item.operationCode
    ).length;

    if (laborWithoutCodes > 0) {
      issues.push({
        id: 'ccc_no_op_codes',
        severity: 'warning',
        field: 'lineItems',
        message: 'CCC ONE strongly recommends operation codes',
        suggestion: `${laborWithoutCodes} labor items missing operation codes. Add P-pages codes for faster approval`,
        rejectionRisk: 'medium',
        category: 'pricing',
      });
    }
  }

  // Mitchell specific
  if (platform === 'mitchell') {
    // Mitchell prefers part numbers for all parts
    const partsWithoutNumbers = estimate.lineItems.filter(
      item => item.type === 'parts' && !item.partNumber
    ).length;

    if (partsWithoutNumbers > 0) {
      issues.push({
        id: 'mitchell_no_part_numbers',
        severity: 'warning',
        field: 'lineItems',
        message: 'Mitchell requires part numbers for efficient processing',
        suggestion: `${partsWithoutNumbers} parts missing part numbers. Add OEM or aftermarket part numbers`,
        rejectionRisk: 'medium',
        category: 'pricing',
      });
    }
  }

  // Audatex specific
  if (platform === 'audatex') {
    // Audatex requires panel locations for paint
    const paintWithoutPanels = estimate.lineItems.filter(
      item => item.type === 'paint' && !item.panelLocation
    ).length;

    if (paintWithoutPanels > 0) {
      issues.push({
        id: 'audatex_no_panels',
        severity: 'warning',
        field: 'lineItems',
        message: 'Audatex requires panel locations for refinish work',
        suggestion: `${paintWithoutPanels} paint items missing panel locations`,
        rejectionRisk: 'medium',
        category: 'pricing',
      });
    }
  }
}

/**
 * Calculate quality score (0-100)
 */
function calculateQualityScore(estimate: FormattedEstimate, issues: ValidationIssue[]): number {
  let score = 100;

  // Deduct points based on issues
  issues.forEach(issue => {
    if (issue.severity === 'error') {
      score -= 15;
    } else if (issue.severity === 'warning') {
      score -= 5;
    } else {
      score -= 1;
    }

    // Extra deduction for high rejection risk
    if (issue.rejectionRisk === 'high') {
      score -= 5;
    }
  });

  // Bonus points for completeness
  if (estimate.photos && estimate.photos.length >= 4) score += 5;
  if (estimate.vehicleInfo.color) score += 2;
  if (estimate.vehicleInfo.mileage) score += 2;
  if (estimate.claimInfo.policyNumber) score += 3;
  if (estimate.shopInfo.taxId) score += 2;
  if (estimate.shopInfo.licenseNumber) score += 2;

  // Bonus for detailed line items
  const itemsWithCodes = estimate.lineItems.filter(item => item.operationCode || item.partNumber).length;
  const codeCompleteness = (itemsWithCodes / estimate.lineItems.length) * 10;
  score += codeCompleteness;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate overall rejection risk
 */
function calculateRejectionRisk(issues: ValidationIssue[], qualityScore: number): 'high' | 'medium' | 'low' {
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const highRiskCount = issues.filter(i => i.rejectionRisk === 'high').length;

  if (errorCount > 0 || highRiskCount > 2 || qualityScore < 50) {
    return 'high';
  } else if (highRiskCount > 0 || qualityScore < 75) {
    return 'medium';
  } else {
    return 'low';
  }
}

export default {
  validateEstimateForInsurance,
};
