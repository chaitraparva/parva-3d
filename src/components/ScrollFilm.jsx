import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Photoreal scroll film — scroll picks the frame, drawn on a canvas.
//
// Main source: ONE compressed video (H.264). Video shares detail between frames, so the whole
// 856-frame film is ~13 MB at 720p / ~24 MB at 1080p, versus 150+ MB as separate HD stills.
// It streams from the start while the visitor is still at the top, and scrolling just seeks it.
//
// Safety net: tiny preview stills (~20 KB) for a coarse set of frames, shown only if the
// visitor scrolls past what the video has buffered so far. They never compete with the video
// for bandwidth beyond the first few hundred KB.
const WINDOW = 6;
const PARALLEL = 4;

const ScrollFilm = forwardRef(function ScrollFilm({ manifest, className = "" }, ref) {
  const canvas = useRef(null);
  const state = useRef({ target: 0, cur: 0 });

  useImperativeHandle(ref, () => ({
    setProgress: (p) => { state.current.target = Math.max(0, Math.min(1, p)); },
    frameRect: () => state.current.rect,
  }));

  useEffect(() => {
    const s = state.current;
    const { count, sets, pad = 4, ext = "webp", fps = 18, video = {} } = manifest;
    const loSet = [...sets].sort((a, b) => a - b)[0];
    const url = (set, i) => `${manifest.base}/${set}/${String(i + 1).padStart(pad, "0")}.${ext}`;
    let alive = true;
    window.__film = s;

    // ---------- pick the video for this screen + connection ----------
    const net = navigator.connection || {};
    const slow = net.saveData || (net.downlink && net.downlink < 6) || /2g|3g/.test(net.effectiveType || "");
    const small = Math.min(innerWidth, innerHeight) < 700 || innerWidth < 900;
    const vsrc = (!slow && !small && video["1080"]) || video["720"] || video["1080"];
    const v = document.createElement("video");
    let vOK = false;
    if (vsrc) {
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      v.src = `${manifest.base}/${vsrc}`;
      v.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1";
      document.body.appendChild(v);
      v.addEventListener("loadeddata", () => { vOK = true; dirty = true; });
      v.addEventListener("seeked", () => { dirty = true; });
      // nudge mobile browsers (iOS) into actually buffering: a muted play/pause is always allowed
      v.play().then(() => v.pause()).catch(() => {});
    }
    const buffered = (t) => { const b = v.buffered; for (let k = 0; k < b.length; k++) if (t >= b.start(k) - 0.01 && t <= b.end(k) - 0.02) return true; return false; };

    // ---------- preview stills: a light safety net only ----------
    const lo = new Array(count).fill(null);
    const bmp = new Map();
    const pending = new Set();
    const want = new Uint8Array(count);
    let c8 = 0, active = 0;
    const pick = () => {
      const here = Math.round(s.cur * (count - 1));
      const videoCovers = vOK && buffered(here / fps);
      // around the playhead only when the video can't show it
      if (!videoCovers) for (let d = 0; d <= 10; d++) for (const j of [here + d, here - d]) if (j >= 0 && j < count && !want[j]) return j;
      // otherwise a coarse every-8th frame net, ahead of the video's buffer
      while (c8 < count && want[c8]) c8 += 8;
      return c8 < count ? c8 : null;
    };
    const pump = () => {
      while (alive && active < PARALLEL) {
        const i = pick(); if (i == null) break;
        want[i] = 1; active++;
        fetch(url(loSet, i)).then((r) => (r.ok ? r.blob() : null)).catch(() => null).then((b) => {
          active--; if (b) lo[i] = b; else want[i] = 0; pump();
        });
      }
    };
    pump();
    const kick = setInterval(pump, 200);
    const decode = (i) => {
      if (i < 0 || i >= count || pending.has(i) || bmp.has(i) || !lo[i]) return;
      pending.add(i);
      createImageBitmap(lo[i]).then((b) => { pending.delete(i); if (!alive) return b.close?.(); bmp.set(i, b); }).catch(() => pending.delete(i));
    };
    const nearest = (i) => { for (let d = 0; d < count; d++) { if (bmp.has(i - d)) return bmp.get(i - d); if (bmp.has(i + d)) return bmp.get(i + d); decode(i - d); decode(i + d); if (d > WINDOW * 4) break; } return null; };

    // ---------- drawing ----------
    const cv = canvas.current, ctx = cv.getContext("2d", { alpha: false });
    let dirty = true, lastKey = "";
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); dirty = true;
      ctx.imageSmoothingQuality = "high";
    };
    size(); addEventListener("resize", size);
    const paint = (src, iw, ih) => {
      const W = cv.width, H = cv.height;
      const sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc, dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.drawImage(src, dx, dy, dw, dh);
      const k = W / cv.getBoundingClientRect().width;
      s.rect = { x: dx / k, y: dy / k, w: dw / k, h: dh / k, iw, ih };
    };

    let raf, last = performance.now();
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      s.cur += (s.target - s.cur) * (1 - Math.exp(-dt * 12));
      if (window.__riseSnap) s.cur = s.target;
      const i = Math.round(s.cur * (count - 1));
      const tt = Math.min((count - 0.5) / fps, (i + 0.5) / fps);   // middle of frame i
      s.want = i;
      if (vOK && buffered(tt)) {
        // 1 · draw whatever the last seek produced  2 · then ask for the next frame
        //     (seek only once the previous one has landed, so the decoder never queues up work)
        if (!v.seeking && v.readyState >= 2) {
          const key = "v" + v.currentTime.toFixed(3);
          if (key !== lastKey || dirty) {
            paint(v, v.videoWidth, v.videoHeight); lastKey = key; dirty = false;
            s.shown = Math.round(v.currentTime * fps - 0.5); s.hiOK = true;
          }
          if (Math.abs(v.currentTime - tt) > 0.5 / fps) v.currentTime = tt;
        }
        return;
      }
      // not buffered yet → nearest preview still
      decode(i);
      const b = bmp.get(i) || nearest(i);
      if (!b) return;
      const key = "p" + i;
      if (key !== lastKey || dirty) { paint(b, b.width, b.height); lastKey = key; dirty = false; s.shown = i; s.hiOK = false; }
      for (const [k, x] of bmp) if (Math.abs(k - i) > 40) { x.close?.(); bmp.delete(k); }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      clearInterval(kick); alive = false; cancelAnimationFrame(raf); removeEventListener("resize", size);
      for (const x of bmp.values()) x.close?.();
      v.removeAttribute("src"); v.load(); v.remove();
    };
  }, [manifest]);

  return <canvas ref={canvas} className={`film-canvas ${className}`} />;
});

export default ScrollFilm;
