"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

const LINKS = [
  { href: "/batch", label: "배치 관리" },
  { href: "/reviews", label: "리뷰" },
  { href: "/mappings", label: "품종 매핑" },
];

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
