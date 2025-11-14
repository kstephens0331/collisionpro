import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create shop and user in a transaction
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

      // Create admin user
      const user = await tx.user.create({
        data: {
          shopId: shop.id,
          email: email,
          passwordHash: passwordHash,
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
