import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail, getResetPasswordEmailTemplate } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return NextResponse.json({
        message: "If an account with that email exists, we have sent a password reset link.",
      });
    }

    const tokenStr = "reset_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Remove previous reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create 1-hour reset token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenStr,
        expires: new Date(Date.now() + 3600 * 1000), // 1 Hour Expiration
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your LOOP AI Password",
      html: getResetPasswordEmailTemplate(user.name || "User", resetUrl),
    });

    return NextResponse.json({
      message: "If an account with that email exists, we have sent a password reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "Failed to send password reset email." }, { status: 500 });
  }
}
