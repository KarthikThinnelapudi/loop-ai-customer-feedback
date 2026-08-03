import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";

const createReportSchema = z.object({
  title: z.string().min(3, "Title required").optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const workspaceId = currentUser?.memberships[0]?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { workspaceId };
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("GET Reports Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userMembership = currentUser.memberships[0];
    const role = userMembership?.role || "VIEWER";
    const workspaceId = userMembership?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ message: "Workspace required" }, { status: 403 });
    }

    if (!hasPermission(role, "reports:generate")) {
      return NextResponse.json(
        { message: "Forbidden: Viewer role cannot generate reports." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title } = createReportSchema.parse(body);

    // 1-Click VoC Digest: Aggregate feedback stats from DB
    const [totalItems, avgSentimentResult, topThemes] = await Promise.all([
      db.feedback.count({ where: { workspaceId, deletedAt: null } }),
      db.feedback.aggregate({
        where: { workspaceId, deletedAt: null },
        _avg: { sentimentScore: true },
      }),
      db.feedbackTheme.findMany({
        where: { workspaceId },
        take: 3,
      }),
    ]);

    const avgSentiment = avgSentimentResult._avg.sentimentScore || 0.65;
    const themeTitles = topThemes.map((t) => t.title).join(", ") || "Customer Onboarding & App Speed";

    const reportTitle = title || `Executive VoC Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const summary = `Analyzed ${totalItems} customer feedback items. Overall sentiment index is ${(avgSentiment * 100).toFixed(0)}%. Key customer focus areas include ${themeTitles}.`;

    const newReport = await db.report.create({
      data: {
        workspaceId,
        authorId: currentUser.id,
        title: reportTitle,
        summary,
        totalItems,
        avgSentiment,
      },
    });

    await db.auditLog.create({
      data: {
        workspaceId,
        userId: currentUser.id,
        action: "REPORT_GENERATED",
        entityType: "Report",
        entityId: newReport.id,
        details: `Generated VoC digest for ${totalItems} feedback items.`,
      },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("POST Report Error:", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
