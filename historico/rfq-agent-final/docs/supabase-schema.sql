-- ============================================================
-- RFQ Agent — Esquema de base de datos Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ── TABLA: talleres ──────────────────────────────────────────
create table public.talleres (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  nombre          text not null,
  email_owner     text not null,
  email_magico    text not null unique,
  config          jsonb not null default '{}',
  plan            text not null default 'piloto',
  activo          boolean not null default true
);

comment on table public.talleres is 'Clientes del SaaS — talleres mecánicos';
comment on column public.talleres.email_magico is 'Email al que el taller reenvía sus RFQs. Formato: rfq-{slug}@dominio.com';
comment on column public.talleres.config is 'Configuración del taller: precios/hora, márgenes, condiciones comerciales';

-- ── TABLA: rfqs ──────────────────────────────────────────────
create table public.rfqs (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  taller_id       uuid not null references public.talleres(id) on delete cascade,
  email_origen    text not null,
  email_subject   text,
  estado          text not null default 'recibido'
                  check (estado in ('recibido','procesando','completado','error')),
  planos_urls     text[] not null default '{}',
  analisis        jsonb,
  presupuesto     jsonb,
  pdf_url         text,
  tiempo_proc_ms  integer,
  error_log       text
);

comment on table public.rfqs is 'Cada RFQ recibido y procesado';
comment on column public.rfqs.estado is 'recibido → procesando → completado | error';
comment on column public.rfqs.analisis is 'Output de la skill procesar-rfq (JSON estructurado)';
comment on column public.rfqs.presupuesto is 'Output de la skill generar-presupuesto (JSON estructurado)';

-- Índices para queries frecuentes
create index idx_rfqs_taller_id on public.rfqs(taller_id);
create index idx_rfqs_estado on public.rfqs(estado);
create index idx_rfqs_created_at on public.rfqs(created_at desc);

-- ── TABLA: eventos ────────────────────────────────────────────
create table public.eventos (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  rfq_id          uuid not null references public.rfqs(id) on delete cascade,
  tipo            text not null,
  detalle         jsonb
);

comment on table public.eventos is 'Auditoría de cada paso del procesamiento';
comment on column public.eventos.tipo is 'email_recibido | validado | procesado | presupuestado | enviado | error';

create index idx_eventos_rfq_id on public.eventos(rfq_id);

-- ── STORAGE BUCKET ────────────────────────────────────────────
-- Crear el bucket para planos (ejecutar desde Dashboard → Storage)
-- insert into storage.buckets (id, name, public) values ('planos', 'planos', true);

-- ── RLS (Row Level Security) ──────────────────────────────────
-- Habilitar RLS en todas las tablas
alter table public.talleres enable row level security;
alter table public.rfqs enable row level security;
alter table public.eventos enable row level security;

-- Políticas básicas: el service_role tiene acceso total (para la API)
-- Los usuarios autenticados solo ven sus propios datos

create policy "Service role acceso total talleres"
  on public.talleres for all
  using (auth.role() = 'service_role');

create policy "Service role acceso total rfqs"
  on public.rfqs for all
  using (auth.role() = 'service_role');

create policy "Service role acceso total eventos"
  on public.eventos for all
  using (auth.role() = 'service_role');

-- TODO Sprint 3: añadir políticas para usuarios autenticados
-- para que cada taller vea solo sus RFQs en el dashboard
