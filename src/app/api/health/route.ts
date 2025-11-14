import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Try to query a table
    const shopCount = await prisma.shop.count();

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      prisma: "working",
      tables: {
        shops: shopCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message,
      stack: error.stack,
      prismaGenerated: typeof prisma !== 'undefined',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
