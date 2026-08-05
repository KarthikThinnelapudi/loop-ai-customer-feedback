import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
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
      return NextResponse.json({ message: "Workspace required" }, { status: 401 });
    }

    // RBAC: Viewer & restricted roles cannot view Audit Logs
    if (!hasPermission(role, "audit:view")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer and unauthorized roles cannot view Activity Audit Logs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where: { workspaceId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where: { workspaceId } }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      mode: "PRODUCTION",
    });
  } catch (error) {
    console.error("GET Audit Logs Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
