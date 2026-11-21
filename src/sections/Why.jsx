import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Words } from "../components/Split.jsx";

// 02 — "Why here?" One fixed photo; only the words change as you scroll.
const SLIDES = [
  { eyebrow: "01 — The address", title: "Why\nhere?", text: "Minutes from the business district, the waterfront and the city's best schools — yet set back from the noise." },
  { eyebrow: "02 — The building", title: "Fourteen\n*floors.* *One* *rooftop.*", text: "Studios to a five-bedroom sky villa across 14 floors, crowned by a rooftop penthouse with its own infinity pool." },
  { eyebrow: "03 — The long view", title: "Built for\n*the* *decades* *ahead.*", text: "Chosen for how it will feel in twenty years, not just today. Quiet streets, green edges, lasting value." },
];

export default function Why() {
  const root = useRef(null);
  useGSAP(() => {
    const slides = gsap.utils.toArray(".why .slide");
    gsap.set(slides.slice(1), { autoAlpha: 0 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: `+=${SLIDES.length * 70}%`, scrub: 0.6, pin: true } });
    slides.forEach((s, i) => {
      if (i === 0) return;
      const prev = slides[i - 1];
      tl.to(prev.querySelectorAll(".w > span"), { yPercent: -110, stagger: 0.03, duration: 0.4, ease: "power2.in" })
        .to(prev.querySelectorAll("p, .eyebrow"), { opacity: 0, y: -20, duration: 0.3 }, "<")
        .set(prev, { autoAlpha: 0 })
        .set(s, { autoAlpha: 1 })
        .fromTo(s.querySelectorAll(".w > span"), { yPercent: 110 }, { yPercent: 0, stagger: 0.04, duration: 0.5, ease: "power3.out" })
        .fromTo(s.querySelectorAll("p, .eyebrow"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.1")
        .to({}, { duration: 0.4 });
    });
    gsap.from(".why .slide:first-child .w > span", { yPercent: 110, stagger: 0.08, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 60%" } });
    gsap.from(".why .stats > div", { opacity: 0, y: 30, stagger: 0.08, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 40%" } });
    root.current.querySelectorAll("[data-count]").forEach((el) => {
      const o = { v: 0 };
      gsap.to(o, { v: +el.dataset.count, duration: 2.2, ease: "power2.out", scrollTrigger: { trigger: root.current, start: "top 30%" }, onUpdate: () => (el.textContent = Math.round(o.v) + (el.dataset.suffix || "")) });
    });
  }, { scope: root });

  return (
    <section className="why pin" ref={root}>
      <div className="layer media"><Img k="residence" style={{ objectPosition: "50% 35%" }} /></div>
      <div className="fill shade" />
      <div className="copy">
        {SLIDES.map((s, i) => (
          <div className="slide" key={i}>
            <div className="eyebrow muted">{s.eyebrow}</div>
            <h2 style={{ marginTop: "1.4rem" }}><Words text={s.title} /></h2>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
      <div className="stats">
        <div><b data-count="14">0</b><span>Residential floors</span></div>
        <div><b data-count="62">0</b><span>Residences</span></div>
        <div><b data-count="1">0</b><span>Rooftop penthouse</span></div>
        <div><b data-count="12">0</b><span>Amenities</span></div>
      </div>
    </section>
  );
}
