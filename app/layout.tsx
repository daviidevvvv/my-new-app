import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GymCut Companion",
  description: "Dashboard MVP per GymCut Companion"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
