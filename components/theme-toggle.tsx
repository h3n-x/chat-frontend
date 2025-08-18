"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

/**
 * Theme toggle component with glassmorphism styling
 *
 * Features:
 * - Smooth transitions between light and dark themes
 * - Animated icon switching with rotation effects
 * - Glassmorphism button styling with hover effects
 * - Accessibility support with screen reader text
 * - Hydration-safe rendering
 *
 * @returns {JSX.Element} Theme toggle button component
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  /** Prevents hydration mismatch by waiting for client-side mounting */
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="glass hover:glass-strong transition-all duration-300 hover:scale-105"
      >
        <div className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="glass hover:glass-strong transition-all duration-300 hover:scale-105 group"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 group-hover:text-primary" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 group-hover:text-primary" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
