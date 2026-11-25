import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap, lockScroll } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Words } from "../components/Split.jsx";

const ROOMS = [
  { k: "living", label: "The Living Room", title: "The\nLiving Room", line: "Long evenings, good company." },
  { k: "kitchen", label: "The Kitchen", title: "The\nKitchen", line: "Breakfast with a view, every day." },
  { k: "bedroom", label: "The Bedroom", title: "The\nBedroom", line: "Wake up to the skyline, not an alarm." },
  { k: "bath", label: "The Bathroom", title: "The\nBathroom", line: "Stone, steam and a long soak." },
];

// 05 — "Step inside the everyday." Arches rise; the bedroom arch opens to full screen on scroll.
// Clicking ANY arch opens that room full screen (grows out of the arch), with prev / next + close.
export default function StepInside() {
  const root = useRef(null);
  const [open, setOpen] = useState(null); // { index, rect }

  useGSAP(() => {
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
    const geo = () => {
      const mobile = innerWidth <= 900;
      if (mobile) {
        const w = innerWidth * 0.42, h = innerWidth * 0.58, gap = 1.6 * rem();
        const total = 2 * w + gap;
        return { left: innerWidth / 2 - total / 2 + w + gap, top: innerHeight - h - 5 * rem(), width: w, height: h, r: w / 2 };
      }
      const w = 19 * rem(), h = 27 * rem(), gap = 1.6 * rem();
      const total = 4 * w + 3 * gap;
      return { left: innerWidth / 2 - total / 2 + 2 * (w + gap), top: innerHeight - h - 5 * rem(), width: w, height: h, r: w / 2 };
    };

    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=320%", scrub: 0.6, pin: true, invalidateOnRefresh: true }, defaults: { ease: "none" } });
    tl.fromTo(".step .arch", { yPercent: 105 }, { yPercent: 0, stagger: 0.06, duration: 0.22, ease: "power2.out" }, 0)
      .fromTo(".step .arch .img", { scale: 1.3 }, { scale: 1, stagger: 0.06, duration: 0.3 }, 0)
      .set(".step .expander", { opacity: 1 }, 0.36)
      .fromTo(".step .expander",
        { clipPath: () => { const g = geo(); return `inset(${g.top}px ${innerWidth - g.left - g.width}px ${innerHeight - g.top - g.height}px ${g.left}px round ${g.r}px)`; } },
        { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", duration: 0.22, ease: "power2.inOut" }, 0.36)
      .fromTo(".step .expander .img", { scale: 1.25 }, { scale: 1, duration: 0.3 }, 0.36)
      .fromTo(".step .expander .txt > *", { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.03, duration: 0.08 }, 0.55)
      .to({}, { duration: 0.1 })
      .to(".step .expander", { opacity: 0, duration: 0.08 }, 0.74)
      .to(".step .head", { yPercent: -60, opacity: 0, duration: 0.12 }, 0.74)
      .to(".step .row", { y: () => -(innerHeight * 0.45), duration: 0.16 }, 0.76)
      .to(".step .amen-label", { opacity: 1, duration: 0.08 }, 0.9);
    gsap.from(".step h2 .w > span", { yPercent: 110, stagger: 0.08, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%" } });
  }, { scope: root });

  const openRoom = (i, e) => {
    const arch = e.currentTarget.querySelector(".arch");
    setOpen({ index: i, rect: arch.getBoundingClientRect() });
  };

  return (
    <section className="step pin light" id="interiors" ref={root} data-chapter="03|Interiors">
      <div className="head">
        <div className="eyebrow" style={{ color: "#8a8378" }}>03 — Interiors</div>
        <h2 style={{ marginTop: "1.2rem" }}><Words text={"Inside, the light\n*does* *the* *talking.*"} /></h2>
        <p>Engineered oak, honed stone and glass from floor to ceiling. Tap a room to walk into it.</p>
      </div>
      <div className="row">
        {ROOMS.map((r, i) => (
          <figure
            className="archwrap clickable" key={r.k} data-cursor="Open"
            role="button" tabIndex={0} aria-label={`Open ${r.label}`}
            onClick={(e) => openRoom(i, e)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openRoom(i, e))}
          >
            <div className="arch media"><Img k={r.k} sizes="25vw" /></div>
            <figcaption>{r.label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="expander media">
        <Img k="bedroom" />
        <div className="fill grad" />
        <div className="txt">
          <span className="pill">The master suite</span>
          <h3>The<br />Bedroom</h3>
          <p>Wake up to the skyline, not an alarm.</p>
        </div>
      </div>
      <div className="amen-label">Twelve amenities below ↓</div>
      {open && createPortal(<RoomViewer start={open} onClose={() => setOpen(null)} />, document.body)}
    </section>
  );
}

// Full-screen room view that grows out of the clicked arch and shrinks back into it.
function RoomViewer({ start, onClose }) {
  const el = useRef(null);
  const [i, setI] = useState(start.index);
  const closing = useRef(false);
  const room = ROOMS[i];

  // open: arch → full screen
  useEffect(() => {
    const { rect } = start;
    const r = rect.width / 2;
    lockScroll(true);
    const tl = gsap.timeline();
    tl.fromTo(el.current.querySelector(".rv-frame"),
      { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: `${r}px` },
      { left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: "0px 0px 0px 0px", duration: 1.1, ease: "expo.inOut" })
      .fromTo(el.current.querySelector(".rv-frame .img"), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0)
      .fromTo(el.current.querySelectorAll(".rv-ui"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.8, ease: "power3.out" }, 0.7);
    return () => tl.kill();
  }, []);

  // switching rooms: crossfade + text slide
  const go = (dir) => {
    const next = (i + dir + ROOMS.length) % ROOMS.length;
    const frame = el.current.querySelector(".rv-frame");
    gsap.timeline()
      .to(el.current.querySelectorAll(".rv-text > *"), { opacity: 0, y: -20, stagger: 0.04, duration: 0.35, ease: "power2.in" })
      .to(frame.querySelector(".img"), { opacity: 0, scale: 1.06, duration: 0.45, ease: "power2.in" }, 0)
      .add(() => setI(next))
      .add(() => {
        const img = frame.querySelector(".img");
        gsap.fromTo(img, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" });
        gsap.fromTo(el.current.querySelectorAll(".rv-text > *"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.8, ease: "power3.out" });
      }, "+=0.05");
  };

  // close: full screen → back into its arch
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const archs = document.querySelectorAll(".step .row .arch");
    const rect = archs[i]?.getBoundingClientRect() ?? start.rect;
    const r = rect.width / 2;
    gsap.timeline({ onComplete: () => { lockScroll(false); onClose(); } })
      .to(el.current.querySelectorAll(".rv-ui"), { opacity: 0, duration: 0.3 })
      .to(el.current.querySelector(".rv-frame"), { left: rect.left, top: rect.top, width: rect.width, height: rect.height, borderRadius: `${r}px`, duration: 0.9, ease: "expo.inOut" }, 0.1)
      .to(el.current, { opacity: 0, duration: 0.25 }, "-=0.15");
  };

  useEffect(() => {
    const k = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  });

  return (
    <div className="room-viewer" ref={el} role="dialog" aria-modal="true" aria-label={room.label}>
      <div className="rv-frame media">
        <Img k={room.k} eager key={room.k} />
        <div className="fill rv-grad" />
      </div>
      <button className="pill rv-ui rv-back" onClick={close}>← Interiors</button>
      <button className="pill rv-ui rv-close" onClick={close} aria-label="Close">Close ✕</button>
      <div className="rv-text rv-ui">
        <h3>{room.title.split("\n").map((t, n) => <span key={n} style={{ display: "block" }}>{t}</span>)}</h3>
        <p>{room.line}</p>
      </div>
      <div className="rv-nav rv-ui">
        <button onClick={() => go(-1)} aria-label="Previous room" data-cursor="Prev">←</button>
        <span>{String(i + 1).padStart(2, "0")} / {String(ROOMS.length).padStart(2, "0")}</span>
        <button onClick={() => go(1)} aria-label="Next room" data-cursor="Next">→</button>
      </div>
      <div className="rv-thumbs rv-ui">
        {ROOMS.map((r, n) => (
          <button key={r.k} className={n === i ? "on" : ""} onClick={() => n !== i && go(n - i)} data-cursor="View">{r.label.replace("The ", "")}</button>
        ))}
      </div>
    </div>
  );
}
