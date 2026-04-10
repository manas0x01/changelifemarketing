// app/api/user/total-income/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from "@/models/User";

export async function GET() {
  try {
    console.log('💳 [API] TOTAL-INCOME - Starting...');
    
    await connectDB();
    console.log('📊 [API] TOTAL-INCOME - Database connected');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      console.log('❌ [API] TOTAL-INCOME - Unauthorized: No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ [API] TOTAL-INCOME - Session found:', session.user.username);
    
    const user = await User.findOne({ username: session.user.username }).select(
      "basicIncome boosterIncomeAmount userId fullName bankName accountNo ifsc accountType"
    );

    if (!user) {
      console.log('❌ [API] TOTAL-INCOME - User not found:', session.user.username);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log('✅ [API] TOTAL-INCOME - User found');

    // Calculate total income dynamically: Basic + Booster
    const basicIncome = user.basicIncome || 0;
    const boosterIncomeAmount = user.boosterIncomeAmount || 0;
    const calculatedTotalIncome = basicIncome + boosterIncomeAmount;
    
    console.log('📝 [API] TOTAL-INCOME - Basic:', basicIncome, '| Booster:', boosterIncomeAmount, '| Total:', calculatedTotalIncome);

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
    console.error('❌ [API] TOTAL-INCOME - Error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}