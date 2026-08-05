import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { getAIGatewayObservability } from "@/lib/ai-gateway";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { role?: string; workspaceId?: string };

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: true },
    });

    const userMembership = currentUser?.memberships[0];
    const role = userMembership?.role || sessionUser.role || "VIEWER";

    // Admin / Super Admin Authorization Check
    if (!hasPermission(role, "workspace:settings") && role !== "ADMIN" && role !== "OWNER") {
      return NextResponse.json(
        { message: "Forbidden: Admin or Owner privileges required for AI Gateway Monitoring." },
        { status: 403 }
      );
    }

    const observability = getAIGatewayObservability();

    return NextResponse.json({
      gateway: observability,
      timestamp: new Date().toISOString(),
      status: "HEALTHY",
    });
  } catch (error) {
    console.error("GET AI Gateway Monitoring Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
