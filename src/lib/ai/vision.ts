/**
 * Google Cloud Vision API Integration
 * Phase 5.1 - AI-Powered Damage Assessment
 *
 * This module handles image analysis for vehicle damage detection.
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';

// Damage types we detect
export type DamageType =
  | 'dent'
  | 'scratch'
  | 'crack'
  | 'broken'
  | 'paint_damage'
  | 'rust'
  | 'glass_damage'
  | 'bumper_damage'
  | 'panel_damage'
  | 'structural';

// Vehicle panel locations
export type PanelLocation =
  | 'front_bumper'
  | 'rear_bumper'
  | 'hood'
  | 'trunk'
  | 'roof'
  | 'left_fender'
  | 'right_fender'
  | 'left_door_front'
  | 'left_door_rear'
  | 'right_door_front'
  | 'right_door_rear'
  | 'left_quarter'
  | 'right_quarter'
  | 'windshield'
  | 'rear_glass'
  | 'headlight_left'
  | 'headlight_right'
  | 'taillight_left'
  | 'taillight_right'
  | 'mirror_left'
  | 'mirror_right'
  | 'grille';

// Detected damage result
export interface DamageDetection {
  id: string;
  type: DamageType;
  location: PanelLocation;
  confidence: number; // 0-100
  severity: 'minor' | 'moderate' | 'severe';
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  suggestedOperations: string[];
  suggestedParts: string[];
  estimatedCost: {
    labor: number;
    parts: number;
    paint: number;
    total: number;
  };
}

// Full analysis result
export interface DamageAnalysisResult {
  imageId: string;
  imageUrl: string;
  analyzedAt: string;
  processingTimeMs: number;
  damages: DamageDetection[];
  overallConfidence: number;
  vehicleDetected: boolean;
  panelDetected: PanelLocation | null;
  rawLabels: string[];
  warnings: string[];
}

// Vision client singleton
let visionClient: ImageAnnotatorClient | null = null;

/**
 * Get or create Vision API client
 */
export function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    // Check for credentials
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!credentials && !projectId) {
      throw new Error(
        'Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_PROJECT_ID'
      );
    }

    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

/**
 * Analyze an image for vehicle damage using Google Cloud Vision
 */
