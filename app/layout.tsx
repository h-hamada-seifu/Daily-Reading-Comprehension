import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "N2読解練習",
  description: "毎日のニュース記事で読解力を鍛えよう",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased bg-gray-50 text-gray-900"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        <main className="mx-auto max-w-md min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
