import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AIAssistant } from "@/components/ai";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/components/shared";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "DentalHire - Find Your Perfect Dental Career Match",
  description: "Connect with top dental clinics and professionals. DentalHire is the premier job platform for dental assistants, hygienists, and sales representatives.",
  keywords: "dental jobs, dental assistant jobs, dental hygienist, dental careers, dentist hiring",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DentalHire",
  },
  openGraph: {
    title: "DentalHire - Dental Industry Job Platform",
    description: "Find your perfect dental career match or hire top dental professionals",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${cairo.variable} font-sans antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              <ToastProvider>
                {children}
              </ToastProvider>
            </ThemeProvider>
            <AIAssistant />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
