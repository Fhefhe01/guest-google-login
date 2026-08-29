# Migrasi $TNB Clicker ke Supabase Sendiri + Netlify

Panduan lengkap memindahkan game ini dari Lovable Cloud ke Supabase pribadi
dan hosting Netlify. Preview/publish Lovable tetap berfungsi selama proses ini.

---

## Langkah 1 — Buat Project Supabase

1. Buat project baru di supabase.com (region terdekat, mis. Singapore).
2. Setelah project aktif, catat dari **Project Settings → Data API / API Keys**:
   - **Project URL** (mis. `https://abcdefgh.supabase.co`)
   - **Publishable / anon key** (`sb_publishable_...` atau `eyJ...`)

## Langkah 2 — Jalankan Migrasi Database

Repo ini sudah berisi 3 file migrasi lengkap di `supabase/migrations/`:

```
20260829030309_1d8c1d78-...sql   → tabel players, profiles, upgrades + RLS + GRANT
20260829030359_5a86f552-...sql   → fungsi RPC game (tnb_state, tnb_click, tnb_buy,
                                    tnb_leaderboard, tnb_set_alias, tnb_reset,
                                    tnb_state_json, tnb_stats) + seed upgrades
20260829030421_1d16273c-...sql   → penyesuaian lanjutan
```

Jalankan di **SQL Editor** Supabase Anda, satu per satu sesuai urutan nama file
(urutan timestamp menjamin dependensi benar).

Alternatif CLI (jika repo sudah di GitHub/lokal):

```bash
npx supabase link --project-ref <ref-project-anda>
npx supabase db push
```

## Langkah 3 — Aktifkan Provider Auth

Di **Authentication → Sign In / Providers** project Supabase Anda:

1. **Anonymous sign-ins** → aktifkan (wajib untuk tombol "Play as Guest").
2. **Google** → aktifkan, isi Client ID + Client Secret dari Google Cloud
   Console milik Anda (APIs & Services → Credentials → OAuth 2.0 Client ID,
   tipe Web application). Salin **Callback URL** yang ditampilkan Supabase ke
   Authorized redirect URIs di Google.

Di **Authentication → URL Configuration**:
- Site URL: `https://<nama-site-anda>.netlify.app`
- Redirect URLs: tambahkan `https://<nama-site-anda>.netlify.app/**`

## Langkah 4 — Migrasi Data Player (Opsional)

Akun auth (guest/Google) **tidak bisa dipindahkan** antar project — pemain
harus login ulang. Yang bisa dibawa hanya skor dan alias:

1. Jalankan query export di `scripts/export-players.sql` bagian **EXPORT**
   lewat View Backend (Lovable Cloud) → SQL, simpan hasilnya.
2. Ubah hasilnya menjadi pernyataan INSERT memakai template di bagian
   **IMPORT** pada file yang sama, lalu jalankan di SQL Editor Supabase Anda.

Catatan: `user_id` akan berbeda di project baru. Jika ingin mempertahankan
skor pemain lama, petakan alias → user_id baru setelah mereka login ulang,
lalu UPDATE tabel `players`.

## Langkah 5 — Deploy ke Netlify

1. Push repo ke GitHub (Lovable: tombol **GitHub → Connect** lalu transfer).
2. Di Netlify: **Add new site → Import from Git** → pilih repo.
3. Build settings:
   - Build command: `npm run build` (atau `bun run build`)
   - Publish directory: `.output/public` (default Nitro)
4. Di **Site settings → Environment variables**, set:

   | Key | Value |
   |---|---|
   | `NITRO_PRESET` | `netlify` |
   | `VITE_SUPABASE_URL` | Project URL Supabase Anda |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key Anda |
   | `SUPABASE_URL` | Project URL Supabase Anda |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key Anda |

   `NITRO_PRESET=netlify` mengganti target build tanpa mengubah
   `vite.config.ts`, jadi preview Lovable tidak terpengaruh.

## Langkah 6 — Google OAuth Pasca-Export

Login Google saat ini memakai broker Lovable (`lovable.auth.signInWithOAuth`)
yang **hanya berfungsi di hosting Lovable**. Di repo GitHub Anda sendiri,
ganti dua pemanggilan berikut:

- `src/components/AuthGate.tsx`
- `src/routes/index.tsx` (fungsi `linkGoogle`)

dari:

```ts
await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
```

menjadi:

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin },
});
```

Jangan lakukan perubahan ini di dalam editor Lovable — login Google di
preview akan rusak.

## Langkah 7 — Regenerasi Types (Opsional)

Agar `src/integrations/supabase/types.ts` cocok dengan project baru:

```bash
npx supabase gen types typescript --project-id <ref-project-anda> \
  > src/integrations/supabase/types.ts
```

## Checklist Akhir

- [ ] 3 file migrasi berjalan tanpa error di Supabase baru
- [ ] Anonymous + Google provider aktif
- [ ] Guest login berfungsi di site Netlify
- [ ] Google login berfungsi di site Netlify (setelah Langkah 6)
- [ ] Klik, beli upgrade, leaderboard, reset — semua tersimpan ke Supabase baru
- [ ] Data player lama ter-import (jika Langkah 4 dilakukan)
