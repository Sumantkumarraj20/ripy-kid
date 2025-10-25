'use client'

import { useTheme } from '@/lib/theme-provider'
import { HiSun, HiMoon } from 'react-icons/hi'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm rounded-full relative"
      aria-label="Toggle theme"
    >
      <HiSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <HiMoon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}