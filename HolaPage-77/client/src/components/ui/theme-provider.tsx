import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ActualTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [actualTheme, setActualTheme] = useState<ActualTheme>("dark");

  // Get system preference
  const getSystemTheme = (): ActualTheme => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  useEffect(() => {
    // Load stored theme preference
    const stored = localStorage.getItem("theme") as Theme;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    // Determine actual theme to apply
    let newActualTheme: ActualTheme;
    
    if (theme === "system") {
      newActualTheme = getSystemTheme();
      
      // Listen to system changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        if (theme === "system") {
          const systemTheme = getSystemTheme();
          setActualTheme(systemTheme);
        }
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      newActualTheme = theme as ActualTheme;
    }
    
    setActualTheme(newActualTheme);
  }, [theme]);

  useEffect(() => {
    // Apply theme to DOM
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
    localStorage.setItem("theme", theme);
  }, [theme, actualTheme]);

  const toggleTheme = () => {
    setTheme(actualTheme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
