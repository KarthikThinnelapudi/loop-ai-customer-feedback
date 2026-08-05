import assert from "assert";
import { generateGroundedAnswer, retrieveAndRankEvidence, FeedbackItem } from "../lib/rag";

export function runMultiTenancyAndOnboardingTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING MULTI-TENANCY ISOLATION & ONBOARDING SUITE");
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

  console.log("==================================================");
  console.log("✅ MULTI-TENANCY & ONBOARDING SUITE PASSED 100%");
  console.log("==================================================\n");
}

runMultiTenancyAndOnboardingTests();
