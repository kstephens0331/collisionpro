import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/analytics/3d-viewer
 * Track 3D viewer analytics events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, estimateId, vehicleType, markerCount, damageType, cameraAngle, timestamp } = body;

    // Validate required fields
    if (!event || !estimateId) {
      return NextResponse.json(
        { success: false, error: 'event and estimateId are required' },
        { status: 400 }
      );
    }

    // Store in database (create table if it doesn't exist)
    const { error } = await supabaseAdmin
      .from('analytics_3d_viewer')
      .insert({
        event,
        estimate_id: estimateId,
        vehicle_type: vehicleType,
        marker_count: markerCount,
        damage_type: damageType,
        camera_angle: cameraAngle,
        timestamp: timestamp || new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, log but don't fail
      if (error.code === '42P01') {
        console.log('Analytics table not created yet:', error.message);
        return NextResponse.json({ success: true, message: 'Analytics table pending creation' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking 3D viewer analytics:', error);
    // Return success anyway - don't break user experience for analytics
    return NextResponse.json({ success: true, error: error.message });
  }
}

/**
 * GET /api/analytics/3d-viewer?estimateId=xxx
 * Get analytics for specific estimate or aggregate stats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get('estimateId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabaseAdmin.from('analytics_3d_viewer').select('*');

    if (estimateId) {
      query = query.eq('estimate_id', estimateId);
    }

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty results
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [], message: 'Analytics table not created yet' });
      }
      throw error;
    }

    // Calculate aggregate stats
    const stats = {
      totalEvents: data.length,
      viewerOpened: data.filter(e => e.event === '3d_viewer_opened').length,
      markersAdded: data.filter(e => e.event === '3d_marker_added').length,
      markersSaved: data.filter(e => e.event === '3d_markers_saved').length,
      screenshotsCaptured: data.filter(e => e.event === '3d_screenshot_captured').length,
      cameraChanges: data.filter(e => e.event === '3d_camera_changed').length,
      mostUsedDamageTypes: getMostUsed(data.filter(e => e.damage_type), 'damage_type'),
      mostUsedCameraAngles: getMostUsed(data.filter(e => e.camera_angle), 'camera_angle'),
    };

    return NextResponse.json({
      success: true,
      data,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching 3D viewer analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper to get most used values
 */
function getMostUsed(data: any[], field: string): Array<{ value: string; count: number }> {
  const counts: Record<string, number> = {};

  data.forEach(item => {
    const value = item[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
}
