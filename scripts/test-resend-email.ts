import "dotenv/config";
import { sendEmail } from "../lib/email";

async function main() {
  console.log("==================================================");
  console.log("✉️ TESTING RESEND API DISPATCH WITH VERIFIED SENDER");
  console.log("==================================================\n");

  const sender = process.env.EMAIL_FROM || "LOOP AI <team@customerloop.in>";
  const testRecipient = process.env.TEST_RECIPIENT || "team@customerloop.in";

  console.log("RESEND_API_KEY Present:", Boolean(process.env.RESEND_API_KEY));
  console.log("EMAIL_FROM:", sender);
  console.log("TEST RECIPIENT:", testRecipient);

  const result = await sendEmail({
    to: testRecipient,
    subject: "CustomerLoop Resend API Verification Test",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #10b981;">Resend API Test Delivered Successfully!</h2>
        <p>This email confirms that Resend API is sending from the verified sender domain <strong>customerloop.in</strong>.</p>
        <p>Sender: ${sender}</p>
        <p>Recipient: ${testRecipient}</p>
      </div>
    `,
  });

  console.log("\nDispatch Result:", result);

  if (result.success && result.provider === "Resend API") {
    console.log(`\n✅ Resend API test returned SUCCESS (HTTP 200 OK — Message ID: ${result.messageId})`);
  } else {
    console.log("\n⚠️ Email dispatch result:", result);
  }
}

main().catch(console.error);
