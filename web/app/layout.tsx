import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import Providers from "./providers";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "ComfyUI Launcher",
  description: "Run & share ComfyUI workflows with zero setup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  return (
    <Providers>
      <StoreProvider>
        <html lang="en">
          <body className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
          >{children}</body>
        </html>
      </StoreProvider>
    </Providers>
  );
}
