import { NextResponse } from 'next/server';
import { decodeVIN } from '@/lib/vin-decoder';

/**
 * POST /api/vin/decode
 * Decode a VIN to get vehicle details
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vin } = body;

    if (!vin) {
      return NextResponse.json(
        { success: false, error: 'VIN is required' },
        { status: 400 }
      );
    }

    const result = await decodeVIN(vin);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('VIN decode API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to decode VIN' },
      { status: 500 }
    );
  }
}
