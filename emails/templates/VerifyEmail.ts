import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
  code?: string;
  expiresHours?: number;
}

export function renderVerifyEmail({
  name,
  verifyUrl,
  code,
  expiresHours = 24,
}: VerifyEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Verify your CustomerLoop Email Address";
  const previewText = "Please verify your email address to complete your CustomerLoop account setup.";

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Verify Your Email Address
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${name || "there"}, thank you for signing up for CustomerLoop. Please verify your email address to activate your workspace:
    </p>

    ${
      code
        ? `
    <div style="background-color: #1e293b; border: 1px dashed #334155; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
      <span style="font-family: monospace; font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: 6px;">${code}</span>
      <p style="font-family: sans-serif; font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">Verification Code</p>
    </div>
    `
        : ""
    }

    ${renderEmailButton({ href: verifyUrl, text: "Verify Email Address", variant: "primary" })}

    <div style="background-color: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
      <p style="font-family: sans-serif; font-size: 13px; color: #fbbf24; margin: 0; line-height: 1.5;">
        ⏳ <strong>Expiration Notice:</strong> This verification link will expire in <strong>${expiresHours} hours</strong>. If expired, you can request a new verification link from the login page.
      </p>
    </div>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    securityNotice: "If you did not create a CustomerLoop account, please disregard this message.",
    showUnsubscribe: false,
  });

  const text = `Hi ${name},\n\nPlease verify your email address for CustomerLoop by opening this link: ${verifyUrl}\n${code ? `Verification Code: ${code}\n` : ""}Link expires in ${expiresHours} hours.`;

  return { subject, html, text };
}
