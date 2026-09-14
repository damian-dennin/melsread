"use client";

import { useMemo, useState } from "react";
import type { Libro } from "@/lib/types";

const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function contar(valores: string[]) {
  const mapa = new Map<string, number>();
  for (const v of valores) {
    const limpio = v.trim();
    if (!limpio) continue;
    mapa.set(limpio, (mapa.get(limpio) ?? 0) + 1);
  }
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}

export default function Numeros({ libros }: { libros: Libro[] }) {
  const terminados = useMemo(
    () => libros.filter((l) => l.estado === "leido" && l.terminado_el),
    [libros],
  );

  const anios = useMemo(() => {
    const set = new Set(terminados.map((l) => l.terminado_el!.slice(0, 4)));
    set.add(String(new Date().getFullYear()));
    return [...set].sort().reverse();
  }, [terminados]);

  const [anio, setAnio] = useState(anios[0]);
  const delAnio = terminados.filter((l) => l.terminado_el!.startsWith(anio));

  const paginas = delAnio.reduce((s, l) => s + (l.paginas ?? 0), 0);
  const puntuados = delAnio.filter((l) => l.puntuacion);
  const promedio = puntuados.length
    ? puntuados.reduce((s, l) => s + (l.puntuacion ?? 0), 0) / puntuados.length
    : null;

  const porMes = MESES.map((_, i) =>
    delAnio.filter((l) => Number(l.terminado_el!.slice(5, 7)) === i + 1).length,
  );
  const tope = Math.max(1, ...porMes);
  const mejorMes = porMes.indexOf(Math.max(...porMes));

  const porPuntuacion = [5, 4, 3, 2, 1].map((n) => ({
    n,
    cantidad: delAnio.filter((l) => l.puntuacion === n).length,
  }));

  const autores = contar(delAnio.map((l) => l.autor)).slice(0, 5);
  const generos = contar(delAnio.flatMap((l) => l.generos)).slice(0, 8);
  const favoritos = delAnio
    .filter((l) => (l.puntuacion ?? 0) >= 4)
    .sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0))
    .slice(0, 5);

  if (terminados.length === 0) {
    return (
      <p className="py-16 text-center text-humo">
        Cuando marques un libro como leído y le pongas la fecha en que lo terminaste, acá aparecen
        los números del año.
      </p>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        {anios.map((a) => (
          <button
            key={a}
            onClick={() => setAnio(a)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              a === anio
                ? "bg-tinta text-white"
                : "border border-borde bg-papel text-humo hover:border-tinta/30"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <p className="max-w-[34ch] font-libro text-[26px] leading-[1.35] sm:text-[32px]">
        {delAnio.length === 0 ? (
          <>Todavía no terminaste ningún libro en {anio}.</>
        ) : (
          <>
            En {anio} terminaste{" "}
            <span className="text-acento">
              {delAnio.length} {delAnio.length === 1 ? "libro" : "libros"}
            </span>
            {paginas > 0 && <>, {paginas.toLocaleString("es-AR")} páginas en total</>}
            {promedio !== null && <>, con un promedio de {promedio.toFixed(1)} estrellas</>}.
          </>
        )}
      </p>

      {delAnio.length > 0 && (
        <>
          <section>
            <h3 className="mb-3 text-sm font-medium text-humo">Mes a mes</h3>
            <div className="flex h-32 items-end gap-1.5">
              {porMes.map((cantidad, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] text-humo">{cantidad || ""}</span>
                  <div
                    className={`w-full rounded-t ${cantidad ? "bg-acento" : "bg-borde"}`}
                    style={{ height: `${Math.max(3, (cantidad / tope) * 100)}%` }}
                    title={`${cantidad} en ${MESES_LARGO[i]}`}
                  />
                  <span className="text-[11px] text-humo">{MESES[i]}</span>
                </div>
              ))}
            </div>
            {porMes[mejorMes] > 0 && (
              <p className="mt-3 text-sm text-humo">
                Tu mejor mes fue {MESES_LARGO[mejorMes]}, con {porMes[mejorMes]}.
              </p>
            )}
          </section>

          {puntuados.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-humo">Cómo los puntuaste</h3>
              <ul className="space-y-1.5">
                {porPuntuacion.map(({ n, cantidad }) => (
                  <li key={n} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-sm text-humo">
                      {n} {n === 1 ? "★" : "★"}
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-borde">
                      <span
                        className="block h-full rounded-full bg-dorado"
                        style={{ width: `${(cantidad / puntuados.length) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 shrink-0 text-right text-sm text-humo">{cantidad}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            {autores.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-medium text-humo">Autores del año</h3>
                <ul className="space-y-2">
                  {autores.map(([autor, cantidad]) => (
                    <li key={autor} className="flex justify-between gap-4 text-[15px]">
                      <span className="truncate font-libro">{autor}</span>
                      <span className="shrink-0 text-humo">{cantidad}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {generos.length > 0 && (
              <section>
                <h3 className="mb-3 text-sm font-medium text-humo">Géneros</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {generos.map(([genero, cantidad]) => (
                    <li
                      key={genero}
                      className="rounded-full border border-borde bg-papel px-2.5 py-1 text-xs"
                    >
                      {genero} <span className="text-humo">{cantidad}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {favoritos.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium text-humo">Los que más te gustaron</h3>
              <ul className="space-y-2">
                {favoritos.map((l) => (
                  <li key={l.id} className="flex justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block truncate font-libro text-[15px]">{l.titulo}</span>
                      <span className="block truncate text-xs text-humo">{l.autor}</span>
                    </span>
                    <span className="shrink-0 text-dorado">{"★".repeat(l.puntuacion ?? 0)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
