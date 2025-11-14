import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        shopName,
        phone
      }
    });

    if (authError || !authData.user) {
      console.error("Supabase auth error:", authError);
      return NextResponse.json(
        { error: "Failed to create auth user", details: authError?.message },
        { status: 500 }
      );
    }

    // Create shop record in database
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('Shop')
      .insert({
        id: authData.user.id + '_shop',
        name: shopName,
        email: email,
        phone: phone,
        subscriptionTier: 'trial',
        subscriptionStatus: 'active'
      })
      .select()
      .single();

    if (shopError) {
      console.error("Shop creation error:", shopError);
      // Delete the auth user if shop creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create shop", details: shopError.message },
        { status: 500 }
      );
    }

    // Create user record in database
    const { error: userError } = await supabaseAdmin
      .from('User')
      .insert({
        id: authData.user.id,
        shopId: shopData.id,
        email: email,
        passwordHash: '',
        firstName: firstName,
        lastName: lastName,
        role: 'admin',
        isActive: true
      });

    if (userError) {
      console.error("User record creation error:", userError);
      return NextResponse.json(
        { error: "Failed to create user record", details: userError.message },
        { status: 500 }
      );
    }

    // Create default rate profile
    const { error: rateError } = await supabaseAdmin
      .from('RateProfile')
      .insert({
        shopId: shopData.id,
        name: 'Standard',
        laborRate: 50.00,
        paintRate: 45.00,
        markupPercentage: 30.00,
        taxRate: 8.25,
        isDefault: true
      });

    if (rateError) {
      console.error("Rate profile creation error:", rateError);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: authData.user.id
    });

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: error.message
      },
      { status: 500 }
    );
  }
}
