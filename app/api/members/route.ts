import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER", "ANALYST", "VIEWER"]),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    if (!currentUser || currentUser.memberships.length === 0) {
      return NextResponse.json({ message: "Workspace membership required" }, { status: 403 });
    }

    const workspaceId = currentUser.memberships[0].workspaceId;

    const members = await db.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET Members Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = memberInviteSchema.parse(body);

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    if (!userMembership || (userMembership.role !== "ADMIN" && userMembership.role !== "MANAGER")) {
      return NextResponse.json(
        { message: "Only Admin or Manager can invite team members." },
        { status: 403 }
      );
    }

    const workspaceId = userMembership.workspaceId;

    // Check if target user exists, or create placeholder account
    let targetUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!targetUser) {
      const defaultPassword = await bcrypt.hash("Welcome123!", 10);
      targetUser = await db.user.create({
        data: {
          email: data.email,
          name: data.name || data.email.split("@")[0],
          password: defaultPassword,
        },
      });
    }

    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { message: "User is already a member of this workspace." },
        { status: 400 }
      );
    }

    const newMember = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to invite member" }, { status: 500 });
  }
}

