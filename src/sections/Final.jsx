import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Words } from "../components/Split.jsx";
import { FloorPlan } from "../components/Plans.jsx";
import { PLANS, REACH, BRAND } from "../data/content.js";

// 12 — Dark green: "The luxury of coming home." Floating collage.
export function ComingHome() {
  const root = useRef(null);
  const tiles = [
    ["living", { left: "4%", top: "30%", width: "30%", aspectRatio: "1.3" }, 0.25],
    ["kitchen2", { left: "40%", top: "4%", width: "24%", aspectRatio: ".8" }, -0.15],
    ["arrive3", { left: "70%", top: "22%", width: "26%", aspectRatio: ".75" }, 0.35],
    ["bedroom2", { left: "22%", top: "64%", width: "22%", aspectRatio: ".8" }, -0.3],
  ];
  return (
    <section className="home" ref={root}>
      <div className="eyebrow" style={{ opacity: 0.6 }}>04 — The residences</div>
      <h2 style={{ marginTop: "1.4rem" }} data-reveal><Words text={"Every evening,\n*a* *homecoming.*"} /></h2>
      <div className="collage">
        {tiles.filter((t) => t[1]).map(([k, st, sp]) => (
          <div key={k} className="media par" data-speed={sp} style={st} data-clip><Img k={k} className="par-img" /></div>
        ))}
        <div className="media par" data-speed="0.15" style={{ left: "52%", top: "58%", width: "34%", aspectRatio: "1.45" }} data-clip><Img k="kitchen" className="par-img" /></div>
      </div>
      <div className="notes">
        <div data-fade><b>Natural light</b>Floor-to-ceiling glazing and deep balconies in every home.</div>
        <div data-fade><b>Thoughtful layouts</b>Separate living and sleeping zones, generous storage, a study in every 1 BHK.</div>
        <div data-fade><b>Considered finishes</b>Engineered oak, honed stone and brushed bronze throughout.</div>
      </div>
    </section>
  );
}

// 13 — Kitchen: "Italian. Intuitive. Open."
export function Kitchen() {
  return (
    <section className="kit light">
      <div className="sticky">
        <div className="media" style={{ aspectRatio: ".9" }} data-clip><Img k="kitchen3" className="par-img" /></div>
        <p className="small muted" style={{ marginTop: "1rem" }}>The kitchen — where every party ends up.</p>
      </div>
      <div className="words">
        <div><h3 data-reveal><Words text={"Crafted"} /></h3><p data-fade>Italian cabinetry, stone worktops and fully integrated appliances.</p></div>
        <div><h3 data-reveal><Words text={"*Considered*"} /></h3><p data-fade>Every drawer, light and socket exactly where your hands expect it.</p></div>
        <div><h3 data-reveal><Words text={"Connected"} /></h3><p data-fade>Islands face the living room — the cook is never left out of the conversation.</p></div>
      </div>
    </section>
  );
}

// 14 — Community band + "Everything, within reach."
export function Reach() {
  return (
    <>
      <section className="band">
        <div className="serif">Close to everything.<br /><span className="it">Removed from the noise.</span></div>
        <div data-fade><b>3 min</b><span>Metro station</span></div>
        <div data-fade><b>5 min</b><span>Schools</span></div>
        <div data-fade><b>6 min</b><span>Waterfront</span></div>
        <div data-fade><b>22 min</b><span>Airport</span></div>
      </section>
      <section className="reach light" id="location">
        <div className="eyebrow" style={{ color: "#8a8378" }}>05 — Location</div>
        <h2 style={{ marginTop: "1.4rem" }} data-reveal><Words text={"The city,\n*on* *your* *terms.*"} /></h2>
        <ol>{REACH.map(([n, name, t]) => <li key={n} data-fade><span>{n}</span><b>{name}</b><em>{t}</em></li>)}</ol>
      </section>
    </>
  );
}

// 15 — The two-bedroom "film": a scripted walkthrough (photo → plan fly-through).
export function Tour() {
  const root = useRef(null);
  const tl = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [sub, setSub] = useState("A walk through the two-bedroom");
  useGSAP(() => {
    const scenes = [
      [0.42, 0.55, "Living and dining, one long view"],
      [0.78, 0.35, "A master suite with its own dressing room"],
      [0.25, 0.75, "A second bedroom for family or guests"],
      [0.5, 0.88, "Opening onto a full-width balcony"],
    ];
    const t = gsap.timeline({ paused: true, onComplete: () => setPlaying(false) });
    t.to(".tour .play", { opacity: 0, scale: 0.8, duration: 0.4 })
      .fromTo(".tour .media .img", { scale: 1 }, { scale: 1.18, duration: 3, ease: "none" }, 0)
      .to(".tour .planwrap", { opacity: 1, duration: 0.8 }, 2.6)
      .fromTo(".tour .planwrap svg", { scale: 0.75, xPercent: 0, yPercent: 0 }, { scale: 0.9, duration: 1.2, ease: "power2.inOut" }, 2.6);
    scenes.forEach(([x, y, s], i) => {
      t.add(() => setSub(s), 3.8 + i * 2.4)
        .to(".tour .planwrap svg", { scale: 2.1, xPercent: (0.5 - x) * 100, yPercent: (0.5 - y) * 100, duration: 2.2, ease: "power2.inOut" }, 3.8 + i * 2.4);
    });
    t.to(".tour .planwrap svg", { scale: 0.85, xPercent: 0, yPercent: 0, duration: 1.6, ease: "power2.inOut" })
      .add(() => setSub("The Two-Bedroom · 1,240 sq ft"))
      .to(".tour .play", { opacity: 1, scale: 1, duration: 0.4 }, "+=0.6");
    t.eventCallback("onUpdate", () => gsap.set(".tour .bar i b", { scaleX: t.progress() }));
    tl.current = t;
  }, { scope: root });

  const toggle = () => {
    const t = tl.current; if (!t) return;
    if (t.progress() === 1) { t.restart(); setPlaying(true); setSub("A walk through the two-bedroom"); return; }
    t.paused() ? (t.play(), setPlaying(true)) : (t.pause(), setPlaying(false));
  };

  return (
    <section className="tour" ref={root}>
      <div className="player" onClick={toggle} data-cursor={playing ? "Pause" : "Play"}>
        <div className="media"><Img k="living" /></div>
        <div className="planwrap"><FloorPlan plan={PLANS["2bhk"]} /></div>
        <div className="lbl">02 Bedroom<br />floor layout</div>
        <div className="sub">{sub}</div>
        <div className="play" aria-label={playing ? "Pause" : "Play"}>
          <svg width="16" viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z" fill="#fff" /></svg>
        </div>
        <div className="bar"><span>{playing ? "❚❚" : "▶"}</span><i><b /></i><span>0:18</span></div>
      </div>
      <div className="eyebrow" style={{ marginTop: "2.4rem" }}>Residence film</div>
      <h3>The Two-Bedroom</h3>
    </section>
  );
}

