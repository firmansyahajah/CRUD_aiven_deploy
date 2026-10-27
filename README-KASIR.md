# Kasir (POS) - cara pasang

1. Salin semua file ke project (timpa yang lama):
   schema.sql, setup-db.js, lib/*, app/layout.js, app/page.js, app/globals.css,
   app/api/**, app/components/*, app/hooks/*, app/riwayat/*, app/pengaturan/*
   Setelah itu hapus file lama yang tidak terpakai (lihat daftar di chat).
2. Pasang dependency:
   npm install mysql2 qrcode.react lucide-react
3. Env var yang dipakai lib/db.js dan setup-db.js (isi di .env.local):
   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   File ca.pem tetap di root project.
4. Migrasi: node setup-db.js
5. Tes QRIS: node --test
6. Jalankan: npm run dev
