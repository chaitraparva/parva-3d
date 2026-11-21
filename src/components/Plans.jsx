// Architectural-style SVG plans (crisp at any resolution).
const W = 1000, H = 700, OX = 70, OY = 60, SX = (W - 140) / 100;
let SY = (H - 130) / 86;
const box = ([x, y, w, h]) => ({ X: OX + x * SX, Y: OY + y * SY, Ww: w * SX, Hh: h * SY });
const wet = (l) => /bath|Bath|Powder|Laundry|W\.I\.C|Spa/.test(l);
const out = (l) => /Balcony|balcony|Terrace|deck|garden|pool/.test(l);

function Furniture({ l, X, Y, Ww, Hh }) {
  const s = { fill: "#fff", stroke: "#8f897f", strokeWidth: 1.6 };
  if (/bedroom|Bedroom|suite|Suite|Maid/.test(l))
    return (<g><rect x={X + Ww * 0.22} y={Y + Hh * 0.16} width={Ww * 0.56} height={Hh * 0.56} rx="5" {...s} />
      <rect x={X + Ww * 0.26} y={Y + Hh * 0.19} width={Ww * 0.2} height={Hh * 0.1} rx="4" fill="#efebe4" stroke="#8f897f" />
      <rect x={X + Ww * 0.54} y={Y + Hh * 0.19} width={Ww * 0.2} height={Hh * 0.1} rx="4" fill="#efebe4" stroke="#8f897f" />
      <rect x={X + Ww * 0.22} y={Y + Hh * 0.5} width={Ww * 0.56} height={Hh * 0.22} fill="#e6dfd3" stroke="#8f897f" strokeWidth="1" /></g>);
  if (/Living|living|Family/.test(l))
    return (<g><path d={`M${X + Ww * 0.14} ${Y + Hh * 0.56} h${Ww * 0.58} v${Hh * 0.16} h${-Ww * 0.58} z M${X + Ww * 0.14} ${Y + Hh * 0.3} h${Ww * 0.12} v${Hh * 0.26} h${-Ww * 0.12} z`} {...s} />
      <rect x={X + Ww * 0.34} y={Y + Hh * 0.3} width={Ww * 0.26} height={Hh * 0.16} rx="3" fill="none" stroke="#8f897f" strokeWidth="1.6" />
      <rect x={X + Ww * 0.84} y={Y + Hh * 0.2} width={Ww * 0.05} height={Hh * 0.56} fill="#3a3732" /></g>);
  if (/Dining/.test(l))
    return (<g><rect x={X + Ww * 0.25} y={Y + Hh * 0.32} width={Ww * 0.5} height={Hh * 0.36} rx="4" {...s} />
      {[0.3, 0.5, 0.7].map((f) => <g key={f}><circle cx={X + Ww * f} cy={Y + Hh * 0.24} r={Math.min(Ww, Hh) * 0.05} {...s} /><circle cx={X + Ww * f} cy={Y + Hh * 0.76} r={Math.min(Ww, Hh) * 0.05} {...s} /></g>)}</g>);
  if (/Kitchen/.test(l))
    return (<g><rect x={X + 6} y={Y + 6} width={Ww - 12} height={Hh * 0.2} fill="#fff" stroke="#8f897f" strokeWidth="1.6" />
      <rect x={X + Ww * 0.25} y={Y + Hh * 0.5} width={Ww * 0.5} height={Hh * 0.22} fill="#fff" stroke="#8f897f" strokeWidth="1.6" />
      <circle cx={X + Ww * 0.3} cy={Y + Hh * 0.16} r="6" fill="none" stroke="#8f897f" /><circle cx={X + Ww * 0.45} cy={Y + Hh * 0.16} r="6" fill="none" stroke="#8f897f" /></g>);
  if (/Bath|bath|Spa|Powder/.test(l))
    return (<g><rect x={X + Ww * 0.12} y={Y + Hh * 0.18} width={Ww * 0.5} height={Hh * 0.34} rx={Hh * 0.17} {...s} />
      <ellipse cx={X + Ww * 0.78} cy={Y + Hh * 0.68} rx={Ww * 0.08} ry={Hh * 0.1} {...s} /></g>);
  if (/Infinity pool/.test(l))
    return <rect x={X + 10} y={Y + 10} width={Ww - 20} height={Hh - 20} rx="6" fill="#9fcbd6" stroke="#5f97a6" strokeWidth="2" />;
  if (/Jacuzzi/.test(l))
    return (<g><rect x={X + Ww * 0.08} y={Y + Hh * 0.22} width={Ww * 0.46} height={Hh * 0.56} rx="8" fill="#9fcbd6" stroke="#5f97a6" strokeWidth="2" />
      <circle cx={X + Ww * 0.76} cy={Y + Hh * 0.5} r={Hh * 0.28} fill="#bfe0e7" stroke="#5f97a6" strokeWidth="2" /></g>);
  if (out(l))
    return (<g>{[0.15, 0.35, 0.55].map((f) => <rect key={f} x={X + Ww * f} y={Y + Hh * 0.25} width={Ww * 0.08} height={Hh * 0.5} rx="4" {...s} />)}</g>);
  return null;
}

