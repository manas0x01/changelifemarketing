// app/api/user/total-income/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id).select(
      "totalIncome userId bankAccountDetails"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      totalIncome: user.totalIncome || 0,
      userId: user.userId,
      bankAccountDetails: user.bankAccountDetails || {},
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}