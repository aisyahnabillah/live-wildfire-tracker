-- Jalankan di Supabase > SQL Editor
create table if not exists langganan (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null,                       -- ID anonim per perangkat (dibuat di browser)
  email text not null check (char_length(email) <= 120),
  wilayah text[] not null,
  keyakinan text not null check (keyakinan in ('rendah','sedang','tinggi')),
  frp_min int not null default 50 check (frp_min between 0 and 150),
  dibuat timestamptz not null default now()
);
create index if not exists langganan_owner_idx on langganan (owner);
-- RLS aktif TANPA policy: anon key tidak bisa membaca/menulis; hanya service key di server (api/langganan.js).
alter table langganan enable row level security;
