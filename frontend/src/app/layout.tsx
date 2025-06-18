import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/NavBar";
import { Children } from "react";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Корты на Маяке",
  description: "Лучшие корты города Каменск-Шахтинский"
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
