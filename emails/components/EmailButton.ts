interface EmailButtonProps {
  href: string;
  text: string;
  variant?: "primary" | "cyan" | "secondary";
}

export function renderEmailButton({ href, text, variant = "primary" }: EmailButtonProps): string {
  const bg = variant === "cyan" ? "#06b6d4" : variant === "secondary" ? "#3b82f6" : "#10b981";
  const hoverBg = variant === "cyan" ? "#0891b2" : variant === "secondary" ? "#2563eb" : "#059669";

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: ${bg}; text-align: center;">
          <a href="${href}" target="_blank" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; display: inline-block; padding: 14px 28px; border-radius: 8px; background-color: ${bg}; border: 1px solid ${hoverBg}; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.25);">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}
