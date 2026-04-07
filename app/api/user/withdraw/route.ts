import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from "@/models/User";
import WithdrawRequest from "@/models/WithdrawRequest";

function generateRequestNo(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WD-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || isNaN(amount) || Number(amount) < 800) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₹800" },
        { status: 400 }
      );
    }
    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userBalance = user.totalIncome || 0;
    if (Number(amount) > userBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }
    if (!user.accountNo || !user.fullName) {
      return NextResponse.json(
        { error: "Bank details not found. Please update your profile first." },
        { status: 400 }
      );
    }
    const pendingExists = await WithdrawRequest.findOne({ 
      userId: user.userId, 
      status: 'Pending' 
    });
    if (pendingExists) {
      return NextResponse.json(
        { error: "You already have a pending withdrawal request. Please wait for it to be processed." },
        { status: 400 }
      );
    }
    const requestNo = generateRequestNo();
    const currentIncome = user.totalIncome || 0;
    const remainingBalance = currentIncome - Number(amount);
    let validAccountType = user.accountType || 'Savings';
    if (validAccountType === 'Saving') {
      validAccountType = 'Savings';
      user.accountType = 'Savings';
    }
    user.totalIncome = remainingBalance;
    if (!user.withdrawRequests) user.withdrawRequests = [];
    user.withdrawRequests.push({
      requestNo,
      amount: Number(amount),
      status: 'Pending',
      requestDate: new Date(),
    });
    await user.save();
    const withdrawRequestData = {
      userId:       user.username,
      userName:     user.username,
      userFullName: user.fullName || user.username,
      mobileNo:     user.mobileNo || user.phone || '',
      requestNo,
      amount:       Number(amount),
      status:       'Pending',
      requestDate:  new Date(),
      bankDetails: {
        accountHolderName: user.fullName,
        accountNumber:     user.accountNo,
        ifscCode:          user.ifsc || '',
        bankName:          user.bankName || '',
        accountType:       validAccountType || 'Savings',
      },
    };
    await WithdrawRequest.create(withdrawRequestData);
    return NextResponse.json({
      success: true,
      message: `Withdrawal request of ₹${amount} submitted successfully`,
      requestNo,
      remainingBalance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const requests = await WithdrawRequest.find({ userId: user.userId })
      .sort({ requestDate: -1 })
      .lean();

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}