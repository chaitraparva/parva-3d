// Builds a furnished, cut-away 3D model of a residence from its plan data.
// Plan rooms are [x, y, w, h, label] on a 100-wide grid; we map that to ~14 m.
import * as THREE from "three";

const S = 0.14;            // metres per plan unit
const WALL_H = 1.45;       // cut-away wall height (marketing "dollhouse" look)
const WALL_T = 0.07;       // half wall thickness (each room draws its own half)

/* ---------------- procedural textures (crisp, no downloads) ---------------- */
function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
function planks(base, dark, light, plankH = 64) {
  return canvasTex(512, 512, (g, w, h) => {
    for (let y = 0; y < h; y += plankH) {
      let x = -rnd() * 300;
      while (x < w) {
        const len = 220 + rnd() * 260, t = rnd();
        g.fillStyle = t < 0.33 ? base : t < 0.66 ? dark : light;
        g.fillRect(x, y, len, plankH);
        g.globalAlpha = 0.08;
        for (let k = 0; k < 14; k++) { g.fillStyle = rnd() < 0.5 ? "#000" : "#fff"; g.fillRect(x, y + rnd() * plankH, len, 1 + rnd() * 2); }
        g.globalAlpha = 1;
        g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x, y, 2, plankH);
        x += len;
      }
      g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(0, y, w, 2);
    }
  });
}
function marble(base = "#ecebe7", vein = "rgba(120,118,112,.35)") {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = vein; g.lineWidth = 0.6 + rnd() * 1.6; g.beginPath();
      let x = rnd() * w, y = rnd() * h; g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += (rnd() - 0.3) * 90; y += (rnd() - 0.5) * 90; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 2;
    for (let i = 0; i <= w; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  });
}
function grass() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#5f7f43"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${60 + rnd() * 60},${100 + rnd() * 60},${40 + rnd() * 30},.6)`; g.fillRect(rnd() * w, rnd() * h, 1.5, 3); }
  });
}
function rugTex(c1, c2) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    g.strokeStyle = c2; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.globalAlpha = 0.12; for (let i = 0; i < 3000; i++) { g.fillStyle = rnd() < 0.5 ? "#000" : "#fff"; g.fillRect(rnd() * w, rnd() * h, 1, 1); }
  });
}

