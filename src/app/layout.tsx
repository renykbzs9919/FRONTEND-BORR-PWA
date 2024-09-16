"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Topheader from "@/components/Topheader";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Cookies from "js-cookie";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
  title = "Mi PWA Next.js", // Título por defecto
}: {
  children: React.ReactNode;
  title?: string; // Añadir título como prop opcional
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>{title}</title> {/* Aquí se renderiza el título */}
        <meta name="application-name" content="Mi PWA Next.js" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mi PWA Next.js" />
        <meta name="description" content="Una PWA creada con Next.js" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            {isLoggedIn && (
              <>
                <div className="sticky top-0 z-50">
                  <Topheader toggleSidebar={toggleSidebar} />
                </div>
                <div className="flex flex-1 relative">
                  <aside
                    className={`${
                      isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } fixed inset-y-0 left-0 z-40 w-64 bg-background transition-transform duration-300 ease-in-out md:translate-x-0 md:static`}
                  >
                    <Sidebar />
                  </aside>
                  <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                      {children}
                    </main>
                  </div>
                </div>
                <Footer />
              </>
            )}
            {!isLoggedIn && (
              <main className="flex-1 p-4 md:p-6 overflow-auto">
                {children}
              </main>
            )}
          </div>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={toggleSidebar}
            ></div>
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
