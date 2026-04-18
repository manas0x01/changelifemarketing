import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Debug: log session user for troubleshooting
    console.log("[validateTx] session.user:", {
      username: session?.user?.username ?? null,
      id: session?.user?.id ?? session?.user?.userId ?? null,
    });

    const userId = session?.user?.id ?? session?.user?.userId ?? null;

    if (!userId) {
      const resp = { success: false, message: "Unauthorized" };
      console.log("[validateTx] responding:", { status: 401, body: resp });
      return NextResponse.json(resp, { status: 401 });
    }
    const body = await req.json();
    const { transactionPassword, epin } = body;
    console.log("[validateTx] received body:", {
      transactionPassword: transactionPassword ? "***REDACTED***" : null,
      transactionPasswordLength: transactionPassword ? transactionPassword.length : 0,
      epin,
    });
    if (!transactionPassword) {
      const resp = { success: false, message: "Transaction password is required" };
      console.log("[validateTx] responding:", { status: 400, body: resp });
      return NextResponse.json(resp, { status: 400 });
    }
    await connectDB();
    const user = await User.findById(userId).select("+transactionPassword ePins");

    console.log("[validateTx] db user found:", {
      username: user?.username ?? null,
      id: user?._id?.toString?.() ?? null,
      transactionPasswordHashPreview: user?.transactionPassword
        ? `${user.transactionPassword.slice(0, 10)}...${user.transactionPassword.slice(-6)}`
        : null,
      ePinsCount: user?.ePins?.length ?? 0,
    });

    if (!user) {
      const resp = { success: false, message: "User not found" };
      console.log("[validateTx] responding:", { status: 404, body: resp });
      return NextResponse.json(resp, { status: 404 });
    }

    if (!user.transactionPassword) {
      const resp = { success: false, message: "Transaction password not set for user", hasPins: !!(user.ePins && user.ePins.length > 0) };
      console.log("[validateTx] responding:", { status: 400, body: resp });
      return NextResponse.json(resp, { status: 400 });
    }

    // Use model helper for consistent trimming + comparison
    const isValidPassword = await (user as any).compareTransactionPassword(transactionPassword);
    console.log("[validateTx] isValidPassword:", isValidPassword);

    if (!isValidPassword) {
      const resp = { success: false, message: "Invalid transaction password", hasPins: !!(user.ePins && user.ePins.length > 0) };
      console.log("[validateTx] responding:", { status: 400, body: resp });
      return NextResponse.json(resp, { status: 400 });
    }

    const hasPins = !!(user.ePins && user.ePins.length > 0);

    // If caller provided an E-PIN, validate it and return pin details
    if (epin) {
      const pinData = user.ePins?.find((p: any) => p.pin === epin);
      console.log("[validateTx] pinData:", pinData ? { pin: pinData.pin, status: pinData.status } : null);

      if (!pinData) {
        const resp = { success: false, message: "Invalid E-PIN", hasPins };
        console.log("[validateTx] responding:", { status: 400, body: resp });
        return NextResponse.json(resp, { status: 400 });
      }

      const resp = {
        success: true,
        message: "Validation successful",
        hasPins: true,
        pinDetails: {
          pin: pinData.pin,
          status: pinData.status,
        },
      };
      console.log("[validateTx] responding:", { status: 200, body: resp });
      return NextResponse.json(resp, { status: 200 });
    }

    // No E-PIN provided — transaction password validated only; inform about pin availability
    if (!hasPins) {
      const resp = { success: false, message: "First Buy The EPin Then Create A Account", hasPins: false };
      console.log("[validateTx] responding:", { status: 200, body: resp });
      return NextResponse.json(resp, { status: 200 });
    }

    const resp = { success: true, message: "Transaction password validated", hasPins: true };
    console.log("[validateTx] responding:", { status: 200, body: resp });
    return NextResponse.json(resp, { status: 200 });

  } catch (error: any) {
    console.error("❌ VALIDATION ERROR:", error);
    const resp = { success: false, message: "Validation failed" };
    console.log("[validateTx] responding:", { status: 500, body: resp });
    return NextResponse.json(resp, { status: 500 });
  }
}