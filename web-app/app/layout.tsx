import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { WebVitalsInit } from "@/components/web-vitals-init";
import { ErrorBoundary } from "@/components/error-boundary";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap", // Voltar para swap para melhor compatibilidade
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "GOLF FOX - Gestão de Frotas",
  description: "Plataforma de gestão de frotas e transporte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} font-smooth`}>
        <ErrorBoundary>
          <WebVitalsInit />
          {children}
          <Toaster position="top-right" />
          {process.env.NODE_ENV === 'production' && <SpeedInsights />}
        </ErrorBoundary>
      </body>
    </html>
  );
}
