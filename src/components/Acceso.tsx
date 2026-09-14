"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Acceso() {
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError(null);
    setMensaje(null);
    if (!email.trim() || clave.length < 6) {
      setError("Poné tu mail y una contraseña de 6 caracteres o más.");
      return;
    }
    setEnviando(true);
    const credenciales = { email: email.trim(), password: clave };
    const { error: fallo } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword(credenciales)
        : await supabase.auth.signUp(credenciales);
    setEnviando(false);

    if (fallo) {
      setError(fallo.message);
      return;
    }
    if (modo === "crear") {
      setMensaje("Cuenta creada. Si Supabase pide confirmar el mail, revisá tu casilla.");
    }
  }

  const input =
    "w-full rounded-lg border border-borde bg-papel px-3 py-2.5 text-[15px] text-tinta";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="font-libro text-4xl">Estante</h1>
      <p className="mt-2 max-w-[30ch] text-[15px] leading-relaxed text-humo">
        Los libros que leíste, los que estás leyendo y los que vienen después.
      </p>

      <div className="mt-8 space-y-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-humo" htmlFor="email">
            Mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-humo" htmlFor="clave">
            Contraseña
          </label>
          <input
            id="clave"
            type="password"
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            className={input}
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-[#FBE9EE] px-3 py-2 text-sm text-[#8C3B52]">{error}</p>
        )}
        {mensaje && (
          <p className="rounded-lg bg-[#E6F3EC] px-3 py-2 text-sm text-verde">{mensaje}</p>
        )}

        <button
          onClick={enviar}
          disabled={enviando}
          className="w-full rounded-lg bg-acento px-4 py-3 font-medium text-white disabled:opacity-60"
        >
          {enviando ? "Un segundo…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>

        <button
          onClick={() => {
            setModo(modo === "entrar" ? "crear" : "entrar");
            setError(null);
            setMensaje(null);
          }}
          className="w-full py-1 text-sm text-humo underline underline-offset-4"
        >
          {modo === "entrar" ? "Todavía no tengo cuenta" : "Ya tengo cuenta"}
        </button>
      </div>
    </main>
  );
}
