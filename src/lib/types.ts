export type Estado = "pendiente" | "leyendo" | "leido";

export type Libro = {
  id: string;
  user_id: string;
  titulo: string;
  autor: string;
  portada_url: string | null;
  estado: Estado;
  puntuacion: number | null;
  notas: string | null;
  generos: string[];
  paginas: number | null;
  anio_publicacion: number | null;
  empezado_el: string | null;
  terminado_el: string | null;
  creado_el: string;
};

export type LibroNuevo = Omit<Libro, "id" | "user_id" | "creado_el">;

export const ESTADOS: { valor: Estado; etiqueta: string }[] = [
  { valor: "pendiente", etiqueta: "Por leer" },
  { valor: "leyendo", etiqueta: "Leyendo" },
  { valor: "leido", etiqueta: "Leído" },
];

export function libroVacio(): LibroNuevo {
  return {
    titulo: "",
    autor: "",
    portada_url: null,
    estado: "pendiente",
    puntuacion: null,
    notas: null,
    generos: [],
    paginas: null,
    anio_publicacion: null,
    empezado_el: null,
    terminado_el: null,
  };
}
