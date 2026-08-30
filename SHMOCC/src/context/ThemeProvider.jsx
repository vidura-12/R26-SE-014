import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  setDark: () => {},
  setLight: () => {},
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export default function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("theme");

      // User previously selected dark mode
      if (savedTheme === "dark") {
        return true;
      }

      // User previously selected light mode
      if (savedTheme === "light") {
        return false;
      }

      // No saved preference -> use system preference
      return window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
    } catch (error) {
      console.error("Failed to read theme:", error);
      return false;
    }
  });

  // ============================================================
  // APPLY GLOBAL THEME
  // ============================================================

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");

      localStorage.setItem("theme", "dark");

      document.body.style.backgroundColor = "#0a1f11";
      document.body.style.color = "#eafaf0";
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");

      localStorage.setItem("theme", "light");

      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#0f172a";
    }
  }, [isDark]);

  // ============================================================
  // SYSTEM THEME LISTENER
  // ============================================================

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = (event) => {
      const savedTheme = localStorage.getItem("theme");

      // Only follow OS preference if the user
      // has not manually selected a theme.
      if (!savedTheme) {
        setIsDark(event.matches);
      }
    };

    media.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      media.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, []);

  // ============================================================
  // THEME FUNCTIONS
  // ============================================================

  const toggleTheme = () => {
    setIsDark((previous) => !previous);
  };

  const setDark = () => {
    setIsDark(true);
  };

  const setLight = () => {
    setIsDark(false);
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value = {
    isDark,
    toggleTheme,
    setDark,
    setLight,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}