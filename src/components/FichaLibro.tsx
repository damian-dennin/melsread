"use client";

import { useEffect, useRef, useState } from "react";
import Portada from "./Portada";
import { EstrellasEditables } from "./Estrellas";
import { buscarLibros, sugerenciaALibro, type Sugerencia } from "@/lib/googleBooks";
import { ESTADOS, libroVacio, type Estado, type Libro, type LibroNuevo } from "@/lib/types";

const hoy = () => new Date().toISOString().slice(0, 10);

function aDatos(libro: Libro | null): LibroNuevo {
  if (!libro) return libroVacio();
  const { id, user_id, creado_el, ...resto } = libro;
  return resto;
}

export default function FichaLibro({
  libro,
  onGuardar,
  onBorrar,
  onCerrar,
}: {
  libro: Libro | null;
  onGuardar: (datos: LibroNuevo) => Promise<void>;
  onBorrar?: () => Promise<void>;
  onCerrar: () => void;
}) {
  const [datos, setDatos] = useState<LibroNuevo>(() => aDatos(libro));
  const [consulta, setConsulta] = useState("");
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generoNuevo, setGeneroNuevo] = useState("");
  const [confirmaBorrar, setConfirmaBorrar] = useState(false);
  const esNuevo = libro === null;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("panel-abierto");
    return () => document.body.classList.remove("panel-abierto");
  }, []);

  useEffect(() => {
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onCerrar]);

  // Búsqueda en Google Books con espera para no pedir en cada tecla.
  useEffect(() => {
    if (!esNuevo) return;
    const texto = consulta.trim();
    if (texto.length < 3) {
      setSugerencias([]);
      setBuscando(false);
      setErrorBusqueda(null);
      return;
    }
    const control = new AbortController();
    setBuscando(true);
    const tiempo = setTimeout(() => {
      buscarLibros(texto, control.signal)
        .then((r) => {
          setSugerencias(r);
          setErrorBusqueda(null);
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setSugerencias([]);
          setErrorBusqueda(e instanceof Error ? e.message : "No se pudo buscar.");
        })
        .finally(() => setBuscando(false));
    }, 350);
    return () => {
      clearTimeout(tiempo);
      control.abort();
    };
  }, [consulta, esNuevo]);

  function campo<K extends keyof LibroNuevo>(clave: K, valor: LibroNuevo[K]) {
    setDatos((d) => ({ ...d, [clave]: valor }));
  }

  function elegirEstado(estado: Estado) {
    setDatos((d) => ({
      ...d,
      estado,
      empezado_el: estado !== "pendiente" && !d.empezado_el ? hoy() : d.empezado_el,
      terminado_el: estado === "leido" && !d.terminado_el ? hoy() : d.terminado_el,
    }));
  }

  function tomarSugerencia(s: Sugerencia) {
    setDatos((d) => ({ ...d, ...sugerenciaALibro(s) }));
    setSugerencias([]);
    setConsulta("");
  }

  function agregarGenero() {
    const limpio = generoNuevo.trim();
    if (!limpio) return;
    if (!datos.generos.includes(limpio)) {
      campo("generos", [...datos.generos, limpio]);
    }
    setGeneroNuevo("");
  }

  async function guardar() {
    if (!datos.titulo.trim()) {
      setError("Poné al menos el título del libro.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ ...datos, titulo: datos.titulo.trim(), autor: datos.autor.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
      setGuardando(false);
    }
  }

  const etiqueta = "mb-1.5 block text-[13px] font-medium text-humo";
  const input =
    "w-full rounded-lg border border-borde bg-papel px-3 py-2 text-[15px] text-tinta placeholder:text-humo/60";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-tinta/40 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={esNuevo ? "Agregar libro" : `Editar ${libro?.titulo}`}
        className="panel-entra scroll-fino relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-fondo shadow-tapa sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-borde bg-fondo/95 px-5 py-3 backdrop-blur">
          <h2 className="font-libro text-lg">{esNuevo ? "Agregar un libro" : "Editar"}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg px-2 py-1 text-sm text-humo hover:bg-borde"
          >
            Cerrar
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          {esNuevo && (
            <div>
              <label className={etiqueta} htmlFor="buscar-libro">
                Buscá el libro y se completa solo
              </label>
              <input
                id="buscar-libro"
                className={input}
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Título, autor o ISBN"
                autoComplete="off"
              />
              {buscando && <p className="mt-2 text-xs text-humo">Buscando…</p>}
              {!buscando && errorBusqueda && (
                <p className="mt-2 text-xs text-red-600">{errorBusqueda}</p>
              )}
              {sugerencias.length > 0 && (
                <ul className="mt-2 divide-y divide-borde overflow-hidden rounded-lg border border-borde bg-papel">
                  {sugerencias.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => tomarSugerencia(s)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-fondo"
                      >
                        <span className="h-14 w-10 shrink-0 overflow-hidden rounded">
                          <Portada titulo={s.titulo} url={s.portada_url} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-libro text-[15px]">{s.titulo}</span>
                          <span className="block truncate text-xs text-humo">
                            {s.autor || "Autor desconocido"}
                            {s.anio_publicacion ? `, ${s.anio_publicacion}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <div className="h-[126px] w-[84px] shrink-0 overflow-hidden rounded-md shadow-tapa">
              <Portada titulo={datos.titulo || "…"} autor={datos.autor} url={datos.portada_url} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label className={etiqueta} htmlFor="titulo">
                  Título
                </label>
                <input
                  id="titulo"
                  className={input}
                  value={datos.titulo}
                  onChange={(e) => campo("titulo", e.target.value)}
                />
              </div>
              <div>
                <label className={etiqueta} htmlFor="autor">
                  Autor
                </label>
                <input
                  id="autor"
                  className={input}
                  value={datos.autor}
                  onChange={(e) => campo("autor", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <span className={etiqueta}>Estado</span>
            <div className="flex gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  onClick={() => elegirEstado(e.valor)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    datos.estado === e.valor
                      ? "border-acento bg-acento text-white"
                      : "border-borde bg-papel text-humo hover:border-acento/40"
                  }`}
                >
                  {e.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={etiqueta}>Puntuación</span>
            <EstrellasEditables valor={datos.puntuacion} onChange={(v) => campo("puntuacion", v)} />
          </div>

          <div>
            <label className={etiqueta} htmlFor="genero">
              Géneros y etiquetas
            </label>
            {datos.generos.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {datos.generos.map((g) => (
                  <li key={g}>
                    <button
                      type="button"
                      onClick={() => campo("generos", datos.generos.filter((x) => x !== g))}
                      className="rounded-full border border-borde bg-papel px-2.5 py-1 text-xs text-tinta hover:border-acento hover:text-acento"
                      aria-label={`Quitar ${g}`}
                    >
                      {g} <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                id="genero"
                className={input}
                value={generoNuevo}
                onChange={(e) => setGeneroNuevo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    agregarGenero();
                  }
                }}
                placeholder="Novela, ensayo, policial…"
              />
              <button
                type="button"
                onClick={agregarGenero}
                className="shrink-0 rounded-lg border border-borde bg-papel px-3 text-sm text-tinta hover:border-acento"
              >
                Sumar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={etiqueta} htmlFor="empezado">
                Empecé
              </label>
              <input
                id="empezado"
                type="date"
                className={input}
                value={datos.empezado_el ?? ""}
                onChange={(e) => campo("empezado_el", e.target.value || null)}
              />
            </div>
            <div>
              <label className={etiqueta} htmlFor="terminado">
                Terminé
              </label>
              <input
                id="terminado"
                type="date"
                className={input}
                value={datos.terminado_el ?? ""}
                onChange={(e) => campo("terminado_el", e.target.value || null)}
              />
            </div>
            <div>
              <label className={etiqueta} htmlFor="paginas">
                Páginas
              </label>
              <input
                id="paginas"
                type="number"
                min={1}
                className={input}
                value={datos.paginas ?? ""}
                onChange={(e) => campo("paginas", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className={etiqueta} htmlFor="anio">
                Año
              </label>
              <input
                id="anio"
                type="number"
                className={input}
                value={datos.anio_publicacion ?? ""}
                onChange={(e) =>
                  campo("anio_publicacion", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div>
            <label className={etiqueta} htmlFor="notas">
              Lo que me dejó
            </label>
            <textarea
              id="notas"
              rows={5}
              className={`${input} resize-y font-libro leading-relaxed`}
              value={datos.notas ?? ""}
              onChange={(e) => campo("notas", e.target.value || null)}
              placeholder="Frases, sensaciones, a quién se lo recomendarías."
            />
          </div>

          <div>
            <label className={etiqueta} htmlFor="portada">
              Link de la portada
            </label>
            <input
              id="portada"
              className={input}
              value={datos.portada_url ?? ""}
              onChange={(e) => campo("portada_url", e.target.value || null)}
              placeholder="Se completa sola al buscar el libro"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[#FBE9EE] px-3 py-2 text-sm text-[#8C3B52]">{error}</p>
          )}
        </div>

        <footer className="sticky bottom-0 flex items-center gap-3 border-t border-borde bg-fondo/95 px-5 py-3 backdrop-blur">
          {!esNuevo && onBorrar && (
            <button
              type="button"
              onClick={async () => {
                if (!confirmaBorrar) return setConfirmaBorrar(true);
                await onBorrar();
              }}
              className="rounded-lg px-3 py-2 text-sm text-[#8C3B52] hover:bg-[#FBE9EE]"
            >
              {confirmaBorrar ? "Sí, borrar" : "Borrar"}
            </button>
          )}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="ml-auto rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {guardando ? "Guardando…" : esNuevo ? "Sumar al estante" : "Guardar cambios"}
          </button>
        </footer>
      </div>
    </div>
  );
}
