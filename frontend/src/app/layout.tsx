import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { TelegramInitializer } from "@/components/TelegramInitializer";
import { UserInitiliazer } from "@/components/UserInitializer";

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
        <TelegramInitializer>
          <UserInitiliazer>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </UserInitiliazer>
        </TelegramInitializer>
      </body>
    </html>
  );
}
