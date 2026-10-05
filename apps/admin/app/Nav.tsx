"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

/** 화면을 만들 때마다 여기에 더한다(배치 관리 · 품종 매핑) */
const LINKS = [{ href: "/reviews", label: "리뷰" }];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname.startsWith(link.href) ? styles.navCurrent : styles.navLink}
          aria-current={pathname.startsWith(link.href) ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
