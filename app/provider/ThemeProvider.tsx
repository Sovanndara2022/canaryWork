"use client"

import { ThemeProvider } from 'next-themes'

// Light by default (bright, education-friendly); dark is opt-in via the
// header toggle and remembered per browser.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
