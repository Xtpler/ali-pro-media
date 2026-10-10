-- OTP storage for forgot-password. Service role only (no public policies).
create table if not exists public.password_reset_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.password_reset_otps enable row level security;

revoke all on table public.password_reset_otps from public, anon, authenticated;
