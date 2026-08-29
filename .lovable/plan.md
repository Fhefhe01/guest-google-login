# Plan: Migrasi Penuh ke Supabase Sendiri + Deploy Netlify

## Tujuan

Memindahkan $TNB Clicker sepenuhnya dari Lovable Cloud ke infrastruktur milik Anda: database Supabase pribadi + hosting Netlify, tanpa merusak preview Lovable yang sedang berjalan.

## Yang akan saya kerjakan di repo ini

### 1. Paket SQL untuk Supabase Anda (sudah tersedia, tinggal dipakai)
- Folder `supabase/migrations/` berisi 3 file SQL lengkap: tabel (players, profiles, upgrades), RLS policies, GRANT, dan 7 fungsi RPC game (tnb_state, tnb_click, tnb_buy, tnb_leaderboard, tnb_set_alias, tnb_reset, tnb_state_json).
- File-file ini bisa langsung dijalankan berurutan di SQL Editor Supabase project baru Anda — tidak perlu ditulis ulang.

### 2. File panduan migrasi `MIGRATION.md` (baru)
Dokumen langkah-demi-langkah berbahasa Indonesia:
- **Langkah 1 — Buat project Supabase**: buat project di supabase.com, catat Project URL dan anon/publishable key.
- **Langkah 2 — Jalankan 3 file migrasi** di SQL Editor (urutan sesuai nama file).
- **Langkah 3 — Aktifkan provider auth**: Anonymous sign-ins (untuk guest mode) dan Google provider (dengan Client ID/Secret dari Google Cloud Console milik Anda).
- **Langkah 4 — Migrasi data player** (opsional): query SQL untuk export `players` + `profiles` dari Lovable Cloud (via View Backend) sebagai CSV, dan SQL `INSERT`/`COPY` untuk import ke project baru.
- **Langkah 5 — Setup Netlify**:
  - Push repo ke GitHub, import ke Netlify.
  - Build command: `bun run build` (atau `npm run build`), publish directory sesuai output Nitro.
  - Set env `NITRO_PRESET=netlify` — ini mengubah target build tanpa mengubah `vite.config.ts`, sehingga preview Lovable tetap aman.
  - Set env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` (Plus server `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`) menunjuk project Supabase Anda.
- **Langkah 6 — Google OAuth pasca-export**: setelah kode keluar dari Lovable (repo GitHub Anda sendiri), ganti `lovable.auth.signInWithOAuth` di `src/routes/index.tsx` dan `src/components/AuthGate.tsx` menjadi `supabase.auth.signInWithOAuth({ provider: "google" })`, lalu daftarkan redirect URL domain Netlify di Google Cloud Console dan Supabase Auth settings. (Perubahan ini TIDAK saya lakukan sekarang karena akan merusak login Google di preview Lovable.)
- **Langkah 7 — Regenerasi types** (opsional): `npx supabase gen types typescript` menunjuk project baru.

### 3. Skrip export data `scripts/export-players.sql` (baru)
- Query SQL siap pakai untuk mengambil seluruh isi `players` dan `profiles` sebagai CSV/JSON dari View Backend Lovable Cloud, beserta template `INSERT ... ON CONFLICT` untuk import ke Supabase Anda.

## Yang TIDAK berubah

- `vite.config.ts`, `src/integrations/supabase/client.ts`, dan seluruh kode game tetap seperti sekarang — preview dan publish Lovable tetap berfungsi penuh.
- Database Lovable Cloud tetap menjadi sumber data sampai Anda sendiri mengganti env vars di deployment Netlify.
- Perubahan Google OAuth dilakukan oleh Anda setelah export (dijelaskan detail di MIGRATION.md), bukan sekarang.

## Catatan penting

- Data player hanya berpindah jika Anda menjalankan Langkah 4; tanpa itu, pemain mulai dari nol di Supabase baru.
- Auth users (akun guest/Google) TIDAK bisa dipindahkan antar project Supabase — pemain lama harus login ulang; hanya skor/alias yang bisa dibawa lewat import data.
- Setelah deploy Netlify berhasil, versi Lovable tetap bisa dipakai sebagai lingkungan pengembangan.

## Verifikasi

- Build tetap hijau setelah penambahan file dokumen/skrip.
- Isi `MIGRATION.md` dicocokkan dengan skema aktual (tabel + fungsi yang tercantum di database saat ini).
