import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Atom Avatar Studio | AI Video Avatars",
  description: "Create dynamic talking avatars using cutting-edge AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
