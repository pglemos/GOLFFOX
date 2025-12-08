import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mobile-optimizations.css";
import { Toaster } from "react-hot-toast";
import { WebVitalsInit } from "@/components/web-vitals-init";
import { ErrorBoundary } from "@/components/error-boundary";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "GOLF FOX - Gestão de Frotas",
  description: "Plataforma de gestão de frotas e transporte",
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GOLF FOX',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Para dispositivos com notch
};

// Next.js 16: Partial Pre-Rendering (PPR) habilitado via cacheComponents no next.config.js
// Renderização incremental para melhor performance e navegação instantânea

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GOLF FOX" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.className} font-smooth antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ReactQueryProvider>
              <WebVitalsInit />
              {children}
              <Toaster position="top-right" />
              <Analytics />
              <SpeedInsights />
            </ReactQueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
