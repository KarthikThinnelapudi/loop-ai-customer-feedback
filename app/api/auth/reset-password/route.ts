import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendPasswordChangedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
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
    const { token, newPassword } = resetPasswordSchema.parse(body);

    const resetToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Invalid or expired password reset link. Please request a new link." },
        { status: 400, headers }
      );
    }

    const email = resetToken.identifier;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email },
        data: { password: hashedPassword },
      });

      await tx.verificationToken.deleteMany({
        where: { identifier: email },
      });

      return user;
    });

    // Send Password Changed Security Email Notification
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
      await sendPasswordChangedEmail({
        to: email,
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
