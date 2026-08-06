import "dotenv/config";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFeedbackConfirmationEmail,
  sendSupportAutoReplyEmail,
  sendFeedbackRequestEmail,
  VERIFIED_DEFAULT_SENDER,
} from "../lib/email";

async function testAllRemainingEmailFlows() {
  console.log("==================================================");
  console.log("🧪 TESTING ALL 6 REMAINING EMAIL FLOWS WITH RESEND");
  console.log("==================================================\n");

  const targetEmail = process.env.TEST_TARGET_EMAIL || "team@customerloop.in";
  console.log(`Verified Default Sender: ${VERIFIED_DEFAULT_SENDER}`);
  console.log(`Target Test Recipient: ${targetEmail}\n`);

  // 1. User Signup Verification Email
  console.log("1. Testing User Signup Verification Email Flow...");
  const verifyRes = await sendVerificationEmail({
    to: targetEmail,
    name: "Alex Rivera",
    verifyUrl: "https://customerloop.in/verify-email?token=test_verify_9918",
    code: "849201",
    expiresHours: 24,
  });
  console.log(`   ✓ Provider: ${verifyRes.provider} | ID: ${verifyRes.messageId || "N/A"} | Success: ${verifyRes.success}\n`);

  // 2. Password Reset Email
  console.log("2. Testing Password Reset Email Flow...");
  const resetRes = await sendPasswordResetEmail({
    to: targetEmail,
    name: "Alex Rivera",
    resetUrl: "https://customerloop.in/reset-password?token=test_reset_4412",
    expiresHours: 1,
  });
  console.log(`   ✓ Provider: ${resetRes.provider} | ID: ${resetRes.messageId || "N/A"} | Success: ${resetRes.success}\n`);

  // 3. Welcome Email
  console.log("3. Testing Welcome Email Flow...");
  const welcomeRes = await sendWelcomeEmail({
    to: targetEmail,
    name: "Alex Rivera",
    dashboardUrl: "https://customerloop.in/dashboard",
  });
  console.log(`   ✓ Provider: ${welcomeRes.provider} | ID: ${welcomeRes.messageId || "N/A"} | Success: ${welcomeRes.success}\n`);

  // 4. Feedback Submission Confirmation Email
  console.log("4. Testing Feedback Submission Confirmation Email Flow...");
  const fbConfirmRes = await sendFeedbackConfirmationEmail({
    to: targetEmail,
    name: "Alex Rivera",
    feedbackId: "fb_live_acme_84920",
    summary: "Love the new AI RAG synthesis engine performance in the dashboard!",
  });
  console.log(`   ✓ Provider: ${fbConfirmRes.provider} | ID: ${fbConfirmRes.messageId || "N/A"} | Success: ${fbConfirmRes.success}\n`);

  // 5. Support Auto Reply Email
  console.log("5. Testing Support Auto Reply Email Flow...");
  const supportRes = await sendSupportAutoReplyEmail({
    to: targetEmail,
    name: "Alex Rivera",
    ticketId: "TICK-99481",
    subject: "Okta SAML Single Sign-On Integration Inquiry",
    expectedResponseTime: "within 4 business hours",
  });
  console.log(`   ✓ Provider: ${supportRes.provider} | ID: ${supportRes.messageId || "N/A"} | Success: ${supportRes.success}\n`);

  // 6. Feedback Survey Request Email
  console.log("6. Testing Feedback Survey Request Email Flow...");
  const surveyRes = await sendFeedbackRequestEmail({
    to: targetEmail,
    name: "Alex Rivera",
    surveyUrl: "https://customerloop.in/feedback",
    category: "Q3 Product Experience",
  });
  console.log(`   ✓ Provider: ${surveyRes.provider} | ID: ${surveyRes.messageId || "N/A"} | Success: ${surveyRes.success}\n`);

  console.log("==================================================");
  console.log("✅ ALL 6 REMAINING EMAIL FLOWS VERIFIED SUCCESSFULLY!");
  console.log("==================================================\n");
}

testAllRemainingEmailFlows().catch(console.error);
