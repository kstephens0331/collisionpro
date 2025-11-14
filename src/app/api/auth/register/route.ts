import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopName, email, password, firstName, lastName, phone } = body;

    // Validate input
    if (!shopName || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName,
        lastName
      }
    });

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Failed to create auth user", details: authError?.message },
        { status: 500 }
      );
    }

    // Create shop and user records in database
    const result = await prisma.$transaction(async (tx) => {
      // Create shop
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          email: email,
          phone: phone,
          subscriptionTier: "trial",
          subscriptionStatus: "active"
        }
      });

      // Create user record (linked to Supabase auth user)
      const user = await tx.user.create({
        data: {
          id: authData.user.id, // Use Supabase auth user ID
          shopId: shop.id,
          email: email,
          passwordHash: "", // Not needed, Supabase handles auth
          firstName: firstName,
          lastName: lastName,
          role: "admin",
          isActive: true
        }
      });

      // Create default rate profile
      await tx.rateProfile.create({
        data: {
          shopId: shop.id,
          name: "Standard",
          laborRate: 50.00,
          paintRate: 45.00,
          markupPercentage: 30.00,
          taxRate: 8.25,
          isDefault: true
        }
      });

      return { shop, user };
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      shopId: result.shop.id,
      userId: result.user.id
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