/* ---------------- materials ---------------- */
function makeMaterials() {
  const M = (o) => new THREE.MeshStandardMaterial(o);
  return {
    oak: M({ map: planks("#c49b6e", "#b48a5c", "#d2ab80"), roughness: 0.55 }),
    teak: M({ map: planks("#9d6f48", "#8a603c", "#ad7d54", 40), roughness: 0.75 }),
    marble: M({ map: marble(), roughness: 0.18, metalness: 0 }),
    tile: M({ map: marble("#e4e1dc", "rgba(150,145,138,.25)"), roughness: 0.3 }),
    grass: M({ map: grass(), roughness: 1 }),
    wall: M({ color: "#f4f1ec", roughness: 0.9 }),
    wallTop: M({ color: "#2b2926", roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#cfe3ea", roughness: 0.05, transmission: 0.85, thickness: 0.05, transparent: true, opacity: 0.35 }),
    frame: M({ color: "#2a2826", roughness: 0.5, metalness: 0.6 }),
    water: new THREE.MeshPhysicalMaterial({ color: "#3fa7c2", roughness: 0.04, transmission: 0.4, thickness: 0.6, ior: 1.33, clearcoat: 1, clearcoatRoughness: 0.05 }),
    poolTile: M({ color: "#7fc4d3", roughness: 0.4 }),
    linen: M({ color: "#f5f2ec", roughness: 0.95 }),
    duvet: M({ color: "#d9d1c4", roughness: 0.95 }),
    fabric: M({ color: "#cfc6b8", roughness: 0.95 }),
    fabricDark: M({ color: "#5b5550", roughness: 0.95 }),
    leather: M({ color: "#6e4a32", roughness: 0.6 }),
    walnut: M({ color: "#5a3e2b", roughness: 0.55 }),
    lightWood: M({ color: "#d8bf9c", roughness: 0.6 }),
    stoneTop: M({ map: marble("#f2f1ee", "rgba(110,110,110,.3)"), roughness: 0.15 }),
    cabinet: M({ color: "#e9e4dc", roughness: 0.6 }),
    darkCab: M({ color: "#3a3734", roughness: 0.5 }),
    brass: M({ color: "#c9a25e", roughness: 0.3, metalness: 1 }),
    black: M({ color: "#1d1c1b", roughness: 0.4 }),
    ceramic: M({ color: "#fbfbfa", roughness: 0.15 }),
    mirror: M({ color: "#c9d3d8", roughness: 0.02, metalness: 1 }),
    leaf: M({ color: "#4e6b3a", roughness: 0.8 }),
    leaf2: M({ color: "#6b8a4a", roughness: 0.8 }),
    pot: M({ color: "#cdbfae", roughness: 0.8 }),
    lamp: M({ color: "#fff2d6", emissive: "#ffd79a", emissiveIntensity: 1.6 }),
    rug: M({ map: rugTex("#d8cfc2", "#b9ab98"), roughness: 1 }),
    rug2: M({ map: rugTex("#b7aa98", "#8f8170"), roughness: 1 }),
    cushion: M({ color: "#8c7c66", roughness: 1 }),
    cushion2: M({ color: "#a2b3a8", roughness: 1 }),
    screen: M({ color: "#0c0c0d", roughness: 0.2, metalness: 0.4 }),
    umbrella: M({ color: "#efe7da", roughness: 0.9, side: THREE.DoubleSide }),
  };
}

/* ---------------- helpers ---------------- */
function box(parent, w, h, d, mat, x, y, z, { ry = 0, cast = true, round = false } = {}) {
  const geo = round ? new THREE.CapsuleGeometry(Math.min(w, d) / 2, Math.max(w, d) - Math.min(w, d), 6, 16) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  if (round) { m.rotation.z = Math.PI / 2; m.scale.set(h / Math.min(w, d), 1, 1); if (w < d) m.rotation.y = Math.PI / 2; }
  m.position.set(x, y + (round ? h / 2 : h / 2), z); m.rotation.y += ry;
  m.castShadow = cast; m.receiveShadow = true;
  parent.add(m); return m;
}
function cyl(parent, rTop, rBot, h, mat, x, y, z, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function sphere(parent, r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
function plant(g, M, x, z, s = 1) {
  cyl(g, 0.16 * s, 0.12 * s, 0.35 * s, M.pot, x, 0, z);
  for (let i = 0; i < 5; i++) sphere(g, (0.16 + rnd() * 0.1) * s, i % 2 ? M.leaf : M.leaf2, x + (rnd() - 0.5) * 0.25 * s, (0.5 + rnd() * 0.45) * s, z + (rnd() - 0.5) * 0.25 * s);
}

/* ---------------- furniture sets (in a room-local frame: width along X) ---------------- */
// Each builder gets a group positioned at room centre, rotated so "w" is the long side.
const F = {
  bed(g, M, w, d) {
    const bw = Math.min(1.9, w * 0.55), bl = Math.min(2.1, d * 0.75), zb = -d / 2 + bl / 2 + 0.12;
    box(g, bw + 0.1, 0.32, bl, M.walnut, 0, 0, zb);
    box(g, bw, 0.22, bl - 0.08, M.linen, 0, 0.32, zb + 0.02);
    box(g, bw + 0.04, 0.08, bl * 0.62, M.duvet, 0, 0.5, zb + bl * 0.18);
    box(g, bw + 0.3, 1.05, 0.12, M.fabric, 0, 0, -d / 2 + 0.08);
    box(g, bw * 0.4, 0.14, 0.38, M.linen, -bw * 0.24, 0.54, zb - bl / 2 + 0.3, { round: true });
    box(g, bw * 0.4, 0.14, 0.38, M.linen, bw * 0.24, 0.54, zb - bl / 2 + 0.3, { round: true });
    box(g, bw * 0.98, 0.05, 0.4, M.cushion, 0, 0.55, zb + bl / 2 - 0.3);
    for (const sx of [-1, 1]) {
      const nx = sx * (bw / 2 + 0.38);
      if (Math.abs(nx) + 0.25 < w / 2) {
        box(g, 0.45, 0.5, 0.4, M.walnut, nx, 0, -d / 2 + 0.32);
        cyl(g, 0.02, 0.02, 0.32, M.brass, nx, 0.5, -d / 2 + 0.32);
        sphere(g, 0.12, M.lamp, nx, 0.92, -d / 2 + 0.32);
      }
    }
    if (d > bl + 1.2) box(g, Math.min(bw * 1.3, w * 0.8), 0.01, 1.4, M.rug, 0, 0, zb + 0.3);
    if (w > bw + 2) plant(g, M, w / 2 - 0.4, d / 2 - 0.4);
  },
  living(g, M, w, d) {
    const sw = Math.min(3.2, w * 0.7), z0 = d / 2 - 0.55;
    box(g, Math.min(w * 0.85, 3.8), 0.01, Math.min(d * 0.7, 3), M.rug2, 0, 0, z0 - 1.1);
    box(g, sw, 0.42, 0.95, M.fabric, 0, 0, z0);                        // seat
    box(g, sw, 0.45, 0.22, M.fabric, 0, 0.42, z0 + 0.38);              // back
    box(g, 0.22, 0.3, 0.95, M.fabric, -sw / 2 + 0.11, 0.42, z0);
    box(g, 0.22, 0.3, 0.95, M.fabric, sw / 2 - 0.11, 0.42, z0);
    for (let i = 0; i < 3; i++) box(g, sw / 3 - 0.1, 0.12, 0.7, M.linen, -sw / 3 + (i * sw) / 3, 0.42, z0 - 0.05);
    box(g, 0.42, 0.42, 0.14, M.cushion, -sw / 2 + 0.45, 0.55, z0 + 0.22);
    box(g, 0.42, 0.42, 0.14, M.cushion2, sw / 2 - 0.45, 0.55, z0 + 0.22);
    box(g, 1.2, 0.36, 0.7, M.stoneTop, 0, 0, z0 - 1.35);               // coffee table
    cyl(g, 0.08, 0.06, 0.16, M.brass, 0.3, 0.36, z0 - 1.3);
    if (d > 3.4) { box(g, Math.min(2.4, w * 0.6), 0.45, 0.42, M.walnut, 0, 0, -d / 2 + 0.3); box(g, 1.5, 0.85, 0.05, M.screen, 0, 0.75, -d / 2 + 0.12); }
    if (w > 3.6) { box(g, 0.8, 0.4, 0.8, M.leather, -w / 2 + 0.7, 0, z0 - 1.4, { ry: 0.5 }); box(g, 0.8, 0.45, 0.15, M.leather, -w / 2 + 0.55, 0.4, z0 - 1.15, { ry: 0.5 }); }
    plant(g, M, w / 2 - 0.4, d / 2 - 0.4, 1.3);
  },
  dining(g, M, w, d) {
    const tw = Math.min(2.2, w * 0.65), td = Math.min(1.0, d * 0.45);
    box(g, tw, 0.05, td, M.walnut, 0, 0.72, 0);
    box(g, 0.1, 0.72, td * 0.6, M.walnut, -tw / 2 + 0.25, 0, 0); box(g, 0.1, 0.72, td * 0.6, M.walnut, tw / 2 - 0.25, 0, 0);
    const n = tw > 1.8 ? 3 : 2;
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const x = -tw / 2 + (tw / n) * (i + 0.5), z = s * (td / 2 + 0.3);
      box(g, 0.45, 0.46, 0.45, M.fabric, x, 0, z); box(g, 0.45, 0.42, 0.07, M.fabric, x, 0.46, z + s * 0.2);
    }
    sphere(g, 0.18, M.lamp, 0, 1.55, 0); cyl(g, 0.005, 0.005, 0.9, M.black, 0, 1.6, 0);
    cyl(g, 0.12, 0.08, 0.2, M.ceramic, 0, 0.77, 0);
  },
  kitchen(g, M, w, d) {
    box(g, w - 0.2, 0.9, 0.62, M.darkCab, 0, 0, -d / 2 + 0.36);
    box(g, w - 0.18, 0.04, 0.66, M.stoneTop, 0, 0.9, -d / 2 + 0.36);
    box(g, w - 0.2, 0.55, 0.36, M.cabinet, 0, 1.6, -d / 2 + 0.2);
    box(g, 0.6, 0.02, 0.45, M.black, -w / 4, 0.94, -d / 2 + 0.36);
    if (d > 2.2) {
      const iw = Math.min(2.2, w * 0.6);
      box(g, iw, 0.9, 0.85, M.cabinet, 0, 0, d / 2 - 0.9);
      box(g, iw + 0.1, 0.05, 0.95, M.stoneTop, 0, 0.9, d / 2 - 0.9);
      for (let i = 0; i < 3; i++) { cyl(g, 0.17, 0.17, 0.05, M.leather, -iw / 3 + (i * iw) / 3, 0.68, d / 2 - 0.25); cyl(g, 0.02, 0.02, 0.68, M.brass, -iw / 3 + (i * iw) / 3, 0, d / 2 - 0.25); }
      cyl(g, 0.12, 0.09, 0.12, M.lightWood, iw / 4, 0.95, d / 2 - 0.9);
      sphere(g, 0.06, M.leaf2, iw / 4, 1.1, d / 2 - 0.9);
    }
  },
  bath(g, M, w, d) {
    const tl = Math.min(1.7, w * 0.7);
    box(g, tl, 0.55, 0.78, M.ceramic, 0, 0, -d / 2 + 0.5, { round: true });
    box(g, tl - 0.25, 0.02, 0.5, M.water, 0, 0.5, -d / 2 + 0.5);
    if (d > 1.9) {
      box(g, Math.min(1.4, w * 0.6), 0.55, 0.5, M.walnut, 0, 0.3, d / 2 - 0.3);
      box(g, Math.min(1.3, w * 0.55), 0.04, 0.52, M.stoneTop, 0, 0.85, d / 2 - 0.3);
      box(g, Math.min(1.1, w * 0.5), 0.7, 0.03, M.mirror, 0, 1.0, d / 2 - 0.06);
    }
    plant(g, M, w / 2 - 0.25, -d / 2 + 0.3, 0.6);
  },
  study(g, M, w, d) {
    box(g, Math.min(1.5, w * 0.7), 0.04, 0.65, M.lightWood, 0, 0.74, -d / 2 + 0.4);
    box(g, 0.05, 0.74, 0.6, M.black, -Math.min(1.5, w * 0.7) / 2 + 0.1, 0, -d / 2 + 0.4);
    box(g, 0.05, 0.74, 0.6, M.black, Math.min(1.5, w * 0.7) / 2 - 0.1, 0, -d / 2 + 0.4);
    box(g, 0.5, 0.48, 0.5, M.leather, 0, 0, -d / 2 + 1.0); box(g, 0.5, 0.45, 0.08, M.leather, 0, 0.48, -d / 2 + 1.22);
    box(g, 0.55, 0.32, 0.03, M.screen, 0, 0.78, -d / 2 + 0.2);
    if (w > 2) box(g, 0.35, 1.6, Math.min(d - 0.4, 1.6), M.walnut, w / 2 - 0.25, 0, 0);
  },
  closet(g, M, w, d) {
    box(g, w - 0.2, 1.3, 0.5, M.cabinet, 0, 0, -d / 2 + 0.3);
    if (d > 1.8) box(g, Math.min(1, w * 0.4), 0.45, 0.6, M.fabric, 0, 0, 0.2);
    plant(g, M, w / 2 - 0.3, d / 2 - 0.3, 0.7);
  },
  deck(g, M, w, d, opts = {}) {
    const n = Math.max(1, Math.min(4, Math.floor(w / 1.1)));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w / n) * (i + 0.5);
      box(g, 0.66, 0.25, 1.8, M.lightWood, x, 0, Math.min(0, d / 2 - 1.05));
      box(g, 0.6, 0.08, 1.2, M.linen, x, 0.25, Math.min(0, d / 2 - 1.05) + 0.25);
      box(g, 0.6, 0.45, 0.1, M.linen, x, 0.3, Math.min(0, d / 2 - 1.05) - 0.75, { ry: 0 });
    }
    if (w > 3 && d > 2.2) { cyl(g, 0.03, 0.03, 2.2, M.walnut, w / 2 - 0.9, 0, -d / 2 + 0.9); const u = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.35, 24, 1, true), M.umbrella); u.position.set(w / 2 - 0.9, 2.3, -d / 2 + 0.9); u.castShadow = true; g.add(u); }
    plant(g, M, -w / 2 + 0.35, -d / 2 + 0.35, 1.1);
    plant(g, M, w / 2 - 0.35, d / 2 - 0.35, 0.9);
    if (opts.jacuzzi) { const r = Math.min(1, Math.min(w, d) * 0.3); cyl(g, r + 0.12, r + 0.12, 0.45, M.tile, w / 2 - r - 0.4, 0, 0); cyl(g, r, r, 0.02, M.water, w / 2 - r - 0.4, 0.44, 0); }
  },
  balcony(g, M, w, d) {
    const n = Math.max(1, Math.floor(w / 2.4));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (w / n) * (i + 0.5);
      cyl(g, 0.32, 0.32, 0.05, M.lightWood, x, 0.7, 0); cyl(g, 0.03, 0.03, 0.7, M.black, x, 0, 0);
      for (const s of [-1, 1]) { box(g, 0.5, 0.42, 0.5, M.fabric, x + s * 0.65, 0, 0); box(g, 0.5, 0.35, 0.08, M.fabric, x + s * 0.65, 0.42, 0.22); }
      plant(g, M, x + 1.1, -d / 2 + 0.3, 0.8);
    }
  },
  garden(g, M, w, d) {
    for (let i = 0; i < Math.round(w * d / 3); i++) {
      const x = (rnd() - 0.5) * (w - 0.6), z = (rnd() - 0.5) * (d - 0.6);
      cyl(g, 0.05, 0.07, 0.9, M.walnut, x, 0, z);
      sphere(g, 0.45 + rnd() * 0.3, rnd() < 0.5 ? M.leaf : M.leaf2, x, 1.3, z);
    }
    box(g, 1.8, 0.4, 0.6, M.lightWood, 0, 0, d / 2 - 0.6);
  },
  pool(g, M, w, d) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.1, d - 0.3), M.poolTile);
    p.position.set(0, -0.1, 0); p.receiveShadow = true; g.add(p);
    const water = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.03, d - 0.3), M.water);
    water.position.set(0, -0.035, 0); water.receiveShadow = true; water.userData.water = true; g.add(water);
    box(g, 0.25, 0.04, d, M.stoneTop, -w / 2 + 0.12, -0.02, 0, { cast: false });
    box(g, 0.25, 0.04, d, M.stoneTop, w / 2 - 0.12, -0.02, 0, { cast: false });
  },
};

