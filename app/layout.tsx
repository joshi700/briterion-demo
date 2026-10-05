import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Briterion Demo",
  description: "Card-not-present fraud decisioning demo for the Mastercard Gateway.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">
        <Nav />
        {children}
      </body>
    </html>
  );
}
