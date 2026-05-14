import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wordle",
    template: "%s · Wordle",
  },
  description: "Guess the daily 5-letter word in six tries.",
  applicationName: "Wordle",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wordle",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Wordle",
    description: "Guess the daily 5-letter word in six tries.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Wordle",
    description: "Guess the daily 5-letter word in six tries.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121213" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeBoot = `
(function() {
  try {
    var raw = localStorage.getItem('wordle-settings');
    var pref = 'dark';
    var hc = false;
    if (raw) {
      var parsed = JSON.parse(raw);
      var st = parsed && parsed.state ? parsed.state : parsed;
      if (st) {
        if (st.theme === 'light' || st.theme === 'dark' || st.theme === 'system') pref = st.theme;
        if (st.highContrast === true) hc = true;
      }
    }
    var resolved = pref;
    if (pref === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-high-contrast', String(hc));
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Inline theme-bootstrap script — runs before paint to avoid FOUC. */}
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
