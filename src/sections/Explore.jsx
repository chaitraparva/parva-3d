import { useRef, useState, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap, lockScroll } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Words } from "../components/Split.jsx";
import { FloorPlan, FloorPlate } from "../components/Plans.jsx";
import { FLOORS, PLANS, PLATES, TYPE_COLORS, TOWER_GEO, FIRST_FLOOR, LAST_FLOOR } from "../data/content.js";
const Home3D = lazy(() => import("../components/home3d/Home3D.jsx"));

// 03 — Explore Residences.
// Tower render with every residential floor selectable (hover = highlight band, click = enter floor).
// Floor view shows every home on that floor with its rooms; click a home = its full plan (2D / 3D).
export default function Explore() {
  const root = useRef(null);
  const [hoverFloor, setHoverFloor] = useState(null);
  const [floorN, setFloorN] = useState(null);   // entered floor number
  const [unit, setUnit] = useState(null);

  const { w: GW, h: GH, left, right, top, bottom, roofTop } = TOWER_GEO;
  const count = LAST_FLOOR - FIRST_FLOOR + 1;
  const resi = count - 1;                       // last level is the rooftop
  const fh = (bottom - top) / resi;
  const band = (n) => n === LAST_FLOOR
    ? { y: roofTop, h: top - roofTop }
    : { y: bottom - (n - FIRST_FLOOR + 1) * fh, h: fh };

  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=160%", scrub: 0.6, pin: true }, defaults: { ease: "none" } });
    tl.fromTo(".explore .stage", { scale: 1.18 }, { scale: 1, duration: 0.5 }, 0)
      .fromTo(".explore .scan", { top: "0%", opacity: 1 }, { top: "100%", duration: 0.35 }, 0.1)
      .to(".explore .scan", { opacity: 0, duration: 0.05 }, 0.45)
      .fromTo(".explore .band", { opacity: 0 }, { opacity: 1, stagger: { each: 0.008, from: "start" }, duration: 0.05 }, 0.12)
      .fromTo(".explore .rail", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.2 }, 0.5)
      .to({}, { duration: 0.3 });
    gsap.from(".explore .intro h2 .w > span", { yPercent: 110, stagger: 0.08, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 60%" } });
  }, { scope: root });

  const enter = (n) => { setHoverFloor(null); setFloorN(n); };
  const floor = floorN ? FLOORS.find((f) => f.n === floorN) : null;

  return (
    <section className="explore pin" id="residences" ref={root}>
      {/* stage keeps the render's 4:3 ratio so the floor bands stay locked to the building */}
      <div className="backdrop"><Img k="residence" eager /></div>
      <div className="stage">
        <Img k="residence" eager />
        <svg className="bands" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none">
          {FLOORS.map((f) => (
            <rect
              key={f.n} className={`band ${hoverFloor === f.n ? "on" : ""}`}
              x={left - 8} y={band(f.n).y} width={right - left + 16} height={band(f.n).h}
              fill={TYPE_COLORS[PLATES[f.plate].units[0][1]]}
              onMouseEnter={() => setHoverFloor(f.n)} onMouseLeave={() => setHoverFloor(null)}
              onClick={() => enter(f.n)} data-cursor={`L${String(f.n).padStart(2, "0")}`}
            />
          ))}
        </svg>
      </div>
      <div className="fill shade" />
      <div className="scan" />

      <div className="intro">
        <h2><Words text={"Find your\n*floor.*"} /></h2>
        <p>Hover the building · click a floor to step inside</p>
        <div className="hover-info">
          {hoverFloor ? (
            <>
              <b>Level {String(hoverFloor).padStart(2, "0")}</b>
              <span>{FLOORS.find((f) => f.n === hoverFloor).units.length} residences · {PLATES[FLOORS.find((f) => f.n === hoverFloor).plate].name}</span>
            </>
          ) : (
            <><b>{resi} floors + rooftop</b><span>Studios · 1, 2 & 3 BHK · Penthouses · Rooftop pool</span></>
          )}
        </div>
      </div>

      <div className="rail" data-lenis-prevent>
        {[...FLOORS].reverse().map((f) => (
          <button key={f.n} className={hoverFloor === f.n ? "on" : ""} onMouseEnter={() => setHoverFloor(f.n)} onMouseLeave={() => setHoverFloor(null)} onClick={() => enter(f.n)}>
            <span>{f.n === LAST_FLOOR ? "ROOF" : `L${String(f.n).padStart(2, "0")}`}</span>
            <i style={{ background: TYPE_COLORS[PLATES[f.plate].units[0][1]] }} />
          </button>
        ))}
      </div>

      {createPortal(<FloorView floor={floor} setFloorN={setFloorN} onPick={setUnit} unit={unit} />, document.body)}
      {createPortal(<UnitModal unit={unit} floor={floor} onClose={() => setUnit(null)} />, document.body)}
    </section>
  );
}

