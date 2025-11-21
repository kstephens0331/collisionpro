/**
 * DRP (Direct Repair Program) Management Library
 *
 * Handles insurance carrier relationships, compliance tracking, and performance metrics
 */

export interface InsuranceCarrier {
  id: string;
  name: string;
  abbreviation?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  claimsPortalUrl?: string;
  claimsPhone?: string;
  notes?: string;
  isActive: boolean;
}

export interface DRPProgram {
  id: string;
  shopId: string;
  carrierId: string;
  carrierName?: string;

  // Program Details
  programName: string;
  enrollmentDate: Date;
  status: 'active' | 'pending' | 'suspended' | 'terminated';
  tierLevel?: string;

  // Requirements
  minCSIScore?: number;
  maxCycleTime?: number;
  requiresPreApproval: boolean;
  requiresPhotos: boolean;
  requiresSupplement: boolean;
  certificationRequired?: string[];

  // Financial Terms
  laborRate?: number;
  paintRate?: number;
  paintMaterialsRate?: number;
  discountPercentage?: number;
  paymentTerms?: string;

  // Volume Requirements
  minMonthlyJobs?: number;
  minAnnualJobs?: number;

  // Performance Metrics
  currentCSIScore?: number;
  avgCycleTime?: number;
  completedJobsThisMonth: number;
  completedJobsThisYear: number;

  // Contacts
  accountManagerName?: string;
  accountManagerEmail?: string;
  accountManagerPhone?: string;

  // Compliance
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  complianceNotes?: string;

  // Alerts
  alerts?: DRPAlert[];
  requirements?: DRPRequirement[];
}

export interface DRPRequirement {
  id: string;
  programId: string;
  category: string;
  requirement: string;
  description?: string;
  isMandatory: boolean;
  dueDate?: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  verificationMethod?: string;
  documentUrl?: string;
  notes?: string;
}

export interface DRPMetric {
  id: string;
  programId: string;
  metricDate: Date;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

  // Volume
  jobsCompleted: number;
  jobsInProgress: number;
  totalRevenue: number;

  // Quality
  csiScore?: number;
  avgCycleTime?: number;
  firstTimeFixRate?: number;
  comebackRate?: number;

  // Compliance
  onTimeDeliveryRate?: number;
  supplementRate?: number;
  avgSupplementAmount?: number;

  // Financial
  avgRepairCost?: number;
  avgLaborHours?: number;
  avgPartsMargin?: number;
}

