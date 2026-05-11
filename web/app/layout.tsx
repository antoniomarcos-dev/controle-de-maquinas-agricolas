import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ConnectivityProvider } from "@/lib/connectivity";
import ConnectivityIndicator from "@/components/layout/ConnectivityIndicator";
import SyncManagerProvider from "@/components/layout/SyncManagerProvider";
import ServiceWorkerRegistration from "@/components/layout/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Ceres Conecta Hub — Controle Operacional",
  description: "Sistema de controle operacional de máquinas, veículos e operadores para operações de campo rurais.",
  keywords: ["controle operacional", "máquinas agrícolas", "gestão de frota", "operadores"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ceres Conecta",
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ConnectivityProvider>
          <AuthProvider>
            <SyncManagerProvider />
            <ServiceWorkerRegistration />
            <ConnectivityIndicator />
            {children}
          </AuthProvider>
        </ConnectivityProvider>
      </body>
    </html>
  );
}
