import type { Metadata } from "next";
import "./globals.css";
import { ResultTimeEnhancer } from "./components/result-time-enhancer";

export const metadata: Metadata = {
  title: "Learn Nova | Personalized learning",
  description: "Role-based assessments, learning insights, and classroom progress in one focused portal.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ResultTimeEnhancer />
      </body>
    </html>
  );
}
