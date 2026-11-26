import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { OctoProvider } from "@/lib/store";
import { AppToaster } from "@/components/app-toaster";
import { themeScript } from "@/components/theme-toggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Octo — your WhatsApp assistant",
  description:
    "Set up an AI assistant that answers your customers on WhatsApp, books appointments and never invents a price.",
};

export const viewport: Viewport = {
  themeColor: "#f6f8f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved light/dark choice before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <OctoProvider>
          {children}
          <AppToaster />
        </OctoProvider>
      </body>
    </html>
  );
}
