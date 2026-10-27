'use client';

import { useState } from 'react';
import MenuGrid from './components/MenuGrid';
import MenuForm from './components/MenuForm';
import Cart, { CartBar } from './components/Cart';
import PaymentDialog from './components/PaymentDialog';

export default function Home() {
  const [form, setForm] = useState(null); // null = tertutup, { product } = terbuka
  const [payOpen, setPayOpen] = useState(false);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-28 pt-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-6">
      <MenuGrid onAdd={() => setForm({ product: null })} onEdit={(product) => setForm({ product })} />
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <Cart onPay={() => setPayOpen(true)} />
        </div>
      </aside>
      <CartBar onPay={() => setPayOpen(true)} />
      <MenuForm open={form !== null} product={form?.product ?? null} onClose={() => setForm(null)} />
      <PaymentDialog open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  );
}
