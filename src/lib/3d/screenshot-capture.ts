import * as THREE from 'three';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number; // 0-1 for jpeg
  transparent?: boolean;
}

/**
 * Capture screenshot from Three.js canvas
 */
export function captureScreenshot(
  renderer: THREE.WebGLRenderer,
  options: ScreenshotOptions = {}
): string {
  const {
    width = 1920,
    height = 1080,
    format = 'png',
    quality = 0.95,
    transparent = false,
  } = options;

  // Store original size
  const originalSize = renderer.getSize(new THREE.Vector2());
  const originalPixelRatio = renderer.getPixelRatio();

  // Set high-resolution render size
  renderer.setSize(width, height);
  renderer.setPixelRatio(2); // 2x for retina/high-DPI

  // Render frame
  renderer.render(renderer.getRenderTarget() as any, renderer.getRenderTarget() as any);

  // Capture as data URL
  const canvas = renderer.domElement;
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);

  // Restore original size
  renderer.setSize(originalSize.x, originalSize.y);
  renderer.setPixelRatio(originalPixelRatio);

  return dataUrl;
}

/**
 * Download screenshot as file
 */
export function downloadScreenshot(
  dataUrl: string,
  filename: string = 'vehicle-damage.png'
) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Capture multiple angles
 */
export async function captureMultipleAngles(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  cameraPresets: Array<{ position: [number, number, number]; target: [number, number, number]; label: string }>,
  options: ScreenshotOptions = {}
): Promise<Array<{ label: string; dataUrl: string }>> {
  const screenshots: Array<{ label: string; dataUrl: string }> = [];

  for (const preset of cameraPresets) {
    // Set camera position
    camera.position.set(...preset.position);
    camera.lookAt(...preset.target);
    camera.updateProjectionMatrix();

    // Render scene
    renderer.render(scene, camera);

    // Capture screenshot
    const dataUrl = captureScreenshot(renderer, options);

    screenshots.push({
      label: preset.label,
      dataUrl,
    });
  }

  return screenshots;
}

/**
 * Convert data URL to Blob for upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)![1];
  const base64 = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(base64.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < base64.length; i++) {
    uint8Array[i] = base64.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mimeType });
}

/**
 * Helper to clean scene for screenshots (remove helpers, grids, etc.)
 */
export function setCleanRenderMode(scene: THREE.Scene, clean: boolean) {
  scene.traverse((object) => {
    // Hide grid helpers
    if (object instanceof THREE.GridHelper) {
      object.visible = !clean;
    }

    // Hide axis helpers
    if (object instanceof THREE.AxesHelper) {
      object.visible = !clean;
    }

    // Hide any debug objects (by naming convention)
    if (object.name.startsWith('debug_')) {
      object.visible = !clean;
    }
  });
}
