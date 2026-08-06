import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { sendWorkspaceInviteEmail } from "@/lib/email";

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

    const sessionUser = session.user as { name?: string | null; email?: string | null; role?: string; workspaceId?: string };

    const currentUser = await db.user.findUnique({
      where: { email: sessionUser.email! },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || sessionUser.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId || sessionUser.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace membership required" }, { status: 403 });
    }

    if (!hasPermission(role, "team:view")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer and unauthorized roles cannot view team members." },
        { status: 403 }
      );
    }

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

    const sessionUser = session.user as { name?: string | null; email?: string | null; role?: string; workspaceId?: string };
    const body = await req.json();
    const data = memberInviteSchema.parse(body);

    const currentUser = await db.user.findUnique({
      where: { email: sessionUser.email! },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userMembership = currentUser.memberships[0];
    const role = userMembership?.role || sessionUser.role || "VIEWER";

    if (!hasPermission(role, "users:invite")) {
      return NextResponse.json(
        { message: "Forbidden: Only Owner, Admin, or Manager can invite team members." },
        { status: 403 }
      );
    }

    const workspace = userMembership?.workspace;
    if (!workspace) {
      return NextResponse.json({ message: "Workspace required" }, { status: 400 });
    }

    const normalizedInviteEmail = data.email.trim().toLowerCase();

    // Check if user is already a member
    const existingMemberUser = await db.user.findUnique({
      where: { email: normalizedInviteEmail },
      include: { memberships: true },
    });

    if (existingMemberUser?.memberships.some((m) => m.workspaceId === workspace.id)) {
      return NextResponse.json(
        { message: "User is already a member of this workspace." },
        { status: 400 }
      );
    }

    // Prevent duplicate invitations by removing prior active tokens
    await db.invitationToken.deleteMany({
      where: {
        email: normalizedInviteEmail,
        workspaceId: workspace.id,
      },
    });

    const inviteTokenStr = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const inviteToken = await db.invitationToken.create({
      data: {
        email: normalizedInviteEmail,
        workspaceId: workspace.id,
        role: data.role,
        token: inviteTokenStr,
        expires: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://customerloop.in";
    const inviteUrl = `${baseUrl}/register?invite=${inviteToken.token}`;

    // Send Workspace Invitation Email via Resend & customerloop.in
    await sendWorkspaceInviteEmail({
      to: normalizedInviteEmail,
      inviterName: currentUser.name || currentUser.email,
      workspaceName: workspace.name,
      role: data.role,
      inviteUrl,
      expiresDays: 7,
    });

    await db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: currentUser.id,
        action: "INVITATION_SENT",
        entityType: "WorkspaceMember",
        details: `Invited ${normalizedInviteEmail} as ${data.role}`,
      },
    });

    return NextResponse.json(
      {
        message: "Invitation sent successfully via Resend API.",
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
