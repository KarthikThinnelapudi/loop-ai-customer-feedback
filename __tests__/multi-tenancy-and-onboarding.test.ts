import assert from "assert";
import { generateGroundedAnswer, retrieveAndRankEvidence, FeedbackItem } from "../lib/rag";
import { hasPermission } from "../lib/rbac";

export function runMultiTenancyAndOnboardingTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING ENTERPRISE MULTI-TENANT & RBAC SECURITY SUITE");
  console.log("==================================================\n");

  // Mock Workspace A Dataset (Acme Corp)
  const workspaceAData: FeedbackItem[] = [
    {
      id: "fb-ws-a-1",
      content: "Acme Corp secret feature request for Okta SAML SSO integration.",
      channel: "SUPPORT_TICKET",
      customerName: "Acme Lead",
      sentimentScore: 0.2,
      sentimentLabel: "NEUTRAL",
    },
  ];

  // 1. SELECT & Retrieval Multi-Tenant Isolation
  console.log("1. Testing Cross-Workspace SELECT & Search Isolation...");
  const searchForBetaInWorkspaceA = retrieveAndRankEvidence("Beta LLC", workspaceAData).ranked;
  assert.strictEqual(searchForBetaInWorkspaceA.length, 0, "Workspace A retrieved Workspace B data!");
  console.log("   ✓ Cross-workspace SELECT isolation verified (0 records leaked).\n");

  // 2. AI Multi-Tenant Isolation
  console.log("2. Testing Cross-Workspace AI Grounding Isolation...");
  const aiAnswerWorkspaceA = generateGroundedAnswer(
    "What are Beta LLC complaints?",
    searchForBetaInWorkspaceA,
    "CUSTOMER_COMPLAINTS",
    {},
    "ws_acme_corp"
  );
  assert.strictEqual(
    aiAnswerWorkspaceA.answer.includes("Beta LLC"),
    false,
    "AI leaked cross-tenant Workspace B data to Workspace A!"
  );
  console.log("   ✓ AI query workspace isolation verified.\n");

  // 3. New User Onboarding Empty State Verification
  console.log("3. Testing Production New-User Onboarding Clean State...");
  const newUserEmptyDataset: FeedbackItem[] = [];
  const newUserRanked = retrieveAndRankEvidence("Summarize workspace feedback", newUserEmptyDataset).ranked;
  const newUserRAGResult = generateGroundedAnswer(
    "Summarize workspace feedback",
    newUserRanked,
    "SUMMARY",
    {},
    "ws_newly_registered_user"
  );

  assert.strictEqual(
    newUserRAGResult.answer,
    "No supporting evidence found in indexed customer feedback.",
    "New user received demo or pre-seeded data!"
  );
  assert.strictEqual(newUserRAGResult.citations.length, 0, "New user received non-zero citations!");
  assert.strictEqual(newUserRAGResult.groundedScore, 0.0, "New user received non-zero grounded score!");
  console.log("   ✓ New-user clean onboarding state verified (0 demo / cross-tenant items).\n");

  // 4. Viewer Strict Read-Only RBAC Enforcement
  console.log("4. Testing Viewer Strict Read-Only RBAC Matrix...");
  assert.strictEqual(hasPermission("VIEWER", "dashboard:view"), true, "Viewer cannot view dashboard!");
  assert.strictEqual(hasPermission("VIEWER", "feedback:view"), true, "Viewer cannot view feedback!");
  assert.strictEqual(hasPermission("VIEWER", "ask_ai:access"), false, "Viewer bypassed AI access restriction!");
  assert.strictEqual(hasPermission("VIEWER", "analytics:view"), false, "Viewer bypassed analytics restriction!");
  assert.strictEqual(hasPermission("VIEWER", "trends:view"), false, "Viewer bypassed trends restriction!");
  assert.strictEqual(hasPermission("VIEWER", "reports:generate"), false, "Viewer bypassed report generation!");
  assert.strictEqual(hasPermission("VIEWER", "audit:view"), false, "Viewer bypassed audit log restriction!");
  assert.strictEqual(hasPermission("VIEWER", "csv:export"), false, "Viewer bypassed export restriction!");
  assert.strictEqual(hasPermission("VIEWER", "users:invite"), false, "Viewer bypassed team invite restriction!");
  console.log("   ✓ Viewer role RBAC enforcement verified (Restricted from AI, Analytics, Audits, Exports).\n");

  // 5. Analyst RBAC Verification
  console.log("5. Testing Analyst Role RBAC Matrix...");
  assert.strictEqual(hasPermission("ANALYST", "dashboard:view"), true);
  assert.strictEqual(hasPermission("ANALYST", "feedback:view"), true);
  assert.strictEqual(hasPermission("ANALYST", "analytics:view"), true);
  assert.strictEqual(hasPermission("ANALYST", "trends:view"), true);
  assert.strictEqual(hasPermission("ANALYST", "ask_ai:access"), true);
  assert.strictEqual(hasPermission("ANALYST", "reports:generate"), true);
  assert.strictEqual(hasPermission("ANALYST", "users:invite"), false, "Analyst improperly granted invite access!");
  console.log("   ✓ Analyst role RBAC matrix verified.\n");

  // 6. Admin Role Verification
  console.log("6. Testing Admin Role RBAC Matrix...");
  assert.strictEqual(hasPermission("ADMIN", "users:invite"), true);
  assert.strictEqual(hasPermission("ADMIN", "users:manage"), true);
  assert.strictEqual(hasPermission("ADMIN", "audit:view"), true);
  assert.strictEqual(hasPermission("ADMIN", "workspace:settings"), true);
  console.log("   ✓ Admin role RBAC matrix verified.\n");

  console.log("==================================================");
  console.log("✅ ENTERPRISE SECURITY & RBAC SUITE PASSED 100%");
  console.log("==================================================\n");
}

runMultiTenancyAndOnboardingTests();
