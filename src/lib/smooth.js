import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

export function startSmoothScroll() {
  if (lenis || matchMedia("(prefers-reduced-motion: reduce)").matches) return lenis;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, syncTouch: false });
  ScrollTrigger.config({ ignoreMobileResize: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
  return lenis;
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.8, ...opts });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: "smooth" });
  }
}

export function lockScroll(lock) {
  if (lenis) lock ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

export { gsap, ScrollTrigger };
