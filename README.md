# Estante

App personal para llevar registro de libros leídos, en curso y pendientes: puntuación con
estrellas, notas propias, géneros, fechas de lectura, vista por autor y números del año.

Next.js 15 (App Router) + TypeScript + Tailwind + Supabase. Las portadas y los datos del libro se
completan solos buscando en Google Books (no hace falta clave de API, aunque conviene una para no
toparse con el límite de búsquedas — ver el paso 2).

---

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com), creá una cuenta y un proyecto nuevo.
2. Andá a **SQL Editor**, pegá todo el contenido de `supabase/schema.sql` y dale **Run**.
   Eso crea la tabla `libros` y las reglas de seguridad (cada cuenta ve solo sus libros).
3. Andá a **Project Settings → API** y copiá dos cosas:
   - `Project URL`
   - `anon public` key

> La `anon key` está pensada para ir en el navegador. Lo que protege los datos es la política de
> RLS del paso 2. La `service_role` key nunca va en esta app.

### Para no tener que confirmar el mail

En **Authentication → Sign In / Providers → Email**, desactivá *Confirm email*. Así tu novia crea
la cuenta desde la app y entra en el momento. Si lo dejás activado, va a tener que abrir el link
que le llega por correo antes del primer ingreso.

## 2. Probarlo en tu compu

```bash
cp .env.local.example .env.local   # y pegá adentro la URL y la anon key
npm install
npm run dev
```

Abrí http://localhost:3000, creá la cuenta y cargá un libro.

### Si la búsqueda de libros tira "Too Many Requests" (429)

Google Books sin clave usa una cuota anónima baja y compartida por IP, así que se agota rápido
(sobre todo en redes compartidas o en desarrollo). La app ya cachea cada búsqueda una hora para
pedir menos, pero la solución de fondo es sacar una clave gratis:

1. [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) →
   creá un proyecto (o usá uno existente) → **Create Credentials → API key**.
2. Habilitá la **Books API** para ese proyecto (**APIs & Services → Library**).
3. Pegá la clave en `.env.local` como `GOOGLE_BOOKS_API_KEY` (sin `NEXT_PUBLIC_`: solo se usa
   desde el servidor, nunca llega al navegador). En Vercel, cargala en **Environment Variables**.

## 3. Subirlo a Vercel

1. Subí la carpeta a un repo de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo.
3. En **Environment Variables** cargá las dos:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy**. No hay que tocar nada más: Vercel detecta Next.js solo.

Si te olvidás de las variables, la app arranca igual y te avisa en pantalla qué falta. Después de
cargarlas hay que volver a desplegar (**Deployments → ⋯ → Redeploy**).

## Cómo se usa

- **Agregar libro**: escribís el título en el buscador y se completan autor, portada, páginas, año
  y género. También podés cargar todo a mano.
- **Estado**: al marcar *Leyendo* se pone sola la fecha de inicio, y al marcar *Leído* la de fin.
  Esas fechas son las que alimentan la pestaña **Números**.
- **Por autor**: agrupa el estante por autor, ordenado por apellido, y respeta el buscador y los
  filtros que tengas puestos.
- **Géneros**: los que vienen de Google Books suelen estar en inglés; se pueden borrar y escribir
  los propios.

## Estructura

```
src/app/page.tsx             pantalla principal: sesión, filtros y las tres vistas
src/components/Acceso.tsx    ingreso y alta de cuenta
src/components/FichaLibro.tsx panel para agregar y editar
src/components/Numeros.tsx   estadísticas del año
src/app/api/books/search     proxy a Google Books (cachea y suma la API key si hay)
src/lib/googleBooks.ts       búsqueda de títulos y portadas
src/lib/supabase.ts          cliente de la base
supabase/schema.sql          tabla y políticas de seguridad
```

## Ideas para después

- Botón de exportar a JSON o CSV para tener un respaldo propio.
- Compartir un estante en modo lectura con un link público.
- Meta de lectura anual con barra de progreso en la pestaña Números.
