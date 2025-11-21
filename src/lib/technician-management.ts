/**
 * Technician Management Library
 *
 * Handles technician tracking, skills, certifications, and job assignments
 */

export interface Technician {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  status: 'active' | 'on-leave' | 'terminated' | 'suspended';
  title: string;
  department?: string;
  payType: 'hourly' | 'salary' | 'flat-rate' | 'commission';
  payRate?: number;
  yearsExperience: number;
  specialties: string[];
  skillLevel: 'apprentice' | 'intermediate' | 'senior' | 'master';
  efficiencyRating: number;
  qualityScore: number;
  hoursPerWeek: number;
  certifications?: TechnicianCertification[];
  skills?: TechnicianSkill[];
}

export interface TechnicianCertification {
  id: string;
  certificationId: string;
  certificationName: string;
  issuingOrganization: string;
  obtainedDate: Date;
  expirationDate?: Date;
  isActive: boolean;
  isExpiringSoon: boolean; // Within 30 days
}

export interface TechnicianSkill {
  id: string;
  skillName: string;
  skillCategory: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  yearsExperience: number;
}

export interface JobAssignment {
  id: string;
  estimateId: string;
  technicianId: string;
  technicianName: string;
  assignedDate: Date;
  startDate?: Date;
  completionDate?: Date;
  status: 'assigned' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
  workType: string;
  estimatedHours: number;
  actualHours?: number;
  efficiency?: number;
  qcPassed?: boolean;
}

export interface TimeEntry {
  id: string;
  technicianId: string;
  estimateId?: string;
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  billableHours?: number;
  workType: string;
  description?: string;
}

/**
 * Calculate technician efficiency
 * Returns percentage: 100 = meets book time, 120 = 20% faster
 */
export function calculateEfficiency(estimatedHours: number, actualHours: number): number {
  if (actualHours === 0) return 0;
  return (estimatedHours / actualHours) * 100;
}

/**
 * Calculate productivity score
 * Based on efficiency, quality, and utilization
 */
export function calculateProductivityScore(
  efficiency: number,
  qualityScore: number,
  hoursWorked: number,
  availableHours: number
): number {
  const utilizationRate = (hoursWorked / availableHours) * 100;

  // Weighted average: efficiency 40%, quality 40%, utilization 20%
  const score =
    efficiency * 0.4 + qualityScore * 0.4 + utilizationRate * 0.2;

  return Math.round(score);
}

/**
 * Check if certification is expiring soon (within 30 days)
 */
export function isCertificationExpiringSoon(expirationDate: Date): boolean {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expirationDate <= thirtyDaysFromNow;
}

/**
 * Get certification status color
 */
export function getCertificationStatusColor(cert: TechnicianCertification): string {
  if (!cert.isActive) return 'bg-red-100 text-red-800';
  if (cert.isExpiringSoon) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

/**
 * Get skill level label and color
 */
export function getSkillLevelInfo(level: number): { label: string; color: string } {
  const levels = {
    1: { label: 'Beginner', color: 'bg-gray-100 text-gray-800' },
    2: { label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
    3: { label: 'Advanced', color: 'bg-green-100 text-green-800' },
    4: { label: 'Expert', color: 'bg-purple-100 text-purple-800' },
    5: { label: 'Master', color: 'bg-yellow-100 text-yellow-800' },
  };
  return levels[level as keyof typeof levels] || levels[1];
}

/**
 * Get technician level badge color
 */
export function getTechnicianLevelColor(skillLevel: string): string {
  const colors = {
    apprentice: 'bg-gray-100 text-gray-800',
    intermediate: 'bg-blue-100 text-blue-800',
    senior: 'bg-green-100 text-green-800',
    master: 'bg-purple-100 text-purple-800',
  };
  return colors[skillLevel as keyof typeof colors] || colors.intermediate;
}

/**
 * Get assignment status color
 */
export function getAssignmentStatusColor(status: string): string {
  const colors = {
    assigned: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || colors.assigned;
}

/**
 * Calculate billable hours from time entry
 */
export function calculateBillableHours(clockIn: Date, clockOut: Date, isBillable: boolean): number {
  if (!isBillable) return 0;

  const diffMs = clockOut.getTime() - clockIn.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.round(diffHours * 100) / 100; // Round to 2 decimals
}

/**
 * Find best technician for a job based on skills and availability
 */
export function findBestTechnicianForJob(
  technicians: Technician[],
  requiredSkills: string[],
  estimatedHours: number
): Technician | null {
  // Filter to active technicians only
  const activeTechs = technicians.filter((t) => t.status === 'active');

  if (activeTechs.length === 0) return null;

  // Score each technician
  const scored = activeTechs.map((tech) => {
    let score = 0;

    // Skill match (50% weight)
    const matchingSkills = tech.specialties.filter((s) =>
      requiredSkills.some((r) => s.toLowerCase().includes(r.toLowerCase()))
    );
    const skillMatchScore = (matchingSkills.length / requiredSkills.length) * 50;
    score += skillMatchScore;

    // Efficiency (25% weight)
    score += (tech.efficiencyRating / 100) * 25;

    // Quality (25% weight)
    score += (tech.qualityScore / 100) * 25;

    return { tech, score };
  });

  // Return highest scoring technician
  const best = scored.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  return best.tech;
}

/**
 * Calculate team capacity for a time period
 */
export function calculateTeamCapacity(
  technicians: Technician[],
  days: number
): number {
  return technicians
    .filter((t) => t.status === 'active')
    .reduce((total, tech) => {
      const hoursPerDay = tech.hoursPerWeek / 5; // Assume 5-day week
      return total + hoursPerDay * days;
    }, 0);
}

/**
 * Common work types for job assignments
 */
export const WORK_TYPES = [
  'Disassembly',
  'Body Repair',
  'Frame Straightening',
  'Panel Replacement',
  'Welding',
  'Paint Preparation',
  'Painting',
  'Paint Finishing',
  'Reassembly',
  'Detail/Cleanup',
  'Quality Control',
  'Glass Installation',
  'Mechanical Repair',
  'Electrical Repair',
] as const;

/**
 * Common skill categories
 */
export const SKILL_CATEGORIES = [
  'Body Repair',
  'Frame Repair',
  'Painting & Refinishing',
  'Welding',
  'Mechanical',
  'Electrical',
  'Glass',
  'Detail',
  'Aluminum Repair',
  'Plastic Repair',
] as const;

/**
 * Format hours to readable string
 */
export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Format technician name
 */
export function formatTechnicianName(tech: Technician): string {
  return `${tech.firstName} ${tech.lastName}`;
}

/**
 * Get efficiency badge info
 */
export function getEfficiencyBadge(efficiency: number): { label: string; color: string } {
  if (efficiency >= 120)
    return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
  if (efficiency >= 100)
    return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
  if (efficiency >= 80)
    return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
}
