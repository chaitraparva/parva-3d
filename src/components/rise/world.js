// Parva — "The Rise". A real-time Three.js world driven by one number: scroll progress 0 → 1.
//   0.00  above golden clouds
//   0.10  descend through the clouds over a Dubai-style district (skyline + sea on the horizon)
//   0.26  empty plot → construction: cranes swing, structure rises floor by floor, glass follows
//   0.64  topping out, camera sweeps over the rooftop pool
//   0.74  dusk: windows, street lights and pool glow come on
//   0.88  front elevation — every floor is hoverable / clickable (explorer)
import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// ---------- tower dimensions (metres) ----------
export const N = 14;                 // residential floors (L01–L14); L15 = rooftop
const LOBBY = 7.2, FH = 3.6, W = 26, D = 19, SLAB = 0.38;
export const levelBase = (k) => (k === 0 ? 0 : LOBBY + (k - 1) * FH);   // k: 0 lobby, 1..14, 15 roof
const ROOF = levelBase(15);
export const TOP = ROOF + 4;

// ---------- helpers ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t = clamp(t), t * t * (3 - 2 * t));
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(20261125);

function canvasTex(w, h, draw, { repeat = false, srgb = true } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slabGeo(w, d, r, h) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  return g;
}
const boxAt = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

// procedural windows for every building in the district (no textures, any size box)
function windowed(mat, { floorH = 3.3, bay = 2.6, litChance = 0.55 } = {}) {
  mat.userData.uniforms = { uNight: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = mat.userData.uniforms.uNight;
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vec4 wp_ = vec4(transformed, 1.0);
        vec3 wn_ = objectNormal;
        #ifdef USE_INSTANCING
          wp_ = instanceMatrix * wp_; wn_ = mat3(instanceMatrix) * wn_;
        #endif
        vWP = (modelMatrix * wp_).xyz; vWN = normalize(mat3(modelMatrix) * wn_);`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        varying vec3 vWP; varying vec3 vWN; uniform float uNight;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        if (abs(vWN.y) < 0.5) {
          float u = abs(vWN.x) > 0.5 ? vWP.z : vWP.x;
          vec2 cell = vec2(floor(u / ${bay.toFixed(2)}), floor(vWP.y / ${floorH.toFixed(2)}));
          vec2 f = vec2(fract(u / ${bay.toFixed(2)}), fract(vWP.y / ${floorH.toFixed(2)}));
          float win = step(0.12, f.x) * step(f.x, 0.88) * step(0.22, f.y) * step(f.y, 0.86) * step(2.0, vWP.y);
          float fadeD = 1.0 - smoothstep(250.0, 1400.0, distance(vWP, cameraPosition));
          win *= mix(0.25, 1.0, fadeD);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.24, 0.27), win * 0.6);
          diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 9.0, vWP.y));
          float lit = step(1.0 - ${litChance.toFixed(2)}, h21(cell + floor(vWP.xz * 0.01)));
          totalEmissiveRadiance += win * lit * uNight * vec3(1.0, 0.62, 0.3) * (0.35 + 0.5 * h21(cell * 3.1)) * mix(0.5, 1.0, fadeD);
        }`);
  };
  return mat;
}

