const logoPalettes = [
  ['#2563eb', '#0ea5e9'],
  ['#1d4ed8', '#22d3ee'],
  ['#0f766e', '#14b8a6'],
  ['#4338ca', '#818cf8'],
  ['#0369a1', '#38bdf8'],
  ['#0f172a', '#334155'],
  ['#4c1d95', '#8b5cf6'],
  ['#14532d', '#22c55e'],
  ['#92400e', '#f59e0b'],
  ['#7c2d12', '#fb7185']
];

function hashText(value) {
  let hash = 0;
  const source = String(value || 'BG');

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getLogoStyle(seed) {
  const hash = hashText(seed);
  const [start, end] = logoPalettes[hash % logoPalettes.length];

  return {
    background: `linear-gradient(145deg, ${start} 0%, ${end} 100%)`,
    boxShadow: `0 8px 16px ${hexToRgba(start, 0.28)}`,
    border: `1px solid ${hexToRgba(end, 0.35)}`
  };
}
