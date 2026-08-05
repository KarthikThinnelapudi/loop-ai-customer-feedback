import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let workspaceId: string | null = null;

    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { memberships: true },
      });
      if (user?.memberships?.[0]?.workspaceId) {
        workspaceId = user.memberships[0].workspaceId;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({ message: "Unauthorized or missing workspace context" }, { status: 401 });
    }

    // Scoped counts strictly for current workspace
    const totalVolume = await db.feedback.count({
      where: { workspaceId, deletedAt: null },
    });

    const positiveCount = await db.feedback.count({
      where: { workspaceId, sentimentLabel: "POSITIVE", deletedAt: null },
    });

    const criticalSpikesCount = await db.feedbackTheme.count({
      where: { workspaceId, isSpike: true },
    });

    const themes = await db.feedbackTheme.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { feedbacks: true } },
      },
      orderBy: { growthRate: "desc" },
      take: 5,
    });

    const aggregateSentiment = await db.feedback.aggregate({
      where: { workspaceId, deletedAt: null },
      _avg: { sentimentScore: true },
    });

    const avgSentiment = Number((aggregateSentiment._avg.sentimentScore || 0.0).toFixed(2));
    const positiveRatio = totalVolume > 0 ? `${((positiveCount / totalVolume) * 100).toFixed(1)}%` : "0%";

    return NextResponse.json({
      totalVolume,
      avgSentiment,
      positiveRatio,
      criticalSpikesCount,
      themes: themes.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        color: t.color,
        mentions: t._count.feedbacks || 0,
        growthRate: `${t.growthRate > 0 ? "+" : ""}${t.growthRate}%`,
        isSpike: t.isSpike,
      })),
      chartTrend: totalVolume > 0 ? [
        { date: "Current", volume: totalVolume, sentiment: avgSentiment }
      ] : [],
    });
  } catch (error) {
    console.error("GET Dashboard Stats Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
