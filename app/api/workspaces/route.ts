import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const workspaceSchema = z.object({
  name: z.string().min(2, "Workspace name required"),
  description: z.string().optional(),
  industry: z.string().optional(),
  teamSize: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { email: string; workspaceId?: string };

    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ message: "Workspace not found" }, { status: 404 });
    }

    // Match session workspaceId if present, otherwise fallback to primary membership
    const targetMembership =
      user.memberships.find((m) => m.workspaceId === sessionUser.workspaceId) ||
      user.memberships[0];

    return NextResponse.json({
      workspace: targetMembership.workspace,
      userRole: targetMembership.role,
    });
  } catch (error) {
    console.error("GET Workspace Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { email: string; workspaceId?: string; role?: string };

    const user = await db.user.findUnique({
      where: { email: sessionUser.email },
      include: { memberships: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const targetMembership =
      user.memberships.find((m) => m.workspaceId === sessionUser.workspaceId) ||
      user.memberships[0];

    const role = targetMembership?.role || sessionUser.role || "VIEWER";

    // Strict RBAC Enforcement: Only Owner/Admin can modify workspace settings
    if (!hasPermission(role, "workspace:settings")) {
      return NextResponse.json(
        { message: "Forbidden: Analysts, Viewers, and non-admin roles cannot modify workspace settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = workspaceSchema.parse(body);

    const updatedWorkspace = await db.workspace.update({
      where: { id: targetMembership.workspaceId },
      data: {
        name: data.name,
        description: data.description,
        industry: data.industry,
        teamSize: data.teamSize,
      },
    });

    return NextResponse.json({ workspace: updatedWorkspace }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("PATCH Workspace Error:", error);
    return NextResponse.json({ message: "Failed to update workspace" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const role = user.memberships[0]?.role || "VIEWER";

    // Strict RBAC Enforcement: Only Owner/Admin can modify or create workspace settings
    if (!hasPermission(role, "workspace:settings")) {
      return NextResponse.json(
        { message: "Forbidden: Analysts, Viewers, and non-admin roles cannot modify workspace settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = workspaceSchema.parse(body);

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const workspace = await db.workspace.create({
      data: {
        name: data.name,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        description: data.description,
        industry: data.industry,
        teamSize: data.teamSize,
        apiKey: `loop_live_sk_${Math.random().toString(36).substring(2, 18)}`,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create workspace" }, { status: 500 });
  }
}
