import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail, getVerificationEmailTemplate } from "@/lib/email";

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
    const tokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Atomic transaction: Workspace -> User -> WorkspaceMember -> VerificationToken
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: validatedData.workspaceName,
          slug,
          description: validatedData.description,
          industry: validatedData.industry || "SaaS / Software",
          teamSize: validatedData.teamSize || "11-50 Employees",
          apiKey: `loop_live_sk_${Math.random().toString(36).substring(2, 18)}`,
        },
      });

      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: normalizedEmail,
          password: hashedPassword,
          isVerified: true, // Allow immediate login post-registration
          emailVerified: new Date(),
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: tokenStr,
          expires: new Date(Date.now() + 24 * 3600 * 1000), // 24 Hours
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          action: "WORKSPACE_REGISTERED",
          entityType: "Workspace",
          entityId: workspace.id,
          details: `Created workspace ${workspace.name} and Admin account for ${user.email}`,
        },
      });

      return { workspace, user };
    });

    // Send Welcome & Verification Email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${tokenStr}`;
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to LOOP AI - Account Activated",
      html: getVerificationEmailTemplate(validatedData.name, verifyUrl),
    });

    return NextResponse.json(
      {
        message: "Account registered successfully! You may now log in.",
        workspaceId: result.workspace.id,
        userId: result.user.id,
        requiresVerification: false,
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
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