export interface DRPAlert {
  id: string;
  programId: string;
  alertType: 'csi-low' | 'cycle-time-high' | 'volume-low' | 'audit-due' | 'certification-expiring';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired?: string;
  dueDate?: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface DRPEstimate {
  estimateId: string;
  programId: string;
  claimNumber?: string;
  adjusterName?: string;
  adjusterEmail?: string;
  adjusterPhone?: string;
  preApprovalRequired: boolean;
  preApprovalStatus?: 'pending' | 'approved' | 'denied';
  preApprovalDate?: Date;
  supplementRequired: boolean;
  supplementAmount?: number;
  supplementApprovedDate?: Date;
  cycleTimeStart?: Date;
  cycleTimeEnd?: Date;
  cycleTimeDays?: number;
}

/**
 * Calculate compliance score based on multiple factors
 */
export function calculateComplianceScore(program: DRPProgram): number {
  let score = 100;
  const deductions: { reason: string; amount: number }[] = [];

  // CSI Score check (30 points)
  if (program.minCSIScore && program.currentCSIScore) {
    if (program.currentCSIScore < program.minCSIScore) {
      const deficit = program.minCSIScore - program.currentCSIScore;
      const deduction = Math.min(30, deficit * 3);
      deductions.push({ reason: 'CSI below minimum', amount: deduction });
      score -= deduction;
    }
  }

  // Cycle Time check (25 points)
  if (program.maxCycleTime && program.avgCycleTime) {
    if (program.avgCycleTime > program.maxCycleTime) {
      const overage = program.avgCycleTime - program.maxCycleTime;
      const deduction = Math.min(25, overage * 2);
      deductions.push({ reason: 'Cycle time exceeds limit', amount: deduction });
      score -= deduction;
    }
  }

  // Volume Requirements check (20 points)
  if (program.minMonthlyJobs && program.completedJobsThisMonth < program.minMonthlyJobs) {
    const shortfall = program.minMonthlyJobs - program.completedJobsThisMonth;
    const deduction = Math.min(20, (shortfall / program.minMonthlyJobs) * 20);
    deductions.push({ reason: 'Below monthly volume requirement', amount: deduction });
    score -= deduction;
  }

  // Outstanding Requirements (15 points)
  if (program.requirements) {
    const overdue = program.requirements.filter(r => r.status === 'overdue' && r.isMandatory).length;
    if (overdue > 0) {
      const deduction = Math.min(15, overdue * 5);
      deductions.push({ reason: `${overdue} overdue requirements`, amount: deduction });
      score -= deduction;
    }
  }

  // Audit Status (10 points)
  if (program.nextAuditDate) {
    const daysUntilAudit = Math.floor(
      (program.nextAuditDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilAudit < 0) {
      deductions.push({ reason: 'Audit overdue', amount: 10 });
      score -= 10;
    }
  }

  return Math.max(0, Math.round(score));
}

/**
 * Get compliance status based on score
 */
export function getComplianceStatus(score: number): DRPProgram['complianceStatus'] {
  if (score >= 90) return 'compliant';
  if (score >= 70) return 'warning';
  return 'non-compliant';
}

/**
 * Calculate cycle time in days
 */
export function calculateCycleTime(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if program is meeting volume requirements
 */
export function isMeetingVolumeRequirements(program: DRPProgram): boolean {
  if (program.minMonthlyJobs && program.completedJobsThisMonth < program.minMonthlyJobs) {
    return false;
  }
  if (program.minAnnualJobs && program.completedJobsThisYear < program.minAnnualJobs) {
    return false;
  }
  return true;
}

/**
 * Get program status color for badges
 */
export function getProgramStatusColor(status: DRPProgram['status']): string {
  const colors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-orange-100 text-orange-800',
    terminated: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

/**
 * Get compliance status color
 */
export function getComplianceStatusColor(status: DRPProgram['complianceStatus']): string {
  const colors = {
    compliant: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    'non-compliant': 'bg-red-100 text-red-800',
  };
  return colors[status];
}

/**
 * Get alert severity color
 */
export function getAlertSeverityColor(severity: DRPAlert['severity']): string {
  const colors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[severity];
}

/**
 * Get requirement status color
 */
export function getRequirementStatusColor(status: DRPRequirement['status']): string {
  const colors = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Check if requirement is overdue
 */
export function isRequirementOverdue(requirement: DRPRequirement): boolean {
  if (!requirement.dueDate || requirement.completedDate) return false;
  return new Date() > requirement.dueDate;
}

/**
 * Calculate days until due
 */
export function daysUntilDue(dueDate: Date): number {
  const diffMs = dueDate.getTime() - new Date().getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generate compliance alerts for a program
 */
export function generateComplianceAlerts(program: DRPProgram): DRPAlert[] {
  const alerts: DRPAlert[] = [];
  const now = new Date();

  // CSI Score Alert
  if (program.minCSIScore && program.currentCSIScore && program.currentCSIScore < program.minCSIScore) {
    alerts.push({
      id: `alert-csi-${program.id}`,
      programId: program.id,
      alertType: 'csi-low',
      severity: program.currentCSIScore < program.minCSIScore - 5 ? 'critical' : 'warning',
      title: 'CSI Score Below Minimum',
      message: `Current CSI score (${program.currentCSIScore.toFixed(1)}) is below the required minimum of ${program.minCSIScore.toFixed(1)}`,
      actionRequired: 'Improve customer satisfaction processes and follow up with recent customers',
      status: 'active',
      createdAt: now,
    });
  }

  // Cycle Time Alert
  if (program.maxCycleTime && program.avgCycleTime && program.avgCycleTime > program.maxCycleTime) {
    alerts.push({
      id: `alert-cycle-${program.id}`,
      programId: program.id,
      alertType: 'cycle-time-high',
      severity: program.avgCycleTime > program.maxCycleTime + 2 ? 'critical' : 'warning',
      title: 'Cycle Time Exceeds Limit',
      message: `Average cycle time (${program.avgCycleTime.toFixed(1)} days) exceeds the maximum of ${program.maxCycleTime} days`,
      actionRequired: 'Review workflow efficiency and identify bottlenecks',
      status: 'active',
      createdAt: now,
    });
  }

  // Volume Alert
  if (program.minMonthlyJobs && program.completedJobsThisMonth < program.minMonthlyJobs) {
    alerts.push({
      id: `alert-volume-${program.id}`,
      programId: program.id,
      alertType: 'volume-low',
      severity: 'warning',
      title: 'Below Monthly Volume Requirement',
      message: `Completed ${program.completedJobsThisMonth} of ${program.minMonthlyJobs} required monthly jobs`,
      actionRequired: 'Contact insurance carrier to increase referrals',
      status: 'active',
      createdAt: now,
    });
  }

  // Audit Due Alert
  if (program.nextAuditDate) {
    const daysUntil = daysUntilDue(program.nextAuditDate);
    if (daysUntil <= 30 && daysUntil >= 0) {
      alerts.push({
        id: `alert-audit-${program.id}`,
        programId: program.id,
        alertType: 'audit-due',
        severity: daysUntil <= 7 ? 'critical' : 'warning',
        title: 'Audit Due Soon',
        message: `DRP audit scheduled in ${daysUntil} days`,
        actionRequired: 'Prepare audit documentation and review compliance checklist',
        dueDate: program.nextAuditDate,
        status: 'active',
        createdAt: now,
      });
    } else if (daysUntil < 0) {
      alerts.push({
        id: `alert-audit-overdue-${program.id}`,
        programId: program.id,
        alertType: 'audit-due',
        severity: 'critical',
        title: 'Audit Overdue',
        message: `DRP audit is ${Math.abs(daysUntil)} days overdue`,
        actionRequired: 'Contact account manager immediately to reschedule',
        dueDate: program.nextAuditDate,
        status: 'active',
        createdAt: now,
      });
    }
  }

  return alerts;
}

/**
 * Calculate CSI score from feedback
 */
export function calculateCSIScore(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return (sum / ratings.length) * 20; // Convert 5-star to 100-point scale
}

/**
 * Common DRP tier levels
 */
export const DRP_TIERS = [
  'Gold',
  'Silver',
  'Bronze',
  'Platinum',
  'Preferred',
  'Select',
  'Premier',
] as const;

/**
 * Common certification requirements
 */
export const CERTIFICATIONS = [
  'I-CAR Gold Class',
  'I-CAR Platinum',
  'ASE Collision Repair',
  'ASE Master Technician',
  'PPG Certified',
  'Sherwin-Williams Certified',
  'Tesla Certified',
  'Mercedes-Benz Certified',
  'BMW Certified',
  'OEM Certified',
] as const;

/**
 * Common payment terms
 */
export const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Upon Completion',
  'Progressive Billing',
] as const;
