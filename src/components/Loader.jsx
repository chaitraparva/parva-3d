import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/smooth.js";

// Parva monogram: a gold capsule draws itself, the "P" fades up inside, counter runs, then curtain lifts.
export default function Loader({ onDone }) {
  const root = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const ring = root.current.querySelector(".ring");
      const len = ring.getTotalLength();
      gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
      const o = { v: 0 };
      gsap.timeline({ defaults: { ease: "power3.inOut" } })
        .to(ring, { strokeDashoffset: 0, duration: 1.8 })
        .fromTo(".mono", { opacity: 0, y: 24, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "expo.out" }, 0.7)
        .fromTo(".loader .lname > *", { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 1.1, ease: "expo.out" }, 1.0)
        .to(o, { v: 100, duration: 2.6, ease: "power1.inOut", onUpdate: () => setCount(Math.round(o.v)) }, 0)
        .to(".loader .inner", { scale: 0.92, opacity: 0, duration: 0.6, ease: "power2.in" }, 3.0)
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.15, ease: "expo.inOut" }, 3.3)
        .add(() => onDone?.(), 3.5);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="loader" ref={root} style={{ clipPath: "inset(0 0 0 0)" }}>
      <div className="inner">
        <svg viewBox="0 0 120 200" className="mono-svg">
          <rect className="ring" x="2" y="2" width="116" height="196" rx="58" fill="none" stroke="#c8a46a" strokeWidth="1.2" />
          <text className="mono" x="60" y="122" textAnchor="middle" fontFamily="Bodoni Moda, serif" fontStyle="italic" fontSize="86" fill="#efe9df">P</text>
        </svg>
        <div className="lname"><span>Parva Residences</span><span className="lsub">Dubai · by Parva Realty</span></div>
      </div>
      <div className="lcount">{String(count).padStart(3, "0")}</div>
      <div className="lsound">Live in celebration</div>
    </div>
  );
}
