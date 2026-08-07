import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface WelcomeEmailProps {
  name: string;
  dashboardUrl?: string;
}

export function renderWelcomeEmail({ name, dashboardUrl = "https://customerloop.in/dashboard" }: WelcomeEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Welcome to LOOP AI — Enterprise Customer Feedback Intelligence";
  const previewText = "Welcome to LOOP AI! Transform raw customer feedback into actionable growth insights.";

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Welcome to LOOP AI, ${name || "there"}! 🎉
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      We're excited to have you on board. <strong>LOOP AI</strong> is your enterprise-grade Customer Feedback Intelligence platform, powered by grounded AI RAG technology.
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; font-weight: 600; color: #10b981; margin: 0 0 10px 0;">
        Here's what you can do right now:
      </h3>
      <ul style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; color: #94a3b8; line-height: 1.7; padding-left: 20px; margin: 0;">
        <li><strong>Import Feedback:</strong> Connect CSV streams, support tickets, or app store reviews.</li>
        <li><strong>Ask LOOP AI:</strong> Query your feedback dataset with zero hallucination and strict RAG grounding.</li>
        <li><strong>Executive Reports:</strong> Generate instant VoC digests, sentiment analysis, and root cause insights.</li>
        <li><strong>Invite Team Members:</strong> Collaborate securely with granular multi-tenant RBAC roles.</li>
      </ul>
    </div>
    ${renderEmailButton({ href: dashboardUrl, text: "Go to Dashboard", variant: "primary" })}
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
      If you have any questions or need custom onboarding assistance, reply directly to this email or reach our support team anytime.
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    showUnsubscribe: true,
  });

  const text = `Welcome to LOOP AI, ${name}!\n\nWe're excited to have you on board. Access your workspace dashboard at ${dashboardUrl} to start analyzing customer feedback with AI RAG intelligence.`;

  return { subject, html, text };
}
