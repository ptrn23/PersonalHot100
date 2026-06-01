import type { Metadata } from "next";
import { Geist } from "next/font/google";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({ subsets: ["latin"] });
// const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Hot 100",
  description:
    "Personal Charts is an algorithmic music tracking system inspired by the Billboard Hot 100. By using Last.fm scrobble data, the engine computes music performance, simulating real-life chart mechanics through weights, multipliers, and time-decay logic.",
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
