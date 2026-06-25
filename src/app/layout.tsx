import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import StoreProvider from "@/components/providers/StoreProvider";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "JobGenie - Find Your Perfect Career Match",
  description: "JobGenie connects talented candidates with forward-thinking employers. Whether you're looking for your dream job or the perfect hire, we've got you covered.",
  keywords: ["jobs", "careers", "hiring", "recruitment", "job portal", "employment"],
  authors: [{ name: "JobGenie" }],
  openGraph: {
    title: "JobGenie - Find Your Perfect Career Match",
    description: "JobGenie connects talented candidates with forward-thinking employers.",
    type: "website",
  },
  icons: {
    icon: "/logo.jpg",
  },
};

const fontSans = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <StoreProvider>
          <SWRProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </SWRProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
