import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InvoiceCraft Studio — Your Brand. Your Invoice. Instantly.",
    template: "%s | InvoiceCraft Studio"
  },
  description:
    "Universal AI-powered branded invoice platform for businesses of every size and industry. Automatic logo color extraction, live preview, decimal-safe calculations, and professional PDF downloads.",
  keywords: [
    "invoice generator",
    "branded invoices",
    "logo color extractor",
    "free invoice maker",
    "pdf invoices",
    "local first",
    "AI invoice",
    "small business invoices",
    "invoice template"
  ],
  authors: [{ name: "InvoiceCraft Studio" }],
  creator: "InvoiceCraft Studio",
  metadataBase: new URL("https://invoicecraft.studio"),
  openGraph: {
    title: "InvoiceCraft Studio — Your Brand. Your Invoice. Instantly.",
    description:
      "Create beautiful, branded invoices in seconds. Upload your logo, extract brand colors, and generate professional PDFs — no account needed.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceCraft Studio",
    description:
      "AI-powered branded invoice platform. Local-first. No sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#5B4FCF",
};

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F6FA] text-[#0F1128]">
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