// Full-screen floor view: whole plate with every home + its rooms. Up/down through all floors.
function FloorView({ floor, setFloorN, onPick, unit }) {
  const el = useRef(null);
  const [hover, setHover] = useState(null);
  const shown = useRef(false);

  useEffect(() => {
    const m = el.current;
    if (floor && !shown.current) {
      shown.current = true; lockScroll(true);
      gsap.set(m, { visibility: "visible" });
      gsap.timeline()
        .fromTo(m, { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" })
        .fromTo(m.querySelector(".fv-plate"), { scale: 0.85, rotateX: 35, opacity: 0 }, { scale: 1, rotateX: 0, opacity: 1, duration: 1.2, ease: "expo.out" }, 0.4)
        .fromTo(m.querySelectorAll(".fv-side > *"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.8, ease: "power3.out" }, 0.5);
    } else if (floor && shown.current) {
      gsap.fromTo(m.querySelectorAll(".unit-g"), { opacity: 0 }, { opacity: 1, stagger: 0.05, duration: 0.5 });
      gsap.fromTo(m.querySelector(".fv-num"), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
    } else if (!floor && shown.current) {
      shown.current = false;
      gsap.to(m, { clipPath: "inset(50% 0% 50% 0%)", duration: 0.8, ease: "expo.inOut", onComplete: () => { gsap.set(m, { visibility: "hidden" }); lockScroll(false); } });
    }
  }, [floor?.n]);

  useEffect(() => {
    const k = (e) => {
      if (!floor || unit) return;
      if (e.key === "Escape") setFloorN(null);
      if (e.key === "ArrowUp") setFloorN((n) => Math.min(LAST_FLOOR, n + 1));
      if (e.key === "ArrowDown") setFloorN((n) => Math.max(FIRST_FLOOR, n - 1));
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [floor, unit]);

  const mix = floor ? Object.entries(floor.units.reduce((a, u) => ((a[u.plan] = (a[u.plan] || 0) + 1), a), {})) : [];
  const h = floor && hover ? floor.units.find((u) => u.id === hover) : null;

  return (
    <div className="floor-view" ref={el} style={{ visibility: "hidden" }}>
      <div className="fv-side">
        <button className="eyebrow fv-back" onClick={() => setFloorN(null)}>← Back to building</button>
        <div className="fv-num serif">{floor?.label}</div>
        <div className="eyebrow muted">{floor && PLATES[floor.plate].name} · {floor?.units.length} residences</div>
        <div className="fv-step">
          <button onClick={() => setFloorN((n) => Math.min(LAST_FLOOR, n + 1))} disabled={floor?.n === LAST_FLOOR}>↑ Floor up</button>
          <button onClick={() => setFloorN((n) => Math.max(FIRST_FLOOR, n - 1))} disabled={floor?.n === FIRST_FLOOR}>↓ Floor down</button>
        </div>
        <div className="fv-legend">
          {mix.map(([plan, c]) => (
            <span key={plan}><i style={{ background: TYPE_COLORS[plan] }} />{PLANS[plan].title.replace("\n", " ")}<em>× {c}</em></span>
          ))}
        </div>
        <div className="fv-hover">
          {h ? (<><b>Residence {h.id}</b><span>{PLANS[h.plan].title.replace("\n", " ")} · {PLANS[h.plan].specs[2][1]}</span></>)
             : (<><b>Select a home</b><span>Hover to preview, click to open its plan</span></>)}
        </div>
      </div>
      <div className="fv-plate">{floor && <FloorPlate floor={floor} onPick={onPick} active={unit?.id} hover={hover} setHover={setHover} showCore={PLATES[floor.plate].core !== false} />}</div>
      <div className="fv-mini">
        {[...FLOORS].reverse().map((f) => (
          <button key={f.n} className={f.n === floor?.n ? "on" : ""} onClick={() => setFloorN(f.n)} title={f.label} />
        ))}
      </div>
    </div>
  );
}

function UnitModal({ unit, floor, onClose }) {
  const el = useRef(null);
  const [is3d, set3d] = useState(true);
  const plan = unit ? PLANS[unit.plan] : null;

  useEffect(() => {
    const m = el.current;
    if (unit) {
      set3d(true);
      gsap.set(m, { visibility: "visible" });
      gsap.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      gsap.from(m.querySelectorAll(".side > *"), { opacity: 0, y: 24, stagger: 0.06, duration: 0.9, ease: "power3.out", delay: 0.2 });
    } else if (m.style.visibility === "visible") {
      gsap.to(m, { opacity: 0, duration: 0.5, onComplete: () => gsap.set(m, { visibility: "hidden" }) });
    }
  }, [unit]);

  useEffect(() => {
    if (!unit || is3d) return;
    const sheet = el.current.querySelector(".sheet");
    if (sheet) gsap.fromTo(sheet, { rotateX: 48, rotateZ: -12, y: 120, opacity: 0 }, { rotateX: 22, rotateZ: -6, y: 0, opacity: 1, duration: 1.2, ease: "expo.out" });
  }, [is3d, unit]);

  useEffect(() => {
    const k = (e) => unit && e.key === "Escape" && onClose();
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [unit, onClose]);

  return (
    <div className="unit-modal" ref={el} role="dialog" aria-modal="true">
      <button className="pill close" onClick={onClose}>Close ✕</button>
      <div className="side">
        <div className="crumb"><button onClick={onClose}>← Back to {floor?.label}</button></div>
        <h3>{plan?.title}</h3>
        <div className="type">{plan?.type} · Residence {unit?.id}</div>
        <div className="specs">{plan?.specs.map(([a, b]) => <div key={a}><span>{a}</span><span>{b}</span></div>)}</div>
        <div className="actions">
          <button className="pill" onClick={() => set3d((v) => !v)}>{is3d ? "View floor plan" : "View in 3D"} <span>↻</span></button>
          <a className="pill" href="#contact" onClick={onClose}>Enquire <span>→</span></a>
        </div>
      </div>
      <div className="stage">
        {plan && is3d && (
          <div className="view3d">
            <Suspense fallback={<div className="h3d-loading">Building your home…</div>}>
              <Home3D key={unit.id} plan={plan} />
            </Suspense>
            <div className="h3d-hint">Drag to look around · Scroll to zoom</div>
          </div>
        )}
        {plan && !is3d && (
          <div className="sheet">
            <div className="north">N ↑</div>
            <div className="stack"><div style={{ position: "absolute", inset: 0 }}><FloorPlan plan={plan} /></div></div>
            <div className="tag">{plan.type} · Indicative layout</div>
            <div className="key">{plan.specs[2][1]}<br />Total area</div>
          </div>
        )}
      </div>
    </div>
  );
}