// ==========================================================================================
export function createWorld(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: "high-performance" });
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 14000);
  scene.fog = new THREE.Fog(0xd8c6a6, 500, 4200);

  // ---------- sky + environment ----------
  const sky = new Sky(); sky.scale.setScalar(12000);
  const su = sky.material.uniforms;
  su.turbidity.value = 5.5; su.rayleigh.value = 1.4; su.mieCoefficient.value = 0.006; su.mieDirectionalG.value = 0.82;
  scene.add(sky);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(11000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false,
    uniforms: { uO: { value: 0 }, uTop: { value: new THREE.Color(0x0e1630) }, uMid: { value: new THREE.Color(0x3a3d63) }, uHor: { value: new THREE.Color(0xe08a54) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `uniform float uO; uniform vec3 uTop, uMid, uHor; varying vec3 vP;
      void main(){ float y = max(vP.y, 0.0);
        vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.12, y)); c = mix(c, uTop, smoothstep(0.12, 0.6, y));
        float glow = pow(max(0.0, 1.0 - abs(vP.y) * 6.0), 3.0) * max(0.0, dot(normalize(vP.xz), normalize(vec2(0.3, 1.0))));
        c += uHor * glow * 0.6;
        gl_FragColor = vec4(c, uO); }`,
  }));
  dome.renderOrder = -1; scene.add(dome);
  const sunDir = new THREE.Vector3();
  const setSun = (elev, az) => {
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(az));
    su.sunPosition.value.copy(sunDir);
  };
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envAt = (elev) => {
    setSun(elev, 215);
    const s = new THREE.Scene(); const k = new Sky(); k.scale.setScalar(1000);
    Object.assign(k.material.uniforms.sunPosition.value, sunDir);
    for (const key of ["turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG"]) k.material.uniforms[key].value = su[key].value;
    s.add(k);
    const rt = pmrem.fromScene(s, 0.02); k.geometry.dispose(); k.material.dispose();
    return rt.texture;
  };
  const envDay = envAt(22), envDusk = envAt(0.5);
  scene.environment = envDay;

  const sun = new THREE.DirectionalLight(0xffe2b8, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 4096, mobile ? 1024 : 4096);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 80, bottom: -40, near: 10, far: 400 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe0ee, 0xb59a77, 0.7);
  scene.add(hemi);

  // ---------- materials ----------
  const M = {
    white: new THREE.MeshStandardMaterial({ color: 0xf1ede6, roughness: 0.55 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb8b2a8, roughness: 0.92 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x8a6a44, metalness: 0.75, roughness: 0.38 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2b2a28, roughness: 0.6 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xcfe2e6, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: 0x41c9d6, emissive: 0x0a5a66, emissiveIntensity: 0.4, roughness: 0.04, metalness: 0.1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa5794c, roughness: 0.7 }),
    lawn: new THREE.MeshStandardMaterial({ color: 0x6f8a4a, roughness: 1 }),
    paving: new THREE.MeshStandardMaterial({ color: 0xd9d0c0, roughness: 0.9 }),
    dirt: new THREE.MeshStandardMaterial({ color: 0x9a8266, roughness: 1 }),
    hoarding: new THREE.MeshStandardMaterial({ color: 0x3a3f42, roughness: 0.8 }),
    cabin: new THREE.MeshStandardMaterial({ color: 0xe9e4d9, roughness: 0.7 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffc27a }),
  };
  const lattice = canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = "#fff"; g.lineWidth = 5;
    g.strokeRect(2, 2, w - 4, h - 4); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  }, { repeat: true, srgb: false });
  M.craneSolid = new THREE.MeshStandardMaterial({ color: 0xe6b021, roughness: 0.5 });
  M.crane = new THREE.MeshStandardMaterial({ color: 0xe6b021, roughness: 0.5, metalness: 0.2, alphaMap: lattice, alphaTest: 0.5, side: THREE.DoubleSide });

  // glass with lit "rooms" baked into an emissive map, one texture shared, offset per floor
  const rooms = canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    const cols = 24;
    for (let i = 0; i < cols; i++) {
      const on = R() < 0.62, x = (i / cols) * w;
      if (!on) continue;
      const k = 0.55 + R() * 0.45;
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, `rgba(255,${180 + R() * 40 | 0},${110 + R() * 40 | 0},${0.35 * k})`);
      grd.addColorStop(0.55, `rgba(255,196,128,${k})`);
      grd.addColorStop(1, `rgba(255,170,96,${0.6 * k})`);
      g.fillStyle = grd; g.fillRect(x + 2, 6, w / cols - 4, h - 10);
      if (R() < 0.5) { g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x + 2 + R() * 20, 6, 10 + R() * 18, h - 10); }
    }
  }, { repeat: true });
  const glassMats = [];
  const glassFor = (k) => {
    const t = rooms.clone(); t.needsUpdate = true; t.offset.x = R(); t.repeat.set(1, 1);
    const m = new THREE.MeshStandardMaterial({ color: 0x5f7480, metalness: 0.9, roughness: 0.06, envMapIntensity: 1.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0 });
    glassMats.push(m); return m;
  };

  // ---------- ground + district ----------
  const world = new THREE.Group(); scene.add(world);
  const G = 1700, GPX = mobile ? 2048 : 4096;
  const toPx = (v) => ((v + G / 2) / G) * GPX;
  const COMMUNITIES = [{ x: -420, z: 300, r: 230 }, { x: 400, z: 340, r: 210 }, { x: 520, z: -40, r: 150 }];
  const inCommunity = (x, z, pad = 0) => COMMUNITIES.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + pad);
  const HIGHWAY = -230;
  const inPark = (x, z) => x > -280 && x < 200 && z > 40 && z < 300;
  const groundTex = canvasTex(GPX, GPX, (g) => {
    const s = GPX / G;
    g.fillStyle = "#d9c29c"; g.fillRect(0, 0, GPX, GPX);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${150 + R() * 60},${130 + R() * 50},${100 + R() * 40},0.08)`; g.fillRect(R() * GPX, R() * GPX, 3 + R() * 30, 3 + R() * 30); }
    // grid roads
    g.fillStyle = "#6e6a64";
    for (let v = -825; v <= 850; v += 110) { g.fillRect(toPx(v) - 6 * s, 0, 12 * s, GPX); g.fillRect(0, toPx(v) - 6 * s, GPX, 12 * s); }
    // pavements
    g.strokeStyle = "rgba(225,215,195,0.7)"; g.lineWidth = 2 * s;
    for (let v = -825; v <= 850; v += 110) {
      g.beginPath(); g.moveTo(toPx(v) - 8 * s, 0); g.lineTo(toPx(v) - 8 * s, GPX); g.moveTo(toPx(v) + 8 * s, 0); g.lineTo(toPx(v) + 8 * s, GPX); g.stroke();
      g.beginPath(); g.moveTo(0, toPx(v) - 8 * s); g.lineTo(GPX, toPx(v) - 8 * s); g.moveTo(0, toPx(v) + 8 * s); g.lineTo(GPX, toPx(v) + 8 * s); g.stroke();
    }
    // highway
    g.fillStyle = "#5c5955"; g.fillRect(0, toPx(HIGHWAY) - 26 * s, GPX, 52 * s);
    g.fillStyle = "#7f8a5e"; g.fillRect(0, toPx(HIGHWAY) - 2.5 * s, GPX, 5 * s);
    g.strokeStyle = "rgba(255,255,255,0.55)"; g.setLineDash([6 * s, 8 * s]); g.lineWidth = 0.6 * s;
    for (const o of [-18, -10, 10, 18]) { g.beginPath(); g.moveTo(0, toPx(HIGHWAY + o)); g.lineTo(GPX, toPx(HIGHWAY + o)); g.stroke(); }
    g.setLineDash([]);
    // villa communities: green discs, ring roads, spokes
    for (const c of COMMUNITIES) {
      g.fillStyle = "#c9c09c"; g.beginPath(); g.arc(toPx(c.x), toPx(c.z), (c.r + 12) * s, 0, 7); g.fill();
      g.fillStyle = "#88935f"; g.beginPath(); g.arc(toPx(c.x), toPx(c.z), 34 * s, 0, 7); g.fill();
      g.strokeStyle = "#77726b"; g.lineWidth = 8 * s;
      for (let r = 52; r < c.r; r += 44) { g.beginPath(); g.arc(toPx(c.x), toPx(c.z), r * s, 0, 7); g.stroke(); }
      for (let a = 0; a < 6; a++) {
        const an = a * Math.PI / 3 + 0.3;
        g.beginPath(); g.moveTo(toPx(c.x + Math.cos(an) * 34), toPx(c.z + Math.sin(an) * 34)); g.lineTo(toPx(c.x + Math.cos(an) * (c.r + 10)), toPx(c.z + Math.sin(an) * (c.r + 10))); g.stroke();
      }
    }
    // green verges + parks
    for (let i = 0; i < 40; i++) { const x = -800 + R() * 1600, z = -150 + R() * 900; if (Math.hypot(x, z) < 120) continue; g.fillStyle = "rgba(118,138,84,0.55)"; g.beginPath(); g.ellipse(toPx(x), toPx(z), (10 + R() * 30) * s, (8 + R() * 24) * s, R() * 3, 0, 7); g.fill(); }
    // the park + lake in front of the tower
    g.fillStyle = "#8a9a5e"; g.fillRect(toPx(-275), toPx(55), 470 * s, 240 * s);
    g.fillStyle = "rgba(150,170,100,0.6)"; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(toPx(-260 + R() * 440), toPx(70 + R() * 210), (6 + R() * 14) * s, 0, 7); g.fill(); }
    g.strokeStyle = "#d9ccb0"; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(toPx(-60), toPx(185), 150 * s, 80 * s, 0, 0, 7); g.stroke();
    // the plot
    g.fillStyle = "#a48b6b"; g.fillRect(toPx(-44), toPx(-38), 88 * s, 76 * s);
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(G, G), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  const outer = new THREE.Mesh(new THREE.RingGeometry(G * 0.69, 9000, 64, 1), new THREE.MeshStandardMaterial({ color: 0xd2bc96, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.05; world.add(outer);

  // sea on the horizon, beyond the skyline
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(30000, 9000), new THREE.MeshStandardMaterial({ color: 0x2f6f86, roughness: 0.12, metalness: 0.4, envMapIntensity: 1.4 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.2, -1250 - 4500); world.add(sea);

  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: 0x3d7f8f, roughness: 0.08, metalness: 0.3, envMapIntensity: 1.3 }));
  lake.rotation.x = -Math.PI / 2; lake.scale.set(95, 42, 1); lake.position.set(-70, 0.25, 190); world.add(lake);

  // instanced district buildings
  const bMat = windowed(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, emissive: 0x000000 }), { litChance: 0.3 });
  const tMat = windowed(new THREE.MeshStandardMaterial({ color: 0xb9c0c4, roughness: 0.25, metalness: 0.55, emissive: 0x000000 }), { floorH: 3.6, bay: 3, litChance: 0.32 });
  const vMat = new THREE.MeshStandardMaterial({ color: 0xf2ece2, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x9c7d63, roughness: 0.9 });
  const unit = new THREE.BoxGeometry(1, 1, 1); unit.translate(0, 0.5, 0);
  const dummy = new THREE.Object3D();
  const place = (list, mat, cast = false) => {
    const m = new THREE.InstancedMesh(unit, mat, list.length);
    list.forEach((b, i) => { dummy.position.set(b.x, b.y || 0, b.z); dummy.rotation.set(0, b.r || 0, 0); dummy.scale.set(b.w, b.h, b.d); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.castShadow = cast; m.receiveShadow = false; world.add(m); return m;
  };
  // villas around ring roads
  const villas = [], villaRoofs = [];
  for (const c of COMMUNITIES) for (let r = 52; r < c.r; r += 44) for (const side of [-12, 12]) {
    const rr = r + side, n = Math.floor((2 * Math.PI * rr) / (mobile ? 22 : 16));
    for (let i = 0; i < n; i++) {
      if (R() < 0.08) continue;
      const a = (i / n) * Math.PI * 2, x = c.x + Math.cos(a) * rr, z = c.z + Math.sin(a) * rr, h = 6.5 + R() * 2;
      villas.push({ x, z, w: 9 + R() * 3, h, d: 8, r: -a });
      villaRoofs.push({ x, z, y: h, w: 5, h: 1.6, d: 4, r: -a });
    }
  }
  place(villas, vMat); place(villaRoofs, roofMat);
  // mid-rise blocks in the grid
  const mids = [];
  for (let gx = -825; gx < 850; gx += 110) for (let gz = -825; gz < 850; gz += 110) {
    const cx = gx + 55, cz = gz + 55;
    if (Math.abs(cx) < 70 && Math.abs(cz) < 70) continue;                 // our block stays open
    if (inPark(cx, cz)) continue;                                          // the park in front of the tower
    if (inCommunity(cx, cz, 40)) continue;
    if (Math.abs(cz - HIGHWAY) < 70) continue;
    const nearHw = cz < HIGHWAY + 160 && cz > HIGHWAY - 400;
    const k = mobile ? 2 : 2 + (R() * 3 | 0);
    for (let i = 0; i < k; i++) {
      const w = 16 + R() * 18, d = 14 + R() * 16;
      const x = cx + (R() - 0.5) * (90 - w), z = cz + (R() - 0.5) * (90 - d);
      const h = nearHw ? 18 + Math.pow(R(), 2) * 60 : 10 + R() * 14 + (R() < 0.12 ? 18 : 0);
      mids.push({ x, z, w, d, h });
    }
  }
  const PAL = [0xe6cfa6, 0xd9bd92, 0xceb48e, 0xeee2cc, 0xc9b294, 0xd6cfc2, 0xe1c7a0, 0xbfa88a];
  const midMesh = place(mids, bMat, !mobile); midMesh.receiveShadow = !mobile;
  mids.forEach((_, i) => midMesh.setColorAt(i, new THREE.Color(PAL[(R() * PAL.length) | 0])));
  place(mids.filter(() => R() < 0.7).map((b) => ({ x: b.x + (R() - 0.5) * b.w * 0.4, z: b.z + (R() - 0.5) * b.d * 0.4, y: b.h, w: 3 + R() * 5, h: 1.5 + R() * 2, d: 3 + R() * 4 })), new THREE.MeshStandardMaterial({ color: 0xbdb3a3, roughness: 0.9 }));
  midMesh.instanceColor.needsUpdate = true;
  // skyline across the horizon (behind the highway), with one supertall
  const towers = [];
  for (let i = 0; i < (mobile ? 70 : 140); i++) {
    const x = -1600 + R() * 3200, z = -820 - R() * 380;
    const h = 70 + Math.pow(R(), 1.6) * 300 * (1 - Math.abs(x) / 2400);
    towers.push({ x, z, w: 26 + R() * 24, d: 26 + R() * 24, h });
  }
  place(towers, tMat);
  const supertall = new THREE.Group();
  [[60, 0, 240], [44, 240, 180], [30, 420, 130], [18, 550, 80]].forEach(([w, y, h]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.55, h, 6), tMat); m.position.y = y + h / 2; supertall.add(m);
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 6, 180, 6), tMat); spire.position.y = 720; supertall.add(spire);
  supertall.position.set(-380, 0, -1060); world.add(supertall);

  // palms (district + plot landscaping)
  const leaf = canvasTex(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = "#fff";
    g.beginPath(); g.moveTo(w / 2, 0); g.quadraticCurveTo(w, h * 0.35, w / 2, h); g.quadraticCurveTo(0, h * 0.35, w / 2, 0); g.fill();
  }, { srgb: false });
  const crownGeo = mergeGeometries(Array.from({ length: 8 }, (_, i) => {
    const p = new THREE.PlaneGeometry(1.1, 4.6, 1, 4); p.translate(0, 2.3, 0);
    const pos = p.attributes.position;
    for (let v = 0; v < pos.count; v++) { const y = pos.getY(v); pos.setZ(v, -0.05 * y * y); }
    p.rotateX(-1.05); p.rotateY((i / 8) * Math.PI * 2); return p;
  }));
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1, 6); trunkGeo.translate(0, 0.5, 0);
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6f52, roughness: 1 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x4f6b34, roughness: 0.9, alphaMap: leaf, alphaTest: 0.5, side: THREE.DoubleSide });
  const makePalms = (pts, cast) => {
    const trunk = new THREE.InstancedMesh(trunkGeo, palmTrunkMat, pts.length), crown = new THREE.InstancedMesh(crownGeo, palmLeafMat, pts.length);
    trunk.castShadow = crown.castShadow = cast;
    const set = (s = 1) => pts.forEach((p, i) => {
      const k = Math.max(0.001, s * p.s);
      dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, p.r, 0); dummy.scale.set(k, p.h * k, k); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
      dummy.position.set(p.x, p.h * k, p.z); dummy.scale.setScalar(k); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
    });
    set(); trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true;
    world.add(trunk, crown); return { set: (s) => { set(s); trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true; } };
  };
  const dPalms = [];
  for (let i = 0; i < (mobile ? 700 : 1600); i++) {
    const c = COMMUNITIES[i % 3], a = R() * 7, r = 40 + R() * (c.r - 30);
    dPalms.push({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, h: 7 + R() * 4, s: 1, r: R() * 7 });
  }
  for (let v = -770; v <= 850; v += 110) for (let t = -800; t < 800; t += 24) {
    if (R() < 0.5) continue;
    dPalms.push({ x: v + 10, z: t, h: 8 + R() * 3, s: 1, r: R() * 7 });
  }
  makePalms(dPalms, false);

  // street lights (glow at dusk)
  const lampPts = [];
  for (let v = -825; v <= 850; v += 110) for (let t = -820; t < 820; t += 30) { lampPts.push([v + 7, t]); lampPts.push([t, v + 7]); }
  for (let t = -840; t < 840; t += 26) { lampPts.push([t, HIGHWAY - 3]); lampPts.push([t, HIGHWAY + 3]); }
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0 });
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 6, 4), lampMat, lampPts.length);
  lampPts.forEach(([x, z], i) => { dummy.position.set(x, 8, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); lamps.setMatrixAt(i, dummy.matrix); });
  world.add(lamps);

  // ---------- the site ----------
  const site = new THREE.Group(); world.add(site);
  const pit = new THREE.Mesh(new THREE.BoxGeometry(72, 6, 60), M.dirt); pit.position.y = -2.95; pit.receiveShadow = true; site.add(pit);
  const hoard = new THREE.Group(); site.add(hoard);
  [[0, 0, -37, 86, 0], [0, 0, 37, 86, 0], [-43, 0, 0, 74, Math.PI / 2], [43, 0, 0, 74, Math.PI / 2]].forEach(([x, y, z, w, r]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, 0.3), M.hoarding); m.position.set(x, 1.3, z); m.rotation.y = r; m.castShadow = true; hoard.add(m);
  });
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.5), M.cabin); m.position.set(-36 + (i % 3) * 6.4, 1.3 + (i > 2 ? 2.6 : 0), 30); m.castShadow = true; hoard.add(m); }
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(3 + R() * 4, 0.8 + R(), 2 + R() * 2), i % 2 ? M.concrete : M.wood); m.position.set(18 + R() * 18, 0.6, 18 + R() * 12); m.rotation.y = R() * 3; hoard.add(m); }

  // finished landscaping (fades in at topping out)
  const land = new THREE.Group(); world.add(land);
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(86, 0.4, 74), M.lawn); lawn.position.y = 0.2; lawn.receiveShadow = true; land.add(lawn);
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(46, 0.5, 34), M.paving); plaza.position.set(0, 0.25, 8); plaza.receiveShadow = true; land.add(plaza);
  const drive = new THREE.Mesh(new THREE.TorusGeometry(15, 3.2, 2, 48, Math.PI), M.paving); drive.rotation.x = -Math.PI / 2; drive.position.set(0, 0.3, 24); drive.scale.z = 0.4; land.add(drive);
  const gpool = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 7), M.water); gpool.position.set(-24, 0.35, -26); land.add(gpool);
  const pPalms = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; pPalms.push({ x: Math.cos(a) * 36, z: Math.sin(a) * 30, h: 8 + R() * 3, s: 1, r: R() * 7 }); }
  const plotPalms = makePalms(pPalms, true);
  land.scale.y = 0.001;

  // ---------- the tower ----------
  const tower = new THREE.Group(); world.add(tower);
  const floors = [];   // per level: { k, base, struct: [meshes], skin: [meshes], hit }
  const colGeo = mergeGeometries([[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-0.5, -1], [0.5, 1]].map(([a, b]) => {
    const g = new THREE.CylinderGeometry(0.38, 0.38, 1, 10); g.translate(a * (W / 2 - 1.6), 0.5, b * (D / 2 - 1.6)); return g;
  }));
  const coreGeo = new THREE.BoxGeometry(8, 1, 6.5); coreGeo.translate(0, 0.5, 0);
  const mullGeo = (h) => {
    const parts = [];
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 1.625) { parts.push(boxAt(0.12, h, 0.22, x, h / 2, D / 2)); parts.push(boxAt(0.12, h, 0.22, x, h / 2, -D / 2)); }
    for (let z = -D / 2 + 1.58; z < D / 2; z += 1.58) { parts.push(boxAt(0.22, h, 0.12, W / 2, h / 2, z)); parts.push(boxAt(0.22, h, 0.12, -W / 2, h / 2, z)); }
    const g = mergeGeometries(parts); g.translate(0, -h / 2, 0); g.translate(0, h / 2, 0); return g;
  };
  const mullStd = mullGeo(1);
  const skinGlass = new THREE.BoxGeometry(W - 0.2, 1, D - 0.2); skinGlass.translate(0, 0.5, 0);

  const mk = (g, m, parent, cast = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; };

  for (let k = 0; k <= 15; k++) {
    const base = levelBase(k), h = k === 0 ? LOBBY : FH;
    const grp = new THREE.Group(); grp.position.y = base; tower.add(grp);
    const L = { k, base, h, grp };
    // structure
    L.slab = mk(k === 0 ? slabGeo(W + 8, D + 8, 3, SLAB) : (() => {
      const dz = 1.7 + 1.1 * Math.sin(k * 0.85), dx = 1.0 + 0.9 * Math.sin(k * 0.85 + 1.9), sx = 1.3 * Math.sin(k * 0.5);
      const g = slabGeo(W + 2 * dx, D + 2 * dz, 2.4, SLAB); g.translate(sx, 0, 0); L.ext = { dx, dz, sx }; return g;
    })(), M.white, grp);
    if (k < 15) {
      L.cols = mk(colGeo, M.concrete, grp); L.cols.position.y = SLAB; L.cols.scale.y = h - SLAB;
      L.core = mk(coreGeo, M.concrete, grp); L.core.position.y = SLAB;
      // skin
      L.glass = mk(skinGlass, k === 0 ? new THREE.MeshStandardMaterial({ color: 0x6f8088, metalness: 0.7, roughness: 0.08, emissive: 0xffc68a, emissiveIntensity: 0 }) : glassFor(k), grp);
      L.glass.position.y = SLAB;
      L.mull = mk(mullStd, M.bronze, grp, false); L.mull.position.y = SLAB;
      if (k > 0) {
        const { dx, dz, sx } = L.ext, rw = W + 2 * dx - 5, rd = D + 2 * dz - 5;
        const rails = new THREE.Group(); rails.position.y = SLAB; grp.add(rails);
        const railGeo = mergeGeometries([boxAt(rw, 1.1, 0.04, sx, 0.55, D / 2 + dz), boxAt(rw, 1.1, 0.04, sx, 0.55, -D / 2 - dz), boxAt(0.04, 1.1, rd, sx + W / 2 + dx, 0.55, 0), boxAt(0.04, 1.1, rd, sx - W / 2 - dx, 0.55, 0)]);
        const capGeo = mergeGeometries([boxAt(rw, 0.06, 0.08, sx, 1.12, D / 2 + dz), boxAt(rw, 0.06, 0.08, sx, 1.12, -D / 2 - dz), boxAt(0.08, 0.06, rd, sx + W / 2 + dx, 1.12, 0), boxAt(0.08, 0.06, rd, sx - W / 2 - dx, 1.12, 0)]);
        mk(railGeo, M.rail, rails, false); mk(capGeo, M.bronze, rails, false);
        L.rails = rails;
        // planter boxes on the deep balconies
        if (dz > 1.9) { const pl = mk(boxAt(rw * 0.6, 0.7, 0.8, sx, SLAB + 0.35, D / 2 + dz - 0.7), M.white, grp); const gr = mk(boxAt(rw * 0.6, 0.35, 0.7, sx, SLAB + 0.85, D / 2 + dz - 0.7), M.lawn, grp, false); L.planter = [pl, gr]; }
      } else {
        // lobby: canopy + bronze portal
        L.canopy = mk(boxAt(16, 0.5, 8, 0, LOBBY - 1.4, D / 2 + 4), M.bronze, grp);
        L.portal = mk(mergeGeometries([boxAt(0.6, LOBBY - 1, 0.6, -6, (LOBBY - 1) / 2, D / 2 + 0.2), boxAt(0.6, LOBBY - 1, 0.6, 6, (LOBBY - 1) / 2, D / 2 + 0.2)]), M.bronze, grp);
      }
    } else {
      // rooftop: pool, deck, pergola, glass parapet
      const roof = new THREE.Group(); roof.position.y = SLAB; grp.add(roof); L.roof = roof;
      mk(boxAt(W - 1, 0.25, D - 1, 0, 0.12, 0), M.wood, roof);
      L.pool = mk(boxAt(15, 0.3, 6.5, -3, 0.3, 3), M.water, roof, false);
      mk(boxAt(15.6, 0.5, 0.3, -3, 0.25, 6.4), M.white, roof); mk(boxAt(15.6, 0.5, 0.3, -3, 0.25, -0.4), M.white, roof);
      const perg = [];
      for (let i = 0; i < 9; i++) perg.push(boxAt(0.18, 0.25, 8, 4.5 + i * 0.9, 3.1, -4.5));
      perg.push(boxAt(0.3, 3.1, 0.3, 4.5, 1.55, -8.3), boxAt(0.3, 3.1, 0.3, 12, 1.55, -8.3), boxAt(0.3, 3.1, 0.3, 4.5, 1.55, -0.8), boxAt(0.3, 3.1, 0.3, 12, 1.55, -0.8));
      mk(mergeGeometries(perg), M.bronze, roof);
      for (let i = 0; i < 5; i++) mk(boxAt(0.8, 0.35, 2, -9 + i * 2.2, 0.42, -2.2), M.white, roof);
      mk(mergeGeometries([boxAt(W, 1.2, 0.05, 0, 0.6, D / 2), boxAt(W, 1.2, 0.05, 0, 0.6, -D / 2), boxAt(0.05, 1.2, D, W / 2, 0.6, 0), boxAt(0.05, 1.2, D, -W / 2, 0.6, 0)]), M.rail, roof, false);
      mk(boxAt(9, 3.2, 6, 4, 1.6, 4.5), M.white, roof);                     // stair / lift overrun
      L.crown = mk(mergeGeometries([boxAt(W + 0.6, 0.35, 0.35, 0, 4.4, D / 2 + 0.2), boxAt(W + 0.6, 0.35, 0.35, 0, 4.4, -D / 2 - 0.2), boxAt(0.35, 0.35, D + 0.6, W / 2 + 0.2, 4.4, 0), boxAt(0.35, 0.35, D + 0.6, -W / 2 - 0.2, 4.4, 0)]), M.bronze, roof);
      const lamps2 = []; for (let i = 0; i < 10; i++) lamps2.push(boxAt(0.25, 0.25, 0.25, -10 + i * 2.2, 0.6, 7.3));
      L.roofGlow = mk(mergeGeometries(lamps2), M.glow, roof, false);
    }
    // explorer hit volume
    const hb = new THREE.Mesh(new THREE.BoxGeometry(W + 6, k === 15 ? 4 : h, D + 6), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.y = (k === 15 ? 4 : h) / 2; hb.userData.level = k; grp.add(hb); L.hit = hb;
    floors.push(L);
  }
  // bronze vertical fins on the short faces (full height, rise with the skin)
  const fins = new THREE.Group(); tower.add(fins);
  for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++) {
    const f = mk(boxAt(0.5, 1, 1.6, sgn * (W / 2 + 0.6), 0.5, -4 + i * 4), M.bronze, fins);
    f.userData.fin = true;
  }
  fins.position.y = LOBBY;

  // highlight for the explorer
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xe2c99a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const hl = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 1, D + 0.6), hlMat); hl.visible = false; tower.add(hl);
  const hlEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.8, 1, D + 0.8)), new THREE.LineBasicMaterial({ color: 0xf3dfb2, transparent: true, opacity: 0.9 }));
  hl.add(hlEdges);

  // ---------- cranes ----------
  function crane(len, back) {
    const g = new THREE.Group();
    const mast = mk(boxAt(2.2, 1, 2.2, 0, 0.5, 0), M.crane.clone(), g, true);
    mast.material.alphaMap = lattice.clone(); mast.material.alphaMap.needsUpdate = true;
    const head = new THREE.Group(); g.add(head);
    const jibMat = M.crane.clone(); jibMat.alphaMap = lattice.clone(); jibMat.alphaMap.repeat.set(len / 2, 1); jibMat.alphaMap.needsUpdate = true;
    mk(boxAt(len + back, 1.8, 1.8, (len - back) / 2, 0, 0), jibMat, head);
    mk(boxAt(4, 2.2, 3, -back + 2.2, -1.6, 0), M.concrete, head);
    mk(boxAt(2.4, 2.4, 2.4, 0, -1.4, 1.9), M.white, head);
    mk(new THREE.ConeGeometry(0.9, 7, 4).translate(0, 4.4, 0), M.craneSolid, head);
    const trolley = new THREE.Group(); head.add(trolley);
    const cable = mk(boxAt(0.06, 1, 0.06, 0, -0.5, 0), M.dark, trolley, false);
    const hook = mk(boxAt(1.4, 1.2, 1.4, 0, 0, 0), M.dark, trolley);
    return { g, mast, head, trolley, cable, hook };
  }
  const cranes = [crane(46, 14), crane(34, 10)];
  cranes[0].g.position.set(W / 2 + 7, 0, -4); cranes[1].g.position.set(-W / 2 - 8, 0, 7);
  cranes.forEach((c) => world.add(c.g));

  // ---------- clouds ----------
  const cloudTex = canvasTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = w * 0.14 + R() * w * 0.72, y = h * 0.62 - Math.pow(R(), 1.5) * h * 0.4, r = 18 + R() * 52;
      const grd = g.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r);
      grd.addColorStop(0, "rgba(255,255,255,0.9)"); grd.addColorStop(0.6, "rgba(246,242,236,0.6)"); grd.addColorStop(0.85, "rgba(225,228,236,0.18)"); grd.addColorStop(1, "rgba(210,215,225,0)");
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // flat-ish base, shaded underside
    g.globalCompositeOperation = "source-atop";
    const sh = g.createLinearGradient(0, h * 0.2, 0, h * 0.85); sh.addColorStop(0, "rgba(255,226,180,0.25)"); sh.addColorStop(0.5, "rgba(255,240,220,0)"); sh.addColorStop(1, "rgba(118,126,150,0.6)");
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
  });
  const clouds = new THREE.Group(); scene.add(clouds);
  const cloudN = mobile ? 70 : 120;
  for (let i = 0; i < cloudN; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex, color: new THREE.Color().setHSL(0.09, 0.5, 0.9 + R() * 0.08), transparent: true, depthWrite: false, opacity: 1, fog: false });
    const s = new THREE.Sprite(m);
    const x = -1600 + R() * 3600, z = -2200 + R() * 3600;
    if (Math.hypot(x - 300, z - 900) < 260 && R() < 0.8) { i--; continue; }  // keep the opening shot's foreground open-ish
    s.position.set(x, 240 + R() * 70, z);
    const k = 170 + R() * 330; s.scale.set(k, k * 0.5, 1);
    s.userData.o = 0.7 + R() * 0.3;
    clouds.add(s);
  }

  // ---------- post ----------
  let composer = null, bloom = null;
  if (!mobile) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.55, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // ---------- camera path ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const KEYS = [
    { t: 0.0, p: V(380, 470, 1150), q: V(-200, 330, -900) },
    { t: 0.08, p: V(300, 430, 820), q: V(-60, 160, -300) },
    { t: 0.16, p: V(200, 300, 500), q: V(0, 0, 0) },
    { t: 0.22, p: V(150, 200, 330), q: V(0, 0, 0) },
    { t: 0.3, p: V(110, 120, 205), q: V(0, 8, 0) },
    { t: 0.4, p: V(72, 62, 122), q: V(0, 18, 0) },
    { t: 0.5, p: V(-28, 70, 112), q: V(0, 30, 0) },
    { t: 0.6, p: V(-74, 82, 66), q: V(0, 44, 0) },
    { t: 0.68, p: V(-38, 94, 36), q: V(-2, 57, 0) },
    { t: 0.76, p: V(-70, 40, 100), q: V(0, 42, 0) },
    { t: 0.83, p: V(-48, 6, 104), q: V(0, 38, 0) },
    { t: 0.9, p: V(-10, 30, 124), q: V(-14, 32, 0) },
    { t: 1.0, p: V(-6, 31, 118), q: V(-14, 31, 0) },
  ];
  const curveP = new THREE.CatmullRomCurve3(KEYS.map((k) => k.p), false, "centripetal");
  const curveQ = new THREE.CatmullRomCurve3(KEYS.map((k) => k.q), false, "centripetal");
  const keyT = (p) => {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].t) i++;
    const a = KEYS[i].t, b = KEYS[i + 1].t;
    return (i + ease(clamp((p - a) / (b - a)))) / (KEYS.length - 1);
  };

  // ---------- state ----------
  let P = 0, hover = null, mobileFrame = mobile;
  const tmpP = new THREE.Vector3(), tmpQ = new THREE.Vector3();
  const BUILD_A = 0.26, BUILD_B = 0.68;   // construction window in scroll progress
  const LAG = 3;                          // facade trails the structure by 3 levels

  function update(time) {
    const p = P;
    // camera
    const u = keyT(p);
    curveP.getPoint(u, tmpP); curveQ.getPoint(u, tmpQ);
    if (mobileFrame) { tmpP.sub(tmpQ).multiplyScalar(p > 0.84 ? 1.45 : 1.18).add(tmpQ); tmpQ.x *= p > 0.84 ? 0 : 1; if (p > 0.84) tmpQ.y += 4; }
    camera.position.copy(tmpP);
    camera.position.x += Math.sin(time * 0.00021) * 1.2 * (1 - range(p, 0.86, 0.95));
    camera.position.y += Math.sin(time * 0.00017) * 0.8;
    camera.lookAt(tmpQ);

    // build progress
    const b = range(p, BUILD_A, BUILD_B);
    const S = b * (16 + LAG);
    let topStruct = 0;
    for (const L of floors) {
      const s = clamp(S - L.k), f = clamp(S - LAG - L.k);
      const vis = s > 0.001;
      L.grp.visible = vis;
      if (!vis) continue;
      L.slab.scale.set(Math.max(0.001, easeOut(s * 1.6)), 1, Math.max(0.001, easeOut(s * 1.6)));
      if (L.cols) {
        const cs = ease((s - 0.3) / 0.7); L.cols.scale.y = Math.max(0.001, cs * (L.h - SLAB)); L.cols.visible = cs > 0.001 && f < 1;
        const cr = clamp(S + 1.2 - L.k); L.core.scale.y = Math.max(0.001, ease(cr) * (L.h - SLAB));
        L.glass.scale.y = Math.max(0.001, ease(f) * (L.h - SLAB)); L.glass.visible = f > 0.001;
        L.mull.scale.y = Math.max(0.001, ease(f) * (L.h - SLAB)); L.mull.visible = f > 0.001;
        if (L.rails) { const r = ease((f - 0.5) / 0.5); L.rails.visible = r > 0.001; L.rails.scale.y = Math.max(0.001, r); }
        if (L.planter) L.planter.forEach((m) => (m.visible = f > 0.95));
        if (L.canopy) { L.canopy.visible = L.portal.visible = f > 0.9; }
        if (s >= 1) topStruct = Math.max(topStruct, L.base + L.h);
      }
      if (L.roof) { const r = ease(f); L.roof.visible = r > 0.01; L.roof.scale.y = Math.max(0.001, r); }
    }
    if (S >= 15) topStruct = TOP;
    const finsK = clamp((S - LAG) / 15);
    fins.scale.y = Math.max(0.001, finsK * (ROOF - LOBBY + 4)); fins.visible = finsK > 0.01;

    // site → landscaping
    const done = range(p, BUILD_B - 0.02, BUILD_B + 0.06);
    hoard.visible = done < 0.6; pit.visible = b < 0.06;
    land.scale.y = Math.max(0.001, ease(done)); land.visible = done > 0.01;
    plotPalms.set(easeOut(range(p, BUILD_B, BUILD_B + 0.1)));

    // cranes
    const craneOut = range(p, 0.6, 0.645);
    cranes.forEach((c, i) => {
      const mh = Math.max(18, topStruct + (i ? 8 : 14)) * (1 - craneOut) + 0.001;
      c.mast.scale.y = mh; c.mast.material.alphaMap.repeat.set(1, mh / 2.2);
      c.head.position.y = mh + 1;
      c.head.rotation.y = (i ? 2.2 : -0.6) + Math.sin(b * (i ? 9 : 7) + i) * 0.9 + b * 2.5;
      const reach = 10 + (Math.sin(b * 11 + i * 2) * 0.5 + 0.5) * (i ? 18 : 26);
      c.trolley.position.x = reach;
      const drop = Math.max(4, mh - topStruct - 2);
      c.cable.scale.y = drop; c.hook.position.y = -drop - 0.6;
      c.g.visible = b > 0.001 && craneOut < 1 && p > BUILD_A - 0.02;
    });

    // sun → dusk
    const dusk = ease(range(p, 0.66, 0.86));
    const morning = ease(range(p, 0.08, 0.36));
    const elev = dusk > 0 ? lerp(32, -1.5, dusk) : lerp(7, 32, morning);
    const az = dusk > 0 ? lerp(70, 20, dusk) : lerp(205, 70, morning);
    setSun(elev, az);
    sun.position.copy(sunDir).multiplyScalar(600); sun.target.position.set(0, 20, 0);
    const span = lerp(260, 80, range(p, 0.3, 0.55));
    const sc = sun.shadow.camera;
    if (Math.abs(sc.right - span) > 0.5) { sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.far = 1400; sc.updateProjectionMatrix(); }
    sun.intensity = lerp(lerp(2.2, 2.8, morning), 0.15, dusk);
    sun.color.setHSL(lerp(0.1, 0.05, dusk), 0.8, lerp(lerp(0.7, 0.86, morning), 0.62, dusk));
    hemi.intensity = lerp(0.5, 0.16, dusk);
    hemi.color.setHSL(lerp(0.57, 0.68, dusk), 0.4, lerp(0.85, 0.45, dusk));
    su.rayleigh.value = lerp(lerp(3, 1.3, morning), 2.6, dusk); su.turbidity.value = lerp(lerp(10, 5, morning), 9, dusk);
    su.mieCoefficient.value = lerp(0.012, 0.005, morning);
    dome.material.uniforms.uO.value = ease(range(p, 0.7, 0.86));
    scene.environment = dusk > 0.55 ? envDusk : envDay;
    renderer.toneMappingExposure = lerp(lerp(0.72, 0.8, morning), 0.6, dusk);
    scene.fog.color.setHSL(lerp(0.1, 0.66, dusk), lerp(0.4, 0.22, dusk), lerp(0.76, 0.2, dusk));
    scene.fog.near = lerp(1400, 300, range(p, 0.14, 0.3)); scene.fog.far = lerp(7000, 3000, range(p, 0.14, 0.3));
    const night = ease(range(p, 0.72, 0.9));
    bMat.userData.uniforms.uNight.value = night; tMat.userData.uniforms.uNight.value = night;
    glassMats.forEach((m) => (m.emissiveIntensity = night * 1.25));
    floors[0].glass.material.emissiveIntensity = night * 0.45;
    M.water.emissiveIntensity = 0.35 + night * 1.6;
    lampMat.opacity = night;
    if (floors[15].roofGlow) floors[15].roofGlow.visible = night > 0.05;
    if (bloom) bloom.strength = night * 0.6;

    // clouds: drift, fade as we pass through, gone once we're below
    const below = range(p, 0.13, 0.21);
    clouds.visible = below < 1;
    if (clouds.visible) clouds.children.forEach((s, i) => {
      s.position.x += Math.sin(time * 0.0001 + i) * 0.02;
      const dist = s.position.distanceTo(camera.position);
      s.material.opacity = s.userData.o * clamp((dist - 60) / 220) * (1 - below);
      s.material.color.setRGB(1.22, 1.04 + s.userData.o * 0.04, 0.86);
    });

    // explorer highlight
    const exploring = p > 0.88;
    if (hover != null && exploring) {
      const L = floors[hover];
      hl.visible = true; hl.position.y = L.base + (hover === 15 ? 2 : L.h / 2); hl.scale.y = hover === 15 ? 4 : L.h;
      hlMat.opacity = 0.22 + Math.sin(time * 0.004) * 0.06;
    } else hl.visible = false;
  }

  // ---------- api ----------
  let w = 1, h = 1;
  const resize = (W_, H_) => {
    w = W_; h = H_;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 46 : 38;
    camera.updateProjectionMatrix();
    if (composer) { composer.setSize(w, h); composer.setPixelRatio(dpr); bloom.resolution.set(w * dpr / 2, h * dpr / 2); }
  };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hits = floors.map((L) => L.hit);
  return {
    setProgress: (p) => { P = p; },
    setHover: (k) => { hover = k; },
    setMobileFrame: (m) => { mobileFrame = m; },
    pick: (x, y) => {
      if (P < 0.88) return null;
      ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      tower.updateMatrixWorld();
      const hit = ray.intersectObjects(hits, false)[0];
      return hit ? hit.object.userData.level : null;
    },
    render: (time) => { update(time); composer ? composer.render() : renderer.render(scene, camera); },
    compile: () => { update(0); renderer.compile(scene, camera); },
    resize,
    dispose: () => { renderer.dispose(); pmrem.dispose(); composer?.dispose?.(); },
  };
}
