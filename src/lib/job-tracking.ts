/**
 * Job Assignment & Tracking Library
 *
 * Manages workflow stages and job progress tracking
 */

export interface WorkflowStage {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  order: number;
  isStart: boolean;
  isComplete: boolean;
  requiresQC: boolean;
  notifyCustomer: boolean;
  estimatedDays?: number;
}

export interface JobBoard {
  id: string;
  estimateId: string;
  shopId: string;
  currentStageId: string;
  currentStageName?: string;

  // Vehicle info (from estimate)
  vehicleInfo?: string;
  customerName?: string;

  // Dates
  startDate: Date;
  targetCompletionDate?: Date;
  actualCompletionDate?: Date;

  // Status
  status: 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  blockedReason?: string;
  blockedSince?: Date;

  // Progress
  progressPercentage: number;
  daysInCurrentStage: number;

  // Assignments
  assignedTechnicians: string[];
  assignedTechnicianNames?: string[];

  // Customer Communication
  lastCustomerUpdate?: Date;
  customerNotificationsEnabled: boolean;

  // Metrics
  totalElapsedDays: number;
  onSchedule: boolean;

  // Related data
  stageHistory?: JobStageHistory[];
  notes?: JobNote[];
  photos?: JobPhoto[];
  checklist?: JobChecklist[];
}

export interface JobStageHistory {
  id: string;
  jobBoardId: string;
  stageId: string;
  stageName?: string;
  enteredAt: Date;
  exitedAt?: Date;
  durationDays?: number;
  assignedTechnicians: string[];
  notes?: string;
  completedBy?: string;
  qcPassed?: boolean;
  qcNotes?: string;
}

export interface JobNote {
  id: string;
  jobBoardId: string;
  userId: string;
  userName: string;
  noteType: 'general' | 'issue' | 'delay' | 'customer' | 'internal';
  content: string;
  isInternal: boolean;
  isPinned: boolean;
  attachments?: string[];
  createdAt: Date;
}

export interface JobPhoto {
  id: string;
  jobBoardId: string;
  stageId?: string;
  url: string;
  caption?: string;
  photoType: 'progress' | 'issue' | 'completion' | 'before' | 'after';
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: Date;
}

export interface JobChecklist {
  id: string;
  jobBoardId: string;
  stageId: string;
  taskName: string;
  description?: string;
  isCompleted: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: Date;
  photoUrl?: string;
  notes?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface BottleneckAnalysis {
  stageId: string;
  stageName: string;
  avgDaysInStage: number;
  jobsInStage: number;
  jobsOverdue: number;
  bottleneckScore: number; // 0-100, higher = worse
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: JobBoard['status']): string {
  const colors = {
    'in-progress': 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800',
  };
  return colors[status];
}

/**
 * Get priority color for badges
 */
export function getPriorityColor(priority: JobBoard['priority']): string {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority];
}

/**
 * Get note type color
 */
export function getNoteTypeColor(noteType: JobNote['noteType']): string {
  const colors = {
    general: 'bg-blue-100 text-blue-800',
    issue: 'bg-red-100 text-red-800',
    delay: 'bg-orange-100 text-orange-800',
    customer: 'bg-purple-100 text-purple-800',
    internal: 'bg-gray-100 text-gray-800',
  };
  return colors[noteType];
}

/**
 * Calculate progress percentage based on stage order
 */
export function calculateProgress(currentStageOrder: number, totalStages: number): number {
  return Math.round((currentStageOrder / totalStages) * 100);
}

/**
 * Calculate days between dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if job is behind schedule
 */
export function isBehindSchedule(job: JobBoard): boolean {
  if (!job.targetCompletionDate) return false;
  return new Date() > job.targetCompletionDate && job.status !== 'completed';
}

/**
 * Calculate estimated completion date based on remaining stages
 */
export function estimateCompletionDate(
  currentStage: WorkflowStage,
  remainingStages: WorkflowStage[]
): Date {
  const totalDays = remainingStages.reduce((sum, stage) => {
    return sum + (stage.estimatedDays || 1);
  }, 0);

  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + totalDays);
  return completionDate;
}

/**
 * Calculate bottleneck score for a stage
 * Higher score = worse bottleneck
 */
export function calculateBottleneckScore(
  avgDaysInStage: number,
  expectedDays: number,
  jobsInStage: number,
  jobsOverdue: number
): number {
  let score = 0;

  // Time factor (0-40 points)
  if (expectedDays > 0) {
    const timeFactor = (avgDaysInStage / expectedDays) - 1;
    score += Math.min(40, Math.max(0, timeFactor * 100));
  }

  // Volume factor (0-30 points)
  const volumeFactor = Math.min(30, jobsInStage * 2);
  score += volumeFactor;

  // Overdue factor (0-30 points)
  const overdueFactor = Math.min(30, jobsOverdue * 5);
  score += overdueFactor;

  return Math.min(100, Math.round(score));
}

/**
 * Find bottlenecks in workflow
 */
export function identifyBottlenecks(
  stages: WorkflowStage[],
  jobs: JobBoard[]
): BottleneckAnalysis[] {
  const analysis: BottleneckAnalysis[] = [];

  stages.forEach(stage => {
    const jobsInStage = jobs.filter(j => j.currentStageId === stage.id);
    const jobsOverdue = jobsInStage.filter(j =>
      stage.estimatedDays && j.daysInCurrentStage > stage.estimatedDays
    ).length;

    const avgDaysInStage = jobsInStage.length > 0
      ? jobsInStage.reduce((sum, j) => sum + j.daysInCurrentStage, 0) / jobsInStage.length
      : 0;

    const bottleneckScore = calculateBottleneckScore(
      avgDaysInStage,
      stage.estimatedDays || 1,
      jobsInStage.length,
      jobsOverdue
    );

    analysis.push({
      stageId: stage.id,
      stageName: stage.name,
      avgDaysInStage,
      jobsInStage: jobsInStage.length,
      jobsOverdue,
      bottleneckScore,
    });
  });

  // Sort by bottleneck score (worst first)
  return analysis.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
}

