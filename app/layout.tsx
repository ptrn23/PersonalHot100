import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Hot 100",
  description: "The official weekly music chart tracking your most played songs on Last.fm.",
  openGraph: {
    title: 'Personal Hot 100',
    description: "The official weekly music chart tracking your most played songs on Last.fm.",
    url: 'https://personal-hot-100.vercel.app',
    siteName: 'Personal Hot 100',
    images: [
      {
        url: '/cover.jpg',
        width: 2048,
        height: 1536,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
