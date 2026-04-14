import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/header";
import { AuthGate } from "@/components/auth-gate";
import { getCurrentUser } from "@/lib/queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskboard",
  description: "Async React demo — a task management app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <AuthGate user={user}>
          <Header />
          <main className="flex-1">{children}</main>
        </AuthGate>
      </body>
    </html>
  );
}
