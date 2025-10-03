import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { TelegramInitializer } from "@/components/TelegramInitializer";
import { UserInitiliazer } from "@/components/UserInitializer";
import { Suspense } from "react";

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
        <Suspense fallback={<h1>Грузим грузим...</h1>}>
          <TelegramInitializer>
            <UserInitiliazer>
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </UserInitiliazer>
          </TelegramInitializer>
        </Suspense>
      </body>
    </html>
  );
}
