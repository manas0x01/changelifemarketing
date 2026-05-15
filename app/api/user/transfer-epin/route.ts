import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientMemberId, pin, packageSelected, remark } = body;

    if (!recipientMemberId || !pin) {
      return NextResponse.json({ success: false, error: "Recipient and Pin are required" }, { status: 400 });
    }

    await connectDB();

    // 1. Get Sender
    const sender = await User.findOne({ username: session.user.username });
    if (!sender) {
      return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 });
    }

    // 2. Check if sender has the pin
    const pinIndex = sender.ePins?.findIndex((p: any) => p.pin === pin && (p.status === "Active" || !p.status));
    if (pinIndex === -1 || pinIndex === undefined) {
      return NextResponse.json({ success: false, error: "E-Pin not found or already used" }, { status: 400 });
    }

    const pinToTransfer = sender.ePins![pinIndex];

    // 3. Get Recipient
    const recipient = await User.findOne({
      $or: [
        { username: recipientMemberId },
        { userId: recipientMemberId }
      ]
    });

    if (!recipient) {
      return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 });
    }

    if (recipient.username === sender.username) {
      return NextResponse.json({ success: false, error: "Cannot transfer to yourself" }, { status: 400 });
    }

    // 4. Perform Transfer
    const now = new Date();

    // A. Remove from sender and add to their history
    sender.ePins!.splice(pinIndex, 1);
    
    sender.transferHistory = sender.transferHistory || [];
    sender.transferHistory.push({
      srNo: sender.transferHistory.length + 1,
      reqNo: `TXN${Date.now().toString().slice(-6)}`,
      fromUser: sender.username,
      fromUserName: sender.fullName || sender.username,
      transferType: "Sent",
      transferRejectDate: now,
      package: packageSelected || pinToTransfer.packageName,
      quantity: 1,
      amount: "0",
      status: "Transferred"
    });

    sender.transferredEpins = sender.transferredEpins || [];
    sender.transferredEpins.push({
      date: now,
      time: now.toLocaleTimeString(),
      ePin: pin,
      package: packageSelected || pinToTransfer.packageName,
      transferredTo: recipient.username,
      transferredToName: recipient.fullName || recipient.username,
      status: "Success",
      remark: remark || "Transferred"
    });

    // B. Add to recipient
    recipient.ePins = recipient.ePins || [];
    recipient.ePins.push({
      pin: pin,
      packageName: packageSelected || pinToTransfer.packageName,
      status: "Active",
      transferredFrom: sender.username,
      transferredFromName: sender.fullName || sender.username,
      transferDate: now,
      remark: remark || "Received via transfer"
    });

    recipient.transferHistory = recipient.transferHistory || [];
    recipient.transferHistory.push({
      srNo: recipient.transferHistory.length + 1,
      reqNo: `RXN${Date.now().toString().slice(-6)}`,
      fromUser: sender.username,
      fromUserName: sender.fullName || sender.username,
      transferType: "Received",
      transferRejectDate: now,
      package: packageSelected || pinToTransfer.packageName,
      quantity: 1,
      amount: "0",
      status: "Transferred"
    });

    // Save both
    await sender.save();
    await recipient.save();

    return NextResponse.json({
      success: true,
      message: `E-Pin ${pin} transferred successfully to ${recipient.fullName || recipient.username}`
    });

  } catch (error) {
    console.error("❌ TRANSFER EPIN ERROR:", error);
    return NextResponse.json({ success: false, error: "An error occurred during transfer" }, { status: 500 });
  }
}
