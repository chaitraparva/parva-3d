// Every photo below is free for commercial use under the Unsplash License
// (https://unsplash.com/license). `npm run images` downloads them in 4K
// into /public/img. Swap any id for your own render: drop a file named
// <key>.jpg into /public/img and it will be used automatically.

const PR = "https://www.parvarealty.ae/assets/";

export const IMAGES = {
  // Arrival sequence
  arrive1:    { id: "T66U5HVG81U", url: "https://images.unsplash.com/photo-1758448756084-c44d73014c07?w=3840&q=85&auto=format&fit=crop", note: "Double-height lobby with garden windows" },
  arrive2:    { id: "4yIOHhuZFKg", url: "https://images.unsplash.com/photo-1758448755981-954afbf60ff7?w=3840&q=85&auto=format&fit=crop", note: "Marble lounge with ambient lighting" },
  arrive3:    { id: "qUreiZclR5o", url: "https://images.unsplash.com/photo-1761602866012-ae9f888255dc?w=3840&q=85&auto=format&fit=crop", note: "Residents' lounge, curved sofa & marble" },
  // Main building (14 floors + rooftop) and rooftop pool
  residence:  { id: "3XevzqwNiQo", url: "https://images.unsplash.com/photo-1780653503205-ac2c41b893a8?w=3840&q=85&auto=format&fit=crop", note: "Parva Residence at dusk" },
  roofpool:   { id: "Fdn9pNPZHXc", url: "https://images.unsplash.com/photo-1766245276596-9aa3bd432d0c?w=3840&q=85&auto=format&fit=crop", note: "Rooftop infinity pool" },
  roofgarden: { id: "gKfd5_PsOBE", url: "https://images.unsplash.com/photo-1769953719808-efd44196a0f2?w=3840&q=85&auto=format&fit=crop", note: "Rooftop pool & garden" },
  // Parva Realty project renders (from parvarealty.ae)
  symphony:   { url: PR + "image-20-BZPMbuKe.png", note: "The Symphony — tower with palms" },
  auresta:    { url: PR + "image-11-Diy888YD.png", note: "Auresta Tower — pool deck" },
  sunsetbay:  { url: PR + "image-16-B8QVYKbA.png", note: "Sunset Bay Grand" },
  enre:       { url: PR + "image-47-YM830T3P.png", note: "Enre Residence" },
  timez:      { url: PR + "image-54-BruEDsDt.png", note: "TIMEZ tower" },

  clouds:     { id: "P3gCxHrE60Q", note: "City from above the clouds" },
  aerial:     { id: "9MsvwQVimvE", note: "Aerial residential district, Dubai" },
  coast:      { id: "2fqptw4fKWI", note: "Aerial coastline & towers, Dubai" },
  skyline:    { id: "mUCdpmKGmnc", note: "Towers against a cloudy sunset" },
  tower:      { id: "PgQgOQ5VhJ0", note: "Luxury condominium tower with palms" },
  tower2:     { id: "aAqVluPj-Sk", note: "Apartment building, balconies & palms" },
  tower3:     { id: "5JON6hFXzBo", note: "Tall building with palm trees" },
  entrance:   { id: "CBWwawOHX_g", note: "Residence entrance at night" },
  lobby:      { id: "pt0nGH-NvoA", note: "Marble lobby & reception" },
  lobby2:     { id: "Accg0bUgp7k", note: "High-ceiling lobby lounge" },
  lift:       { id: "1PXsFfTbEcI", note: "Elevator lobby, marble & wood" },
  living:     { id: "yxO8YG082v8", note: "Living room with city view" },
  kitchen:    { id: "VgyN_CWXQVM", note: "Kitchen with island & window" },
  kitchen2:   { id: "bmgF8O95BuU", note: "White kitchen island" },
  kitchen3:   { id: "YFzqRFFyauw", note: "Kitchen with island" },
  kitchen4:   { id: "mhDeeOvBs9o", note: "Light wood kitchen" },
  bedroom:    { id: "RUvW1KGD9a4", note: "Bedroom with city view" },
  bedroom2:   { id: "z3kNY3K8om4", note: "Bedroom window, city" },
  bath:       { id: "JGfXR2a8RNg", note: "Freestanding bathtub" },
  pool:       { id: "KgybDitNR18", note: "Rooftop infinity pool at sunset" },
  pool2:      { id: "Tx0dfF6D41M", note: "Rooftop pool, skyline" },
  gym:        { id: "uYnHRrm63uo", note: "Residents' gym" },
  gym2:       { id: "asVNiNtSSXE", note: "Gym, wood & nature view" },
  sauna:      { id: "VewfsPIk92w", note: "Sauna" },
  courtyard:  { id: "SBcKyJETLxE", note: "Courtyard with arches & palms" },
  courtyard2: { id: "r1trqQmbSNs", note: "Residential green courtyard" },
  atrium:     { id: "poEga0PVyPs", note: "Planted atrium, top-down" },
  balcony:    { id: "bhKYFvdfTdA", note: "Balcony lounge with palms" },
  terrace:    { id: "xQWLtlQb7L0", note: "Roof terrace over the city" },
  play:       { id: "MLlyFSXH9J4", note: "Children's playground" },
  play2:      { id: "HtIkPWp7jKA", note: "Playground slide & frame" },
  roofs:      { id: "dD9ZZoZnlVc", note: "Aerial rooftops & pool" },
};

