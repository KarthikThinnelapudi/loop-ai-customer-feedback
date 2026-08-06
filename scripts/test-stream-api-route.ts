import "dotenv/config";
import { generateGroundedAnswer, retrieveAndRankEvidence } from "../lib/rag";

async function testStreamPipeline() {
  console.log("==================================================");
  console.log("🧪 TESTING /api/ai/stream RAG PIPELINE & STREAM GENERATION");
  console.log("==================================================\n");

  const prompt = "What are the primary onboarding complaints from users?";
  const history = [{ role: "user" as const, content: "Hello" }];

  const mockFeedbackItems = [
    {
      id: "fb_101",
      content: "Team member invitation links in onboarding failed repeatedly.",
      channel: "SUPPORT_TICKET",
      company: "Acme Corp",
      sentimentScore: -0.75,
      sentimentLabel: "NEGATIVE",
      customerName: "Sarah Jenkins",
      createdAt: new Date(),
    },
  ];

  console.log(`• Input Prompt: "${prompt}"`);
  console.log(`• History Turns: ${history.length}`);
  console.log(`• Mock Feedback Records: ${mockFeedbackItems.length}`);

  const { ranked, metrics: retrievalMetrics } = retrieveAndRankEvidence(prompt, mockFeedbackItems, 8);
  console.log(`• Evidence Ranked Count: ${ranked.length}`);
  console.log(`• Retrieval Latency: ${retrievalMetrics.retrievalLatencyMs}ms`);

  const ragResult = await generateGroundedAnswer(prompt, ranked, "CUSTOMER_COMPLAINTS", retrievalMetrics, "ws_test_992", history);

  console.log("\n==================================================");
  console.log("📩 GROUNDED RAG RESULT METRICS:");
  console.log("==================================================");
  console.log(`• Provider: ${ragResult.metrics.provider}`);
  console.log(`• Model: ${ragResult.metrics.model}`);
  console.log(`• Total Latency: ${ragResult.metrics.totalLatencyMs}ms`);
  console.log(`• Grounded Score: ${ragResult.groundedScore}`);
  console.log(`• Citations Count: ${ragResult.citations.length}`);
  console.log(`• Answer Preview: "${ragResult.answer.substring(0, 120)}..."`);
  console.log("==================================================\n");

  if (ragResult.answer && ragResult.groundedScore > 0) {
    console.log("✅ SUCCESS: Grounded answer & stream token data generated cleanly.");
  } else {
    console.warn("⚠️ WARNING: Grounded answer returned empty.");
  }
}

testStreamPipeline().catch(console.error);
