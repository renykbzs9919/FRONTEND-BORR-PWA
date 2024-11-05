"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Topheader from "@/components/Topheader";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import Cookies from "js-cookie";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
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
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
              </div>
            </div>
            <Footer />
          </>
        )}
        {!isLoggedIn && (
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        )}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
