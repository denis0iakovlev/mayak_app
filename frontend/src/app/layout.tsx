import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layouts/NavBar";
import { Footer } from "@/components/layouts/Footer";
import { TelegramInitializer } from "@/components/context/TelegramInitializer";
import { UserInitiliazer } from "@/components/context/UserInitializer";
import { Suspense } from "react";
import Loader from "@/components/layouts/Loader";

export const metadata: Metadata = {
  title: "Корты на Маяке",
  description: "Лучшие корты города Каменск-Шахтинский",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1.5,
  userScalable: false
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <TelegramInitializer>
            <UserInitiliazer>
                <Navbar />
                {children}
            </UserInitiliazer>
          </TelegramInitializer>
        </main>
        <Footer />
      </body>
    </html >
  );
}
