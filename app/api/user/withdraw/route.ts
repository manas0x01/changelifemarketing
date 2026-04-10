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
    console.log('💸 [API] WITHDRAW - Request initiated');
    
    await connectDB();
    console.log('📊 [API] WITHDRAW - Database connected');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [API] WITHDRAW - Unauthorized: No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ [API] WITHDRAW - Session found:', session.user.username);

    const { amount } = await req.json();
    console.log('📝 [API] WITHDRAW - Amount requested:', amount);

    if (!amount || isNaN(amount) || Number(amount) < 800) {
      console.log('❌ [API] WITHDRAW - Invalid amount:', amount);
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₹800" },
        { status: 400 }
      );
    }
    console.log('✅ [API] WITHDRAW - Amount validation passed');
    
    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      console.log('❌ [API] WITHDRAW - User not found:', session.user.username);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log('✅ [API] WITHDRAW - User found');
    
    const userBalance = user.totalIncome || 0;
    console.log('📝 [API] WITHDRAW - User balance:', userBalance);
    
    if (Number(amount) > userBalance) {
      console.log('❌ [API] WITHDRAW - Insufficient balance. Requested:', amount, '| Available:', userBalance);
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }
    console.log('✅ [API] WITHDRAW - Balance check passed');
    
    if (!user.accountNo || !user.fullName) {
      console.log('❌ [API] WITHDRAW - Bank details missing');
      return NextResponse.json(
        { error: "Bank details not found. Please update your profile first." },
        { status: 400 }
      );
    }
    console.log('✅ [API] WITHDRAW - Bank details verified');
    const pendingExists = await WithdrawRequest.findOne({ 
      userId: user.userId, 
      status: 'Pending' 
    });
    if (pendingExists) {
      console.log('❌ [API] WITHDRAW - Pending request already exists');
      return NextResponse.json(
        { error: "You already have a pending withdrawal request. Please wait for it to be processed." },
        { status: 400 }
      );
    }
    console.log('✅ [API] WITHDRAW - No pending requests');
    
    const requestNo = generateRequestNo();
    console.log('🚀 [API] WITHDRAW - Request number generated:', requestNo);
    
    const currentIncome = user.totalIncome || 0;
    const remainingBalance = currentIncome - Number(amount);
    console.log('📊 [API] WITHDRAW - Current income:', currentIncome, '| Remaining after withdrawal:', remainingBalance);
    
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
    console.log('✅ [API] WITHDRAW - User record updated and saved');
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
    console.log('✅ [API] WITHDRAW - Withdrawal request record created');
    console.log('🎉 [API] WITHDRAW - SUCCESS! Request:', requestNo, '| Amount:', amount, '| New balance:', remainingBalance);
    
    return NextResponse.json({
      success: true,
      message: `Withdrawal request of ₹${amount} submitted successfully`,
      requestNo,
      remainingBalance,
    });
  } catch (error: any) {
    console.error('❌ [API] WITHDRAW - Error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('📋 [API] WITHDRAW-GET - Fetching withdrawal history');
    
    await connectDB();
    console.log('📊 [API] WITHDRAW-GET - Database connected');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ [API] WITHDRAW-GET - Unauthorized: No session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('✅ [API] WITHDRAW-GET - Session found:', session.user.username);
    
    const user = await User.findOne({ username: session.user.username });
    if (!user) {
      console.log('❌ [API] WITHDRAW-GET - User not found:', session.user.username);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log('✅ [API] WITHDRAW-GET - User found');
    
    const requests = await WithdrawRequest.find({ userId: user.userId })
      .sort({ requestDate: -1 })
      .lean();
    
    console.log('✅ [API] WITHDRAW-GET - Found', requests.length, 'withdrawal requests');

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error('❌ [API] WITHDRAW-GET - Error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}