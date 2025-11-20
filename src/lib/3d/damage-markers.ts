/**
 * Phase 8: 3D Vehicle Damage Visualization
 * Damage marker types and utilities
 */

export type DamageType =
  | 'dent'
  | 'scratch'
  | 'crack'
  | 'shatter'
  | 'bend'
  | 'tear'
  | 'paint'
  | 'missing';

export type DamageSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export interface DamageMarker {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  damageType: DamageType;
  severity: DamageSeverity;
  description: string;
  partName?: string;
  color: string;
}

export interface DamageAnnotation {
  id: string;
  estimateId: string;
  vehicleType: 'sedan' | 'suv' | 'truck' | 'coupe';
  markers: DamageMarker[];
  cameraPosition?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Damage type definitions with icons and labels
 */
export const DAMAGE_TYPES: Record<
  DamageType,
  { label: string; icon: string; description: string }
> = {
  dent: {
    label: 'Dent',
    icon: 'CircleDot',
    description: 'Impact dent or depression',
  },
  scratch: {
    label: 'Scratch',
    icon: 'Minus',
    description: 'Surface scratch or scuff',
  },
  crack: {
    label: 'Crack',
    icon: 'Split',
    description: 'Crack or fracture',
  },
  shatter: {
    label: 'Shatter/Broken',
    icon: 'BrokenLink',
    description: 'Shattered glass or broken part',
  },
  bend: {
    label: 'Bend',
    icon: 'Waves',
    description: 'Bent or warped panel',
  },
  tear: {
    label: 'Tear',
    icon: 'Scissors',
    description: 'Torn or ripped material',
  },
  paint: {
    label: 'Paint Damage',
    icon: 'Paintbrush',
    description: 'Paint chipping or peeling',
  },
  missing: {
    label: 'Missing Part',
    icon: 'X',
    description: 'Missing or detached part',
  },
};

/**
 * Severity levels with colors
 */
export const SEVERITY_LEVELS: Record<
  DamageSeverity,
  { label: string; color: string; description: string }
> = {
  minor: {
    label: 'Minor',
    color: '#10b981', // green
    description: 'Cosmetic damage, easy repair',
  },
  moderate: {
    label: 'Moderate',
    color: '#fbbf24', // yellow
    description: 'Moderate damage, standard repair',
  },
  severe: {
    label: 'Severe',
    color: '#f97316', // orange
    description: 'Significant damage, complex repair',
  },
  critical: {
    label: 'Critical',
    color: '#ef4444', // red
    description: 'Extensive damage, may require replacement',
  },
};

/**
 * Get color for damage marker based on severity
 */
export function getMarkerColor(severity: DamageSeverity): string {
  return SEVERITY_LEVELS[severity].color;
}

/**
 * Create a new damage marker
 */
export function createDamageMarker(
  position: { x: number; y: number; z: number },
  damageType: DamageType,
  severity: DamageSeverity,
  description: string = ''
): DamageMarker {
  return {
    id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    position,
    damageType,
    severity,
    description,
    color: getMarkerColor(severity),
  };
}

/**
 * Get damage type label
 */
export function getDamageTypeLabel(type: DamageType): string {
  return DAMAGE_TYPES[type]?.label || type;
}

/**
 * Get severity label
 */
export function getSeverityLabel(severity: DamageSeverity): string {
  return SEVERITY_LEVELS[severity]?.label || severity;
}

/**
 * Validate marker data
 */
export function isValidMarker(marker: any): marker is DamageMarker {
  return (
    marker &&
    typeof marker.id === 'string' &&
    marker.position &&
    typeof marker.position.x === 'number' &&
    typeof marker.position.y === 'number' &&
    typeof marker.position.z === 'number' &&
    typeof marker.damageType === 'string' &&
    typeof marker.severity === 'string' &&
    typeof marker.description === 'string'
  );
}
