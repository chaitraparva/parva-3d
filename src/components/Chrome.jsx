import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger, scrollToTarget, lockScroll } from "../lib/smooth.js";
import Img from "./Img.jsx";

const LINKS = [
  ["#residences", "Residences", "Fourteen floors, one rooftop", "residence"],
  ["#interiors", "Interiors", "Stone, oak and evening light", "living"],
  ["#amenities", "Amenities", "A dozen reasons to stay in", "pool"],
  ["#life", "A day at Parva", "Morning coffee to the last light", "terrace"],
  ["#location", "Location", "The city, on your terms", "aerial"],
  ["#contact", "Enquire", "Private viewings by appointment", "arrive1"],
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const go = (e, id) => { e.preventDefault(); setOpen(false); setTimeout(() => scrollToTarget(id), open ? 650 : 0); };
  return (
    <>
      <nav className="nav">
        <a href="#top" className="logo" onClick={(e) => go(e, "#top")}>Parvā<small>Residences · Dubai</small></a>
        <div className="right">
          <a href="#contact" className="pill magnetic" onClick={(e) => go(e, "#contact")}>Book a viewing <span>→</span></a>
          <button className="menu-btn magnetic" onClick={() => setOpen(true)} aria-label="Open menu"><i /><i /><span>Menu</span></button>
        </div>
      </nav>
      {createPortal(<Menu open={open} onClose={() => setOpen(false)} go={go} />, document.body)}
    </>
  );
}

function Menu({ open, onClose, go }) {
  const el = useRef(null);
  const [hover, setHover] = useState(0);
  useEffect(() => {
    const m = el.current;
    if (open) {
      lockScroll(true);
      gsap.set(m, { visibility: "visible" });
      gsap.timeline()
        .fromTo(m, { clipPath: "circle(0% at 96% 4%)" }, { clipPath: "circle(150% at 96% 4%)", duration: 1.1, ease: "expo.inOut" })
        .fromTo(m.querySelectorAll(".m-link .t"), { yPercent: 110 }, { yPercent: 0, stagger: 0.06, duration: 1, ease: "expo.out" }, 0.45)
        .fromTo(m.querySelectorAll(".m-foot > *, .m-prev"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.8 }, 0.6);
    } else if (m.style.visibility === "visible") {
      gsap.to(m, { clipPath: "circle(0% at 96% 4%)", duration: 0.8, ease: "expo.inOut", onComplete: () => { gsap.set(m, { visibility: "hidden" }); lockScroll(false); } });
    }
  }, [open]);
  useEffect(() => { const k = (e) => open && e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);

  return (
    <div className="menu" ref={el} style={{ visibility: "hidden" }} role="dialog" aria-modal="true">
      <button className="menu-close magnetic" onClick={onClose}>Close <span>✕</span></button>
      <ol className="m-links">
        {LINKS.map(([href, label, sub], i) => (
          <li key={href} className={`m-link ${hover === i ? "on" : ""}`} onMouseEnter={() => setHover(i)}>
            <a href={href} onClick={(e) => go(e, href)}>
              <em>{String(i + 1).padStart(2, "0")}</em>
              <span className="mask"><span className="t">{label}</span></span>
              <small>{sub}</small>
            </a>
          </li>
        ))}
      </ol>
      <div className="m-prev">
        {LINKS.map(([, , , img], i) => <div key={i} className={`media ${hover === i ? "on" : ""}`}><Img k={img} sizes="40vw" /></div>)}
      </div>
      <div className="m-foot">
        <span>Parva Realty · Dubai</span>
        <span>+971 00 000 0000 · sales@parvarealty.ae</span>
        <span>Instagram · LinkedIn</span>
      </div>
    </div>
  );
}

export function Progress() {
  const bar = useRef(null);
  useEffect(() => {
    const t = gsap.to(bar.current, { scaleY: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, []);
  return <div className="progress"><i ref={bar} /></div>;
}

export function Cursor() {
  const el = useRef(null);
  useEffect(() => {
    const c = el.current;
    const xTo = gsap.quickTo(c, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(c, "y", { duration: 0.45, ease: "power3" });
    let mag = null;
    const move = (e) => {
      xTo(e.clientX); yTo(e.clientY);
      // magnetic buttons
      const t = e.target.closest?.(".magnetic");
      if (t) {
        const r = t.getBoundingClientRect();
        gsap.to(t, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.4, duration: 0.5, ease: "power3.out" });
        mag = t;
      } else if (mag) { gsap.to(mag, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, .4)" }); mag = null; }
    };
    const over = (e) => {
      const t = e.target.closest?.("[data-cursor]");
      c.classList.toggle("big", !!t);
      c.classList.toggle("link", !t && !!e.target.closest?.("a, button"));
      if (t) c.querySelector("span").textContent = t.dataset.cursor;
    };
    gsap.set(c, { xPercent: -50, yPercent: -50 });
    addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    return () => { removeEventListener("mousemove", move); document.removeEventListener("mouseover", over); };
  }, []);
  return <div className="cursor" ref={el} aria-hidden="true"><span>View</span></div>;
}

// Film grain — subtle, cinematic.
export function Grain() { return <div className="grain" aria-hidden="true" />; }

// Endless word strip whose speed and skew follow the scroll velocity.
export function Marquee({ words, tone = "dark" }) {
  const root = useRef(null);
  useEffect(() => {
    const track = root.current.querySelector(".mq-track");
    const loop = gsap.to(track, { xPercent: -50, repeat: -1, duration: 30, ease: "none" });
    const st = ScrollTrigger.create({
      trigger: root.current, start: "top bottom", end: "bottom top",
      onUpdate: (s) => {
        const v = s.getVelocity() / 400;
        const ts = (1 + Math.min(6, Math.abs(v))) * (v < 0 ? -1 : 1);
        gsap.to(loop, { timeScale: ts, duration: 0.3, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: ts < 0 ? -1 : 1, duration: 1.2 }) });
        gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, -v * 1.2), duration: 0.3, overwrite: true, onComplete: () => gsap.to(track, { skewX: 0, duration: 0.8 }) });
      },
    });
    return () => { loop.kill(); st.kill(); };
  }, []);
  const row = words.map((w, i) => <span key={i}>{w}<i>✦</i></span>);
  return (
    <div className={`marquee ${tone}`} ref={root} aria-hidden="true">
      <div className="mq-track">{row}{row}{row}{row}</div>
    </div>
  );
}

// Re-measure ScrollTrigger once fonts are in (layout changes).
export function useFontsRefresh() {
  useEffect(() => { document.fonts?.ready.then(() => ScrollTrigger.refresh()); }, []);
}

// Chapter marker — bottom-left: which part of the story you're in.
export function Chapter() {
  const [ch, setCh] = useState(null);
  useEffect(() => {
    let sts = [];
    const t = setTimeout(() => {
      sts = [...document.querySelectorAll("[data-chapter]")].map((el) => ScrollTrigger.create({
        trigger: el.closest(".pin-spacer") || el, start: "top 55%", end: "bottom 55%",
        onToggle: (s) => s.isActive && setCh(el.dataset.chapter.split("|")),
      }));
    }, 600);
    return () => { clearTimeout(t); sts.forEach((s) => s.kill()); };
  }, []);
  return (
    <div className={`chapter ${ch ? "" : "off"}`} aria-hidden="true">
      <b>{ch?.[0]}</b><i /><span className="nm"><span key={ch?.[1]}>{ch?.[1]}</span></span>
    </div>
  );
}
