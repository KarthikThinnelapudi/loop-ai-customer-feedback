import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, getResetPasswordEmailTemplate } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to prevent email enumeration attacks
      return NextResponse.json({ message: "If account exists, password reset instructions have been sent." });
    }

    const resetTokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    await db.verificationToken.create({
      data: {
        identifier: `RESET_${email}`,
        token: resetTokenStr,
        expires: new Date(Date.now() + 3600 * 1000), // 1 Hour
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetTokenStr}`;

    await sendEmail({
      to: email,
      subject: "Reset Your LOOP AI Password",
      html: getResetPasswordEmailTemplate(user.name || "User", resetUrl),
    });

    return NextResponse.json({ message: "Password reset instructions have been sent to your email." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { email, token, newPassword } = resetPasswordSchema.parse(body);

    const resetToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `RESET_${email}`,
          token,
        },
      },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.$transaction([
      db.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      db.verificationToken.delete({
        where: { token },
      }),
    ]);

    return NextResponse.json({ message: "Password updated successfully. You may now log in with your new password." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
