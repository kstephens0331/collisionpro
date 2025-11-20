/**
 * Phase 7: Automated Supplement Detection
 * Type definitions for supplement patterns and recommendations
 */

export interface SupplementPattern {
  id: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  damageLocation: string | null;
  initialDamageType: string | null;
  initialEstimateRange: string | null;
  supplementTrigger: string;
  supplementCategory: 'labor' | 'parts' | 'paint' | 'other';
  supplementType: string | null;
  frequencyCount: number;
  approvalCount: number;
  rejectionCount: number;
  avgApprovalRate: number;
  avgAmount: number;
  avgDaysToApproval: number;
  confidenceScore: number; // 0-100
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplementRecommendation {
  id: string;
  estimateId: string;
  shopId: string;
  trigger: string;
  category: 'labor' | 'parts' | 'paint' | 'other';
  confidence: number; // 0-100
  suggestedAmount: number | null;
  justification: string | null;
  documentationNeeded: string[];
  relatedPatterns: string[]; // Pattern IDs
  wasAccepted: boolean;
  wasSubmitted: boolean;
  wasApproved: boolean | null;
  actualAmount: number | null;
  actualSubmissionId: string | null;
  feedback: string | null;
  accuracyScore: number | null;
  createdAt: string;
  updatedAt: string;
  dismissedAt: string | null;
  acceptedAt: string | null;
}

export interface EstimateContext {
  id: string;
  total: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vin: string | null;
  damageDescription: string | null;
  items: EstimateItem[];
  photoCount: number;
  insuranceCompany: string | null;
  hasInsuranceSubmission: boolean;
}

export interface EstimateItem {
  id: string;
  type: 'labor' | 'parts' | 'paint' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string | null;
}

export interface SupplementSuggestion {
  id: string;
  trigger: string;
  category: 'labor' | 'parts' | 'paint' | 'other';
  confidence: number;
  suggestedAmount: number;
  justification: string;
  documentationNeeded: string[];
  relatedPatterns: SupplementPattern[];
  priority: 'high' | 'medium' | 'low';
  timing: 'pre-disassembly' | 'during-repair' | 'post-repair';
}

export interface AnalyticsData {
  totalRecommendations: number;
  acceptedRecommendations: number;
  submittedSupplements: number;
  approvedSupplements: number;
  rejectedSupplements: number;
  totalSupplementRevenue: number;
  avgSupplementAmount: number;
  avgCycleTime: number; // days
  avgApprovalRate: number; // percentage
  avgAccuracyScore: number; // percentage
  timeSaved: number; // hours
  topTriggers: TriggerStat[];
  topVehicles: VehicleStat[];
  monthlyTrend: MonthlyDataPoint[];
}

export interface TriggerStat {
  trigger: string;
  count: number;
  approvalRate: number;
  avgAmount: number;
}

export interface VehicleStat {
  make: string;
  model: string;
  count: number;
  approvalRate: number;
  avgAmount: number;
}

export interface MonthlyDataPoint {
  month: string; // "2024-11"
  count: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  avgCycleTime: number;
}

export interface RecommendationRequest {
  estimateId: string;
  context: EstimateContext;
  includePreDisassembly?: boolean;
  includeDuringRepair?: boolean;
  minConfidence?: number; // Only return recommendations with confidence >= this
}

export interface RecommendationResponse {
  recommendations: SupplementSuggestion[];
  totalCount: number;
  highPriorityCount: number;
  estimatedTotalAmount: number;
  avgConfidence: number;
}

export interface FeedbackRequest {
  recommendationId: string;
  action: 'accept' | 'dismiss' | 'submit' | 'outcome';
  feedback?: string;
  actualAmount?: number;
  wasApproved?: boolean;
  submissionId?: string;
}

// Trigger condition types
export type TriggerCondition =
  | 'high_impact_collision'
  | 'water_flood_exposure'
  | 'age_related_issues'
  | 'part_availability'
  | 'frame_damage_likely'
  | 'airbag_deployment'
  | 'electrical_exposure'
  | 'corrosion_risk'
  | 'structural_compromise'
  | 'sensor_replacement'
  | 'hidden_damage_likely';

export interface TriggerConditionResult {
  condition: TriggerCondition;
  met: boolean;
  confidence: number;
  reason: string;
  suggestedDocumentation: string[];
}

// Estimate ranges for pattern matching
export type EstimateRange = '$0-2K' | '$2K-5K' | '$5K-10K' | '$10K+';

// Damage location categories
export type DamageLocation =
  | 'Front End'
  | 'Rear End'
  | 'Left Front'
  | 'Right Front'
  | 'Left Rear'
  | 'Right Rear'
  | 'Roof'
  | 'Undercarriage'
  | 'Multiple';

// Damage types
export type DamageType =
  | 'Impact'
  | 'Scrape'
  | 'Dent'
  | 'Crack'
  | 'Shatter'
  | 'Bend'
  | 'Tear'
  | 'Burn'
  | 'Water'
  | 'Rust';

// Supplement types
export type SupplementType =
  | 'Frame'
  | 'Mechanical'
  | 'Electrical'
  | 'Corrosion'
  | 'Hidden Damage'
  | 'Part Availability'
  | 'Additional Labor'
  | 'Paint Blend'
  | 'Sublet'
  | 'Other';
