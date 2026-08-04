import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const shareSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  expiresInDays: z.number().optional().default(7), // 24h = 1, 7d = 7, 30d = 30, 0 = never
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

    if (!hasPermission(role, "reports:share")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer role cannot generate share links." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportId, expiresInDays } = shareSchema.parse(body);

    const report = await db.report.findFirst({
      where: { id: reportId, workspaceId },
    });

    if (!report) {
      return NextResponse.json({ message: "Report not found in workspace" }, { status: 404 });
    }

    let expiresAt: Date | null = null;
    if (expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 3600 * 1000);
    }

    const shareLink = await db.shareLink.create({
      data: {
        reportId,
        workspaceId,
        createdBy: currentUser?.id || "sys_user",
        expiresAt,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser?.id,
        action: "REPORT_SHARE_LINK_CREATED",
        entityType: "ShareLink",
        entityId: shareLink.id,
        details: `Created secure share token for report #${reportId} (Expires in ${expiresInDays} days)`,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://loop-ai-customer-feedback.vercel.app";
    const shareUrl = `${baseUrl}/share/report/${shareLink.token}`;

    return NextResponse.json({
      token: shareLink.token,
      shareUrl,
      expiresAt: shareLink.expiresAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("Share Link Error:", error);
    return NextResponse.json({ message: "Failed to generate share link" }, { status: 500 });
  }
}
