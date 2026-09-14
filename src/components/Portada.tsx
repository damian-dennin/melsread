"use client";

const TAPAS = [
  { fondo: "#2E3A6E", texto: "#E8E4F5" },
  { fondo: "#5B4BC4", texto: "#F1EEFF" },
  { fondo: "#2F7D63", texto: "#E6F3EC" },
  { fondo: "#8C3B52", texto: "#FBE9EE" },
  { fondo: "#3F3352", texto: "#EDE6F7" },
  { fondo: "#B07333", texto: "#FCF2E3" },
  { fondo: "#1F5F72", texto: "#E3F1F5" },
];

function tapaPara(texto: string) {
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma = (suma + texto.charCodeAt(i) * (i + 1)) % 9973;
  return TAPAS[suma % TAPAS.length];
}

export default function Portada({
  titulo,
  autor,
  url,
  className = "",
}: {
  titulo: string;
  autor?: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Portada de ${titulo}`}
        loading="lazy"
        className={`h-full w-full bg-borde object-cover ${className}`}
      />
    );
  }

  const tapa = tapaPara(titulo || "sin título");

  return (
    <div
      className={`flex h-full w-full flex-col justify-between p-3 ${className}`}
      style={{ backgroundColor: tapa.fondo, color: tapa.texto }}
      role="img"
      aria-label={`Portada de ${titulo}`}
    >
      <span
        className="font-libro text-[13px] leading-snug"
        style={{ display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {titulo}
      </span>
      {autor ? (
        <span className="truncate text-[10px] opacity-75">{autor}</span>
      ) : null}
    </div>
  );
}
