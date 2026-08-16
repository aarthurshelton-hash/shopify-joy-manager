/**
 * Resolution-independent SVG hero background.
 * Renders a chess-themed abstract grid with the En Pensent brand palette.
 * Always sharp at any screen size — no raster upscaling artifacts.
 */

export function HeroBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* Deep obsidian gradient base */}
        <radialGradient id="bg-base" cx="0.5" cy="0.35" r="0.9">
          <stop offset="0%" stopColor="#10131B" />
          <stop offset="50%" stopColor="#0B0D12" />
          <stop offset="100%" stopColor="#06070A" />
        </radialGradient>

        {/* Gold glow for the central area */}
        <radialGradient id="gold-glow" cx="0.5" cy="0.4" r="0.35">
          <stop offset="0%" stopColor="#F2B01E" stopOpacity="0.12" />
          <stop offset="40%" stopColor="#D99A12" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#F2B01E" stopOpacity="0" />
        </radialGradient>

        {/* Subtle blue accent glow */}
        <radialGradient id="blue-glow" cx="0.15" cy="0.8" r="0.3">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>

        {/* Red accent glow */}
        <radialGradient id="red-glow" cx="0.85" cy="0.75" r="0.25">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>

        {/* Grid pattern — chess board inspired */}
        <pattern id="chess-grid" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="none" />
          <rect x="0" y="0" width="60" height="60" fill="#12151D" opacity="0.4" />
          <rect x="60" y="60" width="60" height="60" fill="#12151D" opacity="0.4" />
          <rect x="60" y="0" width="60" height="60" fill="#171B25" opacity="0.3" />
          <rect x="0" y="60" width="60" height="60" fill="#171B25" opacity="0.3" />
        </pattern>

        {/* Fine grid overlay */}
        <pattern id="fine-grid" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
          <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#2A2F3C" strokeWidth="0.3" opacity="0.5" />
        </pattern>

        {/* Diagonal lines for dynamic flow */}
        <linearGradient id="diag-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2B01E" stopOpacity="0" />
          <stop offset="50%" stopColor="#F2B01E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F2B01E" stopOpacity="0" />
        </linearGradient>

        {/* Blur filter for glow elements */}
        <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      {/* Base gradient */}
      <rect width="1920" height="1080" fill="url(#bg-base)" />

      {/* Chess grid pattern — large, faded */}
      <rect width="1920" height="1080" fill="url(#chess-grid)" opacity="0.3" />

      {/* Fine grid overlay */}
      <rect width="1920" height="1080" fill="url(#fine-grid)" opacity="0.4" />

      {/* Diagonal flow lines */}
      <line x1="-200" y1="200" x2="2120" y2="1280" stroke="url(#diag-line)" strokeWidth="2" />
      <line x1="-200" y1="500" x2="2120" y2="1580" stroke="url(#diag-line)" strokeWidth="1.5" opacity="0.6" />
      <line x1="-200" y1="800" x2="2120" y2="1880" stroke="url(#diag-line)" strokeWidth="1" opacity="0.4" />

      {/* Glowing orbs */}
      <circle cx="960" cy="400" r="300" fill="url(#gold-glow)" filter="url(#soft-blur)" />
      <circle cx="200" cy="850" r="200" fill="url(#blue-glow)" filter="url(#soft-blur)" />
      <circle cx="1700" cy="750" r="180" fill="url(#red-glow)" filter="url(#soft-blur)" />

      {/* Abstract chess piece silhouettes — knight and bishop outlines */}
      <g opacity="0.04" fill="#F2B01E" transform="translate(1400, 250) scale(3.5)">
        {/* Knight silhouette */}
        <path d="M 22 10 C 32.5 10 27.5 90 22.5 90 L 12.5 90 C 7.5 90 2.5 50 7.5 45 C 12.5 40 17.5 35 17.5 30 C 17.5 25 12.5 20 17.5 15 C 20 12.5 20 10 22 10 Z M 20 95 L 25 95 L 25 100 L 20 100 Z" />
      </g>

      <g opacity="0.03" fill="#3B82F6" transform="translate(300, 600) scale(3)">
        {/* Bishop silhouette */}
        <path d="M 12 2 C 16 2 16 8 16 8 C 16 12 14 14 14 18 C 14 22 18 24 18 28 L 18 32 L 6 32 L 6 28 C 6 24 10 22 10 18 C 10 14 8 12 8 8 C 8 8 8 2 12 2 Z M 5 34 L 19 34 L 19 40 L 5 40 Z" />
      </g>

      {/* Subtle vignette */}
      <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.7">
        <stop offset="60%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
      </radialGradient>
      <rect width="1920" height="1080" fill="url(#vignette)" />
    </svg>
  );
}
