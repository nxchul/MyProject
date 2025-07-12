"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/mpw", label: "MPW" },
  { href: "/pdk", label: "PDK" },
  { href: "/services", label: "Services" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/60 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-lg text-slate-800">
          YNS
        </Link>
        <ul className="flex space-x-4 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "rounded px-2 py-1 hover:text-slate-900",
                  pathname === item.href && "text-slate-900 underline"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}