import type { Metadata } from "next";
import "./globals.css";
import NoTransitionOnNav from "@/components/navbar/NoTransitionOnNav";
import Preloader from "@/components/preloader/Preloader";
import { UserProvider } from "@/contexts/UserContext";

const geistSans = {
  variable: "--font-geist-sans",
};
const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/csh/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: [{ url: "/csh/favicon.svg?v=2", type: "image/svg+xml" }],
  },
  title: "Остаточные знания",
  description: "Сервис для согласования дат сдачи отчетов и получения отчетов по остаточным знаниям",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
              }
              if (localStorage.getItem('sidebarCollapsed') === 'true') {
                document.documentElement.classList.add('sidebar-collapsed');
              }
              document.documentElement.classList.add('no-transition');
              requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                  document.documentElement.classList.remove('no-transition');
                });
              });
            })();
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Preloader />
        <NoTransitionOnNav />
        <div className="bg-gradient"></div>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}