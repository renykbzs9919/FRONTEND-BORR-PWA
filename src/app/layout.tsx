import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./ClientLayout"; // Importar el componente con `use client`

const inter = Inter({ subsets: ["latin"] });

// Exportación de metadatos
export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Embutidos Mardely",
  description: "Embutidos Mardely",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Llamar al componente que maneja la lógica del cliente */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
