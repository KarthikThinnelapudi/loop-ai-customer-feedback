import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Prevent email enumeration attack
      return NextResponse.json(
        { message: "If an account with that email exists, we have sent a password reset verification code." },
        { status: 200, headers }
      );
    }

    // Cryptographically secure 6-digit OTP code & link token
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const tokenStr = "reset_" + crypto.randomBytes(32).toString("hex");

    // Remove previous reset tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Save link token (1 Hour Expiration)
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenStr,
        expires: new Date(Date.now() + 3600 * 1000),
      },
    });

    // Save 6-digit OTP token (15 Minutes Expiration)
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otpCode,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;

    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name || "Customer",
      resetUrl,
      expiresHours: 1,
    });

    return NextResponse.json(
      {
        message: "If an account with that email exists, we have sent a password reset verification code.",
        email: normalizedEmail,
      },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400, headers });
    }
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "Failed to send password reset email." }, { status: 500, headers });
  }
}
