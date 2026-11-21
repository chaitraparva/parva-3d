import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import { Chars } from "../components/Split.jsx";
import { VIDEOS } from "../data/images.js";

// 01 — The drone film plays INSIDE a giant PARVA wordmark cut out of the dark.
// Scroll flies the camera through the letters until the footage fills the screen,
// then the brand line arrives over the moving city.
export default function Hero({ ready }) {
  const root = useRef(null);
  const vid = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "+=260%", scrub: 0.6, pin: true, anticipatePin: 1 },
      defaults: { ease: "none" },
    });
    tl.to(".hero .ko-word", { scale: 14, duration: 0.45, ease: "power2.in" }, 0)
      .to(".hero .knockout", { opacity: 0, duration: 0.12 }, 0.33)
      .to(".hero .ko-side", { opacity: 0, y: -20, duration: 0.1 }, 0)
      .to(".hero .cue", { opacity: 0, duration: 0.05 }, 0)
      .fromTo(".hero .film", { scale: 1.35 }, { scale: 1, duration: 0.6 }, 0)
      .fromTo(".hero .tint", { opacity: 0 }, { opacity: 0.38, duration: 0.15 }, 0.45)
      .fromTo(".hero .rise h2 .c", { opacity: 0, yPercent: 70 }, { opacity: 1, yPercent: 0, stagger: 0.012, duration: 0.16, ease: "power2.out" }, 0.48)
      .fromTo(".hero .rise p, .hero .rise .eyebrow", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12 }, 0.62)
      .to({}, { duration: 0.15 })
      .to(".hero .rise", { yPercent: -14, opacity: 0, duration: 0.14 }, 0.86);
  }, { scope: root });

  useGSAP(() => {
    if (!ready) return;
    vid.current?.play?.().catch(() => {});
    gsap.timeline()
      .from(".hero .ko-word .c", { yPercent: 100, opacity: 0, stagger: 0.07, duration: 1.6, ease: "expo.out" }, 0.1)
      .from(".hero .ko-side > *", { opacity: 0, y: 16, stagger: 0.08, duration: 1 }, 0.9)
      .from(".hero .cue", { opacity: 0, duration: 1 }, 1.3);
  }, { scope: root, dependencies: [ready] });

  return (
    <section className="hero pin" id="top" ref={root}>
      <div className="film">
        <video
          ref={vid}
          className="film-video"
          src={VIDEOS.hero.src}
          poster={VIDEOS.hero.poster}
          muted playsInline loop autoPlay preload="auto"
          onCanPlay={(e) => e.currentTarget.classList.add("ready")}
        />
      </div>
      <div className="fill tint" />
      <div className="fill grade" />

      {/* black sheet with white letters + multiply blend = the film shows only through the letters */}
      <div className="knockout" aria-hidden="true">
        <div className="ko-word"><Chars text={"PARVA"} /></div>
      </div>
      <div className="ko-side">
        <span>Private residences</span>
        <span className="it">est. 2026</span>
        <span>Dubai · UAE</span>
      </div>

      <div className="rise">
        <div>
          <div className="eyebrow">Parva Residences</div>
          <h2><Chars text={"Live in"} /><br /><span className="it"><Chars text={"celebration."} /></span></h2>
          <p>Parva is Sanskrit for a celebration. Fourteen floors and a rooftop, built around the idea that an ordinary Tuesday deserves to feel like an occasion.</p>
        </div>
      </div>
      <h1 className="sr-only">Parva Residences, Dubai</h1>
      <div className="cue">Scroll to fly in<i /></div>
    </section>
  );
}
