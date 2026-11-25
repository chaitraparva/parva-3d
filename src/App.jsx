import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, startSmoothScroll } from "./lib/smooth.js";
import Loader from "./components/Loader.jsx";
import { Nav, Progress, Cursor, Grain, Marquee, Chapter, useFontsRefresh } from "./components/Chrome.jsx";
import Rise from "./sections/Rise.jsx";
import Arrival from "./sections/Arrival.jsx";
import StepInside from "./sections/StepInside.jsx";
import { Above, Generation } from "./sections/Lifestyle.jsx";
import { Amenities, Day } from "./sections/Story.jsx";
import { Kitchen, Reach, Tour, Finale, Contact } from "./sections/Final.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const main = useRef(null);
  useFontsRefresh();

  useEffect(() => {
    document.body.classList.add("is-loading");
    history.scrollRestoration = "manual";
    scrollTo(0, 0);
  }, []);

  const done = () => {
    document.body.classList.remove("is-loading");
    startSmoothScroll();
    setReady(true);
    ScrollTrigger.refresh();
    setTimeout(() => setLoading(false), 1200);
  };

  // Shared scroll effects for anything marked up with data-* hooks.
  useGSAP(() => {
    const q = (s) => main.current.querySelectorAll(s);
    q("[data-reveal]").forEach((el) =>
      gsap.from(el.querySelectorAll(".w > span"), { yPercent: 110, stagger: 0.07, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    q("[data-fade]").forEach((el) =>
      gsap.from(el, { opacity: 0, y: 30, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    q("[data-clip]").forEach((el) =>
      gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    q(".par-img").forEach((img) =>
      gsap.fromTo(img, { scale: 1.22 }, { scale: 1.02, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
    q(".par[data-speed]").forEach((el) =>
      gsap.to(el, { yPercent: () => +el.dataset.speed * -100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } }));
  }, { scope: main });

  return (
    <>
      {loading && <Loader onDone={done} />}
      <Cursor />
      <Grain />
      <Nav />
      <Progress />
      <Chapter />
      <main ref={main}>
        <Rise ready={ready} />
        <Arrival />
        <Marquee words={["Considered", "Crafted", "Celebrated", "Fourteen floors", "One rooftop", "Dubai"]} tone="light" />
        <StepInside />
        <Kitchen />
        <Tour />
        <Amenities />
        <Above />
        <Day />
        <Generation />
        <Marquee words={["Live in celebration", "Parva Residences", "Private viewings now open"]} tone="gold" />
        <Reach />
        <Finale />
        <Contact />
      </main>
    </>
  );
}