export async function analyzeImage(
  imageSource: string | Buffer
): Promise<DamageAnalysisResult> {
  const startTime = Date.now();
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const client = getVisionClient();

    // Prepare image for analysis
    const imageContent = typeof imageSource === 'string'
      ? imageSource
      : imageSource.toString('base64');

    // Run label detection (primary method)
    const [labelResult] = await client.labelDetection({
      image: typeof imageSource === 'string'
        ? { source: { imageUri: imageSource } }
        : { content: imageContent },
    });

    // Run object localization separately to handle potential errors
    let objectResult: any = { localizedObjectAnnotations: [] };
    if (client.objectLocalization) {
      try {
        const [result] = await client.objectLocalization({
          image: typeof imageSource === 'string'
            ? { source: { imageUri: imageSource } }
            : { content: imageContent },
        });
        objectResult = result || objectResult;
      } catch (e) {
        console.warn('Object localization failed:', e);
      }
    }

    // Safe search is optional
    let safeSearchResult: any = {};
    if (client.safeSearchDetection) {
      try {
        const [result] = await client.safeSearchDetection({
          image: typeof imageSource === 'string'
            ? { source: { imageUri: imageSource } }
            : { content: imageContent },
        });
        safeSearchResult = result || safeSearchResult;
      } catch (e) {
        console.warn('Safe search failed:', e);
      }
    }

    // Extract labels
    const labels = labelResult?.labelAnnotations || [];
    const rawLabels = labels.map(l => l.description || '');

    // Extract objects
    const objects = objectResult?.localizedObjectAnnotations || [];

    // Check if vehicle is detected
    const vehicleDetected = rawLabels.some(label =>
      ['car', 'vehicle', 'automobile', 'truck', 'suv', 'van'].includes(label.toLowerCase())
    ) || objects.some((obj: any) =>
      ['Car', 'Vehicle', 'Truck', 'Wheel'].includes(obj.name || '')
    );

    // Analyze for damage
    const damages = detectDamage(labels, objects);
    const panelDetected = detectPanel(labels, objects);

    // Calculate overall confidence
    const overallConfidence = damages.length > 0
      ? Math.round(damages.reduce((sum, d) => sum + d.confidence, 0) / damages.length)
      : 0;

    // Generate warnings
    const warnings: string[] = [];
    if (!vehicleDetected) {
      warnings.push('No vehicle detected in image. Please upload a clear photo of vehicle damage.');
    }
    if (overallConfidence < 50 && damages.length > 0) {
      warnings.push('Low confidence detection. Manual review recommended.');
    }

    return {
      imageId,
      imageUrl: typeof imageSource === 'string' ? imageSource : `data:image/jpeg;base64,${imageSource.toString('base64').substr(0, 50)}...`,
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
      damages,
      overallConfidence,
      vehicleDetected,
      panelDetected,
      rawLabels,
      warnings,
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect damage from Vision API results
 */
function detectDamage(
  labels: Array<{ description?: string | null; score?: number | null }>,
  objects: Array<{ name?: string | null; score?: number | null; boundingPoly?: any }>
): DamageDetection[] {
  const damages: DamageDetection[] = [];

  // Damage keyword mapping
  const damageKeywords: Record<string, DamageType> = {
    'dent': 'dent',
    'dented': 'dent',
    'scratch': 'scratch',
    'scratched': 'scratch',
    'crack': 'crack',
    'cracked': 'crack',
    'broken': 'broken',
    'shattered': 'broken',
    'rust': 'rust',
    'corrosion': 'rust',
    'paint': 'paint_damage',
    'peeling': 'paint_damage',
    'faded': 'paint_damage',
    'glass': 'glass_damage',
    'windshield': 'glass_damage',
    'bumper': 'bumper_damage',
    'collision': 'structural',
    'crash': 'structural',
    'wreck': 'structural',
  };

  // Check labels for damage indicators
  labels.forEach((label, index) => {
    const labelText = (label.description || '').toLowerCase();
    const confidence = Math.round((label.score || 0) * 100);

    for (const [keyword, damageType] of Object.entries(damageKeywords)) {
      if (labelText.includes(keyword) && confidence > 30) {
        const detection = createDamageDetection(
          `damage_${index}_${damageType}`,
          damageType,
          inferLocation(labels),
          confidence
        );
        damages.push(detection);
        break;
      }
    }
  });

  // Also check objects for damage-related detections
  objects.forEach((obj, index) => {
    const objName = (obj.name || '').toLowerCase();
    const confidence = Math.round((obj.score || 0) * 100);

    if (objName.includes('damage') || objName.includes('dent') || objName.includes('scratch')) {
      const detection = createDamageDetection(
        `obj_damage_${index}`,
        'dent',
        inferLocation(labels),
        confidence
      );

      // Add bounding box if available
      if (obj.boundingPoly?.normalizedVertices) {
        const vertices = obj.boundingPoly.normalizedVertices;
        detection.boundingBox = {
          x: vertices[0]?.x || 0,
          y: vertices[0]?.y || 0,
          width: (vertices[2]?.x || 0) - (vertices[0]?.x || 0),
          height: (vertices[2]?.y || 0) - (vertices[0]?.y || 0),
        };
      }

      damages.push(detection);
    }
  });

  return damages;
}

/**
 * Infer panel location from labels
 */
function inferLocation(
  labels: Array<{ description?: string | null }>
): PanelLocation {
  const labelText = labels.map(l => (l.description || '').toLowerCase()).join(' ');

  const locationKeywords: Record<string, PanelLocation> = {
    'bumper front': 'front_bumper',
    'front bumper': 'front_bumper',
    'bumper rear': 'rear_bumper',
    'rear bumper': 'rear_bumper',
    'hood': 'hood',
    'trunk': 'trunk',
    'roof': 'roof',
    'fender': 'left_fender',
    'door': 'left_door_front',
    'quarter panel': 'left_quarter',
    'windshield': 'windshield',
    'headlight': 'headlight_left',
    'taillight': 'taillight_left',
    'mirror': 'mirror_left',
    'grille': 'grille',
  };

  for (const [keyword, location] of Object.entries(locationKeywords)) {
    if (labelText.includes(keyword)) {
      return location;
    }
  }

  return 'front_bumper'; // Default
}

/**
 * Detect which panel is shown in the image
 */
function detectPanel(
  labels: Array<{ description?: string | null }>,
  objects: Array<{ name?: string | null }>
): PanelLocation | null {
  return inferLocation(labels);
}

/**
 * Create a damage detection with suggested operations and parts
 */
function createDamageDetection(
  id: string,
  type: DamageType,
  location: PanelLocation,
  confidence: number
): DamageDetection {
  // Map damage type + location to labor operations
  const operations = mapDamageToOperations(type, location);
  const parts = mapDamageToParts(type, location);
  const costs = estimateCosts(type, location, operations);

  // Determine severity based on type and confidence
  let severity: 'minor' | 'moderate' | 'severe' = 'minor';
  if (type === 'structural' || type === 'broken') {
    severity = 'severe';
  } else if (type === 'crack' || type === 'panel_damage') {
    severity = 'moderate';
  } else if (confidence > 80) {
    severity = 'moderate';
  }

  return {
    id,
    type,
    location,
    confidence,
    severity,
    description: generateDescription(type, location, severity),
    suggestedOperations: operations,
    suggestedParts: parts,
    estimatedCost: costs,
  };
}

/**
 * Map damage to labor operations
 */
function mapDamageToOperations(type: DamageType, location: PanelLocation): string[] {
  const operations: string[] = [];

  // Base operations by damage type
  switch (type) {
    case 'dent':
      operations.push('PDR (Paintless Dent Repair)');
      if (location.includes('door') || location.includes('fender')) {
        operations.push('Body filler application');
        operations.push('Block sanding');
      }
      break;
    case 'scratch':
      operations.push('Sand and feather');
      operations.push('Spot paint');
      break;
    case 'crack':
    case 'broken':
      operations.push(`R&I ${formatPanelName(location)}`);
      operations.push(`Replace ${formatPanelName(location)}`);
      break;
    case 'paint_damage':
      operations.push('Sand and prep');
      operations.push('Prime');
      operations.push('Base coat');
      operations.push('Clear coat');
      operations.push('Buff and polish');
      break;
    case 'bumper_damage':
      operations.push('R&I front bumper');
      operations.push('Bumper repair');
      operations.push('Bumper refinish');
      break;
    case 'glass_damage':
      operations.push('R&I windshield');
      operations.push('Replace windshield');
      break;
    case 'structural':
      operations.push('Frame measurement');
      operations.push('Structural repair');
      operations.push('Frame alignment');
      break;
    default:
      operations.push('Inspect and assess');
  }

  return operations;
}

/**
 * Map damage to suggested parts
 */
function mapDamageToParts(type: DamageType, location: PanelLocation): string[] {
  const parts: string[] = [];

  if (type === 'broken' || type === 'crack' || type === 'structural') {
    // Need replacement part
    switch (location) {
      case 'front_bumper':
        parts.push('Front bumper cover');
        parts.push('Bumper absorber');
        parts.push('Bumper reinforcement');
        break;
      case 'rear_bumper':
        parts.push('Rear bumper cover');
        parts.push('Bumper absorber');
        break;
      case 'hood':
        parts.push('Hood panel');
        parts.push('Hood hinges');
        parts.push('Hood latch');
        break;
      case 'left_fender':
      case 'right_fender':
        parts.push('Fender panel');
        parts.push('Fender liner');
        break;
      case 'windshield':
        parts.push('Windshield glass');
        parts.push('Windshield molding');
        break;
      case 'headlight_left':
      case 'headlight_right':
        parts.push('Headlight assembly');
        parts.push('Headlight bulb');
        break;
      case 'mirror_left':
      case 'mirror_right':
        parts.push('Side mirror assembly');
        break;
      case 'grille':
        parts.push('Front grille');
        break;
      default:
        parts.push(`${formatPanelName(location)} panel`);
    }
  }

  // Paint supplies for any paint work
  if (type === 'paint_damage' || type === 'scratch' || parts.length > 0) {
    parts.push('Paint and materials');
  }

  return parts;
}

/**
 * Estimate costs for damage repair
 */
function estimateCosts(
  type: DamageType,
  location: PanelLocation,
  operations: string[]
): { labor: number; parts: number; paint: number; total: number } {
  // Base labor cost per hour
  const laborRate = 65;

  // Estimate hours based on operations
  let laborHours = 0;
  operations.forEach(op => {
    if (op.includes('R&I')) laborHours += 0.5;
    if (op.includes('Replace')) laborHours += 1.5;
    if (op.includes('PDR')) laborHours += 1.0;
    if (op.includes('Sand')) laborHours += 0.5;
    if (op.includes('Prime')) laborHours += 0.3;
    if (op.includes('coat')) laborHours += 0.5;
    if (op.includes('Buff')) laborHours += 0.3;
    if (op.includes('Structural')) laborHours += 3.0;
  });

  const labor = Math.round(laborHours * laborRate);

  // Estimate parts cost
  let parts = 0;
  if (type === 'broken' || type === 'crack') {
    switch (location) {
      case 'front_bumper':
      case 'rear_bumper':
        parts = 350;
        break;
      case 'hood':
        parts = 450;
        break;
      case 'left_fender':
      case 'right_fender':
        parts = 300;
        break;
      case 'windshield':
        parts = 400;
        break;
      case 'headlight_left':
      case 'headlight_right':
        parts = 250;
        break;
      default:
        parts = 200;
    }
  }

  // Paint cost
  let paint = 0;
  if (operations.some(op => op.includes('coat') || op.includes('paint'))) {
    paint = 150;
    if (type === 'broken' || location.includes('door')) {
      paint = 300;
    }
  }

  return {
    labor,
    parts,
    paint,
    total: labor + parts + paint,
  };
}

/**
 * Format panel location name
 */
function formatPanelName(location: PanelLocation): string {
  return location
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate human-readable description
 */
function generateDescription(
  type: DamageType,
  location: PanelLocation,
  severity: string
): string {
  const panelName = formatPanelName(location);
  const damageTypeName = type.replace('_', ' ');

  return `${severity.charAt(0).toUpperCase() + severity.slice(1)} ${damageTypeName} detected on ${panelName}`;
}

export default {
  analyzeImage,
  getVisionClient,
};
