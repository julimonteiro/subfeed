import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SubFeed",
  description:
    "Track the latest videos from your favorite YouTube channels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] antialiased`}
      >
        <Navbar />
        <main className="mx-auto w-full max-w-[600px] px-0 pb-20 sm:px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
