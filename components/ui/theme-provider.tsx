"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "./button"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

// Script to prevent flash of wrong theme
const themeScript = `
  let isDarkMode = false;
  try {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      isDarkMode = true;
    } else if (theme === "system") {
      isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  } catch (err) {}
  document.documentElement.classList.toggle("dark", isDarkMode);
`;

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only set the actual theme on the client side once mounted
    const storedTheme = localStorage.getItem(storageKey) as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    } else if (defaultTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
    setMounted(true)
  }, [defaultTheme, storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.add(prefersDark ? "dark" : "light")
    } else {
      root.classList.add(theme)
    }
    
    localStorage.setItem(storageKey, theme)
  }, [theme, mounted, storageKey])

  // Handle system preference changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      const root = window.document.documentElement
      const isDark = mediaQuery.matches
      
      root.classList.remove("light", "dark")
      root.classList.add(isDark ? "dark" : "light")
    }
    
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  // Insert script into document head to prevent flash of wrong theme
  useEffect(() => {
    // Insert the script once when the component mounts
    if (!document.getElementById("theme-script")) {
      const script = document.createElement("script")
      script.id = "theme-script"
      script.textContent = themeScript
      document.head.appendChild(script)
    }
  }, [])
  
  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return context
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </Button>
  )
}