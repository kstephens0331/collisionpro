/**
 * Phase 8: 3D Vehicle Damage Visualization
 * Camera preset angles for quick navigation
 */

export interface CameraPosition {
  position: [number, number, number];
  target: [number, number, number];
  label: string;
  icon?: string;
}

export const CAMERA_PRESETS: Record<string, CameraPosition> = {
  front: {
    position: [0, 1.5, 5],
    target: [0, 0.8, 0],
    label: 'Front View',
    icon: 'ArrowUp',
  },
  rear: {
    position: [0, 1.5, -5],
    target: [0, 0.8, 0],
    label: 'Rear View',
    icon: 'ArrowDown',
  },
  left: {
    position: [-5, 1.5, 0],
    target: [0, 0.8, 0],
    label: 'Left Side',
    icon: 'ArrowLeft',
  },
  right: {
    position: [5, 1.5, 0],
    target: [0, 0.8, 0],
    label: 'Right Side',
    icon: 'ArrowRight',
  },
  top: {
    position: [0, 8, 0],
    target: [0, 0, 0],
    label: 'Top View',
    icon: 'Maximize2',
  },
  frontLeft: {
    position: [-4, 2, 4],
    target: [0, 0.8, 0],
    label: 'Front Left 45°',
  },
  frontRight: {
    position: [4, 2, 4],
    target: [0, 0.8, 0],
    label: 'Front Right 45°',
  },
  isometric: {
    position: [5, 3, 5],
    target: [0, 0.8, 0],
    label: 'Isometric',
    icon: 'Box',
  },
};

export const DEFAULT_CAMERA_POSITION: CameraPosition = CAMERA_PRESETS.isometric;

/**
 * Get camera preset by name
 */
export function getCameraPreset(name: string): CameraPosition | undefined {
  return CAMERA_PRESETS[name];
}

/**
 * Get all camera preset names
 */
export function getCameraPresetNames(): string[] {
  return Object.keys(CAMERA_PRESETS);
}

/**
 * Calculate smooth camera transition parameters
 */
export function calculateCameraTransition(
  from: CameraPosition,
  to: CameraPosition,
  duration: number = 1000 // ms
): {
  duration: number;
  easing: 'easeInOutQuad' | 'easeInOutCubic';
} {
  return {
    duration,
    easing: 'easeInOutCubic',
  };
}
