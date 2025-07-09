"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props} defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      {children}
    </NextThemesProvider>
  )
}
