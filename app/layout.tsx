import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Shree ? Marathi Voice Assistant",
  description: "Calm, confident Marathi voice companion for mindset and habits.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mr">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <h1>Shree</h1>
            <p className="tag">???? ????? ?????? ????</p>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">? {new Date().getFullYear()} Shree</footer>
        </div>
      </body>
    </html>
  );
}
