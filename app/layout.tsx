import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOP AI — Customer Feedback Intelligence Platform",
  description: "Transform scattered customer feedback into ranked, evidence-backed product insights with real-time sentiment analysis, theme clustering, and grounded RAG AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-sans">
        {children}
      </body>
    </html>
  );
}

