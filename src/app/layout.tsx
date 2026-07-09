import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "The Twenty-Fifth — Beachfront Villa in Zambales",
  description:
    "Book your exclusive beachfront villa escape at The Twenty-Fifth in Botolan, Zambales. Private beach access, infinity pool, and a whole villa perfect for family getaways and celebrations.",
  keywords: [
    "The Twenty-Fifth",
    "25th Zambales",
    "beachfront villa Zambales",
    "Botolan resort",
    "villa booking Zambales",
    "private beach resort Philippines",
    "whole villa rental",
  ],
  authors: [{ name: "The Twenty-Fifth" }],
  openGraph: {
    title: "The Twenty-Fifth — A Beachfront Villa in Zambales Awaits",
    description:
      "An exclusive private villa escape in Botolan, Zambales. Perfect for group or family getaways, celebrations, and relaxing stays.",
    siteName: "The Twenty-Fifth",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Twenty-Fifth — Beachfront Villa in Zambales",
    description:
      "An exclusive private villa escape in Botolan, Zambales.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "rounded-md border border-border bg-card text-card-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
