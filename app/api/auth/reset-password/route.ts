import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendPasswordChangedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const verifyOtpSchema = z.object({
  step: z.literal("verify-otp"),
  otp: z.string().min(1, "OTP is required"),
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().optional(),
  otp: z.string().optional(),
  email: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(req: Request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  };

  try {
    const body = await req.json().catch(() => ({}));

    // Step 1: Verify OTP Step
    if (body.step === "verify-otp") {
      const { otp, email } = verifyOtpSchema.parse(body);
      const normalizedEmail = email.trim().toLowerCase();

      const resetToken = await db.verificationToken.findFirst({
        where: {
          identifier: normalizedEmail,
          token: otp.trim(),
        },
      });

      if (!resetToken || resetToken.expires < new Date()) {
        return NextResponse.json(
          { message: "Invalid or expired password reset verification code." },
          { status: 400, headers }
        );
      }

      return NextResponse.json(
        { message: "Verification code validated successfully.", valid: true, email: normalizedEmail, token: resetToken.token },
        { status: 200, headers }
      );
    }

    // Step 2: Set New Password Step
    const { token, otp, email, newPassword } = resetPasswordSchema.parse(body);

    let resetToken = null;

    if (token) {
      resetToken = await db.verificationToken.findFirst({
        where: { token: token.trim() },
      });
    } else if (otp && email) {
      const normalizedEmail = email.trim().toLowerCase();
      resetToken = await db.verificationToken.findFirst({
        where: {
          identifier: normalizedEmail,
          token: otp.trim(),
        },
      });
    }

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Invalid or expired password reset token. Please request a new code." },
        { status: 400, headers }
      );
    }

    const targetEmail = resetToken.identifier;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email: targetEmail },
        data: { password: hashedPassword },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier: targetEmail },
      });

      return user;
    });

    // Send Password Changed Security Email Notification
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
      await sendPasswordChangedEmail({
        to: targetEmail,
        name: updatedUser.name || "Customer",
        loginUrl: `${baseUrl}/login`,
      });
    } catch (emailErr) {
      console.warn("Password changed email dispatch warning:", emailErr);
    }

    return NextResponse.json(
      { message: "Password updated successfully. You may now log in with your new password." },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400, headers });
    }
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500, headers });
  }
}
