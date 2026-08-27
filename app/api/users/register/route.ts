import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
  description: z.string().optional(),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  inviteToken: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Normalize email (trim + lowercase)
    const normalizedEmail = validatedData.email.trim().toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email address already exists." },
        { status: 400 }
      );
    }

    const slugCandidate = validatedData.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const existingWorkspace = await db.workspace.findFirst({
      where: { slug: slugCandidate },
    });

    const slug = existingWorkspace
      ? `${slugCandidate}-${Math.floor(1000 + Math.random() * 9000)}`
      : slugCandidate;

    // Hash password with 12 bcrypt salt rounds
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Cryptographically secure 6-digit OTP code & link token
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const tokenStr = crypto.randomBytes(32).toString("hex");

    // Atomic transaction: Workspace -> User -> WorkspaceMember -> VerificationToken
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: validatedData.workspaceName,
          slug,
          description: validatedData.description,
          industry: validatedData.industry || "SaaS / Software",
          teamSize: validatedData.teamSize || "11-50 Employees",
          apiKey: `loop_live_sk_${crypto.randomBytes(12).toString("hex")}`,
        },
      });

      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: normalizedEmail,
          password: hashedPassword,
          isVerified: false, // Require email verification before account activation
          emailVerified: null,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      // Clear any previous verification tokens for this email identifier
      await tx.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });

      // Save link token (24 Hours expiration)
      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: tokenStr,
          expires: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });

      // Save 6-digit OTP token (15 Minutes secure expiration)
      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: otpCode,
          expires: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: "WORKSPACE_REGISTERED",
          entityType: "Workspace",
          entityId: workspace.id,
          details: `Created workspace ${workspace.name} and Admin account for ${user.email} (Pending Email Verification)`,
        },
      });

      return { workspace, user };
    });

    // Dispatch Verification Email with 6-digit OTP code & link
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
      const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;

      await sendVerificationEmail({
        to: normalizedEmail,
        name: validatedData.name,
        verifyUrl,
        expiresHours: 24,
      });
    } catch (emailErr) {
      console.warn("Non-fatal verification email dispatch warning:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Registration successful! Please check your email for your 6-digit verification code.",
        workspaceId: result.workspace.id,
        userId: result.user.id,
        email: normalizedEmail,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Registration Error Stack Trace:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error during registration." },
      { status: 500 }
    );
  }
}
