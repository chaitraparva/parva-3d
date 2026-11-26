import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Photoreal scroll film — scroll picks the frame, drawn on a canvas.
// Built for smoothness at high resolution:
//  • two tiers: a light 1280px pass for every frame first (instant scrubbing), then the HD set (1920 / 2560)
//  • frames are kept COMPRESSED in memory; only a small window around the playhead is decoded,
//    off the main thread (createImageBitmap), so drawing never stalls on a decode
//  • the window looks ahead in the direction you are scrolling
const WINDOW = 10;          // decoded frames kept on each side of the playhead
const PARALLEL = 8;

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
    const net = navigator.connection || {};
    const slow = net.saveData || (net.downlink && net.downlink < 4) || /2g|3g/.test(net.effectiveType || "");
    const cap = slow ? Math.min(innerWidth, 1280) : px;   // on a slow connection, HD = 1280 so it can actually arrive
    const hiSet = sorted.slice(1).find((x) => x >= cap * 0.85) || sorted[sorted.length - 1];   // never the preview tier
    const loSet = sorted[0];
    const url = (set, i) => `${manifest.base}/${set}/${String(i + 1).padStart(pad, "0")}.${ext}`;

    const lo = new Array(count).fill(null);   // Blob
    const hi = new Array(count).fill(null);   // Blob
    const bmp = new Map();                    // i -> { b: ImageBitmap, hi: bool }
    const pending = new Set();
    let alive = true;
    window.__film = s;

    // ---------- downloading (compressed blobs), always nearest-the-playhead first ----------
    // preview tier (tiny, ~20 KB) for every frame; HD only for a window around where you are,
    // so the connection is never clogged by frames nobody is looking at.
    const HD_AHEAD = 36, HD_BEHIND = 12, PREVIEW_NEAR = 90;
    const want = new Uint8Array(count * 2);       // 1 = requested/loaded (lo at i, hi at count+i)
    const order = (n) => { const o = [], seen = new Set(); for (const st of [8, 4, 2, 1]) for (let i = 0; i < n; i += st) if (!seen.has(i)) { seen.add(i); o.push(i); } return o; };
    const coarse = order(count);                  // every 8th, 4th, 2nd, then all
    let ci = 0, c8 = 0, active = 0, dirS = 1, lastHere = 0;
    const pick = () => {
      const here = Math.round(s.cur * (count - 1));
      if (here !== lastHere) { dirS = here > lastHere ? 1 : -1; lastHere = here; }
      const lo1 = (r) => { for (let d = 0; d <= r; d++) for (const j of [here + d * dirS, here - d * dirS]) if (j >= 0 && j < count && !want[j]) return ["lo", j]; return null; };
      const hi1 = (ahead, behind) => { if (hiSet === loSet) return null; for (let d = 0; d <= ahead; d++) for (const j of d <= behind ? [here + d * dirS, here - d * dirS] : [here + d * dirS]) if (j >= 0 && j < count && !want[count + j]) return ["hi", j]; return null; };
      // 1 · preview right around the playhead  2 · HD for the frame you are on (+ a few)
      // 3 · preview further ahead  4 · HD window ahead
      const step8 = () => { while (c8 < count && want[c8]) c8 += 8; return c8 < count ? ["lo", c8] : null; };
      const job = lo1(16) || hi1(4, 2) || step8() || lo1(PREVIEW_NEAR) || hi1(HD_AHEAD, HD_BEHIND);
      if (job) return job;
      // 3 · the rest of the preview film, coarse to fine
      while (ci < coarse.length && want[coarse[ci]]) ci++;
      if (ci < coarse.length) return ["lo", coarse[ci]];
      return null;
    };
    const pump = () => {
      while (alive && active < PARALLEL) {
        const job = pick(); if (!job) break;
        const [tier, i] = job;
        want[(tier === "hi" ? count : 0) + i] = 1;
        active++;
        fetch(url(tier === "lo" ? loSet : hiSet, i)).then((r) => (r.ok ? r.blob() : null)).catch(() => null).then((b) => {
          active--;
          if (b) { (tier === "lo" ? lo : hi)[i] = b; if (tier === "hi" && bmp.has(i) && !bmp.get(i).hi) { bmp.get(i).b.close?.(); bmp.delete(i); } }
          else want[(tier === "hi" ? count : 0) + i] = 0;
          pump();
        });
      }
    };
    pump();
    const kick = setInterval(pump, 120);   // re-aim the queue as you scroll

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
      s.want = i; s.hiOK = !!(f && f.hi); s.hiHave = hi[i] ? 1 : 0; s.hiSet = hiSet;
      if (!f || (f === drawn && !dirty)) return;
      const W = cv.width, H = cv.height, iw = f.b.width, ih = f.b.height;
      const sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc, dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.drawImage(f.b, dx, dy, dw, dh);
      const k = W / cv.getBoundingClientRect().width;
      s.rect = { x: dx / k, y: dy / k, w: dw / k, h: dh / k, iw, ih };
      drawn = f; dirty = false;
      for (const [k, v] of bmp) if (v === f) { s.shown = k; break; }
    };
    raf = requestAnimationFrame(loop);
    return () => { clearInterval(kick); alive = false; cancelAnimationFrame(raf); removeEventListener("resize", size); for (const v of bmp.values()) v.b.close?.(); };
  }, [manifest]);

  return <canvas ref={canvas} className={`film-canvas ${className}`} />;
});

export default ScrollFilm;
