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
    if (!session?.user?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await User.findOne({ username: session.user.username }).select(
      "basicIncome boosterIncomeAmount userId fullName bankName accountNo ifsc accountType"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const basicIncome = user.basicIncome || 0;
    const boosterIncomeAmount = user.boosterIncomeAmount || 0;
    const calculatedTotalIncome = basicIncome + boosterIncomeAmount;
    return NextResponse.json({
      totalIncome: calculatedTotalIncome,
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