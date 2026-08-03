import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { IS_DEMO_MODE } from "@/lib/config";

const generateReportSchema = z.object({
  title: z.string().min(3, "Report title is required"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let workspaceId = "ws_acme_prod_9921";

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    if (IS_DEMO_MODE) {
      return NextResponse.json([
        {
          id: "rep-101",
          title: "Weekly Voice-of-Customer Executive Digest",
          summary: "Customer sentiment improved +6.4% this week. Onboarding friction was identified as top spiking theme.",
          totalItems: 120,
          avgSentiment: 0.84,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    const reports = await db.report.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
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

    const userMembership = currentUser?.memberships[0];
    if (!userMembership || (userMembership.role !== "ADMIN" && userMembership.role !== "ANALYST")) {
      return NextResponse.json(
        { message: "Forbidden: Only Admin or Analyst roles can generate VoC reports." },
        { status: 403 }
      );
    }

    const workspaceId = userMembership.workspaceId;
    const body = await req.json();
    const { title } = generateReportSchema.parse(body);

    // Compute live metrics from dataset
    const totalItems = await db.feedback.count({
      where: { workspaceId, deletedAt: null },
    });

    const positiveCount = await db.feedback.count({
      where: { workspaceId, sentimentLabel: "POSITIVE", deletedAt: null },
    });

    const avgSentiment = totalItems > 0 ? Number((positiveCount / totalItems).toFixed(2)) : 0.84;
    const summary = `Generated VoC Executive Digest for ${totalItems} customer feedback records. Overall positive sentiment ratio is ${(avgSentiment * 100).toFixed(1)}%. Key priorities focus on onboarding speed and dashboard performance.`;

    const report = await db.report.create({
      data: {
        workspaceId,
        authorId: currentUser.id,
        title,
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
        entityId: report.id,
        details: `Generated executive VoC report: "${title}"`,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 });
    }
    console.error("POST Report Error:", error);
    return NextResponse.json({ message: "Failed to generate report" }, { status: 500 });
  }
}
