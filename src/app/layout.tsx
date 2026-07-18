import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskboard",
  description: "Async React demo — a task management app",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
