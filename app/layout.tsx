import type { Metadata } from "next";
import { Geist } from "next/font/google";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({ subsets: ["latin"] });
// const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Charts | Hot 100",
  description:
    "Personal Charts is an algorithmic music tracking system inspired by the Billboard Hot 100. By using Last.fm scrobble data, the engine computes music performance, simulating real-life chart mechanics through weights, multipliers, and time-decay logic.",
  openGraph: {
    title: "Personal Charts | Hot 100",
    description:
      "Personal Charts is an algorithmic music tracking system inspired by the Billboard Hot 100. By using Last.fm scrobble data, the engine computes music performance, simulating real-life chart mechanics through weights, multipliers, and time-decay logic.",
    url: "https://personal-hot-100.vercel.app",
    siteName: "Personal Charts",
    images: [
      {
        url: "/cover.jpg",
        width: 1200,
        height: 630,
        alt: "Personal Charts Official Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Charts | The Definitive Hot 100",
    description:
      "An algorithmic music tracking system computing Last.fm scrobble data into a realistic Billboard-style Hot 100.",
    images: ["/cover.jpg"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} antialiased bg-white text-black min-h-screen flex flex-col`}
      >
        <Header />

        <main className="w-full flex-1 bg-white">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
