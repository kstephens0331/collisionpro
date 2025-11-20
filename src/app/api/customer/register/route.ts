import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phoneNumber } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Email, password, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from("Customer")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customerId = nanoid();
    const { data: customer, error } = await supabase
      .from("Customer")
      .insert({
        id: customerId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Return customer data (without password)
    const { password: _, ...customerData } = customer;

    return NextResponse.json({
      success: true,
      customer: customerData,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Customer registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
