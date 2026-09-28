import "@pomona/shared/tokens.css";
import "./globals.css";
import type { Metadata } from "next";
import { Jua, Nanum_Gothic } from "next/font/google";

const jua = Jua({ weight: "400", subsets: ["latin"], variable: "--font-jua" });
const nanum = Nanum_Gothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-nanum" });

export const metadata: Metadata = {
  title: "pomona",
  description: "가락시장 도매가와 출하 물량으로 보는 과일 시세",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${jua.variable} ${nanum.variable}`}>
      <body>{children}</body>
    </html>
  );
}
