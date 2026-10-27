'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

// Bottom sheet di layar kecil, dialog di tengah di layar lebar.
export default function Dialog({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-lg border border-[var(--line)] bg-[var(--surface)] sm:max-w-md sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[var(--line)] py-1 pl-4 pr-1">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
