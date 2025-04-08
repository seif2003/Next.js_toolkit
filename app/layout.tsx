import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ThemeProvider, ThemeToggle } from "@/components/ui/theme-provider";
import { Footer } from "@/components/ui/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js Toolkit",
  description: "A collection of useful tools including color picker, password generator, and background remover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="p-4 md:p-6 flex flex-col flex-grow">
              <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <h1 className="font-semibold text-xl">Toolkit</h1>
                </div>
                <ThemeToggle />
              </header>
              <div className="flex-grow">
                {children}
              </div>
              <Footer />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
