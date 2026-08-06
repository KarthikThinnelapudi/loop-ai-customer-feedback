import { renderEmailContainer } from "../components/EmailContainer";

export interface SupportAutoReplyEmailProps {
  name: string;
  ticketId: string;
  subject: string;
  expectedResponseTime?: string;
}

export function renderSupportAutoReplyEmail({
  name,
  ticketId,
  subject: ticketSubject,
  expectedResponseTime = "within 4 business hours",
}: SupportAutoReplyEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `[Ticket #${ticketId}] Support Request Received: ${ticketSubject}`;
  const previewText = `We've received your support request (Ticket #${ticketId}). Our team will respond ${expectedResponseTime}.`;

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      Support Request Received 📩
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${name || "there"}, thank you for contacting CustomerLoop Support. We have received your inquiry and created a tracking ticket for your request:
    </p>

    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8;">Ticket ID:</td>
          <td style="font-family: monospace; font-size: 15px; font-weight: 700; color: #10b981;" align="right">#${ticketId}</td>
        </tr>
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8; padding-top: 8px;">Subject:</td>
          <td style="font-family: sans-serif; font-size: 14px; font-weight: 600; color: #f8fafc;" align="right">${ticketSubject}</td>
        </tr>
        <tr>
          <td style="font-family: sans-serif; font-size: 14px; color: #94a3b8; padding-top: 8px;">Expected SLA:</td>
          <td style="font-family: sans-serif; font-size: 14px; font-weight: 600; color: #38bdf8;" align="right">${expectedResponseTime}</td>
        </tr>
      </table>
    </div>

    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 20px 0 0 0;">
      Our customer support specialists are reviewing your request. If you have additional details or screenshots to append, simply reply to this email.
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    showUnsubscribe: false,
  });

  const text = `Hi ${name},\n\nWe have received your support request (Ticket #${ticketId}: "${ticketSubject}"). Our team will respond ${expectedResponseTime}.\n\nReply directly to this email to add more details.`;

  return { subject, html, text };
}
