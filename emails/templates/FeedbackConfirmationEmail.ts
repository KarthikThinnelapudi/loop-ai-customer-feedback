import { renderEmailContainer } from "../components/EmailContainer";

export interface FeedbackConfirmationEmailProps {
  name: string;
  feedbackId: string;
  summary: string;
}

export function renderFeedbackConfirmationEmail({
  name,
  feedbackId,
  summary,
}: FeedbackConfirmationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Feedback Received [Ref #${feedbackId.substring(0, 8)}] — LOOP AI`;
  const previewText = `Thank you for your feedback! Ref #${feedbackId.substring(0, 8)} has been logged.`;

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Thank You for Your Feedback! 🙌
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${name || "there"}, we have successfully received your feedback submission for <strong>LOOP AI</strong>. Thank you for taking the time to help us improve.
    </p>

    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8;">Feedback Ref:</td>
          <td style="font-family: monospace; font-size: 14px; font-weight: 700; color: #10b981;" align="right">#${feedbackId.substring(0, 8)}</td>
        </tr>
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8; padding-top: 8px;">Submission Summary:</td>
          <td style="font-family: sans-serif; font-size: 14px; font-style: italic; color: #f8fafc;" align="right">"${summary.length > 60 ? summary.substring(0, 60) + "..." : summary}"</td>
        </tr>
      </table>
    </div>

    <div style="background-color: rgba(6, 182, 212, 0.08); border-left: 3px solid #06b6d4; padding: 12px 16px; border-radius: 4px; margin-top: 20px;">
      <p style="font-family: sans-serif; font-size: 13px; color: #38bdf8; margin: 0; line-height: 1.5;">
        💡 <strong>What's Next?</strong> Our product engineering team reviews incoming customer feedback daily. High-priority items are routed directly to our feature roadmap.
      </p>
    </div>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    showUnsubscribe: false,
  });

  const text = `Hi ${name},\n\nThank you for submitting feedback to LOOP AI! (Ref #${feedbackId.substring(0, 8)}).\nSummary: "${summary}"\n\nOur product team reviews all submissions daily to improve LOOP AI.`;

  return { subject, html, text };
}
