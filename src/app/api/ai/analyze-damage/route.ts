import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, DamageAnalysisResult } from '@/lib/ai/vision';

export const dynamic = 'force-dynamic';

/**
 * AI Damage Analysis API
 * Phase 5 - Analyze vehicle photos for damage detection
 *
 * POST /api/ai/analyze-damage
 * Body: { imageUrl: string } or FormData with 'image' file
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let imageSource: string | Buffer;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file provided' },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      imageSource = Buffer.from(arrayBuffer);
    } else {
      // Handle JSON with image URL
      const body = await request.json();
      const { imageUrl, imageBase64 } = body;

      if (imageBase64) {
        imageSource = Buffer.from(imageBase64, 'base64');
      } else if (imageUrl) {
        imageSource = imageUrl;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'No image provided',
            usage: {
              fileUpload: 'POST with multipart/form-data and "image" field',
              urlMethod: 'POST with JSON body { "imageUrl": "https://..." }',
              base64Method: 'POST with JSON body { "imageBase64": "..." }',
            },
          },
          { status: 400 }
        );
      }
    }

    // Check if Vision API is configured
    const hasCredentials =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!hasCredentials) {
      // Return mock data for demo purposes
      console.log('Vision API not configured, returning demo response');
      return NextResponse.json({
        success: true,
        data: getMockAnalysisResult(),
        demo: true,
        message: 'This is demo data. Configure GOOGLE_CLOUD_PROJECT_ID for real analysis.',
      });
    }

    // Perform analysis
    const result = await analyzeImage(imageSource);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Google Cloud Vision API not configured',
            details: error.message,
            setup: {
              step1: 'Create a Google Cloud project',
              step2: 'Enable Cloud Vision API',
              step3: 'Create service account and download JSON key',
              step4: 'Set GOOGLE_APPLICATION_CREDENTIALS env variable',
            },
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check API status
 */
export async function GET() {
  const hasCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_CLOUD_PROJECT_ID;

  return NextResponse.json({
    service: 'AI Damage Analysis',
    status: hasCredentials ? 'configured' : 'demo_mode',
    version: '1.0.0',
    capabilities: [
      'Damage type detection (dent, scratch, crack, broken, paint, rust)',
      'Panel location identification',
      'Severity assessment',
      'Labor operation suggestions',
      'Part recommendations',
      'Cost estimation',
    ],
    usage: {
      endpoint: 'POST /api/ai/analyze-damage',
      methods: [
        'File upload: multipart/form-data with "image" field',
        'URL: JSON body with "imageUrl"',
        'Base64: JSON body with "imageBase64"',
      ],
    },
    note: hasCredentials
      ? 'Google Cloud Vision API is configured'
      : 'Demo mode - set GOOGLE_CLOUD_PROJECT_ID for real analysis',
  });
}

/**
 * Generate mock analysis result for demo
 */
function getMockAnalysisResult(): DamageAnalysisResult {
  return {
    imageId: `demo_${Date.now()}`,
    imageUrl: 'demo-image',
    analyzedAt: new Date().toISOString(),
    processingTimeMs: 1250,
    damages: [
      {
        id: 'damage_1_dent',
        type: 'dent',
        location: 'front_bumper',
        confidence: 87,
        severity: 'moderate',
        boundingBox: { x: 0.2, y: 0.4, width: 0.3, height: 0.2 },
        description: 'Moderate dent detected on Front Bumper',
        suggestedOperations: [
          'PDR (Paintless Dent Repair)',
          'Body filler application',
          'Block sanding',
          'Prime',
          'Base coat',
          'Clear coat',
        ],
        suggestedParts: ['Paint and materials'],
        estimatedCost: {
          labor: 195,
          parts: 0,
          paint: 150,
          total: 345,
        },
      },
      {
        id: 'damage_2_scratch',
        type: 'scratch',
        location: 'left_fender',
        confidence: 92,
        severity: 'minor',
        description: 'Minor scratch detected on Left Fender',
        suggestedOperations: ['Sand and feather', 'Spot paint'],
        suggestedParts: ['Paint and materials'],
        estimatedCost: {
          labor: 65,
          parts: 0,
          paint: 150,
          total: 215,
        },
      },
      {
        id: 'damage_3_crack',
        type: 'crack',
        location: 'headlight_left',
        confidence: 95,
        severity: 'severe',
        description: 'Severe crack detected on Headlight Left',
        suggestedOperations: ['R&I Headlight Left', 'Replace Headlight Left'],
        suggestedParts: ['Headlight assembly', 'Headlight bulb', 'Paint and materials'],
        estimatedCost: {
          labor: 130,
          parts: 250,
          paint: 0,
          total: 380,
        },
      },
    ],
    overallConfidence: 91,
    vehicleDetected: true,
    panelDetected: 'front_bumper',
    rawLabels: [
      'Car',
      'Vehicle',
      'Bumper',
      'Dent',
      'Scratch',
      'Automotive exterior',
      'Headlight',
      'Damage',
    ],
    warnings: [],
  };
}
