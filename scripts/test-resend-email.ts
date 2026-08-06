import "dotenv/config";
import { sendEmail } from "../lib/email";

async function main() {
  console.log("==================================================");
  console.log("✉️ TESTING RESEND API DISPATCH WITH VERIFIED DOMAIN");
  console.log("==================================================\n");

  console.log("RESEND_API_KEY Present:", Boolean(process.env.RESEND_API_KEY));
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "CustomerLoop <noreply@customerloop.in>");

  const testEmail = "onboarding@customerloop.in";
  const result = await sendEmail({
    to: testEmail,
    subject: "CustomerLoop Resend API Verification Test",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #10b981;">Resend API Test Delivered Successfully!</h2>
        <p>This email confirms that Resend API is sending from the verified domain <strong>customerloop.in</strong>.</p>
        <p>Sender: ${process.env.EMAIL_FROM || "CustomerLoop <noreply@customerloop.in>"}</p>
      </div>
    `,
  });

  console.log("\nDispatch Result:", result);

  if (result.success && result.provider === "Resend API") {
    console.log(`\n✅ Resend API test returned SUCCESS (Message ID: ${result.messageId})`);
  } else {
    console.log("\n⚠️ Email dispatch result:", result);
  }
}

main().catch(console.error);
