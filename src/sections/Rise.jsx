import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import { Chars } from "../components/Split.jsx";
import Img from "../components/Img.jsx";
import { FloorView, UnitModal } from "./Explore.jsx";
import { FLOORS, PLATES, TYPE_COLORS, LAST_FLOOR } from "../data/content.js";

// 01 — The Rise. One continuous, scroll-driven 3D shot:
// clouds → Dubai from above → the tower is built floor by floor → rooftop → dusk → pick a floor.
const SCENE_END = 0.9;     // last 10% of the scroll holds the explorer still

const STAGES = [
  [0.0, "Groundwork", "The plot is cleared and the foundations go in."],
  [0.06, "Structure", "Columns, core and slabs — one level at a time."],
  [0.45, "Façade", "Glass, bronze fins and balconies follow the frame."],
  [0.9, "Topping out", "The rooftop pool is the last thing to arrive."],
];

export default function Rise({ ready }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const world = useRef(null);
  const target = useRef(0);
  const hud = useRef({});
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(null);
  const [floorN, setFloorN] = useState(null);
  const [unit, setUnit] = useState(null);
  const [exploring, setExploring] = useState(false);

  // ---- WebGL world + render loop (runs only while the section is on screen) ----
  useEffect(() => {
    let w, raf = 0, alive = true, inView = true, cur = 0, last = performance.now();
    const mobile = matchMedia("(max-width: 900px), (hover: none)").matches;
    const boot = async () => {
      try {
        const { createWorld } = await import("../components/rise/world.js");
        if (!alive) return;
        w = createWorld(canvas.current, { mobile });
        world.current = w;
        const size = () => { const r = canvas.current.getBoundingClientRect(); w.resize(r.width, r.height); w.setMobileFrame(innerWidth < 900); };
        size(); addEventListener("resize", size);
        w.compile();
        const loop = (t) => {
          raf = requestAnimationFrame(loop);
          if (!inView) return;
          const dt = Math.min(0.05, (t - last) / 1000); last = t;
          cur += (target.current - cur) * (1 - Math.exp(-dt * 7));
          if (window.__riseSnap) cur = target.current;
          if (Math.abs(target.current - cur) < 0.00005) cur = target.current;
          w.setProgress(cur);
          w.render(t);
          drawHud(cur);
        };
        raf = requestAnimationFrame(loop);
        const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { rootMargin: "100px" });
        io.observe(root.current);
        w._cleanup = () => { io.disconnect(); removeEventListener("resize", size); };
      } catch (e) {
        console.warn("3D unavailable, falling back to image", e);
        setFailed(true);
      }
    };
    boot();
    return () => { alive = false; cancelAnimationFrame(raf); w?._cleanup?.(); w?.dispose(); };
  }, []);

  // level counter + stage captions, written straight to the DOM each frame
  const drawHud = (p) => {
    const h = hud.current;
    if (!h.num) return;
    const b = Math.min(1, Math.max(0, (p - 0.26) / (0.68 - 0.26)));
    const lvl = Math.min(15, Math.floor(b * 19));
    const txt = lvl >= 15 ? "RF" : String(lvl).padStart(2, "0");
    if (h.num.textContent !== txt) h.num.textContent = txt;
    h.bar.style.transform = `scaleY(${b})`;
    let s = STAGES[0]; for (const st of STAGES) if (b >= st[0]) s = st;
    if (h.stage.textContent !== s[1]) { h.stage.textContent = s[1]; h.note.textContent = s[2]; }
  };

  // ---- one long pinned scroll: progress feeds the 3D world; captions ride the same timeline ----
  useGSAP(() => {
    const at = (p) => p * SCENE_END;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root.current, start: "top top", end: "+=1000%", pin: true, scrub: 0.6, anticipatePin: 1,
        onUpdate: (st) => {
          target.current = Math.min(1, st.progress / SCENE_END);
          const ex = st.progress > at(0.9);
          setExploring((v) => (v === ex ? v : ex));
        },
      },
      defaults: { ease: "none" },
    });
    tl.set({}, {}, 1);
    window.__riseExplore = () => { const st = tl.scrollTrigger; return st.start + (st.end - st.start) * at(0.95); };
    // opening title
    tl.to(".rise .c-hero", { autoAlpha: 0, y: -60, duration: at(0.05) }, at(0.03))
      .to(".rise .cue", { autoAlpha: 0, duration: at(0.02) }, at(0.01))
      // Dubai, from above
      .fromTo(".rise .c-from .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.002, duration: at(0.04), ease: "power3.out" }, at(0.15))
      .fromTo(".rise .c-from p, .rise .c-from .eyebrow", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: at(0.03) }, at(0.17))
      .to(".rise .c-from", { autoAlpha: 0, y: -40, duration: at(0.03) }, at(0.22))
      // Ready to rise
      .fromTo(".rise .c-ready .c", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.003, duration: at(0.04), ease: "power3.out" }, at(0.24))
      .to(".rise .c-ready", { autoAlpha: 0, scale: 1.08, duration: at(0.03) }, at(0.3))
      // construction HUD
      .fromTo(".rise .c-build", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: at(0.03) }, at(0.31))
      .to(".rise .c-build", { autoAlpha: 0, duration: at(0.03) }, at(0.68))
      // rooftop
      .fromTo(".rise .c-roof .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.002, duration: at(0.04), ease: "power3.out" }, at(0.64))
      .fromTo(".rise .c-roof p", { autoAlpha: 0 }, { autoAlpha: 1, duration: at(0.03) }, at(0.67))
      .to(".rise .c-roof", { autoAlpha: 0, duration: at(0.03) }, at(0.75))
      // dusk + numbers
      .fromTo(".rise .c-dusk .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.002, duration: at(0.04), ease: "power3.out" }, at(0.77))
      .fromTo(".rise .c-dusk .stats > div", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: at(0.008), duration: at(0.03) }, at(0.79))
      .to(".rise .c-dusk", { autoAlpha: 0, duration: at(0.03) }, at(0.86))
      // explorer
      .fromTo(".rise .c-explore", { autoAlpha: 0 }, { autoAlpha: 1, duration: at(0.03) }, at(0.89))
      .fromTo(".rise .c-explore h2 .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.002, duration: at(0.04), ease: "power3.out" }, at(0.89))
      .fromTo(".rise .rail", { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: at(0.04) }, at(0.91));
  }, { scope: root });

  // intro choreography after the loader
  useGSAP(() => {
    if (!ready) return;
    gsap.timeline()
      .from(".rise .c-hero .mark .c", { yPercent: 110, opacity: 0, stagger: 0.06, duration: 1.6, ease: "expo.out" }, 0.1)
      .from(".rise .c-hero .sub > *", { opacity: 0, y: 14, stagger: 0.1, duration: 1 }, 0.8)
      .from(".rise .cue", { opacity: 0, duration: 1 }, 1.2)
      .from(".rise .gl", { opacity: 0, duration: 2.4, ease: "power2.out" }, 0);
  }, { scope: root, dependencies: [ready] });

  // ---- explorer: hover / tap floors on the 3D tower ----
  const level = (e) => {
    const r = canvas.current.getBoundingClientRect();
    const k = world.current?.pick(e.clientX - r.left, e.clientY - r.top);
    return k >= 1 && k <= LAST_FLOOR ? k : null;
  };
  const onMove = (e) => {
    if (!exploring || e.pointerType === "touch") return;
    const k = level(e);
    if (k !== hover) { setHover(k); world.current?.setHover(k); }
  };
  const onClick = (e) => { if (!exploring) return; const k = level(e); if (k) { setHover(null); world.current?.setHover(null); setFloorN(k); } };
  const railHover = (k) => { setHover(k); world.current?.setHover(k); };

  const floor = floorN ? FLOORS.find((f) => f.n === floorN) : null;
  const hf = hover ? FLOORS.find((f) => f.n === hover) : null;

  return (
    <section className={`rise pin ${exploring ? "is-exploring" : ""} ${hover ? "is-hover" : ""}`} id="top" ref={root} data-chapter="01|The rise">
      {failed ? <div className="fill media"><Img k="residence" eager /></div> : (
        <canvas ref={canvas} className="gl" onPointerMove={onMove} onClick={onClick} onPointerLeave={() => { setHover(null); world.current?.setHover(null); }} />
      )}
      <div className="fill vignette" />
      <div className="fill leftshade" />
      <div id="residences" className="anchor" />

      <div className="c-hero">
        <div className="mark"><Chars text={"Parva"} /></div>
        <div className="sub"><span>Residences</span><i /><span className="it">Live in celebration</span><i /><span>Dubai</span></div>
      </div>
      <div className="cue">Scroll to descend<i /></div>

      <div className="c-from">
        <div className="eyebrow">01 — The address</div>
        <h2><Chars text={"Dubai,"} /><br /><span className="it"><Chars text={"from above."} /></span></h2>
        <p>Between the business district and the waterfront. Close to everything that matters, quietly removed from the noise.</p>
      </div>

      <div className="c-ready"><h2><Chars text={"Ready"} /><br /><span className="it"><Chars text={"to rise."} /></span></h2></div>

      <div className="c-build">
        <div className="lv"><span className="k">Level</span><b ref={(e) => (hud.current.num = e)}>00</b><span className="of">/ 14 + roof</span></div>
        <div className="st"><em ref={(e) => (hud.current.stage = e)}>Groundwork</em><span ref={(e) => (hud.current.note = e)}>The plot is cleared and the foundations go in.</span></div>
        <div className="track"><i ref={(e) => (hud.current.bar = e)} /></div>
      </div>

      <div className="c-roof">
        <h2><Chars text={"One rooftop."} /><br /><span className="it"><Chars text={"Fourteen floors beneath it."} /></span></h2>
        <p>An infinity pool, a pergola lounge and the whole city as the view.</p>
      </div>

      <div className="c-dusk">
        <h2><Chars text={"Lit from"} /><br /><span className="it"><Chars text={"within."} /></span></h2>
        <div className="stats">
          <div><b>14</b><span>Residential floors</span></div>
          <div><b>62</b><span>Residences</span></div>
          <div><b>1</b><span>Rooftop penthouse</span></div>
          <div><b>12</b><span>Amenities</span></div>
        </div>
      </div>

      <div className="c-explore">
        <div className="eyebrow">01 — The residences</div>
        <h2><Chars text={"Find your"} /><br /><span className="it"><Chars text={"floor."} /></span></h2>
        <p className="hint-d">Hover the tower · click a floor to step inside</p>
        <p className="hint-m">Tap a floor on the tower or the list</p>
        <div className="hover-info">
          {hf ? (<><b>{hf.label}</b><span>{hf.units.length} residences · {PLATES[hf.plate].name}</span></>)
              : (<><b>14 floors + rooftop</b><span>Studios · 1–4 BHK · Sky villa · Rooftop</span></>)}
        </div>
      </div>
      <div className="rail" data-lenis-prevent>
        {[...FLOORS].reverse().map((f) => (
          <button key={f.n} className={hover === f.n ? "on" : ""} onMouseEnter={() => railHover(f.n)} onMouseLeave={() => railHover(null)} onClick={() => setFloorN(f.n)}>
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
