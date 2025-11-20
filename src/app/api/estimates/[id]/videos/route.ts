import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// GET - Get all videos for an estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id")
      .eq("id", id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Get videos
    const { data: videos, error } = await supabase
      .from("EstimateVideo")
      .select("*")
      .eq("estimateId", id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videos: videos || [],
    });
  } catch (error) {
    console.error("Video fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Upload a new video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const caption = formData.get("caption") as string;
    const uploadedBy = formData.get("uploadedBy") as string || "Shop User";

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Video file is required" },
        { status: 400 }
      );
    }

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id")
      .eq("id", id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}/videos/${nanoid()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload video" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    const videoUrl = publicUrlData.publicUrl;

    // Create video record in database
    const videoId = nanoid();
    const { data: video, error: dbError } = await supabase
      .from("EstimateVideo")
      .insert({
        id: videoId,
        estimateId: id,
        url: videoUrl,
        caption: caption || null,
        uploadedBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating video record:", dbError);
      // Try to delete the uploaded file
      await supabase.storage.from("videos").remove([fileName]);
      return NextResponse.json(
        { success: false, error: "Failed to save video record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
      videoUrl,
    });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Get video to find the storage path
    const { data: video, error: fetchError } = await supabase
      .from("EstimateVideo")
      .select("*")
      .eq("id", videoId)
      .eq("estimateId", id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Extract storage path from URL
    const urlParts = video.url.split("/videos/");
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      // Delete from storage
      await supabase.storage.from("videos").remove([storagePath]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("EstimateVideo")
      .delete()
      .eq("id", videoId);

    if (deleteError) {
      console.error("Error deleting video:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete video" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Video delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
