export function HexBackground() {
  const s = 28; // hex side length
  const colSpacing = s * Math.sqrt(3);
  const rowSpacing = s * 1.5;
  const cols = Math.ceil(480 / colSpacing) + 3;
  const rows = Math.ceil(900 / rowSpacing) + 3;

  const hexes = [];
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * colSpacing + (row % 2 !== 0 ? colSpacing / 2 : 0);
      const cy = row * rowSpacing;
      hexes.push({ cx, cy, key: `${row}-${col}` });
    }
  }

  function points(cx, cy) {
    const h = s * Math.sqrt(3) / 2;
    const half = s / 2;
    return [
      [cx,     cy - s],
      [cx + h, cy - half],
      [cx + h, cy + half],
      [cx,     cy + s],
      [cx - h, cy + half],
      [cx - h, cy - half],
    ].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  }

  return (
    <svg
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
        overflow: 'hidden',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Pink glow — bottom left */}
        <radialGradient id="g-pink" cx="10%" cy="90%" r="55%" gradientUnits="userSpaceOnUse"
          fx="10%" fy="90%">
          <stop offset="0%"   stopColor="#db2777" stopOpacity="0.45" />
          <stop offset="50%"  stopColor="#db2777" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#db2777" stopOpacity="0"    />
        </radialGradient>

        {/* Blue/indigo glow — top right */}
        <radialGradient id="g-blue" cx="90%" cy="10%" r="55%" gradientUnits="userSpaceOnUse"
          fx="90%" fy="10%">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.45" />
          <stop offset="50%"  stopColor="#6366f1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
        </radialGradient>

        {/* Subtle center glow */}
        <radialGradient id="g-center" cx="50%" cy="50%" r="40%" gradientUnits="userSpaceOnUse"
          fx="50%" fy="50%">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Base background */}
      <rect width="100%" height="100%" fill="#050510" />

      {/* Glow layers */}
      <rect width="100%" height="100%" fill="url(#g-pink)"   />
      <rect width="100%" height="100%" fill="url(#g-blue)"   />
      <rect width="100%" height="100%" fill="url(#g-center)" />

      {/* Hex grid */}
      {hexes.map(({ cx, cy, key }) => (
        <polygon
          key={key}
          points={points(cx, cy)}
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth="0.8"
        />
      ))}

      {/* Bright-edge hex highlights (near glow centres) */}
      {hexes
        .filter(({ cx, cy }) => {
          const distPink = Math.hypot(cx - 50, cy - 800);
          const distBlue = Math.hypot(cx - 430, cy - 80);
          return distPink < 120 || distBlue < 120;
        })
        .map(({ cx, cy, key }) => (
          <polygon
            key={`hl-${key}`}
            points={points(cx, cy)}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
        ))}
    </svg>
  );
}
