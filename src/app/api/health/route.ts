import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // Test database connection by querying shops table
    const { data: shops, error } = await supabaseAdmin
      .from('Shop')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      supabase: "working",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
