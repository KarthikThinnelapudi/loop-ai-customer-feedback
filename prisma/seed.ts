import { PrismaClient, Role, FeedbackChannel, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding enterprise demo data for Acme Production...");

  // Known demo password
  const demoPasswordHash = await bcrypt.hash("Loop@2026", 12);

  // 1. Upsert Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-prod" },
    update: {},
    create: {
      name: "Acme Production",
      slug: "acme-prod",
      industry: "Enterprise SaaS & B2B Software",
      description: "Production Workspace for LOOP Customer Intelligence",
      apiKey: "acme_prod_live_key_99882211",
    },
  });

  // 2. Upsert Admin User (admin@acme.demo & admin@loop.ai)
  const admin = await prisma.user.upsert({
    where: { email: "admin@acme.demo" },
    update: { password: demoPasswordHash },
    create: {
      email: "admin@acme.demo",
      name: "Acme Admin User",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  const adminAlias = await prisma.user.upsert({
    where: { email: "admin@loop.ai" },
    update: { password: demoPasswordHash },
    create: {
      email: "admin@loop.ai",
      name: "Acme Admin User",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  // 3. Upsert Analyst User (analyst@acme.demo & analyst@loop.ai)
  const analyst = await prisma.user.upsert({
    where: { email: "analyst@acme.demo" },
    update: { password: demoPasswordHash },
    create: {
      email: "analyst@acme.demo",
      name: "Acme Lead Analyst",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  const analystAlias = await prisma.user.upsert({
    where: { email: "analyst@loop.ai" },
    update: { password: demoPasswordHash },
    create: {
      email: "analyst@loop.ai",
      name: "Acme Lead Analyst",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  // 4. Upsert Viewer User (viewer@acme.demo & viewer@loop.ai)
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@acme.demo" },
    update: { password: demoPasswordHash },
    create: {
      email: "viewer@acme.demo",
      name: "Acme Executive Viewer",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  const viewerAlias = await prisma.user.upsert({
    where: { email: "viewer@loop.ai" },
    update: { password: demoPasswordHash },
    create: {
      email: "viewer@loop.ai",
      name: "Acme Executive Viewer",
      password: demoPasswordHash,
      isVerified: true,
    },
  });

  // 5. Workspace Memberships
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } },
    update: { role: Role.ADMIN },
    create: { workspaceId: workspace.id, userId: admin.id, role: Role.ADMIN },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: adminAlias.id } },
    update: { role: Role.ADMIN },
    create: { workspaceId: workspace.id, userId: adminAlias.id, role: Role.ADMIN },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: analyst.id } },
    update: { role: Role.ANALYST },
    create: { workspaceId: workspace.id, userId: analyst.id, role: Role.ANALYST },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: analystAlias.id } },
    update: { role: Role.ANALYST },
    create: { workspaceId: workspace.id, userId: analystAlias.id, role: Role.ANALYST },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: viewer.id } },
    update: { role: Role.VIEWER },
    create: { workspaceId: workspace.id, userId: viewer.id, role: Role.VIEWER },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: viewerAlias.id } },
    update: { role: Role.VIEWER },
    create: { workspaceId: workspace.id, userId: viewerAlias.id, role: Role.VIEWER },
  });

  // 6. Feedback Themes
  const themes = [
    { title: "Dashboard Latency", description: "Queries and metric loading times during peak hours", color: "rose" },
    { title: "Onboarding Guidance", description: "Team invite workflow and initial workspace setup", color: "amber" },
    { title: "CSV Bulk Upload", description: "Ingestion of large datasets and column mapping", color: "emerald" },
    { title: "API Webhook Stability", description: "Real-time event payload delivery and rate limits", color: "blue" },
    { title: "Mobile App UX", description: "Navigation and mobile push notifications", color: "purple" },
  ];

  const createdThemes = [];
  for (const t of themes) {
    const theme = await prisma.feedbackTheme.create({
      data: {
        workspaceId: workspace.id,
        title: t.title,
        description: t.description,
        color: t.color,
        growthRate: Math.random() * 25,
        isSpike: t.title === "Dashboard Latency",
      },
    });
    createdThemes.push(theme);
  }

  // 7. Seed 500 Realistic Feedback Records
  const channels: FeedbackChannel[] = [
    FeedbackChannel.SUPPORT_TICKET,
    FeedbackChannel.APP_STORE_REVIEW,
    FeedbackChannel.NPS_SURVEY,
    FeedbackChannel.SALES_CALL_NOTE,
    FeedbackChannel.COMMUNITY_POST,
  ];

  const statuses: FeedbackStatus[] = [
    FeedbackStatus.NEW,
    FeedbackStatus.REVIEWED,
    FeedbackStatus.ACTIONED,
  ];

  const companies = ["Stripe", "Linear", "Vercel", "Datadog", "Notion", "Figma", "Snowflake", "Twilio", "Plaid"];
  const names = ["Sarah Jenkins", "David Miller", "Elena Rostova", "Marcus Chen", "Chloe Bennett", "Liam O'Connor"];

  console.log("⏳ Generating 500 realistic feedback records...");
  const feedbackData = [];
  for (let i = 1; i <= 500; i++) {
    const isPositive = i % 3 === 0;
    const isNegative = i % 3 === 1;
    const channel = channels[i % channels.length];
    const status = statuses[i % statuses.length];
    const company = companies[i % companies.length];
    const name = names[i % names.length];
    const theme = createdThemes[i % createdThemes.length];

    let content = "";
    let sentimentScore = 0.0;
    let sentimentLabel = "NEUTRAL";

    if (isPositive) {
      content = `The v2 analytics redesign for ${company} is outstanding! Report generation velocity improved significantly.`;
      sentimentScore = 0.85 + Math.random() * 0.12;
      sentimentLabel = "POSITIVE";
    } else if (isNegative) {
      content = `Experiencing intermittent timeout errors during CSV bulk ingestion on ${theme.title}. Needs immediate engineering triage.`;
      sentimentScore = -0.75 - Math.random() * 0.2;
      sentimentLabel = "NEGATIVE";
    } else {
      content = `Requested additional REST API webhook endpoints for automated integration with ${company} internal tools.`;
      sentimentScore = 0.1;
      sentimentLabel = "NEUTRAL";
    }

    feedbackData.push({
      workspaceId: workspace.id,
      authorId: admin.id,
      content,
      channel,
      company,
      rating: isPositive ? 5 : isNegative ? 2 : 4,
      category: theme.title,
      priority: isNegative ? "HIGH" : "MEDIUM",
      product: "Core Platform",
      source: "Web Portal",
      tags: [theme.title, company],
      sentimentScore,
      sentimentLabel,
      status,
      customerName: name,
      customerEmail: `${name.toLowerCase().replace(" ", ".")}@${company.toLowerCase()}.com`,
      themeId: theme.id,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000)),
    });
  }

  await prisma.feedback.createMany({
    data: feedbackData,
  });

  // 8. Reports Seed
  await prisma.report.create({
    data: {
      workspaceId: workspace.id,
      authorId: admin.id,
      title: "Q3 2026 Executive Voice-of-Customer Digest",
      summary: "Comprehensive feedback analysis across 500+ items indicates high customer satisfaction on new UI dashboards, with latency spike alerts identified in webhook ingestion APIs.",
      totalItems: 500,
      avgSentiment: 0.68,
    },
  });

  // 9. Audit Log Seed
  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: admin.id,
      action: "WORKSPACE_SEEDED",
      entityType: "Workspace",
      details: "Seeded 500 feedback items and verified demo accounts (Admin, Analyst, Viewer).",
    },
  });

  console.log("✅ Enterprise demo seed completed successfully with verified password: Loop@2026");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
