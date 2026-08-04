import assert from "assert";
import {
  detectIntent,
  retrieveAndRankEvidence,
  generateGroundedAnswer,
  FeedbackItem,
} from "../lib/rag";

export function runRAGPipelineTests() {
  console.log("🧪 Running Grounded RAG Pipeline Automated Test Suite...");

  const sampleItems: FeedbackItem[] = [
    {
      id: "fb-1",
      content: "Onboarding took forever — I couldn't figure out how to invite my team.",
      channel: "SUPPORT_TICKET",
      customerName: "Sarah Jenkins",
      sentimentScore: -0.8,
      sentimentLabel: "NEGATIVE",
    },
    {
      id: "fb-2",
      content: "The new dashboard is gorgeous and finally fast. Huge performance improvement!",
      channel: "APP_STORE_REVIEW",
      customerName: "David K.",
      sentimentScore: 0.9,
      sentimentLabel: "POSITIVE",
    },
    {
      id: "fb-3",
      content: "Prospect wants SSO SAML integration before signing the enterprise tier.",
      channel: "SALES_CALL_NOTE",
      customerName: "Enterprise Account Rep",
      sentimentScore: 0.1,
      sentimentLabel: "NEUTRAL",
    },
  ];

  // 1. Executive Report Intent
  const intent1 = detectIntent("Generate a complete executive report for Q3 customer feedback");
  assert.strictEqual(intent1, "EXECUTIVE_REPORT", "Failed Executive Report intent detection");

  // 2. Root Cause Intent
  const intent2 = detectIntent("What is the root cause of onboarding complaints?");
  assert.strictEqual(intent2, "ROOT_CAUSE_ANALYSIS", "Failed Root Cause intent detection");

  // 3. Comparison Intent
  const intent3 = detectIntent("Compare sentiment between support tickets and app reviews");
  assert.strictEqual(intent3, "COMPARISON", "Failed Comparison intent detection");

  // 4. Sentiment Intent
  const intent4 = detectIntent("What is the overall customer sentiment score?");
  assert.strictEqual(intent4, "SENTIMENT_ANALYSIS", "Failed Sentiment intent detection");

  // 5. Empty evidence returns exact grounded string
  const resultEmpty = generateGroundedAnswer("What is the feedback on dark mode?", [], "SUMMARY");
  assert.strictEqual(
    resultEmpty.answer,
    "No supporting evidence found in indexed customer feedback.",
    "Failed empty evidence grounded message"
  );
  assert.strictEqual(resultEmpty.citations.length, 0, "Citations should be empty");

  // 6. Executive Report generates exact 11 Markdown sections
  const ranked = retrieveAndRankEvidence("Generate a complete executive report", sampleItems);
  const resultExec = generateGroundedAnswer("Generate a complete executive report", ranked, "EXECUTIVE_REPORT");

  assert.ok(resultExec.answer.includes("# Executive Summary"), "Missing # Executive Summary");
  assert.ok(resultExec.answer.includes("## Overall Sentiment"), "Missing ## Overall Sentiment");
  assert.ok(resultExec.answer.includes("## Top Issues"), "Missing ## Top Issues");
  assert.ok(resultExec.answer.includes("## Top Pain Points"), "Missing ## Top Pain Points");
  assert.ok(resultExec.answer.includes("## Root Cause Analysis"), "Missing ## Root Cause Analysis");
  assert.ok(resultExec.answer.includes("## Department Impact"), "Missing ## Department Impact");
  assert.ok(resultExec.answer.includes("## Churn Risk"), "Missing ## Churn Risk");
  assert.ok(resultExec.answer.includes("## Recommendations"), "Missing ## Recommendations");
  assert.ok(resultExec.answer.includes("## Priority Matrix"), "Missing ## Priority Matrix");
  assert.ok(resultExec.answer.includes("## Supporting Customer Quotes"), "Missing ## Supporting Customer Quotes");
  assert.ok(resultExec.answer.includes("## Confidence Score"), "Missing ## Confidence Score");

  // 7. Prevents prompt echoing (never repeats user query in answer)
  const prompt = "Generate a complete executive report on onboarding friction";
  const rankedPrompt = retrieveAndRankEvidence(prompt, sampleItems);
  const resultPrompt = generateGroundedAnswer(prompt, rankedPrompt, "EXECUTIVE_REPORT");

  assert.strictEqual(resultPrompt.answer.includes(`regarding '${prompt}'`), false, "Prompt echoed in answer!");
  assert.strictEqual(resultPrompt.answer.includes(`for "${prompt}"`), false, "Prompt echoed in answer!");

  // 8. Deduplicates identical feedback items
  const duplicateItems: FeedbackItem[] = [
    ...sampleItems,
    {
      id: "fb-dup",
      content: "Onboarding took forever — I couldn't figure out how to invite my team.",
      channel: "SUPPORT_TICKET",
      customerName: "Sarah Jenkins Duplicate",
      sentimentScore: -0.8,
      sentimentLabel: "NEGATIVE",
    },
  ];

  const rankedDups = retrieveAndRankEvidence("onboarding", duplicateItems);
  assert.strictEqual(rankedDups.length, 1, "Deduplication failed");

  console.log("✅ All Grounded RAG Pipeline tests passed successfully!");
}

// Execute tests if executed directly
if (require.main === module) {
  runRAGPipelineTests();
}
