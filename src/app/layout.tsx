import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { currentUser } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Worldwiki", template: "%s · Worldwiki" },
  description: "A shared wiki for an invented world: characters, families and the links between them.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = hasSupabase() ? await currentUser() : null;
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-display text-xl tracking-tight">Worldwiki</Link>
            <nav className="text-sm text-muted">
              {user ? (
                <span className="flex items-center gap-3">
                  <span className="hidden sm:inline">{user.email}</span>
                  <form action="/auth/signout" method="post"><button className="underline underline-offset-4 hover:text-ink">Sign out</button></form>
                </span>
              ) : (
                <Link href="/login" className="underline underline-offset-4 hover:text-ink">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