/**
 * Get jobs that need attention
 */
export function getJobsNeedingAttention(jobs: JobBoard[]): {
  behindSchedule: JobBoard[];
  stuckInStage: JobBoard[];
  onHold: JobBoard[];
  urgent: JobBoard[];
} {
  const behindSchedule = jobs.filter(j => isBehindSchedule(j));
  const stuckInStage = jobs.filter(j => j.daysInCurrentStage > 5 && j.status === 'in-progress');
  const onHold = jobs.filter(j => j.status === 'on-hold');
  const urgent = jobs.filter(j => j.priority === 'urgent' && j.status === 'in-progress');

  return {
    behindSchedule,
    stuckInStage,
    onHold,
    urgent,
  };
}

/**
 * Calculate shop capacity utilization
 */
export function calculateCapacityUtilization(
  activeJobs: number,
  technicians: number,
  avgJobsPerTechnician: number = 3
): {
  utilization: number;
  capacity: number;
  available: number;
  status: 'low' | 'optimal' | 'high' | 'overloaded';
} {
  const capacity = technicians * avgJobsPerTechnician;
  const utilization = (activeJobs / capacity) * 100;
  const available = capacity - activeJobs;

  let status: 'low' | 'optimal' | 'high' | 'overloaded';
  if (utilization < 60) status = 'low';
  else if (utilization < 85) status = 'optimal';
  else if (utilization < 100) status = 'high';
  else status = 'overloaded';

  return {
    utilization: Math.round(utilization),
    capacity,
    available: Math.max(0, available),
    status,
  };
}

/**
 * Format stage duration
 */
export function formatDuration(days: number): string {
  if (days === 0) return 'Just started';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 14) return `${Math.floor(days / 7)} week`;
  return `${Math.floor(days / 7)} weeks`;
}

/**
 * Get checklist completion percentage
 */
export function getChecklistCompletion(checklist: JobChecklist[]): number {
  if (checklist.length === 0) return 100;
  const completed = checklist.filter(c => c.isCompleted).length;
  return Math.round((completed / checklist.length) * 100);
}

/**
 * Check if job can move to next stage
 */
export function canMoveToNextStage(
  job: JobBoard,
  currentStage: WorkflowStage,
  checklist: JobChecklist[]
): { canMove: boolean; reason?: string } {
  // Check if on hold
  if (job.status === 'on-hold') {
    return { canMove: false, reason: 'Job is on hold' };
  }

  // Check if stage requires QC
  if (currentStage.requiresQC) {
    const qcHistory = job.stageHistory?.find(h =>
      h.stageId === currentStage.id && !h.exitedAt
    );
    if (!qcHistory || !qcHistory.qcPassed) {
      return { canMove: false, reason: 'Quality control not passed' };
    }
  }

  // Check mandatory checklist items
  const mandatoryItems = checklist.filter(c =>
    c.stageId === currentStage.id && !c.isCompleted
  );
  if (mandatoryItems.length > 0) {
    return {
      canMove: false,
      reason: `${mandatoryItems.length} checklist items incomplete`
    };
  }

  return { canMove: true };
}

/**
 * Default workflow stages (can be customized per shop)
 */
export const DEFAULT_STAGES: Omit<WorkflowStage, 'id' | 'shopId'>[] = [
  {
    name: 'Check In',
    description: 'Vehicle arrival and inspection',
    color: '#6B7280',
    icon: 'clipboard-check',
    order: 1,
    isStart: true,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: true,
    estimatedDays: 1,
  },
  {
    name: 'Disassembly',
    description: 'Tear down and parts ordering',
    color: '#8B5CF6',
    icon: 'wrench',
    order: 2,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 1,
  },
  {
    name: 'Waiting for Parts',
    description: 'Awaiting parts delivery',
    color: '#F59E0B',
    icon: 'package',
    order: 3,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 3,
  },
  {
    name: 'Body Work',
    description: 'Frame and body repair',
    color: '#3B82F6',
    icon: 'hammer',
    order: 4,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 2,
  },
  {
    name: 'Paint Prep',
    description: 'Sanding and masking',
    color: '#EC4899',
    icon: 'paint-brush',
    order: 5,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 1,
  },
  {
    name: 'Painting',
    description: 'Paint application',
    color: '#10B981',
    icon: 'palette',
    order: 6,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 2,
  },
  {
    name: 'Reassembly',
    description: 'Putting vehicle back together',
    color: '#6366F1',
    icon: 'cog',
    order: 7,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 1,
  },
  {
    name: 'Quality Control',
    description: 'Final inspection',
    color: '#F97316',
    icon: 'shield-check',
    order: 8,
    isStart: false,
    isComplete: false,
    requiresQC: true,
    notifyCustomer: false,
    estimatedDays: 1,
  },
  {
    name: 'Detail & Cleanup',
    description: 'Final wash and detail',
    color: '#14B8A6',
    icon: 'sparkles',
    order: 9,
    isStart: false,
    isComplete: false,
    requiresQC: false,
    notifyCustomer: false,
    estimatedDays: 1,
  },
  {
    name: 'Complete',
    description: 'Ready for customer pickup',
    color: '#22C55E',
    icon: 'check-circle',
    order: 10,
    isStart: false,
    isComplete: true,
    requiresQC: false,
    notifyCustomer: true,
    estimatedDays: 0,
  },
];
