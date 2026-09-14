import type { LibroNuevo } from "./types";

type Volumen = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    categories?: string[];
    pageCount?: number;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
};

export type Sugerencia = {
  id: string;
  titulo: string;
  autor: string;
  portada_url: string | null;
  generos: string[];
  paginas: number | null;
  anio_publicacion: number | null;
};

function portadaGrande(url?: string): string | null {
  if (!url) return null;
  return url
    .replace(/^http:/, "https:")
    .replace("&edge=curl", "")
    .replace("zoom=1", "zoom=2");
}

/** Busca libros vía nuestro endpoint (cachea y evita pegarle directo a Google desde el navegador). */
export async function buscarLibros(
  consulta: string,
  signal?: AbortSignal,
): Promise<Sugerencia[]> {
  const texto = consulta.trim();
  if (texto.length < 3) return [];

  const respuesta = await fetch(`/api/books/search?q=${encodeURIComponent(texto)}`, { signal });

  if (respuesta.status === 429) {
    throw new Error("Demasiadas búsquedas seguidas. Esperá unos segundos e intentá de nuevo.");
  }
  if (!respuesta.ok) throw new Error("No se pudo buscar en Google Books");

  const datos = (await respuesta.json()) as { items?: Volumen[] };
  const items = datos.items ?? [];

  return items.map((item) => {
    const info = item.volumeInfo ?? {};
    const anio = info.publishedDate?.slice(0, 4);
    return {
      id: item.id,
      titulo: info.title ?? "Sin título",
      autor: (info.authors ?? []).join(", "),
      portada_url: portadaGrande(info.imageLinks?.thumbnail),
      generos: (info.categories ?? []).slice(0, 3),
      paginas: info.pageCount ?? null,
      anio_publicacion: anio && /^\d{4}$/.test(anio) ? Number(anio) : null,
    };
  });
}

export function sugerenciaALibro(s: Sugerencia): Partial<LibroNuevo> {
  return {
    titulo: s.titulo,
    autor: s.autor,
    portada_url: s.portada_url,
    generos: s.generos,
    paginas: s.paginas,
    anio_publicacion: s.anio_publicacion,
  };
}
