import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import localfonts from "next/font/local";
import { Providers } from "./provider/ThemeProvider";

const localFont = localfonts({
  src: "./fonts/test.otf",
  variable: "--font-local",
  weight: "400",
})

const localFont2 = localfonts({
  src: "./fonts/reckless.ttf",
  variable: "--font-Reckless",
  weight: "400",
})

const localFont3 = localfonts({
  src: "./fonts/recklessSthin.otf",
  variable: "--font-recklessSthin",
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lightning Lessons",
  description: "Short, free video lessons from people who do the work — reviewed before they're published.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${localFont.variable} ${plusJakartaSans.variable} ${localFont2.variable} ${localFont3.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        </body>
    </html>
  );
}
