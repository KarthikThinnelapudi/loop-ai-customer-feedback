import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const workspaceId = currentUser?.memberships[0]?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const body = await req.json();
    const { title } = updateSchema.parse(body);

    const updated = await db.report.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("PATCH Report Error:", error);
    return NextResponse.json({ message: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Analyst & Viewer are NOT allowed to delete reports
    if (role === "ANALYST" || role === "VIEWER" || !hasPermission(role, "users:manage")) {
      return NextResponse.json(
        { message: "Forbidden: Delete Reports is restricted to Admin & Owner roles." },
        { status: 403 }
      );
    }


    await db.report.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser?.id,
        action: "REPORT_DELETED",
        entityType: "Report",
        entityId: id,
        details: `Deleted report #${id}`,
      },
    });

    return NextResponse.json({ message: "Report deleted successfully." });
  } catch (error) {
    console.error("DELETE Report Error:", error);
    return NextResponse.json({ message: "Failed to delete report" }, { status: 500 });
  }
}
