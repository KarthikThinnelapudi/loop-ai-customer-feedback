import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendEmail, getWorkspaceInviteEmailTemplate } from "@/lib/email";

const memberInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
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
      include: { memberships: { include: { workspace: true } } },
    });

    const userMembership = currentUser?.memberships[0];
    if (!userMembership || (userMembership.role !== "ADMIN" && userMembership.role !== "MANAGER")) {
      return NextResponse.json(
        { message: "Only Admin or Manager can invite team members." },
        { status: 403 }
      );
    }

    const workspace = userMembership.workspace;
    const inviteTokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Save invitation token
    const inviteToken = await db.invitationToken.create({
      data: {
        email: data.email,
        workspaceId: workspace.id,
        role: data.role,
        token: inviteTokenStr,
        expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register?invite=${inviteToken.token}`;

    // Send HTML Invitation Email
    await sendEmail({
      to: data.email,
      subject: `Join ${workspace.name} on LOOP AI Platform`,
      html: getWorkspaceInviteEmailTemplate(currentUser.name || currentUser.email, workspace.name, inviteUrl),
    });

    await db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: currentUser.id,
        action: "MEMBER_INVITED",
        entityType: "WorkspaceMember",
        details: `Invited ${data.email} as ${data.role}`,
      },
    });

    return NextResponse.json(
      {
        message: "Invitation sent successfully.",
        token: inviteToken.token,
        inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Invite Member Error:", error);
    return NextResponse.json({ message: "Failed to invite member" }, { status: 500 });
  }
}
