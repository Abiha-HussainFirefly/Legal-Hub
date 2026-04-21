"use client";

import { useEffect } from "react";
import { applyTheme, readStoredTheme } from "@/lib/theme";

export default function ThemeInitializer() {
  useEffect(() => {
    const mode = readStoredTheme();
    applyTheme(mode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (readStoredTheme() === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  return null;
}
