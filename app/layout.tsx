import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Hot 100",
  description: "The official weekly music chart tracking your most played songs on Last.fm.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased bg-white text-black min-h-screen`}>
        
        <header className="w-full px-8 pt-8 pb-4 border-b-2 border-black flex justify-between items-end bg-white">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
              Personal Hot 100
            </h1>
          </div>
        </header>

        <main className="w-full bg-white">
          {children}
        </main>

      </body>
    </html>
  );
}