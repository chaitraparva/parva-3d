import { useEffect, useRef, useState } from "react";
import { IMAGES, remoteUrl } from "../data/images.js";

// Smooth-scroll friendly image:
// • starts loading ~2 screens before it scrolls into view (no pop-in, no decode hitch mid-scroll)
// • decodes off the main thread (img.decode) before fading in
// • serves a 1600px version to small slots and the 4K file only where it's needed
export default function Img({ k, alt, className = "", style, eager = false, sizes, ...rest }) {
  sizes = sizes || (className.includes("par-img") ? "50vw" : "100vw");
  const ref = useRef(null);
  const [src, setSrc] = useState(eager ? `/img/${k}.jpg` : null);
  const [srcSet, setSrcSet] = useState(eager ? `/img/${k}-1600.jpg 1600w, /img/${k}.jpg 3840w` : null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (src) return;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSrcSet(`/img/${k}-1600.jpg 1600w, /img/${k}.jpg 3840w`);
        setSrc(`/img/${k}.jpg`);
        io.disconnect();
      }
    }, { rootMargin: "200% 0px 200% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [k, src]);

  const onLoad = (e) => {
    const img = e.currentTarget;
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => setLoaded(true));
  };
  const onError = () => {
    if (srcSet) { setSrcSet(null); return; }               // no 1600px copy → use the main file
    if (src && !src.startsWith("http")) setSrc(remoteUrl(k)); // not downloaded → load from source
  };

  return (
    <img
      ref={ref}
      src={src || undefined}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
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
