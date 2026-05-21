import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: "Please provide either your User ID or Email address." },
        { status: 400 }
      );
    }

    await connectDB();

    // Query for the user by username/userId or email address
    let query: any = {};
    if (userId) {
      const uId = userId.trim();
      query = { $or: [{ username: { $regex: new RegExp(`^${uId}$`, "i") } }, { userId: { $regex: new RegExp(`^${uId}$`, "i") } }] };
    } else if (email) {
      query = { email: { $regex: new RegExp(`^${email.trim()}$`, "i") } };
    }

    const user = await User.findOne(query);

    if (!user) {
      // For security, don't reveal if user doesn't exist, but here we can return a friendly error or mock success.
      // Usually, it's friendlier to say "If that account exists, a reset link was sent" or "User not found". Let's say "User not found" so they know they entered the wrong ID/email.
      return NextResponse.json(
        { success: false, message: "No account found with those details." },
        { status: 404 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { success: false, message: "This user profile does not have an email address configured. Please contact support." },
        { status: 400 }
      );
    }

    // Generate reset token and expiration (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await user.save();

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/auth/resetpassword?token=${token}`;

    console.log("=========================================");
    console.log("🔑 [PASSWORD RESET LINK GENERATED]");
    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("=========================================");

    // Attempt to send email
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || "587");
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@changelifemarketing.com";

    let emailSent = false;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: `"Change Life Marketing" <${smtpFrom}>`,
          to: user.email,
          subject: "Password Reset Request - Change Life Marketing",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #0A6E5A; text-align: center;">Change Life Marketing</h2>
              <h3 style="color: #333;">Password Reset Request</h3>
              <p>Hello ${user.fullName || user.username},</p>
              <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
              <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #0A6E5A; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="font-size: 12px; color: #777;">If you are having trouble clicking the button, copy and paste the link below into your web browser:</p>
              <p style="font-size: 12px; color: #0A6E5A; word-break: break-all;">${resetUrl}</p>
            </div>
          `,
        });

        emailSent = true;
        console.log(`📧 [PASSWORD RESET] Email sent successfully to ${user.email}`);
        if (smtpHost.includes("ethereal.email")) {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log(`✉️ [ETHEREAL PREVIEW] View email at: ${previewUrl}`);
        }
      } catch (mailErr) {
        console.error("❌ Failed to send reset password email via SMTP:", mailErr);
      }
    } else {
      console.warn("⚠️ SMTP credentials not configured in environment variables. Email was not sent.");
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Password reset link has been sent to your email address."
        : "Password reset link generated. (Check server logs if email configuration is pending)",
      // In development mode, if email is not sent, we can output the URL in the response for convenience
      resetUrl: !emailSent && process.env.NODE_ENV !== "production" ? resetUrl : undefined
    });

  } catch (err: any) {
    console.error("❌ Error in forgot password handler:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
