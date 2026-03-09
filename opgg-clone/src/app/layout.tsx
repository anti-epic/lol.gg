import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/utils/trpc-provider";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OP.GG Clone",
  description: "League of Legends player stats and match history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Nav />
        {/* Skip link — first focusable element, jumps to main content for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
