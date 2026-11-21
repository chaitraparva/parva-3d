import { useEffect, useRef, useState } from "react";
import { IMAGES, sources, remoteUrl } from "../data/images.js";

// Smooth-scroll friendly image:
// • starts loading ~2 screens before it scrolls into view (no pop-in, no decode hitch mid-scroll)
// • decodes off the main thread (img.decode) before fading in
// • picks the right size for the screen: ~800–1600px on phones, 2400px on laptops, 3840px only on 4K
export default function Img({ k, alt, className = "", style, eager = false, sizes, ...rest }) {
  // Retina laptops get the 2400px file (sharp, fast to decode); only big 4K-class screens pull the 3840px original.
  sizes = sizes || (className.includes("par-img")
    ? "(max-width: 900px) 100vw, (min-width: 2600px) 50vw, min(50vw, 800px)"
    : "(min-width: 2600px) 100vw, min(100vw, 1250px)");
  const ref = useRef(null);
  const [on, setOn] = useState(eager);
  const [fallback, setFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (on) return;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); }
    }, { rootMargin: "150% 0px 150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  const s = sources(k);
  const src = fallback ? remoteUrl(k) : s.src;
  const srcSet = fallback ? null : s.srcSet;

  const onLoad = (e) => {
    const img = e.currentTarget;
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => setLoaded(true));
  };
  const onError = () => { if (!fallback) setFallback(true); };

  return (
    <img
      ref={ref}
      src={on ? src : undefined}
      srcSet={on && srcSet ? srcSet : undefined}
      sizes={on && srcSet ? sizes : undefined}
      alt={alt ?? IMAGES[k]?.note ?? ""}
      className={`img ${loaded ? "is-loaded" : ""} ${className}`}
      style={style}
      decoding="async"
      draggable="false"
      onLoad={onLoad}
      onError={onError}
      {...rest}
    />
  );
}
