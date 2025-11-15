import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/labor-operations
 * Fetch all industry-standard labor operations
 * Optional query params:
 *   - category: filter by category (body, paint, mechanical, etc.)
 *   - search: search operation name/description
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('LaborOperation')
      .select('*')
      .order('category', { ascending: true })
      .order('operation', { ascending: true });

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Search operation name or description
    if (search) {
      query = query.or(`operation.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: operations, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch labor operations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operations: operations || [],
    });
  } catch (error: any) {
    console.error('Error fetching labor operations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
