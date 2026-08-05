import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    const resetToken = await db.verificationToken.findFirst({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
    }

    const email = resetToken.identifier;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.$transaction([
      db.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      db.verificationToken.deleteMany({
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
