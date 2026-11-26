import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Photoreal scroll film — scroll picks the frame, drawn on a canvas.
// Built for smoothness at high resolution:
//  • two tiers: a light 1280px pass for every frame first (instant scrubbing), then the HD set (1920 / 2560)
//  • frames are kept COMPRESSED in memory; only a small window around the playhead is decoded,
//    off the main thread (createImageBitmap), so drawing never stalls on a decode
//  • the window looks ahead in the direction you are scrolling
const WINDOW = 10;          // decoded frames kept on each side of the playhead
const PARALLEL = 6;

const ScrollFilm = forwardRef(function ScrollFilm({ manifest, className = "" }, ref) {
  const canvas = useRef(null);
  const state = useRef({ target: 0, cur: 0 });

  useImperativeHandle(ref, () => ({
    setProgress: (p) => { state.current.target = Math.max(0, Math.min(1, p)); },
    frameRect: () => state.current.rect,
  }));

  useEffect(() => {
    const s = state.current;
    const { count, sets, pad = 4, ext = "webp" } = manifest;
    const sorted = [...sets].sort((a, b) => a - b);
    const px = innerWidth * Math.min(devicePixelRatio || 1, 2);
    const hiSet = sorted.find((x) => x >= px * 0.85) || sorted[sorted.length - 1];
    const loSet = sorted[0];
    const url = (set, i) => `${manifest.base}/${set}/${String(i + 1).padStart(pad, "0")}.${ext}`;

    const lo = new Array(count).fill(null);   // Blob
    const hi = new Array(count).fill(null);   // Blob
    const bmp = new Map();                    // i -> { b: ImageBitmap, hi: bool }
    const pending = new Set();
    let alive = true;

    // ---------- downloading (compressed blobs) ----------
    const queue = [];
    const order = (n) => { const o = [], seen = new Set(); for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); o.push(i); } return o; };
    order(count).forEach((i) => queue.push(["lo", i]));
    if (hiSet !== loSet) order(count).forEach((i) => queue.push(["hi", i]));
    let active = 0;
    const pump = () => {
      while (alive && active < PARALLEL && queue.length) {
        // HD frames near the playhead jump the queue
        let k = 0;
        if (queue[0][0] === "hi") {
          const here = Math.round(s.cur * (count - 1));
          let best = Infinity;
          for (let j = 0; j < Math.min(queue.length, 400); j++) { const d = Math.abs(queue[j][1] - here); if (d < best) { best = d; k = j; } }
        }
        const [tier, i] = queue.splice(k, 1)[0];
        active++;
        fetch(url(tier === "lo" ? loSet : hiSet, i)).then((r) => (r.ok ? r.blob() : null)).catch(() => null).then((b) => {
          active--;
          if (b) { (tier === "lo" ? lo : hi)[i] = b; if (tier === "hi" && bmp.has(i) && !bmp.get(i).hi) { bmp.get(i).b.close?.(); bmp.delete(i); } }
          pump();
        });
      }
    };
    pump();

    // ---------- decoding window (off main thread) ----------
    const decode = (i) => {
      if (pending.has(i)) return;
      const blob = hi[i] || lo[i];
      if (!blob) return;
      const have = bmp.get(i);
      if (have && (have.hi || !hi[i])) return;
      pending.add(i);
      createImageBitmap(blob).then((b) => {
        pending.delete(i);
        if (!alive) { b.close?.(); return; }
        const old = bmp.get(i); if (old) old.b.close?.();
        bmp.set(i, { b, hi: !!hi[i] });
      }).catch(() => pending.delete(i));
    };
    let dir = 1, lastIdx = 0;
    const maintain = (idx) => {
      if (idx !== lastIdx) { dir = idx > lastIdx ? 1 : -1; lastIdx = idx; }
      decode(idx);
      for (let d = 1; d <= WINDOW; d++) { decode(idx + d * dir); if (d <= WINDOW / 2) decode(idx - d * dir); }
      for (const [k, v] of bmp) if (Math.abs(k - idx) > WINDOW * 1.6) { v.b.close?.(); bmp.delete(k); }
    };

    // ---------- drawing ----------
    const cv = canvas.current, ctx = cv.getContext("2d", { alpha: false });
    ctx.imageSmoothingQuality = "high";
    let drawn = null, dirty = true;
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); dirty = true;
      ctx.imageSmoothingQuality = "high";
    };
    size(); addEventListener("resize", size);
    const nearest = (i) => { for (let d = 0; d < count; d++) { const a = bmp.get(i - d) || bmp.get(i + d); if (a) return a; } return null; };

    let raf, last = performance.now();
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      s.cur += (s.target - s.cur) * (1 - Math.exp(-dt * 10));
      if (window.__riseSnap) s.cur = s.target;
      const i = Math.round(s.cur * (count - 1));
      maintain(i);
      const f = bmp.get(i) || nearest(i);
      if (!f || (f === drawn && !dirty)) return;
      const W = cv.width, H = cv.height, iw = f.b.width, ih = f.b.height;
      const sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc, dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.drawImage(f.b, dx, dy, dw, dh);
      const k = W / cv.getBoundingClientRect().width;
      s.rect = { x: dx / k, y: dy / k, w: dw / k, h: dh / k, iw, ih };
      drawn = f; dirty = false;
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", size); for (const v of bmp.values()) v.b.close?.(); };
  }, [manifest]);

  return <canvas ref={canvas} className={`film-canvas ${className}`} />;
});

export default ScrollFilm;
