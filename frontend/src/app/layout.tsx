import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from '@/components/NavBar';
import "./globals.css";

// We use one versatile font family for a "unified" ultra-clean look
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  // We load 400 for body, 500 for UI, and 600 for "Clean" headings
  weight: ['400', '500', '600'], 
});

export const metadata: Metadata = {
  title: "My App",
  description: "Clean UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      {/* antialiased makes text look thinner and sharper on dark backgrounds */}
      <body className="bg-black text-white font-sans antialiased tracking-tight">
        <Navbar />
        {children}
      </body>
    </html>
  );
}