import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "ATTESTLY — Fine-Tune & Deploy Open-Weight Models",
  description: "Upload your data, fine-tune any open-weight LLM with LoRA/QLoRA, and get a private API endpoint.",
  keywords: ["fine-tuning", "LLM", "LoRA", "QLoRA", "open-weight", "AI", "MLOps", "deployment"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${space.variable} font-sans min-h-screen bg-background text-text-primary antialiased`}>
        {children}
      </body>
    </html>
  );
}
