import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [GET-CHILDREN-STATUS] Route called');
    
    await connectDB();
    console.log('✅ [DB] Database connected');

    const { userId } = await request.json();
    console.log('📝 [REQUEST] Username received:', userId);

    if (!userId) {
      console.log('❌ [VALIDATION] Username is required');
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    console.log('🔍 [DB] Searching for user with username:', userId.trim());
    const user = await User.findOne({ username: userId.trim() });
    console.log('🔍 [DB] User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ [ERROR] User not found for username:', userId.trim());
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('✅ [SUCCESS] Sending children status');
    console.log('📊 Left Child:', user.leftChild || "empty");
    console.log('📊 Right Child:', user.rightChild || "empty");

    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      leftChild: user.leftChild || "",
      rightChild: user.rightChild || "",
    });
  } catch (error) {
    console.error("❌ [ERROR] Error fetching children status:", error);
    console.error("❌ [ERROR] Stack:", (error as any)?.stack);
    return NextResponse.json(
      { error: "Failed to fetch children status" },
      { status: 500 }
    );
  }
}
