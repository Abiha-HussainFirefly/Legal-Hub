"use client";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./ui/toast/toast-context";
import ToastMessages from "./ui/toast/toast-messages";
import ThemeInitializer from "./ThemeInitializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInitializer />
      <ToastProvider>
        {children}
        <ToastMessages />
      </ToastProvider>
    </SessionProvider>
  );
}
