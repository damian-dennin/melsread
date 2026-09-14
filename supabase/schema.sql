-- Estante — esquema de la base de datos
-- Pegá todo esto en Supabase → SQL Editor → Run

create table if not exists public.libros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  autor text not null default '',
  portada_url text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'leyendo', 'leido')),
  puntuacion smallint check (puntuacion between 1 and 5),
  notas text,
  generos text[] not null default '{}',
  paginas int,
  anio_publicacion int,
  empezado_el date,
  terminado_el date,
  creado_el timestamptz not null default now()
);

create index if not exists libros_user_idx on public.libros (user_id);
create index if not exists libros_autor_idx on public.libros (user_id, autor);

alter table public.libros enable row level security;

-- Cada persona ve y edita solamente sus propios libros.
drop policy if exists "libros propios" on public.libros;
create policy "libros propios" on public.libros
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
