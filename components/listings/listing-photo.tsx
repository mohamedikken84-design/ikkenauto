import type { BodyType, Listing } from "@/lib/listings/types";

const paint: Record<string, string> = {
  grijs: "#8a8680",
  zwart: "#242424",
  wit: "#f4f0e6",
  blauw: "#1e3a5f",
  rood: "#7f2d2d",
  zilver: "#c5c2ba",
  groen: "#1f3d32",
  geel: "#c4a35a",
  oranje: "#b8612a",
};

const frames = ["zijaanzicht", "driekwart", "achterzijde", "interieur"] as const;

type ListingPhotoProps = {
  listing: Pick<Listing, "make" | "model" | "color" | "body">;
  frame?: number;
  className?: string;
};

function roofLift(body: BodyType) {
  if (body === "suv" || body === "monovolume") return -16;
  if (body === "coupe" || body === "cabrio") return 10;
  return 0;
}

export function ListingPhoto({ listing, frame = 0, className = "" }: ListingPhotoProps) {
  const safeFrame = ((frame % frames.length) + frames.length) % frames.length;
  const fill = paint[listing.color] ?? "#8a8680";
  const stroke = listing.color === "wit" || listing.color === "zilver" ? "#121212" : fill;
  const label = frames[safeFrame];

  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={`${listing.make} ${listing.model}, voorbeeldafbeelding ${label}`}
      className={`h-full w-full bg-[#ebe6dc] ${className}`}
    >
      <rect width="640" height="400" fill="#ebe6dc" />
      <rect x="0" y="0" width="640" height="6" fill="#c4a35a" />
      <text x="32" y="48" fill="#6b5420" fontSize="14" fontFamily="Georgia, serif" letterSpacing="2">
        VOORBEELD · {label.toUpperCase()}
      </text>
      <text x="32" y="86" fill="#121212" fontSize="28" fontFamily="Georgia, serif">
        {listing.make} {listing.model}
      </text>
      {safeFrame === 3 ? (
        <>
          <rect x="70" y="140" width="500" height="180" rx="28" fill="#1a1a1a" />
          <rect x="120" y="175" width="150" height="90" rx="16" fill="#3a342c" />
          <rect x="300" y="175" width="150" height="90" rx="16" fill="#3a342c" />
          <circle cx="250" cy="150" r="22" fill="none" stroke="#c4a35a" strokeWidth="6" />
        </>
      ) : safeFrame === 2 ? (
        <>
          <rect x="170" y="130" width="300" height="140" rx="18" fill={fill} stroke={stroke} strokeWidth="3" />
          <rect x="200" y="155" width="240" height="50" rx="8" fill="#f6f4ef" opacity="0.8" />
          <circle cx="210" cy="250" r="16" fill="#c4a35a" />
          <circle cx="430" cy="250" r="16" fill="#c4a35a" />
        </>
      ) : (
        <g transform={`translate(0 ${roofLift(listing.body)})`}>
          <path
            d="M118 262 L168 214 L230 196 L278 150 L430 146 L492 188 L560 204 L575 262 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="3"
          />
          <path d="M286 158 L360 156 L360 198 L250 202 Z" fill="#f6f4ef" opacity="0.85" />
          <path d="M372 156 L452 152 L486 194 L372 198 Z" fill="#f6f4ef" opacity="0.7" />
          <circle cx="210" cy="262" r="28" fill="#121212" />
          <circle cx="500" cy="262" r="28" fill="#121212" />
          <circle cx="210" cy="262" r="10" fill="#c4a35a" />
          <circle cx="500" cy="262" r="10" fill="#c4a35a" />
        </g>
      )}
      <text x="32" y="360" fill="#5c564c" fontSize="16" fontFamily="sans-serif">
        Geen foto van deze wagen
      </text>
    </svg>
  );
}
