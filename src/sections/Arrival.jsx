import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import Img from "../components/Img.jsx";

// 04 — Into the arrival lobby, through the lounge to the lift lobby. "Welcome to Parva".
// Smooth zoom + crossfades only (no boxes).
export default function Arrival() {
  const root = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=220%", scrub: 0.6, pin: true }, defaults: { ease: "none" } });
    tl.fromTo(".arrival .a1 .img", { scale: 1.25 }, { scale: 1, duration: 0.45 }, 0)
      .fromTo(".arrival .a2", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.32)
      .fromTo(".arrival .a2 .img", { scale: 1.35 }, { scale: 1.05, duration: 0.4 }, 0.32)
      .fromTo(".arrival .a3", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.62)
      .fromTo(".arrival .a3 .img", { scale: 1.2 }, { scale: 1, duration: 0.35 }, 0.62)
      .fromTo(".arrival .welcome", { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.15 }, 0.75)
      .to({}, { duration: 0.1 });
  }, { scope: root });

  return (
    <section className="arrival pin" ref={root}>
      <div className="fill media a1"><Img k="arrive1" /></div>
      <div className="fill media a2"><Img k="arrive2" /></div>
      <div className="fill media a3"><Img k="arrive3" /></div>
      <div className="welcome">
        <h3>Arrive like a guest. <span className="it">Stay like you own the place.</span></h3>
        <div className="eyebrow muted">Double-height lobby · 24/7 concierge · valet</div>
      </div>
    </section>
  );
}
