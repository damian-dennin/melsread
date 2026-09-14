import { NextResponse } from "next/server";

/**
 * Proxy server-side a Google Books. Cachea cada búsqueda una hora para no
 * repetir la misma consulta contra Google (fuente principal de los 429) y,
 * si hay GOOGLE_BOOKS_API_KEY configurada, la suma para tener más cuota que
 * el límite compartido y sin clave.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json({ items: [] });
  }

  const params = new URLSearchParams({ maxResults: "12", printType: "books", q });
  const clave = process.env.GOOGLE_BOOKS_API_KEY;
  if (clave) params.set("key", clave);

  const respuesta = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
    next: { revalidate: 3600 },
  });

  if (respuesta.status === 429) {
    return NextResponse.json(
      { error: "Google Books está limitando las búsquedas. Esperá unos segundos e intentá de nuevo." },
      { status: 429 },
    );
  }
  if (!respuesta.ok) {
    return NextResponse.json({ error: "No se pudo buscar en Google Books." }, { status: 502 });
  }

  const datos = await respuesta.json();
  return NextResponse.json(datos);
}
