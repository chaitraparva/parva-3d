import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import Spots from "../components/Spots.jsx";
import { Chars } from "../components/Split.jsx";

// 02 — Arrival. Opens on the lobby
// (materials called out with hotspots), the lounge rises in as a capsule card, then the
// residents' lounge opens out to fill the screen.
const LOBBY = [
  { x: 0.46, y: 0.24, label: "Fluted oak screens", sub: "Floor to 9 m ceiling" },
  { x: 0.405, y: 0.6, label: "Book-matched travertine", sub: "Hand-selected slabs" },
  { x: 0.84, y: 0.46, label: "Garden glazing", sub: "A courtyard on three sides" },
];
const LOUNGE = [
  { x: 0.2, y: 0.42, label: "Backlit gallery niche", sub: "Rotating local art" },
  { x: 0.62, y: 0.6, label: "Curved bouclé lounge", sub: "Seats twelve" },
  { x: 0.82, y: 0.3, label: "Walnut-panelled walls", sub: "Acoustic, warm, quiet" },
];

export default function Arrival() {
  const root = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "+=340%", scrub: 0.6, pin: true, anticipatePin: 1 },
      defaults: { ease: "none" },
    });
    // 1 · doors part onto the lobby
    tl.fromTo(".arrival .a1 .zoom", { scale: 1.12 }, { scale: 1, duration: 0.3 }, 0)
      .fromTo(".arrival .a1 .veil", { opacity: 0.35 }, { opacity: 0.12, duration: 0.2 }, 0)
      .fromTo(".arrival .chap > *", { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.02, duration: 0.06 }, 0.2)
      .fromTo(".arrival .l1 .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.004, duration: 0.1, ease: "power3.out" }, 0.22)
      .fromTo(".arrival .a1 .spot", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, stagger: 0.03, duration: 0.06, ease: "back.out(2)" }, 0.26)
      // 2 · lounge card rises; lobby dims
      .to(".arrival .a1 .spot", { autoAlpha: 0, duration: 0.05 }, 0.42)
      .to(".arrival .a1 .zoom", { scale: 1.1, duration: 0.24 }, 0.42)
      .to(".arrival .a1 .veil", { opacity: 0.55, duration: 0.14 }, 0.42)
      .fromTo(".arrival .card", { yPercent: 70, rotate: 4, autoAlpha: 0 }, { yPercent: 0, rotate: 0, autoAlpha: 1, duration: 0.18, ease: "power3.out" }, 0.42)
      .fromTo(".arrival .card .img", { scale: 1.4 }, { scale: 1.05, duration: 0.3 }, 0.42)
      .fromTo(".arrival .cap > *", { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.02, duration: 0.07 }, 0.52)
      // 3 · the residents' lounge opens out
      .set(".arrival .a3", { autoAlpha: 1 }, 0.639)
      .fromTo(".arrival .a3", { clipPath: "inset(42% 44% 42% 44% round 40vh)" }, { clipPath: "inset(0% 0% 0% 0% round 0vh)", duration: 0.22, ease: "power2.inOut" }, 0.64)
      .fromTo(".arrival .a3 .zoom", { scale: 1.6 }, { scale: 1, duration: 0.26 }, 0.64)
      .to(".arrival .l1, .arrival .card, .arrival .cap, .arrival .chap", { autoAlpha: 0, duration: 0.06 }, 0.66)
      .fromTo(".arrival .a3 .spot", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, stagger: 0.03, duration: 0.06, ease: "back.out(2)" }, 0.86)
      .fromTo(".arrival .l2 .c", { yPercent: 110 }, { yPercent: 0, stagger: 0.004, duration: 0.1, ease: "power3.out" }, 0.86)
      .fromTo(".arrival .facts > *", { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.02, duration: 0.06 }, 0.92)
      .to({}, { duration: 0.08 });
  }, { scope: root });

  return (
    <section className="arrival pin" ref={root} data-chapter="02|Arrival">
      <div className="fill media a1">
        <div className="zoom fill"><Img k="arrive1" /><Spots aspect={4 / 3} spots={LOBBY} /></div>
        <div className="fill veil" />
      </div>

      <div className="chap"><span>02</span><span>The arrival</span><span>Ground floor</span></div>
      <div className="line l1"><Chars text={"Arrive like"} /><br /><span className="it"><Chars text={"a guest."} /></span></div>
      <figure className="card media"><Img k="arrive2" sizes="(max-width: 900px) 60vw, 30vw" /></figure>
      <div className="cap">
        <em>02 / 03</em>
        <b>The lounge</b>
        <span>Marble, low light and nowhere to be. Coffee is on the house, every morning.</span>
      </div>

      <div className="fill media a3">
        <div className="zoom fill"><Img k="arrive3" /><Spots aspect={1000 / 899} spots={LOUNGE} /></div>
        <div className="fill a3-shade" />
      </div>
      <div className="line l2"><Chars text={"Stay like you"} /><br /><span className="it"><Chars text={"own the place."} /></span></div>
      <div className="facts"><span>Double-height lobby</span><span>24/7 concierge</span><span>Valet</span><span>Residents' lounge</span></div>

    </section>
  );
}
