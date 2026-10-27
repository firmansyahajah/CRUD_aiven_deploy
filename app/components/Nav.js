'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ReceiptText } from 'lucide-react';

const links = [
  { href: '/', label: 'Kasir', Icon: Store },
  { href: '/riwayat', label: 'Riwayat', Icon: ReceiptText },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        
        {/* Nama Toko di-hardcode di sini */}
        <span className="truncate font-semibold">Kasir</span>
        
        <nav className="flex gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm font-medium ${
                  active ? 'bg-[var(--accent)] text-white' : 'hover:bg-[#eeeae0]'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}