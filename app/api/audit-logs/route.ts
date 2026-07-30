import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { IS_DEMO_MODE } from "@/lib/config";

const mockAuditLogs = [
  {
    id: "log-1",
    action: "USER_INVITED",
    entityType: "WorkspaceMember",
    entityId: "m-2",
    details: "Invited Sarah Analyst (analyst@loop.ai) as ANALYST role",
    createdAt: new Date().toISOString(),
    user: { name: "Admin User", email: "admin@loop.ai" },
  },
  {
    id: "log-2",
    action: "FEEDBACK_CREATED",
    entityType: "Feedback",
    entityId: "fb-101",
    details: "Ingested new feedback from SUPPORT_TICKET channel",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { name: "Sarah Analyst", email: "analyst@loop.ai" },
  },
  {
    id: "log-3",
    action: "THEME_UPDATED",
    entityType: "FeedbackTheme",
    entityId: "theme-1",
    details: "Marked theme 'Onboarding Latency' as Critical Volume Spike",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: { name: "Admin User", email: "admin@loop.ai" },
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (IS_DEMO_MODE) {
      return NextResponse.json({
        data: mockAuditLogs,
        pagination: {
          page: 1,
          limit: 10,
          total: mockAuditLogs.length,
          totalPages: 1,
        },
        mode: "DEMO",
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const workspaceId = user?.memberships[0]?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 400 });
    }

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
