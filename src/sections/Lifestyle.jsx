import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "../lib/smooth.js";
import Img from "../components/Img.jsx";
import { Words, Chars } from "../components/Split.jsx";
import { AMENITIES } from "../data/content.js";

// 06 — "Twelve ways to spend a day." Pinned: scrolling walks the list, the photo changes with it.
export function Ways() {
  const root = useRef(null);
  const [on, setOn] = useState(0);
  useGSAP(() => {
    const n = AMENITIES.length;
    const list = root.current.querySelector("ol");
    ScrollTrigger.create({
      trigger: root.current, start: "top top", end: `+=${n * 45}%`, pin: true,
      onUpdate: (s) => {
        const i = Math.min(n - 1, Math.floor(s.progress * n));
        if (i === list.__i) return;
        list.__i = i;
        setOn(i);
        const li = list.children[i];
        gsap.to(list, { y: list.parentElement.clientHeight / 2 - li.offsetTop - li.offsetHeight / 2, duration: 0.8, ease: "power3.out", overwrite: true });
      },
    });
    gsap.from(".ways h2 .w > span", { yPercent: 110, stagger: 0.07, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%" } });
  }, { scope: root });

  return (
    <section className="ways light" id="amenities" ref={root}>
      <div className="sticky">
        <div className="eyebrow" style={{ color: "#8a8378" }}>02 — Amenities</div>
        <h2 style={{ marginTop: "1.2rem" }}><Words text={"A dozen reasons\n*to* *stay* *in.*"} /></h2>
        <p className="lead">Water, green and quiet corners — all a lift ride from your front door, none of them a drive away.</p>
        <div className="frame">
          {AMENITIES.map((a, i) => <div key={a.name} className={`media ${i === on ? "on" : ""}`}><Img k={a.img} sizes="40vw" /></div>)}
        </div>
      </div>
      <div className="list-mask">
        <ol>
          {AMENITIES.map((a, i) => (
            <li key={a.name} className={i === on ? "on" : ""}>
              <span>{String(i + 1).padStart(2, "0")}</span>{a.name}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// 07 — Editorial lifestyle spreads (slower / balance / move / exhale / simply be)
export function Editorial() {
  const root = useRef(null);
  return (
    <div className="light" ref={root}>
      <section className="ed">
        <div className="ghost par" data-speed="-0.25" style={{ top: "2rem", left: "-3rem" }}>celebrate</div>
        <div className="grid">
          <div style={{ gridColumn: "1 / 8" }}>
            <div className="big" data-reveal><Words text={"Mornings,\n*unhurried.*"} /></div>
            <p className="copy" style={{ marginTop: "2.4rem" }} data-fade>Coffee on the courtyard, the city still waking up below. Parva is planned around time — and gives more of it back to you.</p>
          </div>
          <div className="media arch-img" style={{ gridColumn: "8 / 13", aspectRatio: ".72" }} data-clip><Img k="courtyard" className="par-img" /></div>
        </div>
      </section>

      <section className="ed" style={{ paddingTop: "2rem" }}>
        <div className="grid" style={{ alignItems: "start" }}>
          <div className="media par" data-speed="0.12" style={{ gridColumn: "1 / 4", aspectRatio: ".78", marginTop: "14rem" }} data-clip><Img k="atrium" className="par-img" /></div>
          <div style={{ gridColumn: "5 / 10" }}>
            <div className="big" data-reveal><Words text={"Steam, stone,\n*stillness.*"} /></div>
          </div>
          <div className="media par" data-speed="-0.1" style={{ gridColumn: "10 / 13", aspectRatio: ".7" }} data-clip><Img k="gym2" className="par-img" /></div>
          <div className="media" style={{ gridColumn: "5 / 10", aspectRatio: "1.55", marginTop: "3rem" }} data-clip><Img k="sauna" className="par-img" /></div>
        </div>
      </section>

      <section className="ed">
        <div className="grid">
          <div className="media" style={{ gridColumn: "1 / 8", aspectRatio: "1.5" }} data-clip><Img k="gym" className="par-img" /></div>
          <div style={{ gridColumn: "8 / 13" }}>
            <div className="big" style={{ fontSize: "8.4rem" }} data-reveal><Words text={"Strength,\n*with* *a* *view.*"} /></div>
            <p className="copy" style={{ marginTop: "2rem" }} data-fade><b>Open from first light.</b>A residents' gym with garden views, a wellness studio and a lap pool.</p>
          </div>
        </div>
      </section>

      <section className="ed">
        <div className="grid">
          <div className="media" style={{ gridColumn: "2 / 12", aspectRatio: "2.1" }} data-clip>
            <Img k="bath" className="par-img" />
            <div className="overlay-text" style={{ left: "3rem", top: "3rem" }}>
              <div className="big" style={{ color: "#fff", fontSize: "8rem" }} data-reveal><Words text={"The long\n*soak.*"} /></div>
            </div>
          </div>
          <p className="copy" style={{ gridColumn: "9 / 13", marginTop: "2rem" }} data-fade><b>Spa bathrooms as standard.</b>Freestanding tubs, rain showers, sauna and steam on the podium.</p>
        </div>
      </section>

      <section className="ed" style={{ paddingBottom: "12rem" }}>
        <div className="grid" style={{ alignItems: "center" }}>
          <div style={{ gridColumn: "1 / 9" }}><div className="big" style={{ fontSize: "14rem" }} data-reveal><Words text={"Just *breathe.*"} /></div></div>
          <div className="media arch-img par" data-speed="-0.15" style={{ gridColumn: "9 / 13", aspectRatio: ".7" }} data-clip><Img k="balcony" className="par-img" /></div>
        </div>
      </section>
    </div>
  );
}

// 08 — Full-bleed pool: "Nothing to do. Everything to feel."
export function Feel() {
  const root = useRef(null);
  useGSAP(() => {
    gsap.fromTo(".feel .img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".feel h2 .w > span", { yPercent: 110, stagger: 0.08, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 50%" } });
  }, { scope: root });
  return (
    <section className="feel pin" ref={root}>
      <div className="fill media"><Img k="pool" /></div>
      <div className="fill" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,0) 45%)" }} />
      <div className="txt"><h2><Words text={"The city goes\n*quiet* *up* *here.*"} /></h2></div>
      <div className="foot"><span>Infinity pool</span><span>Podium deck</span></div>
    </section>
  );
}

// 09 — "Less rush. More Parva." White circle swells, letters fill in.
export function Rush() {
  const root = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=150%", scrub: 0.6, pin: true }, defaults: { ease: "none" } });
    tl.to(".rush .circle", { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(".rush .c", { opacity: 1, stagger: 0.02, duration: 0.1 }, 0.2);
  }, { scope: root });
  return (
    <section className="rush pin" ref={root}>
      <div className="circle" />
      <h2><Chars text={"Fewer things."} /><br /><span className="it"><Chars text={"Better ones."} /></span></h2>
      <div className="meta"><span>Parva Residences</span><span>Quiet luxury, Dubai</span></div>
    </section>
  );
}

// 10 — "Above the everyday." Terrace, friends, long afternoons.
export function Above() {
  const root = useRef(null);
  useGSAP(() => {
    gsap.fromTo(".above .img", { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".above h2 .w > span", { yPercent: 110, stagger: 0.08, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 45%" } });
    gsap.from(".above .note", { opacity: 0, y: 30, duration: 1.2, scrollTrigger: { trigger: root.current, start: "top 35%" } });
  }, { scope: root });
  return (
    <section className="above pin" ref={root} data-chapter="04|Amenities">
      <div className="fill media"><Img k="roofpool" /></div>
      <div className="fill" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.45), rgba(0,0,0,0) 55%)" }} />
      <h2><Words text={"Dinner above\n*the* *skyline.*"} /></h2>
      <div className="note">Rooftop pool, sky garden,<br /><span className="it">and a table that seats twelve.</span></div>
    </section>
  );
}

// 11 — "For every generation."
export function Generation() {
  return (
    <section className="gen light" data-chapter="06|Community">
      <div style={{ gridColumn: "1 / 8" }}>
        <div className="eyebrow" style={{ color: "#8a8378" }}>06 — Community</div>
        <h2 style={{ marginTop: "1.4rem" }} data-reveal><Words text={"Room to grow up.\n*Room* *to* *grow* *old.*"} /></h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "2rem", marginTop: "4rem", alignItems: "end" }}>
          <div className="media par" data-speed="0.1" style={{ aspectRatio: ".62" }} data-clip><Img k="courtyard2" className="par-img" /></div>
          <p className="ed-copy" style={{ color: "#6f695f", lineHeight: 1.75, fontSize: ".9rem" }} data-fade>
            <b style={{ display: "block", fontFamily: "var(--serif)", fontWeight: 400, fontStyle: "italic", fontSize: "1.7rem", color: "#1a1916", marginBottom: ".8rem", lineHeight: 1.15 }}>A play garden in sight of the lounge.</b>
            Shaded play, a splash pad and a family lawn — designed so grandparents get the best seat.
          </p>
        </div>
      </div>
      <div className="media arch-img par" data-speed="-0.12" style={{ gridColumn: "8 / 13", aspectRatio: ".74", borderRadius: "999px", marginTop: "6rem" }} data-clip><Img k="enre" className="par-img" /></div>
    </section>
  );
}
