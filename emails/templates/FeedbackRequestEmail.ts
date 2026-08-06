import { renderEmailContainer } from "../components/EmailContainer";
import { renderEmailButton } from "../components/EmailButton";

export interface FeedbackRequestEmailProps {
  name: string;
  surveyUrl?: string;
  category?: string;
}

export function renderFeedbackRequestEmail({
  name,
  surveyUrl = "https://customerloop.in/feedback",
  category = "recent experience",
}: FeedbackRequestEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "How was your recent experience with CustomerLoop?";
  const previewText = "We'd love your feedback to help us improve your CustomerLoop intelligence platform.";

  const contentHtml = `
    <h1 style="font-family: 'Inter', -apple-system, sans-serif; font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 16px 0;">
      We Value Your Feedback 💬
    </h1>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Hi ${name || "there"}, thank you for using CustomerLoop. We are constantly striving to refine our AI Customer Feedback platform.
    </p>
    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 16px 0;">
      Could you take 30 seconds to share your thoughts on your ${category}? Your feedback directly shapes our product roadmap.
    </p>

    ${renderEmailButton({ href: surveyUrl, text: "Leave Feedback", variant: "primary" })}

    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0;">
      Your responses are confidential and handled with strict enterprise data privacy controls.
    </p>
  `;

  const html = renderEmailContainer({
    title: subject,
    previewText,
    contentHtml,
    showUnsubscribe: true,
  });

  const text = `Hi ${name},\n\nWe'd love your feedback on your ${category} with CustomerLoop. Share your thoughts here: ${surveyUrl}`;

  return { subject, html, text };
}
