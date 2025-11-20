import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret (use a strong secret in production)
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find customer by email
    const { data: customer, error } = await supabase
      .from("Customer")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, customer.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      {
        customerId: customer.id,
        email: customer.email,
        type: "customer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return customer data (without password) and token
    const { password: _, ...customerData } = customer;

    const response = NextResponse.json({
      success: true,
      customer: customerData,
      token,
      message: "Login successful",
    });

    // Set HTTP-only cookie for authentication
    response.cookies.set("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
