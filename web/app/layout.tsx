import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Ceres Conecta Hub — Controle Operacional",
  description: "Sistema de controle operacional de máquinas, veículos e operadores para operações de campo rurais.",
  keywords: ["controle operacional", "máquinas agrícolas", "gestão de frota", "operadores"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
