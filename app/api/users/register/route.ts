import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { IS_DEMO_MODE } from "@/lib/config";

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
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
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

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const requiresVerification = !IS_DEMO_MODE;

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
          email: validatedData.email,
          password: hashedPassword,
          isVerified: !requiresVerification,
          emailVerified: requiresVerification ? null : new Date(),
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      // Default Themes/Categories Creation
      await tx.feedbackTheme.createMany({
        data: [
          { workspaceId: workspace.id, title: "Onboarding Experience", color: "rose", growthRate: 12.0 },
          { workspaceId: workspace.id, title: "Dashboard & UI Speed", color: "emerald", growthRate: 45.0 },
          { workspaceId: workspace.id, title: "SSO & SAML Security", color: "amber", growthRate: 25.0 },
        ],
      });

      // Create Verification Token if in Production Mode
      if (requiresVerification) {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await tx.verificationToken.create({
          data: {
            identifier: validatedData.email,
            token,
            expires: new Date(Date.now() + 24 * 3600 * 1000), // 24 Hours
          },
        });
      }

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

    return NextResponse.json(
      {
        message: requiresVerification
          ? "Account registered! A verification link has been sent to your email. Please verify before signing in."
          : "Workspace and Admin account created successfully.",
        workspaceId: result.workspace.id,
        userId: result.user.id,
        requiresVerification,
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
