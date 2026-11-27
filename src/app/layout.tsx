import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { SessionKeepAlive } from "@/components/session-keep-alive";
import { PreferencesProvider } from "@/components/preferences";
import { ReportLanguageBridge } from "@/lib/contexts/language-context";
import { getCurrentUser } from "@/lib/api/auth";
import { readLanguageCookie, readThemeCookie } from "@/lib/preferences";
import { translations } from "@/lib/translations";
import { AppToaster } from "@/components/shell/app-toaster";
import { VisitorBanner } from "@/components/visitor-banner";
import { WorkspaceSync } from "@/components/workspace/workspace-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = readLanguageCookie(cookieStore.get("language")?.value) ?? "pt";
  return {
    title: {
      template: "%s · Riteflow",
      default: "Riteflow",
    },
    description: translations[language].tagline,
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const initialTheme = readThemeCookie(cookieStore.get("theme")?.value);
  const initialLanguage = readLanguageCookie(cookieStore.get("language")?.value);

  return (
    <html
      lang={initialLanguage === "en" ? "en" : "pt-BR"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${initialTheme === "light" ? "" : " dark"}`}
      suppressHydrationWarning
    >
      <body className="app-shell min-h-full text-foreground">
        <PreferencesProvider initialTheme={initialTheme} initialLanguage={initialLanguage}>
          <ReportLanguageBridge>
            <SkipLink />
            <AppToaster />
            {user ? <SessionKeepAlive /> : null}
            <WorkspaceSync enabled={Boolean(user)} />
            <SiteHeader
              user={
                user
                  ? {
                      email: user.email,
                      name: user.name,
                      image: user.image,
                    }
                  : null
              }
            />
            {!user ? <VisitorBanner /> : null}
            {children}
            <SiteFooter />
          </ReportLanguageBridge>
        </PreferencesProvider>
      </body>
    </html>
  );
}
