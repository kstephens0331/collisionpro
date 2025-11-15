import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/shop-settings?shopId=xxx
 * Fetch shop settings for a specific shop
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    const { data: settings, error } = await supabaseAdmin
      .from('ShopSettings')
      .select('*')
      .eq('shopId', shopId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shop settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: settings || null,
    });
  } catch (error: any) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shop-settings
 * Update shop settings
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { shopId, ...updates } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
      .from('ShopSettings')
      .select('id')
      .eq('shopId', shopId)
      .single();

    let settings;
    let error;

    if (existing) {
      // Update existing settings
      const result = await supabaseAdmin
        .from('ShopSettings')
        .update(updates)
        .eq('shopId', shopId)
        .select()
        .single();

      settings = result.data;
      error = result.error;
    } else {
      // Create new settings
      const result = await supabaseAdmin
        .from('ShopSettings')
        .insert({
          id: `settings_${Date.now()}`,
          shopId,
          ...updates,
        })
        .select()
        .single();

      settings = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update shop settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
