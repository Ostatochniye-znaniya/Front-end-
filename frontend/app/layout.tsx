import type { Metadata } from "next";
// remove next/font imports to avoid turbopack issues
import "./globals.css";

// fonts will be loaded via css @import in globals.css

// keep variables for font families if needed
const geistSans = {
  variable: "--font-geist-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "Остаточные знания",
  description: "Сервис для согласования дат сдачи отчетов и получения отчетов по остаточным знаниям",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
