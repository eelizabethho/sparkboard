import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import { OwnerNav } from "@/components/owner-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Sparkboard",
  description: "Liz's thoughts on AI and everything new around it.",
  authors: [{ name: "Liz", url: "https://github.com/eelizabethho" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col overflow-x-clip">
        <ThemeProvider>
          <header className="frosted sticky top-0 z-40 bg-background/70 backdrop-blur-[20px] backdrop-saturate-[180%] [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link href="/" className="text-xl font-semibold tracking-[-0.02em]">
                Sparkboard
              </Link>
              <div className="flex items-center gap-2">
                <Suspense fallback={null}>
                  <OwnerNav />
                </Suspense>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
            {children}
          </main>
          <footer className="py-8 text-center text-sm text-muted-foreground">
            <a
              href="https://github.com/eelizabethho"
              className="underline-offset-4 hover:underline"
            >
              Made by Liz
            </a>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
