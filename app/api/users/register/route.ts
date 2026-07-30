import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const registerSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
  description: z.string().optional(),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
        { message: "User with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const slug = validatedData.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Atomic transaction: Create Workspace -> User -> WorkspaceMember
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: validatedData.workspaceName,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
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
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      return { workspace, user };
    });

    return NextResponse.json(
      {
        message: "Workspace and Admin account created successfully.",
        workspaceId: result.workspace.id,
        userId: result.user.id,
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

