import type { Metadata } from "next";
import { Space_Grotesk, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mhlaba Matrix | 3D World Navigator",
  description: "Tactical Spatial Interface Overlay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* We expose Cesium logic globally from CDN to bypass massive local file watching crashes in Next.js Turbopack */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cesium.com/downloads/cesiumjs/releases/1.139.1/Build/Cesium/Cesium.js"></script>
        <link rel="stylesheet" href="https://cesium.com/downloads/cesiumjs/releases/1.139.1/Build/Cesium/Widgets/widgets.css" />
        <script dangerouslySetInnerHTML={{
          __html: `window.CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.139.1/Build/Cesium';`
        }}></script>
      </head>
      <body className="min-h-full flex flex-col m-0 p-0 overflow-hidden text-text bg-black font-body">
        {children}
      </body>
    </html>
  );
}
