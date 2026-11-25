import { useEffect, useRef, useState } from "react";

// Annotated hotspots pinned to points of a photo shown with object-fit: cover.
// Points are fractions of the ORIGINAL photo, so they stay on the right object at any screen shape;
// anything cropped off-screen simply isn't shown.
export default function Spots({ aspect, spots, className = "" }) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // every spot is always rendered (so scroll timelines can find them); cropped ones get .off
  const { w, h } = box || { w: 1, h: 1 };
  const sw = w / h > aspect ? w : h * aspect;
  const sh = sw / aspect;
  const ox = (w - sw) / 2, oy = (h - sh) / 2;
  const items = spots.map((s) => {
    const px = ox + s.x * sw, py = oy + s.y * sh;
    const off = !box || px < w * 0.06 || px > w * 0.94 || py < h * (w < 700 ? 0.3 : 0.12) || py > h * 0.9;
    return { ...s, px, py, off, flip: px > w * 0.58 };
  });
  return (
    <div className={`spots ${className}`} ref={ref} aria-hidden="true">
      {items.map((s) => (
        <div key={s.label} className={`spot ${s.flip ? "flip" : ""} ${s.off ? "off" : ""}`} style={{ left: s.px, top: s.py }}>
          <i />
          <span><b>{s.label}</b>{s.sub && <em>{s.sub}</em>}</span>
        </div>
      ))}
    </div>
  );
}