export function FloorPlan({ plan, mode = "full" }) {
  SY = (H - 130) / Math.max(...plan.rooms.map((r) => r[1] + r[3]));
  // mode: "full" (fills, furniture, labels) | "walls" (walls only, for 3D extrusion layers)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" fontFamily="Inter, sans-serif">
      <defs>
        <pattern id="wood" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#ebe2d3" /><path d="M0 8H16" stroke="#dfd2bd" /></pattern>
        <pattern id="tile" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#eef0f0" /><path d="M0 0H20V20" stroke="#d4d9da" fill="none" /></pattern>
        <pattern id="deck" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d9c7a8" /><path d="M0 5H10" stroke="#c6b08c" /></pattern>
      </defs>
      {plan.rooms.map((r, i) => {
        const { X, Y, Ww, Hh } = box(r); const l = r[4];
        if (mode === "walls") return <rect key={i} x={X} y={Y} width={Ww} height={Hh} fill="none" stroke="#2a2825" strokeWidth="8" />;
        return (
          <g key={i} className="rm">
            <rect x={X} y={Y} width={Ww} height={Hh} fill={wet(l) ? "url(#tile)" : out(l) ? "url(#deck)" : "url(#wood)"} />
            <Furniture l={l} X={X} Y={Y} Ww={Ww} Hh={Hh} />
            {!out(l) && <path d={`M${X + 10} ${Y + Hh - 5} a 30 30 0 0 1 30 -30`} fill="none" stroke="#8f897f" strokeWidth="1.3" />}
            <text x={X + Ww / 2} y={Y + Hh - 12} textAnchor="middle" fontSize={Math.min(12, Ww / 9)} letterSpacing="1.8" fill="#3b3833">{l.toUpperCase()}</text>
          </g>
        );
      })}
      {mode === "full" && plan.rooms.map((r, i) => { const { X, Y, Ww, Hh } = box(r); return <rect key={"w" + i} x={X} y={Y} width={Ww} height={Hh} fill="none" stroke="#1d1c1a" strokeWidth="7" />; })}
      {mode === "full" && <line x1={OX} y1={OY} x2={W - OX} y2={OY} stroke="#9cc0d0" strokeWidth="3" strokeDasharray="70 16" />}
    </svg>
  );
}

// ---------- Full floor plate: every home drawn with its rooms ----------
import { SLOTS, CORE, PLANS as ALL_PLANS } from "../data/content.js";

function unitRooms(planKey, slotKey) {
  const plan = ALL_PLANS[planKey];
  const [sx, sy, sw, sh] = SLOTS[slotKey];
  const pad = 6;
  const maxY = Math.max(...plan.rooms.map((r) => r[1] + r[3]));
  const rotate = sh > sw * 1.2;
  const mirror = sx > 500;
  const flip = !rotate && sy < 300 && sh < 300;
  return plan.rooms.map(([x, y, w, h, l]) => {
    let X, Y, W, H;
    if (rotate) { // plan x runs down the slot, plan y runs across it
      X = (y / maxY) * (sw - pad * 2); W = (h / maxY) * (sw - pad * 2);
      Y = (x / 100) * (sh - pad * 2); H = (w / 100) * (sh - pad * 2);
    } else {
      X = (x / 100) * (sw - pad * 2); W = (w / 100) * (sw - pad * 2);
      Y = (y / maxY) * (sh - pad * 2); H = (h / maxY) * (sh - pad * 2);
    }
    if (mirror) X = sw - pad * 2 - X - W;
    if (flip) Y = sh - pad * 2 - Y - H;   // top-row homes face their balcony to the outside
    return { x: sx + pad + X, y: sy + pad + Y, w: W, h: H, l };
  });
}

