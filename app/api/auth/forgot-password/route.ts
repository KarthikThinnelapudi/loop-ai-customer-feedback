import { NextResponse } from "next/server";
import { z } from "zod";
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
        { message: "If an account with that email exists, we have sent a password reset link." },
        { status: 200, headers }
      );
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

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;

    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name || "Customer",
      resetUrl,
      expiresHours: 1,
    });

    return NextResponse.json(
      { message: "If an account with that email exists, we have sent a password reset link." },
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