// 16 — Finale: giant PARVA with an arch window that opens onto the tower.
export function Finale() {
  const root = useRef(null);
  useGSAP(() => {
    // the arch window's rectangle (matches the CSS sizes)
    const arch = () => innerWidth <= 900
      ? { l: innerWidth * 0.27, t: innerHeight / 2 - innerWidth * 0.3, w: innerWidth * 0.46, h: innerWidth * 0.7 }
      : { l: innerWidth * 0.39, t: innerHeight / 2 - innerWidth * 0.15, w: innerWidth * 0.22, h: innerWidth * 0.34 };
    gsap.set(".finale .window", { clipPath: () => { const a = arch(); return `inset(${a.t}px ${innerWidth - a.l - a.w}px ${innerHeight - a.t - a.h}px ${a.l}px round ${a.w / 2}px)`; } });
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=200%", scrub: 0.6, pin: true, invalidateOnRefresh: true }, defaults: { ease: "none" } });
    tl.from(".finale .word", { yPercent: 20, opacity: 0, duration: 0.2 }, 0)
      .fromTo(".finale .window", { y: () => innerHeight * 0.35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2 }, 0.05)
      .fromTo(".finale .window .img", { scale: 1.5 }, { scale: 1, duration: 0.6 }, 0.05)
      .fromTo(".finale .window",
        { clipPath: () => { const a = arch(); return `inset(${a.t}px ${innerWidth - a.l - a.w}px ${innerHeight - a.t - a.h}px ${a.l}px round ${a.w / 2}px)`; } },
        { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", duration: 0.4, ease: "power2.inOut", immediateRender: false }, 0.4)
      .to(".finale .word", { letterSpacing: "0.2em", opacity: 0, duration: 0.3 }, 0.42)
      .to(".finale .tagline", { opacity: 0, duration: 0.1 }, 0.4)
      .to(".finale .endcard", { opacity: 1, duration: 0.15 }, 0.82);
  }, { scope: root });
  return (
    <section className="finale pin" ref={root}>
      <div className="word">Parva</div>
      <div className="window"><div className="media"><Img k="residence" /></div></div>
      <div className="tagline">Celebrate <span className="it">the everyday.</span></div>
      <div className="endcard">
        <div><div className="eyebrow" style={{ opacity: 0.8 }}>Now registering</div><h3 style={{ marginTop: ".8rem" }}>Parva<br />Residences</h3></div>
        <div className="dev"><span className="eyebrow" style={{ opacity: 0.7 }}>Developed by</span><b>PARVA</b><span className="eyebrow" style={{ opacity: 0.7 }}>Realty</span></div>
      </div>
    </section>
  );
}

// 17 — Enquiry + footer
export function Contact() {
  const [note, setNote] = useState("");
  return (
    <section className="contact" id="contact">
      <div className="top">
        <div>
          <div className="eyebrow" style={{ opacity: 0.6 }}>06 — Enquire</div>
          <h2 style={{ marginTop: "1.4rem" }} data-reveal><Words text={"Let's find\n*your* *floor.*"} /></h2>
          <p className="small muted" style={{ marginTop: "2rem", maxWidth: "26rem" }}>Private viewings at our sales gallery, or the brochure and price list in your inbox within the hour.</p>
          <p className="small" style={{ marginTop: "2rem" }}>{BRAND.phone}<br />{BRAND.email}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setNote("Thank you — we'll be in touch. (Connect this form to your CRM before launch.)"); }}>
          <label>Full name<input required name="name" autoComplete="name" /></label>
          <label>Phone<input required name="phone" type="tel" autoComplete="tel" /></label>
          <label>Email<input required name="email" type="email" autoComplete="email" /></label>
          <label>Interested in<select name="type">{Object.values(PLANS).map((p) => <option key={p.title}>{p.title.replace("\n", " ")}</option>)}</select></label>
          <label className="full">Message<textarea name="msg" rows="3" /></label>
          <div className="actions"><button className="pill" type="submit">Send enquiry <span>→</span></button><span className="small muted">{note}</span></div>
        </form>
      </div>
      <div className="foot">
        <div className="logo">Parvā</div>
        <div>{BRAND.developer} · Sales gallery</div>
        <div>© {new Date().getFullYear()} {BRAND.developer}</div>
        <div>Images indicative only</div>
      </div>
    </section>
  );
}
