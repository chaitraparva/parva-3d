import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import gsap from "gsap";
import { buildHome } from "./build.js";

// Real-time, furnished 3D model of a residence. Drag to orbit, scroll/pinch to zoom.
export default function Home3D({ plan, showLabels = true }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    const W = () => el.clientWidth, H = () => el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.setSize(W(), H());
    Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    el.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // warm late-afternoon sun + sky fill
    scene.add(new THREE.HemisphereLight("#fff6e8", "#8a7b68", 0.55));
    const sun = new THREE.DirectionalLight("#ffe7c4", 2.4);
    sun.position.set(-9, 14, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
    scene.add(sun);

    const { root, walls, size } = buildHome(plan);
    scene.add(root);

    // room labels
    if (showLabels) root.traverse((o) => {
      if (o.userData.label) {
        const d = document.createElement("div");
        d.className = "h3d-label"; d.textContent = o.userData.label;
        o.add(new CSS2DObject(d));
      }
    });

    // soft ground shadow catcher
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.35 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.45; ground.receiveShadow = true; scene.add(ground);

    const span = Math.max(size.W, size.D);
    const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 200);
    const target = new THREE.Vector3(0, 0, 0);
    camera.position.set(0, span * 2.2, 0.01);
    camera.lookAt(target);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = span * 0.8; controls.maxDistance = span * 2.8;
    controls.maxPolarAngle = 1.25; controls.minPolarAngle = 0.2;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.45;
    controls.target.copy(target);
    const stopSpin = () => (controls.autoRotate = false);
    renderer.domElement.addEventListener("pointerdown", stopSpin);

    // intro: walls rise, camera sweeps from plan view to a 3/4 view
    walls.forEach((w) => { w.scale.y = 0.001; });
    const tl = gsap.timeline();
    tl.to(walls.map((w) => w.scale), { y: 1, duration: 1.1, ease: "expo.out", stagger: { each: 0.008, from: "random" } }, 0.2)
      .to(camera.position, { x: span * 1.0, y: span * 1.2, z: span * 1.35, duration: 2.2, ease: "expo.inOut", onUpdate: () => camera.lookAt(target) }, 0);

    let raf, running = true;
    const loop = () => {
      if (!running) return;
      controls.update();
      renderer.render(scene, camera);
      labels.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const ro = new ResizeObserver(() => {
      camera.aspect = W() / H(); camera.updateProjectionMatrix();
      renderer.setSize(W(), H()); labels.setSize(W(), H());
    });
    ro.observe(el);

    return () => {
      running = false; cancelAnimationFrame(raf); tl.kill(); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", stopSpin);
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); });
      });
      pmrem.dispose(); renderer.dispose();
      el.innerHTML = "";
    };
  }, [plan, showLabels]);

  return <div ref={host} className="home3d" data-lenis-prevent />;
}
