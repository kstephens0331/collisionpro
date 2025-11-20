import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/estimates/[id]/photos/[photoId]/annotations - Get photo annotations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: estimateId, photoId } = await params;

    // Get the photo with annotations
    const { data: photo, error } = await supabase
      .from("Photo")
      .select("id, annotations")
      .eq("id", photoId)
      .eq("estimateId", estimateId)
      .single();

    if (error || !photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 }
      );
    }

    // Annotations are stored in the annotations JSONB field
    return NextResponse.json({
      success: true,
      data: {
        photoId: photo.id,
        annotations: photo.annotations || [],
      },
    });
  } catch (error) {
    console.error("Error fetching photo annotations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

// POST /api/estimates/[id]/photos/[photoId]/annotations - Save photo annotations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: estimateId, photoId } = await params;
    const body = await request.json();
    const { annotations } = body;

    if (!Array.isArray(annotations)) {
      return NextResponse.json(
        { success: false, error: "Annotations must be an array" },
        { status: 400 }
      );
    }

    // Update the photo with new annotations
    const { data: updatedPhoto, error } = await supabase
      .from("Photo")
      .update({
        annotations: annotations,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", photoId)
      .eq("estimateId", estimateId)
      .select()
      .single();

    if (error) {
      console.error("Error updating photo annotations:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save annotations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        photoId: updatedPhoto.id,
        annotations: updatedPhoto.annotations,
        message: "Annotations saved successfully",
      },
    });
  } catch (error) {
    console.error("Error saving photo annotations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save annotations" },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id]/photos/[photoId]/annotations - Clear all annotations
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: estimateId, photoId } = await params;

    // Clear all annotations
    const { data: updatedPhoto, error } = await supabase
      .from("Photo")
      .update({
        annotations: [],
        updatedAt: new Date().toISOString(),
      })
      .eq("id", photoId)
      .eq("estimateId", estimateId)
      .select()
      .single();

    if (error) {
      console.error("Error clearing photo annotations:", error);
      return NextResponse.json(
        { success: false, error: "Failed to clear annotations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        photoId: updatedPhoto.id,
        message: "Annotations cleared successfully",
      },
    });
  } catch (error) {
    console.error("Error clearing photo annotations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear annotations" },
      { status: 500 }
    );
  }
}
