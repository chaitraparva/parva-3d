import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Photoreal scroll film (the Reposé technique, done properly):
// a video is cut into numbered frames; scroll picks the frame and it is drawn on a canvas.
// • phones get the 960px frame set, laptops 1920px, 4K screens 2560px (if present)
// • keyframes (every 8th frame) load first so scrubbing works instantly, then the gaps fill in
// • if a frame isn't loaded yet, the nearest loaded one is shown — never a blank
const ScrollFilm = forwardRef(function ScrollFilm({ manifest, className = "" }, ref) {
  const canvas = useRef(null);
  const state = useRef({ imgs: [], target: 0, cur: 0, drawn: -1 });

  useImperativeHandle(ref, () => ({
    setProgress: (p) => { state.current.target = Math.max(0, Math.min(1, p)); },
    frameRect: () => state.current.rect,   // where the frame sits on screen (for overlays)
  }));

  useEffect(() => {
    const s = state.current;
    const { count, sets, pad = 4, ext = "webp" } = manifest;
    // laptops (incl. retina) get 1920; big / 4K screens get 2560; phones 1280
    const w = innerWidth * Math.min(devicePixelRatio || 1, 1.25);
    const set = [...sets].sort((a, b) => a - b).find((x) => x >= w * 0.9) || Math.max(...sets);
    const url = (i) => `${manifest.base}/${set}/${String(i + 1).padStart(pad, "0")}.${ext}`;
    s.imgs = new Array(count).fill(null);

    // load order: every 8th, then every 4th, every 2nd, then the rest
    const order = [];
    const seen = new Set();
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let alive = true, k = 0;
    const pump = () => {
      if (!alive || k >= order.length) return;
      const i = order[k++];
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { s.imgs[i] = im; s.drawn = -1; pump(); }); };
      im.onerror = pump;
      im.src = url(i);
    };
    for (let c = 0; c < 6; c++) pump();   // 6 parallel requests

    const cv = canvas.current, ctx = cv.getContext("2d");
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); s.drawn = -1;
    };
    size(); addEventListener("resize", size);

    const nearest = (i) => {
      for (let d = 0; d < count; d++) {
        if (s.imgs[i - d]) return s.imgs[i - d];
        if (s.imgs[i + d]) return s.imgs[i + d];
      }
      return null;
    };
    let raf, last = performance.now();
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      s.cur += (s.target - s.cur) * (1 - Math.exp(-dt * 9));
      if (window.__riseSnap) s.cur = s.target;
      const i = Math.round(s.cur * (count - 1));
      const im = s.imgs[i] || nearest(i);
      if (!im || (i === s.drawn && s.imgs[i])) return;
      // cover-fit
      const W = cv.width, H = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
      const sc = Math.max(W / iw, H / ih), dw = iw * sc, dh = ih * sc, dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.drawImage(im, dx, dy, dw, dh);
      const d = W / cv.getBoundingClientRect().width;
      s.rect = { x: dx / d, y: dy / d, w: dw / d, h: dh / d, iw, ih };
      s.drawn = s.imgs[i] ? i : -1;
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [manifest]);

  return <canvas ref={canvas} className={`film-canvas ${className}`} />;
});

export default ScrollFilm;
