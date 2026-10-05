import "@pomona/shared/tokens.css";
import "./globals.css";
import type { Metadata } from "next";
import { Jua, Nanum_Gothic } from "next/font/google";
import styles from "./layout.module.css";
import { Nav } from "./Nav";

const jua = Jua({ weight: "400", subsets: ["latin"], variable: "--font-jua" });
const nanum = Nanum_Gothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-nanum" });

export const metadata: Metadata = {
  title: "pomona 백오피스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${jua.variable} ${nanum.variable}`}>
      <body>
        <header className={styles.header}>
          <span className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="15" cy="17" r="10" fill="#cfe6b8" stroke="#5e9a5a" strokeWidth="2" />
              <path d="M15 7 C15 4 17 2 20 1" fill="none" stroke="#5e9a5a" strokeWidth="2" strokeLinecap="round" />
            </svg>
            pomona 백오피스
          </span>
          <Nav />
          {/* 로컬 백엔드와 운영 데이터(WireGuard 너머)를 바꿔 쓰므로 지금 어디에 쓰는지 늘 보이게 둔다 */}
          <span className={styles.backend}>백엔드 {process.env.BACKEND_URL}</span>
        </header>
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
