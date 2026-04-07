// app/api/user/total-income/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user || (!session.user.id && !session.user.username)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let user;
    if (session.user.id) {
      try {
        const objectId = new mongoose.Types.ObjectId(session.user.id);
        user = await User.findById(objectId).select(
          "totalIncome userId fullName bankName accountNo ifsc accountType"
        );
      } catch (err) {
        // If ObjectId conversion fails, try by username
        user = await User.findOne({ username: session.user.username }).select(
          "totalIncome userId fullName bankName accountNo ifsc accountType"
        );
      }
    } else {
      user = await User.findOne({ username: session.user.username }).select(
        "totalIncome userId fullName bankName accountNo ifsc accountType"
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      totalIncome: user.totalIncome || 0,
      userId: user.userId,
      fullName: user.fullName || "",
      bankName: user.bankName || "",
      accountNo: user.accountNo || "",
      ifsc: user.ifsc || "",
      accountType: user.accountType || "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}