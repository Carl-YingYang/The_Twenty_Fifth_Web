import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verdara Resort — Luxury Resort Reservations",
  description:
    "Book your escape at Verdara Resort, a luxury forest sanctuary. Reserve elegant villas, world-class amenities, and unforgettable experiences.",
  keywords: [
    "luxury resort",
    "resort reservation",
    "forest resort",
    "villa booking",
    "Verdara Resort",
  ],
  authors: [{ name: "Verdara Resort" }],
  openGraph: {
    title: "Verdara Resort — Luxury Resort Reservations",
    description:
      "Book your escape at Verdara Resort, a luxury forest sanctuary.",
    siteName: "Verdara Resort",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdara Resort — Luxury Resort Reservations",
    description:
      "Book your escape at Verdara Resort, a luxury forest sanctuary.",
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
        className={`${geistSans.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
              border: "1px solid #E2E8F0",
            },
          }}
        />
      </body>
    </html>
  );
}
