-- ============================================================================
-- EXPORT / IMPORT data player $TNB Clicker
--
-- Bagian EXPORT: jalankan di Lovable Cloud (View Backend → SQL) untuk
-- mengambil data saat ini.
-- Bagian IMPORT: jalankan di SQL Editor Supabase project baru Anda.
-- ============================================================================

-- ============================================================================
-- EXPORT (Lovable Cloud / database lama)
-- ============================================================================

-- Semua pemain beserta alias-nya (urut skor tertinggi):
select
  p.user_id,
  coalesce(pr.alias, 'anonymous') as alias,
  p.score,
  p.owned,
  p.best_combo,
  p.perfect_taps,
  p.critical_taps,
  p.updated_at,
  p.created_at
from public.players p
left join public.profiles pr on pr.id = p.user_id
order by p.score desc;

-- Versi JSON (mudah disalin sebagai satu nilai):
select jsonb_agg(row_to_json(t)) from (
  select
    p.user_id, coalesce(pr.alias, 'anonymous') as alias, p.score, p.owned,
    p.best_combo, p.perfect_taps, p.critical_taps
  from public.players p
  left join public.profiles pr on pr.id = p.user_id
) t;

-- ============================================================================
-- IMPORT (Supabase project baru)
-- ============================================================================
--
-- PENTING: baris di tabel players/profiles dibuat otomatis oleh fungsi
-- tnb_state() saat pemain login pertama kali di project baru. Karena user_id
-- auth akan berbeda, cara paling aman membawa skor lama adalah:
--
-- 1. Biarkan pemain login ulang di site baru (baris players dibuat otomatis).
-- 2. Petakan alias lama -> user_id baru, lalu pulihkan skor dengan template
--    di bawah ini per pemain:

-- Template pulihkan skor satu pemain (isi nilai dari hasil EXPORT):
-- update public.players
--   set score = 12345,                 -- score lama
--       owned = '{"auto":2}'::jsonb,   -- owned lama
--       best_combo = 40,
--       perfect_taps = 10,
--       critical_taps = 5
--   where user_id = 'USER_ID_BARU';

-- Template import massal lewat staging table (jika pemain belum login ulang
-- dan Anda ingin menyiapkan datanya terlebih dahulu):
--
-- create temporary table tnb_import (
--   user_id uuid, alias text, score bigint, owned jsonb,
--   best_combo int, perfect_taps int, critical_taps int
-- );
-- -- isi tnb_import dengan data hasil EXPORT (copy dari CSV), lalu:
-- insert into public.profiles (id, alias)
--   select user_id, coalesce(alias, 'anonymous') from tnb_import
--   on conflict (id) do update set alias = excluded.alias;
-- insert into public.players (user_id, score, owned, best_combo, perfect_taps, critical_taps)
--   select user_id, score, owned, best_combo, perfect_taps, critical_taps from tnb_import
--   on conflict (user_id) do update set
--     score = excluded.score, owned = excluded.owned,
--     best_combo = excluded.best_combo, perfect_taps = excluded.perfect_taps,
--     critical_taps = excluded.critical_taps;
--
-- Catatan: insert langsung ke players dengan user_id dari project lama hanya
-- berarti jika Anda JUGA membuat ulang auth users dengan id yang sama
-- (memerlukan akses admin/auth di project baru). Umumnya lebih praktis memakai
-- pemetaan alias seperti di atas.
