"use client";

const TAMANOS = { sm: 13, md: 18, lg: 26 } as const;

function Estrella({ llena, px }: { llena: boolean; px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={llena ? "#C8922E" : "none"}
      stroke={llena ? "#C8922E" : "#B7B0C8"}
      strokeWidth={1.6}
      strokeLinejoin="round"
    >
      <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z" />
    </svg>
  );
}

export function EstrellasFijas({
  valor,
  tamano = "sm",
}: {
  valor: number | null;
  tamano?: keyof typeof TAMANOS;
}) {
  if (!valor) return null;
  const px = TAMANOS[tamano];
  return (
    <span className="inline-flex gap-[2px]" aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrella key={n} llena={n <= valor} px={px} />
      ))}
    </span>
  );
}

export function EstrellasEditables({
  valor,
  onChange,
}: {
  valor: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(valor === n ? null : n)}
          className="rounded p-1 transition-transform hover:scale-110"
          aria-pressed={valor === n}
          aria-label={`Puntuar con ${n}`}
        >
          <Estrella llena={valor !== null && n <= valor} px={TAMANOS.lg} />
        </button>
      ))}
      {valor !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-humo underline underline-offset-2"
        >
          Quitar
        </button>
      )}
    </div>
  );
}
