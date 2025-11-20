/**
 * Analytics tracking for 3D viewer usage
 */

export interface ViewerAnalyticsEvent {
  event: '3d_viewer_opened' | '3d_marker_added' | '3d_markers_saved' | '3d_screenshot_captured' | '3d_camera_changed';
  estimateId: string;
  vehicleType?: string;
  markerCount?: number;
  damageType?: string;
  cameraAngle?: string;
  timestamp: string;
}

/**
 * Track 3D viewer event
 */
export async function track3DViewerEvent(
  event: ViewerAnalyticsEvent['event'],
  data: Omit<ViewerAnalyticsEvent, 'event' | 'timestamp'>
) {
  const eventData: ViewerAnalyticsEvent = {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  };

  try {
    // Send to analytics endpoint (async, don't await)
    fetch('/api/analytics/3d-viewer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    }).catch(err => {
      // Silent fail - don't break user experience for analytics
      console.debug('Analytics tracking failed:', err);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 3D Viewer Analytics:', eventData);
    }
  } catch (error) {
    // Silent fail
    console.debug('Failed to track 3D viewer event:', error);
  }
}

/**
 * Track when 3D viewer is opened
 */
export function trackViewerOpened(estimateId: string, vehicleType: string) {
  return track3DViewerEvent('3d_viewer_opened', { estimateId, vehicleType });
}

/**
 * Track when damage marker is added
 */
export function trackMarkerAdded(estimateId: string, damageType: string) {
  return track3DViewerEvent('3d_marker_added', { estimateId, damageType });
}

/**
 * Track when markers are saved
 */
export function trackMarkersSaved(estimateId: string, markerCount: number) {
  return track3DViewerEvent('3d_markers_saved', { estimateId, markerCount });
}

/**
 * Track when screenshot is captured
 */
export function trackScreenshotCaptured(estimateId: string) {
  return track3DViewerEvent('3d_screenshot_captured', { estimateId });
}

/**
 * Track camera angle changes
 */
export function trackCameraChanged(estimateId: string, cameraAngle: string) {
  return track3DViewerEvent('3d_camera_changed', { estimateId, cameraAngle });
}
