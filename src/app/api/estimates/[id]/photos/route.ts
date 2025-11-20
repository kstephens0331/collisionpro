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

// Valid photo categories
const VALID_CATEGORIES = ["damage", "progress", "completed"];

// GET - Get all photos for an estimate
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

    // Get photos
    const { data: photos, error } = await supabase
      .from("Photo")
      .select("*")
      .eq("estimateId", id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch photos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: photos || [],
    });
  } catch (error) {
    console.error("Photo fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Upload a new photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;
    const caption = formData.get("caption") as string;
    const uploadedBy = formData.get("uploadedBy") as string || "Shop User";

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
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
    const fileName = `${id}/${nanoid()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload photo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("photos")
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData.publicUrl;

    // Create photo record in database
    const photoId = nanoid();
    const { data: photo, error: dbError } = await supabase
      .from("Photo")
      .insert({
        id: photoId,
        estimateId: id,
        url: photoUrl,
        category,
        caption: caption || null,
        uploadedBy,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating photo record:", dbError);
      // Try to delete the uploaded file
      await supabase.storage.from("photos").remove([fileName]);
      return NextResponse.json(
        { success: false, error: "Failed to save photo record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { success: false, error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Get photo to find the storage path
    const { data: photo, error: fetchError } = await supabase
      .from("Photo")
      .select("*")
      .eq("id", photoId)
      .eq("estimateId", id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 }
      );
    }

    // Extract storage path from URL
    const urlParts = photo.url.split("/photos/");
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      // Delete from storage
      await supabase.storage.from("photos").remove([storagePath]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("Photo")
      .delete()
      .eq("id", photoId);

    if (deleteError) {
      console.error("Error deleting photo:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
