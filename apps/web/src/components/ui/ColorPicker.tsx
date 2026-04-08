import { useState, useRef, useEffect } from 'react';

// ── Color math ────────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const s = max === 0 ? 0 : d / max, v = max;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, v];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_PRESETS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981',
  '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6',
  '#64748b', '#ef4444', '#f97316', '#22c55e',
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}

export function ColorPicker({ value, onChange, presets = DEFAULT_PRESETS }: ColorPickerProps) {
  const parsed = hexToRgb(value) ?? [99, 102, 241];
  const init = rgbToHsv(...parsed);

  const [h, setH] = useState(init[0]);
  const [s, setS] = useState(init[1]);
  const [v, setV] = useState(init[2]);
  const [hexInput, setHexInput] = useState(value.replace('#', '').toUpperCase());

  useEffect(() => {
    const rgb = hexToRgb(value);
    if (!rgb) return;
    const [nh, ns, nv] = rgbToHsv(...rgb);
    setH(nh); setS(ns); setV(nv);
    setHexInput(value.replace('#', '').toUpperCase());
  }, [value]);

  function commit(nh: number, ns: number, nv: number) {
    const hex = rgbToHex(...hsvToRgb(nh, ns, nv));
    setHexInput(hex.replace('#', '').toUpperCase());
    onChange(hex);
  }

  // Saturation/Value square
  const svRef = useRef<HTMLDivElement>(null);

  function handleSvPointer(e: React.PointerEvent) {
    if (!svRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = svRef.current.getBoundingClientRect();
    const ns = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nv = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    setS(ns); setV(nv);
    commit(h, ns, nv);
  }

  // Hue bar
  const hueRef = useRef<HTMLDivElement>(null);

  function handleHuePointer(e: React.PointerEvent) {
    if (!hueRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = hueRef.current.getBoundingClientRect();
    const nh = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    setH(nh);
    commit(nh, s, v);
  }

  const hueHex = rgbToHex(...hsvToRgb(h, 1, 1));

  return (
    <div className="space-y-3 select-none">
      {/* Presets */}
      <div className="flex gap-1.5 flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex-shrink-0 ${
              value.toLowerCase() === p.toLowerCase()
                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110'
                : ''
            }`}
            style={{ backgroundColor: p }}
          />
        ))}
      </div>

      {/* SV square */}
      <div
        ref={svRef}
        className="relative w-full rounded-xl overflow-hidden cursor-crosshair"
        style={{
          height: 140,
          background: `linear-gradient(to bottom, transparent, #000),
                       linear-gradient(to right, #fff, ${hueHex})`,
        }}
        onPointerDown={handleSvPointer}
        onPointerMove={(e) => { if (e.buttons) handleSvPointer(e); }}
      >
        {/* Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `${s * 100}%`,
            top: `${(1 - v) * 100}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: value,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative w-full h-3 rounded-full cursor-pointer"
        style={{
          background:
            'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)',
        }}
        onPointerDown={handleHuePointer}
        onPointerMove={(e) => { if (e.buttons) handleHuePointer(e); }}
      >
        {/* Thumb */}
        <div
          className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{
            left: `${(h / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: hueHex,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.25)',
          }}
        />
      </div>

      {/* Hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 border border-black/10"
          style={{ backgroundColor: value }}
        />
        <div className="flex items-center flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
          <span className="pl-2.5 pr-1 text-sm text-gray-400 font-mono select-none">#</span>
          <input
            value={hexInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase();
              setHexInput(raw);
              if (raw.length === 6) {
                const rgb = hexToRgb('#' + raw);
                if (rgb) {
                  const [nh, ns, nv] = rgbToHsv(...rgb);
                  setH(nh); setS(ns); setV(nv);
                  onChange('#' + raw.toLowerCase());
                }
              }
            }}
            className="flex-1 text-sm font-mono py-1.5 pr-2.5 outline-none bg-transparent dark:text-white"
            maxLength={6}
            spellCheck={false}
            placeholder="6366F1"
          />
        </div>
      </div>
    </div>
  );
}
