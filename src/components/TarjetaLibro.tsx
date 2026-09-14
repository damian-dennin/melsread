"use client";

import Portada from "./Portada";
import { EstrellasFijas } from "./Estrellas";
import type { Libro } from "@/lib/types";

const MARCA: Record<Libro["estado"], { color: string; texto: string } | null> = {
  leido: { color: "#2F7D63", texto: "Leído" },
  leyendo: { color: "#5B4BC4", texto: "Leyendo" },
  pendiente: null,
};

export default function TarjetaLibro({
  libro,
  onAbrir,
}: {
  libro: Libro;
  onAbrir: () => void;
}) {
  const marca = MARCA[libro.estado];

  return (
    <button onClick={onAbrir} className="group block w-full text-left">
      <span className="relative block aspect-[2/3] overflow-hidden rounded-md shadow-tapa">
        <Portada titulo={libro.titulo} autor={libro.autor} url={libro.portada_url} />
        {marca && (
          <span
            className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white/85"
            style={{ backgroundColor: marca.color }}
            title={marca.texto}
          />
        )}
        {libro.estado === "pendiente" && (
          <span className="absolute inset-x-0 bottom-0 bg-tinta/70 py-1 text-center text-[10px] text-white">
            Por leer
          </span>
        )}
      </span>
      <span className="mt-2 block font-libro text-[14px] leading-snug text-tinta group-hover:text-acento">
        {libro.titulo}
      </span>
      <span className="mt-0.5 block truncate text-[12px] text-humo">{libro.autor}</span>
      <span className="mt-1 block">
        <EstrellasFijas valor={libro.puntuacion} />
      </span>
    </button>
  );
}
