import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const bulkSchema = z.object({
  action: z.enum(["delete", "archive", "changeStatus", "reanalyze"]),
  ids: z.array(z.string()).min(1, "Select at least one record"),
  status: z.enum(["NEW", "REVIEWED", "ACTIONED", "ARCHIVED"]).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, ids, status } = bulkSchema.parse(body);

    if (action === "delete") {
      if (!hasPermission(role, "feedback:manage")) {
        return NextResponse.json({ message: "Forbidden: Delete requires Owner, Admin, or Manager role" }, { status: 403 });
      }
      await db.feedback.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: { deletedAt: new Date() },
      });
    } else if (action === "archive") {
      if (!hasPermission(role, "feedback:manage")) {
        return NextResponse.json({ message: "Forbidden: Archive requires Manage permission" }, { status: 403 });
      }
      await db.feedback.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: { status: "ARCHIVED" },
      });
    } else if (action === "changeStatus" && status) {
      await db.feedback.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: { status },
      });
    }

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser?.id,
        action: `BULK_${action.toUpperCase()}`,
        entityType: "Feedback",
        details: `Executed bulk action ${action} on ${ids.length} feedback items.`,
      },
    });

    return NextResponse.json({ message: `Bulk ${action} completed successfully for ${ids.length} items.` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Bulk Feedback Error:", error);
    return NextResponse.json({ message: "Bulk action failed" }, { status: 500 });
  }
}
