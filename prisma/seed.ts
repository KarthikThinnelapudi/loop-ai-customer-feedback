import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const sampleQuotes = [
  { content: "The v2 onboarding flow is remarkably smooth and fast. Great job!", channel: "APP_STORE_REVIEW", sentimentScore: 0.9, sentimentLabel: "POSITIVE", status: "REVIEWED", customerName: "David Miller", customerEmail: "david@acme.com" },
  { content: "Encountered 500 internal server error during SSO SAML configuration step.", channel: "SUPPORT_TICKET", sentimentScore: -0.8, sentimentLabel: "NEGATIVE", status: "NEW", customerName: "Elena Rostova", customerEmail: "elena@techcorp.io" },
  { content: "Dashboard page load latency spiked to 4.2 seconds on mobile Safari.", channel: "SUPPORT_TICKET", sentimentScore: -0.6, sentimentLabel: "NEGATIVE", status: "NEW", customerName: "Marcus Vance", customerEmail: "marcus@logistics.net" },
  { content: "Would love automated PDF export scheduling for Voice-of-Customer reports.", channel: "COMMUNITY_POST", sentimentScore: 0.4, sentimentLabel: "POSITIVE", status: "NEW", customerName: "Sarah Jenkins", customerEmail: "sarah@designhub.co" },
  { content: "Ask LOOP RAG citations pinpoint exact quotes flawlessly. Huge time saver!", channel: "NPS_SURVEY", sentimentScore: 0.95, sentimentLabel: "POSITIVE", status: "ACTIONED", customerName: "Alex Rivera", customerEmail: "alex@fintech.org" },
  { content: "Need role-based permissions to hide API keys from viewer team members.", channel: "SALES_CALL_NOTE", sentimentScore: -0.2, sentimentLabel: "NEUTRAL", status: "REVIEWED", customerName: "Robert Chen", customerEmail: "robert@enterprise.com" },
  { content: "CSV bulk upload handled 10,000 rows without any browser memory issues.", channel: "APP_STORE_REVIEW", sentimentScore: 0.85, sentimentLabel: "POSITIVE", status: "ACTIONED", customerName: "Jessica Alba", customerEmail: "jessica@growth.io" },
  { content: "Mobile drawer navbar feels extremely crisp and dark theme looks sleek.", channel: "COMMUNITY_POST", sentimentScore: 0.9, sentimentLabel: "POSITIVE", status: "REVIEWED", customerName: "Kevin Durant", customerEmail: "kevin@hoops.com" },
  { content: "Webhooks for Intercom sync occasionally timeout during peak hours.", channel: "SUPPORT_TICKET", sentimentScore: -0.5, sentimentLabel: "NEGATIVE", status: "NEW", customerName: "Laura Croft", customerEmail: "laura@tomb.org" },
  { content: "The sentiment analysis score accuracy on Spanish reviews is impressive.", channel: "NPS_SURVEY", sentimentScore: 0.8, sentimentLabel: "POSITIVE", status: "ACTIONED", customerName: "Carlos Santana", customerEmail: "carlos@latam.es" },
];

async function main() {
  console.log("🌱 Seeding LOOP AI Production Database...");

  // Clean existing data
  await prisma.feedback.deleteMany({});
  await prisma.feedbackTheme.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Admin & Users
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@loop.ai",
      password: passwordHash,
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      name: "Sarah Analyst",
      email: "analyst@loop.ai",
      password: passwordHash,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      name: "John Viewer",
      email: "viewer@loop.ai",
      password: passwordHash,
    },
  });

  // 2. Create Primary Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Production Workspace",
      slug: "acme-prod",
      description: "Primary enterprise feedback intelligence workspace.",
      industry: "SaaS / Software",
      teamSize: "51-200 Employees",
      apiKey: "loop_live_sk_9921481948194819",
    },
  });

  // 3. Create Workspace Memberships
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: adminUser.id, role: "ADMIN" },
      { workspaceId: workspace.id, userId: analystUser.id, role: "ANALYST" },
      { workspaceId: workspace.id, userId: viewerUser.id, role: "VIEWER" },
    ],
  });

  // 4. Create Key Themes
  const theme1 = await prisma.feedbackTheme.create({
    data: {
      workspaceId: workspace.id,
      title: "Onboarding Latency",
      description: "Latency and setup issues reported during v2 release.",
      color: "rose",
      growthRate: 45.0,
      isSpike: true,
    },
  });

  const theme2 = await prisma.feedbackTheme.create({
    data: {
      workspaceId: workspace.id,
      title: "Dashboard Speed & UI",
      description: "Positive praise for responsive dark mode UI and navigation.",
      color: "emerald",
      growthRate: 92.0,
      isSpike: false,
    },
  });

  const theme3 = await prisma.feedbackTheme.create({
    data: {
      workspaceId: workspace.id,
      title: "SSO & SAML Integration",
      description: "Enterprise feature requests for SAML Okta integration.",
      color: "amber",
      growthRate: 15.0,
      isSpike: false,
    },
  });

  // 5. Seed 100 Sample Feedback Records
  const feedbackData = [];
  const channels = ["SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY", "SALES_CALL_NOTE", "COMMUNITY_POST"] as const;
  const statuses = ["NEW", "REVIEWED", "ACTIONED"] as const;

  for (let i = 0; i < 100; i++) {
    const template = sampleQuotes[i % sampleQuotes.length];
    const theme = i % 3 === 0 ? theme1 : i % 3 === 1 ? theme2 : theme3;

    feedbackData.push({
      workspaceId: workspace.id,
      authorId: i % 2 === 0 ? adminUser.id : analystUser.id,
      content: `${template.content} (Item #${i + 1})`,
      channel: channels[i % channels.length],
      sentimentScore: Number((Math.sin(i) * 0.9).toFixed(2)),
      sentimentLabel: i % 2 === 0 ? "POSITIVE" : i % 5 === 0 ? "NEGATIVE" : "NEUTRAL",
      status: statuses[i % statuses.length],
      customerName: template.customerName,
      customerEmail: template.customerEmail,
      themeId: theme.id,
      createdAt: new Date(Date.now() - i * 3600 * 1000 * 4),
    });
  }

  await prisma.feedback.createMany({
    data: feedbackData,
  });

  // 6. Create Initial VoC Executive Report
  await prisma.report.create({
    data: {
      workspaceId: workspace.id,
      authorId: adminUser.id,
      title: "Weekly Voice-of-Customer Executive Digest",
      summary: "Customer sentiment improved +6.4% this week. Onboarding friction was identified as the top spiking issue with 42 mentions.",
      totalItems: 100,
      avgSentiment: 0.84,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`👤 Admin Account: admin@loop.ai / Password123!`);
  console.log(`🏢 Workspace: Acme Production Workspace (ID: ${workspace.id})`);
  console.log(`📊 Feedback Items Seeded: 100`);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
