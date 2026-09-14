"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseListo } from "@/lib/supabase";
import { ESTADOS, type Estado, type Libro, type LibroNuevo } from "@/lib/types";
import Acceso from "@/components/Acceso";
import TarjetaLibro from "@/components/TarjetaLibro";
import FichaLibro from "@/components/FichaLibro";
import Numeros from "@/components/Numeros";
import Portada from "@/components/Portada";
import { EstrellasFijas } from "@/components/Estrellas";

type Vista = "estante" | "autores" | "numeros";
type Filtro = Estado | "todos";

const VISTAS: { valor: Vista; etiqueta: string }[] = [
  { valor: "estante", etiqueta: "Estante" },
  { valor: "autores", etiqueta: "Por autor" },
  { valor: "numeros", etiqueta: "Números" },
];

function sinAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function apellido(autor: string) {
  const partes = autor.trim().split(/\s+/);
  return partes.length > 1 ? partes[partes.length - 1] : autor;
}

export default function Pagina() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [revisandoSesion, setRevisandoSesion] = useState(true);

  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>("estante");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [genero, setGenero] = useState<string | null>(null);
  const [ficha, setFicha] = useState<{ abierta: boolean; libro: Libro | null }>({
    abierta: false,
    libro: null,
  });

  useEffect(() => {
    if (!supabaseListo) {
      setRevisandoSesion(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setRevisandoSesion(false);
    });
    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => escucha.subscription.unsubscribe();
  }, []);

  const traerLibros = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .order("creado_el", { ascending: false });
    if (error) setErrorCarga(error.message);
    else {
      setErrorCarga(null);
      setLibros((data ?? []) as Libro[]);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    if (sesion) traerLibros();
  }, [sesion, traerLibros]);

  async function guardar(datos: LibroNuevo) {
    if (!sesion) return;
    if (ficha.libro) {
      const { data, error } = await supabase
        .from("libros")
        .update(datos)
        .eq("id", ficha.libro.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setLibros((ls) => ls.map((l) => (l.id === ficha.libro!.id ? (data as Libro) : l)));
    } else {
      const { data, error } = await supabase
        .from("libros")
        .insert({ ...datos, user_id: sesion.user.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setLibros((ls) => [data as Libro, ...ls]);
    }
    setFicha({ abierta: false, libro: null });
  }

  async function borrar() {
    if (!ficha.libro) return;
    const id = ficha.libro.id;
    const { error } = await supabase.from("libros").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setLibros((ls) => ls.filter((l) => l.id !== id));
    setFicha({ abierta: false, libro: null });
  }

  const leyendo = useMemo(() => libros.filter((l) => l.estado === "leyendo"), [libros]);

  const generos = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const l of libros) for (const g of l.generos) cuenta.set(g, (cuenta.get(g) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [libros]);

  const filtrados = useMemo(() => {
    const texto = sinAcentos(busqueda.trim());
    return libros.filter((l) => {
      if (filtro !== "todos" && l.estado !== filtro) return false;
      if (genero && !l.generos.includes(genero)) return false;
      if (!texto) return true;
      return (
        sinAcentos(l.titulo).includes(texto) ||
        sinAcentos(l.autor).includes(texto) ||
        l.generos.some((g) => sinAcentos(g).includes(texto))
      );
    });
  }, [libros, filtro, genero, busqueda]);

  const porAutor = useMemo(() => {
    const grupos = new Map<string, Libro[]>();
    for (const l of filtrados) {
      const clave = l.autor.trim() || "Sin autor";
      grupos.set(clave, [...(grupos.get(clave) ?? []), l]);
    }
    return [...grupos.entries()].sort((a, b) =>
      apellido(a[0]).localeCompare(apellido(b[0]), "es"),
    );
  }, [filtrados]);

  if (revisandoSesion) {
    return <main className="grid min-h-dvh place-items-center text-humo">Abriendo…</main>;
  }

  if (!supabaseListo) {
    return (
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-libro text-3xl">Falta conectar la base</h1>
        <p className="mt-3 leading-relaxed text-humo">
          Cargá <code className="text-tinta">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-tinta">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en las variables de
          entorno del proyecto y volvé a desplegar.
        </p>
      </main>
    );
  }

  if (!sesion) return <Acceso />;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 sm:px-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-libro text-3xl">Estante</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-humo underline underline-offset-4"
        >
          Salir
        </button>
      </header>

      {leyendo.length > 0 && vista !== "numeros" && (
        <section className="mt-5 rounded-xl border border-borde bg-papel p-4">
          <h2 className="mb-3 text-[13px] font-medium text-humo">
            {leyendo.length === 1 ? "Estás leyendo" : "Estás leyendo"}
          </h2>
          <ul className="flex gap-4 overflow-x-auto">
            {leyendo.map((l) => (
              <li key={l.id} className="flex min-w-[220px] gap-3">
                <button
                  onClick={() => setFicha({ abierta: true, libro: l })}
                  className="flex gap-3 text-left"
                >
                  <span className="h-[72px] w-12 shrink-0 overflow-hidden rounded shadow-tapa">
                    <Portada titulo={l.titulo} autor={l.autor} url={l.portada_url} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-libro text-[15px] leading-snug">{l.titulo}</span>
                    <span className="block truncate text-xs text-humo">{l.autor}</span>
                    {l.empezado_el && (
                      <span className="mt-1 block text-xs text-humo">
                        desde el{" "}
                        {new Date(l.empezado_el + "T12:00:00").toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-6 flex gap-1 border-b border-borde">
        {VISTAS.map((v) => (
          <button
            key={v.valor}
            onClick={() => setVista(v.valor)}
            className={`-mb-px border-b-2 px-3 pb-2.5 pt-1 text-[15px] transition-colors ${
              vista === v.valor
                ? "border-acento text-tinta"
                : "border-transparent text-humo hover:text-tinta"
            }`}
          >
            {v.etiqueta}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {vista === "numeros" ? (
          <Numeros libros={libros} />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título, autor o género"
                className="w-full rounded-lg border border-borde bg-papel px-3 py-2 text-[15px] sm:max-w-xs"
                aria-label="Buscar en el estante"
              />
              <div className="flex gap-1.5 overflow-x-auto">
                {(["todos", ...ESTADOS.map((e) => e.valor)] as Filtro[]).map((f) => {
                  const etiqueta =
                    f === "todos" ? "Todos" : ESTADOS.find((e) => e.valor === f)!.etiqueta;
                  const cantidad =
                    f === "todos" ? libros.length : libros.filter((l) => l.estado === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setFiltro(f)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                        filtro === f
                          ? "bg-tinta text-white"
                          : "border border-borde bg-papel text-humo hover:border-tinta/30"
                      }`}
                    >
                      {etiqueta} <span className="opacity-60">{cantidad}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {generos.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {generos.map(([g, n]) => (
                  <li key={g}>
                    <button
                      onClick={() => setGenero(genero === g ? null : g)}
                      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                        genero === g
                          ? "bg-acento text-white"
                          : "border border-borde bg-papel text-humo hover:text-tinta"
                      }`}
                    >
                      {g} <span className="opacity-60">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {errorCarga && (
              <p className="mt-6 rounded-lg bg-[#FBE9EE] px-3 py-2 text-sm text-[#8C3B52]">
                No se pudieron traer los libros: {errorCarga}
              </p>
            )}

            {cargando ? (
              <p className="py-16 text-center text-humo">Cargando el estante…</p>
            ) : libros.length === 0 ? (
              <div className="py-16 text-center">
                <p className="mx-auto max-w-[32ch] font-libro text-xl leading-relaxed">
                  El estante está vacío. Empezá por el último libro que terminaste.
                </p>
                <button
                  onClick={() => setFicha({ abierta: true, libro: null })}
                  className="mt-5 rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-white"
                >
                  Agregar un libro
                </button>
              </div>
            ) : filtrados.length === 0 ? (
              <p className="py-16 text-center text-humo">
                Ningún libro coincide con esa búsqueda.
              </p>
            ) : vista === "estante" ? (
              <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-6">
                {filtrados.map((l) => (
                  <li key={l.id}>
                    <TarjetaLibro libro={l} onAbrir={() => setFicha({ abierta: true, libro: l })} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 space-y-8">
                {porAutor.map(([autor, suyos]) => (
                  <section key={autor}>
                    <h3 className="flex items-baseline gap-2 border-b border-borde pb-1.5">
                      <span className="font-libro text-xl">{autor}</span>
                      <span className="text-sm text-humo">
                        {suyos.length} {suyos.length === 1 ? "libro" : "libros"}
                      </span>
                    </h3>
                    <ul className="mt-3 space-y-1">
                      {suyos.map((l) => (
                        <li key={l.id}>
                          <button
                            onClick={() => setFicha({ abierta: true, libro: l })}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-papel"
                          >
                            <span className="h-12 w-8 shrink-0 overflow-hidden rounded-sm shadow-tapa">
                              <Portada titulo={l.titulo} url={l.portada_url} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-libro text-[15px]">
                                {l.titulo}
                              </span>
                              <span className="block text-xs text-humo">
                                {ESTADOS.find((e) => e.valor === l.estado)!.etiqueta}
                                {l.anio_publicacion ? ` · ${l.anio_publicacion}` : ""}
                              </span>
                            </span>
                            <EstrellasFijas valor={l.puntuacion} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {vista !== "numeros" && libros.length > 0 && (
        <button
          onClick={() => setFicha({ abierta: true, libro: null })}
          className="fixed bottom-6 right-5 z-40 rounded-full bg-acento px-5 py-3.5 text-sm font-medium text-white shadow-tapa sm:right-8"
        >
          Agregar libro
        </button>
      )}

      {ficha.abierta && (
        <FichaLibro
          key={ficha.libro?.id ?? "nuevo"}
          libro={ficha.libro}
          onGuardar={guardar}
          onBorrar={ficha.libro ? borrar : undefined}
          onCerrar={() => setFicha({ abierta: false, libro: null })}
        />
      )}
    </main>
  );
}
