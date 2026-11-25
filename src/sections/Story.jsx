import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Chars } from "../components/Split.jsx";
import { AMENITIES, DAY } from "../data/content.js";

// 04 — Amenities. Full-screen photo per amenity; scrolling steps through all twelve.
export function Amenities() {
  const root = useRef(null);
  const [on, setOn] = useState(0);
  useGSAP(() => {
    const n = AMENITIES.length;
    const list = root.current.querySelector("ol");
    ScrollTrigger.create({
      trigger: root.current, start: "top top", end: `+=${n * 38}%`, pin: true, anticipatePin: 1,
      onUpdate: (s) => {
        const i = Math.min(n - 1, Math.floor(s.progress * n));
        if (i === list.__i) return;
        list.__i = i; setOn(i);
        const li = list.children[i];
        gsap.to(list, { y: -li.offsetTop + list.parentElement.clientHeight * 0.38, duration: 0.9, ease: "power3.out", overwrite: true });
      },
    });
    gsap.from(".am .head .c", { yPercent: 110, stagger: 0.02, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 60%" } });
  }, { scope: root });
  const a = AMENITIES[on];
  return (
    <section className="am pin" id="amenities" ref={root} data-chapter="04|Amenities">
      <div className="stack">
        {AMENITIES.map((x, i) => (
          <div key={x.name} className={`slide ${i === on ? "on" : ""} ${i < on ? "past" : ""}`}><Img k={x.img} /></div>
        ))}
      </div>
      <div className="fill shade" />
      <div className="head">
        <div className="eyebrow">04 — Amenities</div>
        <h2><Chars text={"A dozen reasons"} /> <span className="it"><Chars text={"to stay in."} /></span></h2>
      </div>
      <div className="now" key={on}>
        <div className="count"><b>{String(on + 1).padStart(2, "0")}</b><span>/ {AMENITIES.length}</span></div>
        <h3>{a.name}</h3>
        <p>{a.note}</p>
      </div>
      <div className="list-mask">
        <ol>
          {AMENITIES.map((x, i) => (
            <li key={x.name} className={i === on ? "on" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{x.name}</li>
          ))}
        </ol>
      </div>
      <div className="bar"><i style={{ transform: `scaleX(${(on + 1) / AMENITIES.length})` }} /></div>
    </section>
  );
}

// 05 — A day at Parva. Horizontal: morning to night, the page itself gets darker as the day goes.
export function Day() {
  const root = useRef(null);
  useGSAP(() => {
    const track = root.current.querySelector(".track");
    const dist = () => track.scrollWidth - innerWidth;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + dist() * 1.1, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      defaults: { ease: "none" },
    });
    tl.to(track, { x: () => -dist(), duration: 1 }, 0)
      // the page itself goes from morning cream → golden hour → dusk → night
      .fromTo(root.current, { backgroundColor: "#f2ebe0", color: "#1a1916" }, { keyframes: [
        { backgroundColor: "#f4e4c8", duration: 0.35 },
        { backgroundColor: "#ecc39b", duration: 0.25 },
        { backgroundColor: "#5a4566", color: "#f2ebe0", duration: 0.18 },
        { backgroundColor: "#11152b", duration: 0.22 },
      ], duration: 1 }, 0);
    // sun travels along the arc (quadratic curve 0,118 → 500,-60 → 1000,118 in a 1000×120 box)
    const arc = root.current.querySelector(".arc"), sun = root.current.querySelector(".sun");
    const st = { t: 0 };
    tl.to(st, { t: 1, duration: 1, onUpdate: () => {
      const t = st.t, w = arc.clientWidth, h = arc.clientHeight;
      const x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * 500 + t * t * 1000;
      const y = (1 - t) * (1 - t) * 118 + 2 * (1 - t) * t * -60 + t * t * 118;
      sun.style.transform = `translate(${(x / 1000) * w}px, ${(y / 120) * h}px)`;
      sun.style.setProperty("--night", Math.max(0, (t - 0.65) / 0.35));
    } }, 0);
    // per-panel parallax inside the moving track
    root.current.querySelectorAll(".panel .media .img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -8, scale: 1.18 }, { xPercent: 8, scale: 1.18, ease: "none",
        scrollTrigger: { trigger: img.closest(".panel"), containerAnimation: tl, start: "left right", end: "right left", scrub: true } });
    });
    root.current.querySelectorAll(".panel").forEach((p) => {
      gsap.from(p.querySelectorAll(".time, h3, p"), { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: p, containerAnimation: tl, start: "left 75%" } });
    });
  }, { scope: root });
  return (
    <section className="day pin" id="life" ref={root} data-chapter="05|A day at Parva">
      <div className="arc">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none"><path d="M0,118 Q500,-60 1000,118" /></svg>
        <div className="sun" />
        <div className="parts"><span>Morning</span><span>Midday</span><span>Evening</span><span>Night</span></div>
      </div>
      <div className="track">
        <div className="panel intro">
          <div className="eyebrow">05 — A day at Parva</div>
          <h2><Chars text={"Every day,"} /><br /><span className="it"><Chars text={"a small celebration."} /></span></h2>
          <p>From first coffee to the last light on the terrace. Scroll through a day in the building.</p>
        </div>
        {DAY.map((d, i) => (
          <div className={`panel ${i % 2 ? "lo" : "hi"}`} key={d.time}>
            <div className="media"><Img k={d.img} sizes="(max-width: 900px) 90vw, 55vw" /></div>
            <div className="txt">
              <div className="time">{d.time}<em>{d.part}</em></div>
              <h3>{d.title}</h3>
              <p>{d.text}</p>
            </div>
          </div>
        ))}
        <div className="panel outro"><h2><span className="it">Goodnight,</span><br />Parva.</h2></div>
      </div>
    </section>
  );
}