function kindOf(l) {
  if (/Infinity pool/.test(l)) return "pool";
  if (/Jacuzzi/.test(l)) return "jacuzzi";
  if (/garden/i.test(l)) return "garden";
  if (/Pool deck|deck|Terrace/.test(l)) return "deck";
  if (/Balcony|balcony/.test(l)) return "balcony";
  if (/Living \/ Sleep/.test(l)) return "bed";
  if (/Dining/.test(l)) return "dining";
  if (/Living|living|salon|Family/.test(l)) return "living";
  if (/Kitchen/.test(l)) return "kitchen";
  if (/bed|Bed|suite|Suite|Maid/.test(l)) return "bed";
  if (/Bath|bath|Spa|Powder/.test(l)) return "bath";
  if (/Study|Library/.test(l)) return "study";
  return "closet";
}
const OUTDOOR = new Set(["pool", "jacuzzi", "garden", "deck", "balcony"]);

/* ---------------- main builder ---------------- */
export function buildHome(plan) {
  const M = makeMaterials();
  const root = new THREE.Group();
  const maxY = Math.max(...plan.rooms.map((r) => r[1] + r[3]));
  const W = 100 * S, D = maxY * S;
  const walls = [];

  // base slab
  const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.3, D + 0.5), new THREE.MeshStandardMaterial({ color: "#d9d4cc", roughness: 0.9 }));
  slab.position.y = -0.3; slab.receiveShadow = true; root.add(slab);

  plan.rooms.forEach(([x, y, w, h, label]) => {
    const kind = kindOf(label);
    const rw = w * S, rd = h * S;
    const cx = (x + w / 2 - 50) * S, cz = (y + h / 2 - maxY / 2) * S;
    const outdoor = OUTDOOR.has(kind);

    // floor
    const floorMat = kind === "bath" ? M.tile : kind === "garden" ? M.grass : outdoor ? M.teak : kind === "kitchen" ? M.marble : M.oak;
    if (kind !== "pool") {
      const fm = floorMat.clone(); if (fm.map) { fm.map = fm.map.clone(); fm.map.needsUpdate = true; fm.map.repeat.set(rw / 2.2, rd / 2.2); }
      const f = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.04, rd), fm);
      f.position.set(cx, -0.02, cz); f.receiveShadow = true; root.add(f);
    }

    // walls / glass on each edge
    const edges = [
      { a: [x, y], b: [x + w, y], n: [0, 1] }, { a: [x, y + h], b: [x + w, y + h], n: [0, -1] },
      { a: [x, y], b: [x, y + h], n: [1, 0] }, { a: [x + w, y], b: [x + w, y + h], n: [-1, 0] },
    ];
    edges.forEach(({ a, b, n }) => {
      const exterior = (a[0] === b[0] && (a[0] === 0 || a[0] === 100)) || (a[1] === b[1] && (a[1] === 0 || a[1] === maxY));
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) * S;
      const mx = ((a[0] + b[0]) / 2 - 50) * S + n[0] * WALL_T / 2, mz = ((a[1] + b[1]) / 2 - maxY / 2) * S + n[1] * WALL_T / 2;
      const horiz = a[1] === b[1];
      if (outdoor) {
        if (exterior && kind !== "pool") { // glass balustrade
          const gl = box(root, horiz ? len : 0.03, 1.05, horiz ? 0.03 : len, M.glass, mx, 0, mz, { cast: false });
          box(root, horiz ? len : 0.05, 0.04, horiz ? 0.05 : len, M.frame, mx, 1.05, mz);
          walls.push(gl);
        }
        return;
      }
      if (exterior) { // floor-to-ceiling glazing with slim mullions
        walls.push(box(root, horiz ? len : 0.03, WALL_H + 0.2, horiz ? 0.03 : len, M.glass, mx, 0, mz, { cast: false }));
        const m = Math.max(1, Math.round(len / 1.4));
        for (let i = 0; i <= m; i++) {
          const t = i / m - 0.5;
          walls.push(box(root, 0.05, WALL_H + 0.2, 0.05, M.frame, mx + (horiz ? t * len : 0), 0, mz + (horiz ? 0 : t * len)));
        }
        return;
      }
      // interior wall with a door gap near one end
      const door = len > 1.6 ? 0.9 : 0;
      const segLen = len - door - 0.35;
      const off = (door ? (len - segLen) / 2 : 0) * (n[0] + n[1] > 0 ? 1 : -1);
      const wx = mx + (horiz ? off : 0), wz = mz + (horiz ? 0 : off);
      walls.push(box(root, horiz ? (door ? segLen : len) : WALL_T, WALL_H, horiz ? WALL_T : (door ? segLen : len), M.wall, wx, 0, wz));
      box(root, horiz ? (door ? segLen : len) : WALL_T + 0.002, 0.01, horiz ? WALL_T + 0.002 : (door ? segLen : len), M.wallTop, wx, WALL_H, wz, { cast: false });
      if (door) { const end = mx + (horiz ? -Math.sign(off) * (len / 2 - 0.2) : 0), endz = mz + (horiz ? 0 : -Math.sign(off) * (len / 2 - 0.2)); walls.push(box(root, horiz ? 0.35 : WALL_T, WALL_H, horiz ? WALL_T : 0.35, M.wall, end, 0, endz)); }
    });

    // furniture
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    const long = rw >= rd;
    if (!long) g.rotation.y = Math.PI / 2;
    const lw = long ? rw : rd, ld = long ? rd : rw;
    const fn = kind === "jacuzzi" ? (gg) => F.deck(gg, M, lw, ld, { jacuzzi: true }) : (gg) => F[kind](gg, M, lw, ld);
    fn(g);
    root.add(g);
    g.userData.furniture = true;

    // floating room label anchor
    const anchor = new THREE.Object3D(); anchor.position.set(cx, kind === "garden" ? 2.3 : 0.08, cz); anchor.userData.label = label; root.add(anchor);
  });

  return { root, walls, size: { W, D } };
}