export function FloorPlate({ floor, onPick, active, hover, setHover, showCore = true }) {
  const [cx, cy, cw, ch] = CORE;
  return (
    <svg viewBox="0 0 1000 640" xmlns="http://www.w3.org/2000/svg" fontFamily="Inter, sans-serif">
      <rect x="40" y="40" width="920" height="560" fill="#0d1015" stroke="#3a4049" strokeWidth="2" />
      {/* balcony edge hint */}
      <rect x="48" y="48" width="904" height="544" fill="none" stroke="#2b3038" strokeDasharray="10 8" />
      {floor.units.map((u) => {
        const [x, y, w, h] = SLOTS[u.slot];
        const on = active === u.id || hover === u.id;
        return (
          <g key={u.id} className="unit-g" data-cursor="Open" style={{ cursor: "pointer" }}
             onClick={() => onPick(u)} onMouseEnter={() => setHover?.(u.id)} onMouseLeave={() => setHover?.(null)}>
            <rect className="unit-poly" x={x} y={y} width={w} height={h} fill={u.color} fillOpacity={on ? 0.55 : 0.26} stroke={u.color} strokeWidth={on ? 3 : 1.6} />
            {unitRooms(u.plan, u.slot).map((r, i) => (
              <g key={i}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#e9edf2" strokeOpacity={on ? 0.9 : 0.55} strokeWidth="2.2" />
                {/bed|Bed|suite|Sleep/.test(r.l) && r.w > 30 && r.h > 30 && (
                  <rect x={r.x + r.w * 0.28} y={r.y + r.h * 0.2} width={r.w * 0.44} height={r.h * 0.5} rx="3" fill="#e9edf2" fillOpacity={on ? 0.35 : 0.18} />
                )}
                {/Infinity pool/.test(r.l) && (
                  <rect x={r.x + 8} y={r.y + 8} width={r.w - 16} height={r.h - 16} rx="4" fill="#7fc3d4" fillOpacity=".75" />
                )}
                {/Bath|bath|Spa|Powder/.test(r.l) && r.w > 24 && (
                  <rect x={r.x + r.w * 0.15} y={r.y + r.h * 0.2} width={r.w * 0.45} height={r.h * 0.32} rx={r.h * 0.15} fill="none" stroke="#e9edf2" strokeOpacity=".5" />
                )}
                {r.w > 44 && r.h > 22 && (
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 3} textAnchor="middle" fontSize={Math.min(9, r.w / 9)} letterSpacing="1" fill="#e9edf2" fillOpacity={on ? 0.95 : 0.55}>{r.l.toUpperCase()}</text>
                )}
              </g>
            ))}
            <g transform={`translate(${x + 12},${y + 22})`}>
              <rect x="-6" y="-15" width="58" height="22" rx="11" fill="#0d1015" fillOpacity=".85" />
              <text x="23" y="0" textAnchor="middle" fontSize="12" letterSpacing="2" fill="#fff">{u.id}</text>
            </g>
          </g>
        );
      })}
      {showCore && (<g>
      <rect x={cx} y={cy} width={cw} height={ch} fill="#171b21" stroke="#3a4049" />
      {[0, 1, 2].map((i) => <rect key={i} x={cx + 20 + i * 48} y={cy + 30} width="38" height="46" fill="none" stroke="#4a515c" />)}
      <path d={`M${cx + 30} ${cy + 120} h${cw - 60} M${cx + 30} ${cy + 140} h${cw - 60} M${cx + 30} ${cy + 160} h${cw - 60} M${cx + 30} ${cy + 180} h${cw - 60}`} stroke="#4a515c" />
      <text x={cx + cw / 2} y={cy + ch - 18} textAnchor="middle" fill="#7d838c" fontSize="10" letterSpacing="3">CORE · LIFTS</text>
      </g>)}
      <text x="500" y="626" textAnchor="middle" fill="#7d838c" fontSize="11" letterSpacing="3">{`${floor.label.toUpperCase()} · ${floor.units.length} RESIDENCES · INDICATIVE`}</text>
    </svg>
  );
}