// Direct image links (Unsplash's /download links are now behind a bot check, so they can't be hot-linked).
// Keys that have files in /public/img (with -800 / -1600 / -2400 / -64 copies made by `npm run images`).
export const LOCAL = new Set(["aerial","atrium","balcony","bath","bedroom","bedroom2","clouds","coast","courtyard","courtyard2","entrance","gym","gym2","kitchen","kitchen2","kitchen3","kitchen4","lift","living","lobby","lobby2","play","play2","pool","pool2","roofs","sauna","skyline","terrace","tower","tower2","tower3"]);

// Responsive candidates for an image key: phones get ~800–1600px, desktops 2400px, 4K screens 3840px.
export function sources(key) {
  if (LOCAL.has(key)) return {
    src: `/img/${key}-1600.jpg`,
    srcSet: `/img/${key}-800.jpg 800w, /img/${key}-1600.jpg 1600w, /img/${key}-2400.jpg 2400w, /img/${key}.jpg 3840w`,
  };
  const u = IMAGES[key]?.url;
  if (u && u.includes("images.unsplash.com")) {
    const at = (w) => u.replace(/w=\d+/, `w=${w}`).replace(/q=\d+/, w > 2000 ? "q=80" : "q=75");
    return { src: at(1600), srcSet: [800, 1600, 2400, 3840].map((w) => `${at(w)} ${w}w`).join(", ") };
  }
  return { src: remoteUrl(key), srcSet: null };
}

export const remoteUrl = (key, w = 2400) =>
  IMAGES[key].url || `https://unsplash.com/photos/${IMAGES[key].id}/download?w=${w}`;

// Drone footage — free under the Pexels License (https://www.pexels.com/license/).
// Hero: "An aerial view of the city of Dubai" (Palm Jumeirah) by Rockwell branding agency
//   https://www.pexels.com/video/an-aerial-view-of-the-city-of-dubai-19444055/
// To use your own film, drop public/video/hero.mp4 in and change src to "/video/hero.mp4".
export const VIDEOS = {
  hero: {
    // picked by screen size in heroSrc(): phones 720p, laptops 1080p, big/4K screens 1440p
    src: "https://videos.pexels.com/video-files/19444055/19444055-uhd_2560_1440_60fps.mp4",
    hd: "https://videos.pexels.com/video-files/19444055/19444055-hd_1920_1080_60fps.mp4",
    mobile: "https://videos.pexels.com/video-files/19444055/19444055-hd_1280_720_60fps.mp4",
    poster: "https://images.pexels.com/videos/19444055/pexels-photo-19444055.jpeg?auto=compress&w=2560",
  },
};

export function heroSrc() {
  const v = VIDEOS.hero;
  if (typeof window === "undefined") return v.src;
  const px = Math.max(screen.width, screen.height) * Math.min(devicePixelRatio || 1, 2);
  const conn = navigator.connection;
  if (innerWidth < 900 || conn?.saveData || /2g|3g/.test(conn?.effectiveType || "")) return v.mobile;
  return px > 3000 ? v.src : v.hd;
}
