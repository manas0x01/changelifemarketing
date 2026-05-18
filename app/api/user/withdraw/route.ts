import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import WithdrawRequest from "@/models/WithdrawRequest";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { amount } = await req.json();

    if (!amount || isNaN(amount) || amount < 1000) {
      return NextResponse.json(
        { success: false, message: "Minimum withdrawal amount is ₹1000." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const accountHolderName = user.bankAccountDetails?.accountHolderName || user.fullName || "N/A";
    const accountNumber = user.bankAccountDetails?.accountNumber || user.accountNo || "N/A";
    const ifscCode = user.bankAccountDetails?.ifscCode || user.ifsc || "N/A";
    const bankName = user.bankAccountDetails?.bankName || user.bankName || "N/A";

    // Check bank details approval status
    if (user.bankDetailsStatus !== 'approved') {
      return NextResponse.json(
        { success: false, message: "Your bank details must be approved by the Admin before you can make a withdrawal." },
        { status: 400 }
      );
    }

    // Check bank details
    if (accountNumber === "N/A" || !accountNumber) {
      return NextResponse.json(
        { success: false, message: "Bank details not added. Please update your profile first." },
        { status: 400 }
      );
    }

    // Calculate current balance
    const totalEarned = (user.basicIncome || 0) + (user.boosterMatchingIncome || 0) + (user.awardIncome || 0) + (user.repurchaseIncome || 0);
    
    // Find total withdrawn or pending
    let totalWithdrawn = 0;
    if (user.withdrawRequests && user.withdrawRequests.length > 0) {
      user.withdrawRequests.forEach((req: any) => {
        if (req.status === 'Approved' || req.status === 'Pending') {
          totalWithdrawn += req.amount;
        }
      });
    }

    const availableBalance = totalEarned - totalWithdrawn;

    if (amount > availableBalance) {
      return NextResponse.json(
        { success: false, message: `Insufficient balance. Available: ₹${availableBalance.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    // Generate request No
    const requestNo = `WD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create the withdraw request for user document
    const newReq: any = {
      requestNo,
      amount,
      status: 'Pending',
      requestDate: new Date(),
    };

    if (!user.withdrawRequests) user.withdrawRequests = [];
    user.withdrawRequests.push(newReq);

    // Also insert into WithdrawRequest collection for Admin panel
    await WithdrawRequest.create({
      userId: user.userId || user.username,
      userName: user.username,
      userFullName: user.fullName || user.username,
      mobileNo: user.mobileNo || "N/A",
      requestNo,
      amount,
      status: 'Pending',
      requestDate: new Date(),
      bankDetails: {
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
      }
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully!",
      remainingBalance: availableBalance - amount
    });
  } catch (error: any) {
    console.error("❌ Withdraw POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process withdraw request" },
      { status: 500 }
    );
  }
}

// Return the user's history if needed
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ username: session.user.username }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.withdrawRequests || []
    });
  } catch (error: any) {
    console.error("❌ Withdraw GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch withdraw requests" }, { status: 500 });
  }
}