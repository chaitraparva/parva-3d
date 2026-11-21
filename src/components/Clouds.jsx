import { forwardRef, useEffect, useRef } from "react";

// Procedural volumetric-looking clouds drawn on canvas at device resolution (sharp on 4K).
// `side` decides where the bank sits: "left", "right", "veil" (full coverage, centre-heavy).
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function paint(cv, side, seed) {
  const dpr = 1; // clouds are soft — 1x keeps the GPU light while they scale
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const r = rng(seed);
  const unit = Math.max(W, H);
  const n = side === "veil" ? 260 : 340;
  const puff = (x, y, rad, a, shade) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const c = shade ? "188,196,206" : "255,255,255";
    grd.addColorStop(0, `rgba(${c},${a})`);
    grd.addColorStop(0.55, `rgba(${c},${a * 0.55})`);
    grd.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  };
  const pos = () => {
    if (side === "left") return [Math.pow(r(), 1.6) * W * 0.62, r() * H];
    if (side === "right") return [W - Math.pow(r(), 1.6) * W * 0.62, r() * H];
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7);
    return [W / 2 + Math.cos(a) * d * W * 0.7, H / 2 + Math.sin(a) * d * H * 0.7];
  };
  // shadow pass (soft blue-grey undersides)
  for (let i = 0; i < n * 0.45; i++) { const [x, y] = pos(); puff(x, y + unit * 0.02, unit * (0.03 + r() * 0.09), 0.18 + r() * 0.15, true); }
  // body
  for (let i = 0; i < n; i++) { const [x, y] = pos(); puff(x, y, unit * (0.02 + r() * 0.08), 0.22 + r() * 0.3, false); }
  // bright tops
  for (let i = 0; i < n * 0.4; i++) { const [x, y] = pos(); puff(x, y - unit * 0.01, unit * (0.01 + r() * 0.035), 0.35 + r() * 0.35, false); }
}

const Clouds = forwardRef(function Clouds({ side = "veil", seed = 7, className = "", style }, ref) {
  const cv = useRef(null);
  useEffect(() => {
    const draw = () => paint(cv.current, side, seed);
    draw();
    let t; const onR = () => { clearTimeout(t); t = setTimeout(draw, 200); };
    addEventListener("resize", onR);
    return () => removeEventListener("resize", onR);
  }, [side, seed]);
  return (
    <canvas
      ref={(el) => { cv.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }}
      className={`clouds ${className}`}
      style={style}
    />
  );
});
export default Clouds;
