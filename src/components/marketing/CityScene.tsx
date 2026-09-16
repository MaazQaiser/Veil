import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const BG = 0x090d16;
// Matches the site's CTA gold (#FFC555) so the hero scene and the buttons read as one brand.
const GOLD = 0xffc555;

/**
 * A small procedural night sky (warm horizon glow fading into a deep teal
 * zenith, plus a few bright "glint" panels) baked into a PMREM environment
 * map. Assigning this to `scene.environment` gives every PBR material real
 * reflections — the single biggest lever between "flat toy" and a
 * premium-looking glass tower.
 */
function makeNightEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();

  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: { value: new THREE.Color(0x0a0f22) },
      bottom: { value: new THREE.Color(0x4a3620) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vPos;
      uniform vec3 top;
      uniform vec3 bottom;
      void main() {
        float h = clamp(normalize(vPos).y * 0.7 + 0.3, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottom, top, h), 1.0);
      }
    `,
  });
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 32), skyMaterial));

  const glintGeometry = new THREE.PlaneGeometry(5, 1.4);
  const warmGlint = new THREE.MeshBasicMaterial({ color: 0xffcf8a });
  const coolGlint = new THREE.MeshBasicMaterial({ color: 0x9fc4ff });
  for (let i = 0; i < 14; i++) {
    const glint = new THREE.Mesh(glintGeometry, i % 3 === 0 ? coolGlint : warmGlint);
    glint.position.set((Math.random() - 0.5) * 50, Math.random() * 30 - 4, (Math.random() - 0.5) * 50);
    glint.lookAt(0, glint.position.y * 0.4, 0);
    envScene.add(glint);
  }

  const renderTarget = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return renderTarget.texture;
}

/**
 * The real skyline photo (river/harbor and all) wrapped around a big open
 * cylinder behind the whole scene, so what the camera actually sees in the
 * distance is genuine photography, not procedural geometry. Repeated twice
 * around the circumference — at this scale and with fog, the seam is far
 * less noticeable than a flat-color void would be.
 */
function makeBackdrop(img: HTMLImageElement): THREE.Mesh {
  const texture = new THREE.Texture(img);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 1);
  texture.needsUpdate = true;

  const geometry = new THREE.CylinderGeometry(210, 210, 190, 64, 1, true);
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 55;
  return mesh;
}

type FacadeSet = { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Crops a real facade photo into a repeatable building-skin texture, then
 * derives a second "emissive" texture from that same crop's bright pixels
 * (the windows that were actually lit in the source photo become the glow
 * map) so the lighting pattern is real photographic detail, not drawn.
 */
function makeFacadeSet(
  img: HTMLImageElement,
  crop: { x: number; y: number; w: number; h: number },
  grade: { tint: string; lift: string },
): FacadeSet {
  const sx = img.naturalWidth * crop.x;
  const sy = img.naturalHeight * crop.y;
  const sw = img.naturalWidth * crop.w;
  const sh = img.naturalHeight * crop.h;

  const outW = 220;
  const outH = 320;

  const base = document.createElement("canvas");
  base.width = outW;
  base.height = outH;
  const bctx = base.getContext("2d") as CanvasRenderingContext2D;
  bctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  // lift shadows so the facade reads as dark steel rather than pure black
  bctx.globalCompositeOperation = "screen";
  bctx.fillStyle = grade.lift;
  bctx.fillRect(0, 0, outW, outH);
  // then a light hue wash for warmth/coolness, without crushing contrast
  bctx.globalCompositeOperation = "source-atop";
  bctx.fillStyle = grade.tint;
  bctx.fillRect(0, 0, outW, outH);
  bctx.globalCompositeOperation = "source-over";

  const glow = document.createElement("canvas");
  glow.width = outW;
  glow.height = outH;
  const gctx = glow.getContext("2d") as CanvasRenderingContext2D;
  gctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  const glowData = gctx.getImageData(0, 0, outW, outH);
  const data = glowData.data;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (luminance > 145) {
      const boost = Math.min(1, (luminance - 145) / 90);
      data[i] = Math.min(255, data[i] * 1.2) * boost;
      data[i + 1] = Math.min(255, data[i + 1] * 1.05) * boost;
      data[i + 2] = data[i + 2] * 0.8 * boost;
      data[i + 3] = 255;
    } else {
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  gctx.putImageData(glowData, 0, 0);

  const map = new THREE.CanvasTexture(base);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const emissiveMap = new THREE.CanvasTexture(glow);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;

  return { map, emissiveMap };
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const CAMERA_PATH: [number, number, number][] = [
  [0, 44, 96],
  [58, 40, 78],
  [88, 36, 34],
  [92, 33, -20],
  [62, 28, -66],
  [22, 22, -52],
  [8, 16, -20],
  [15, 13, 6],
  [-3, 12, 16],
  [-16, 14, 2],
  [-14, 19, -22],
  [-44, 26, -46],
  [-82, 34, -18],
  [-90, 38, 30],
  [-56, 42, 76],
];

const CITY_RADIUS = 100;
const CLEAR_RADIUS = 20;
const HERO_HEIGHT = 34;

type Spot = {
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  rotation: number;
  detailed: boolean;
};

/**
 * Organic scatter (random angle/radius + a minimum-spacing check) instead of
 * a jittered grid — a regular grid is the single biggest tell that a
 * skyline is procedurally generated. Real footprints vary in width/depth
 * and sit at slight angles to each other, not on a lattice.
 */
function scatterSpots(): Spot[] {
  const spots: Spot[] = [];
  const target = 150;
  let attempts = 0;

  while (spots.length < target && attempts < target * 10) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const radius = CLEAR_RADIUS + Math.random() * (CITY_RADIUS - CLEAR_RADIUS);
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 5;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 5;
    const minSpacing = 5.5;
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < minSpacing)) continue;

    const falloff = 1 - Math.min(radius / CITY_RADIUS, 1) * 0.55;
    const height = (5 + Math.random() * 24) * falloff + (Math.random() < 0.1 ? 16 : 0);
    const width = 3.2 + Math.random() * 5.2;
    const depth = 3.2 + Math.random() * 5.2;
    const rotation = (Math.random() - 0.5) * 0.45;
    const detailed = radius < CITY_RADIUS * 0.42 && height > 15;

    spots.push({ x, z, height, width, depth, rotation, detailed });
  }
  return spots;
}

function makeBuildingMaterial(facade: FacadeSet, repeatY: number, tint: number, vertexColors = false) {
  const map = facade.map.clone();
  const emissiveMap = facade.emissiveMap.clone();
  map.repeat.set(1, repeatY);
  emissiveMap.repeat.set(1, repeatY);
  map.needsUpdate = true;
  emissiveMap.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color: tint,
    map,
    emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: vertexColors ? 0.7 : 1,
    roughness: vertexColors ? 0.55 : 0.4,
    metalness: vertexColors ? 0.35 : 0.6,
    envMapIntensity: vertexColors ? 0.7 : 0.85,
    vertexColors,
  });
}

function buildCity(
  scene: THREE.Scene,
  backdropImg: HTMLImageElement,
  skylineFacade: FacadeSet,
  towerFacade: FacadeSet,
  heroFacade: FacadeSet,
) {
  scene.add(makeBackdrop(backdropImg));

  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  buildingGeometry.translate(0, 0.5, 0);

  const spots = scatterSpots();
  const detailedSpots = spots.filter((spot) => spot.detailed);
  const silhouetteSpots = spots.filter((spot) => !spot.detailed);

  // Distant/short buildings: same real photo facade as the close-up towers,
  // just lighter per-instance tints so the actual photographic detail (real
  // window rows, real concrete/glass texture) still reads through — this is
  // what turns a skyline of flat-shaded boxes into one that looks like an
  // actual photographed city, even at range.
  const silhouetteMaterial = makeBuildingMaterial(skylineFacade, 2.2, 0xffffff, true);
  const silhouetteMesh = new THREE.InstancedMesh(buildingGeometry, silhouetteMaterial, silhouetteSpots.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const silhouetteHues = [0xaab2c6, 0x9ea8be, 0xb4bcce, 0xa2acc0, 0x98a2b8];
  silhouetteSpots.forEach((spot, index) => {
    dummy.position.set(spot.x, 0, spot.z);
    dummy.rotation.y = spot.rotation;
    dummy.scale.set(spot.width, spot.height, spot.depth);
    dummy.updateMatrix();
    silhouetteMesh.setMatrixAt(index, dummy.matrix);
    color.setHex(silhouetteHues[index % silhouetteHues.length]);
    silhouetteMesh.setColorAt(index, color);
  });
  silhouetteMesh.instanceMatrix.needsUpdate = true;
  if (silhouetteMesh.instanceColor) silhouetteMesh.instanceColor.needsUpdate = true;
  scene.add(silhouetteMesh);

  // A few lit windows scattered on each silhouette so they read as
  // buildings someone lives/works in, not solid dark blocks.
  const windowsPerBuilding = 3;
  const windowGeometry = new THREE.PlaneGeometry(0.55, 0.85);
  const windowMaterial = new THREE.MeshBasicMaterial({ color: GOLD });
  const windowMesh = new THREE.InstancedMesh(
    windowGeometry,
    windowMaterial,
    silhouetteSpots.length * windowsPerBuilding,
  );
  const windowColor = new THREE.Color();
  let windowIndex = 0;
  silhouetteSpots.forEach((spot) => {
    for (let k = 0; k < windowsPerBuilding; k++) {
      const side = Math.floor(Math.random() * 4);
      const hw = spot.width / 2 + 0.03;
      const hd = spot.depth / 2 + 0.03;
      let px = spot.x;
      let pz = spot.z;
      let ry = spot.rotation;
      if (side === 0) {
        pz += hd;
      } else if (side === 1) {
        pz -= hd;
        ry += Math.PI;
      } else if (side === 2) {
        px += hw;
        ry += Math.PI / 2;
      } else {
        px -= hw;
        ry -= Math.PI / 2;
      }
      dummy.position.set(px, Math.random() * spot.height * 0.8 + spot.height * 0.08, pz);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      windowMesh.setMatrixAt(windowIndex, dummy.matrix);
      windowColor.setHSL(0.12 + Math.random() * 0.02, 0.85, 0.6 + Math.random() * 0.18);
      windowMesh.setColorAt(windowIndex, windowColor);
      windowIndex += 1;
    }
  });
  windowMesh.instanceMatrix.needsUpdate = true;
  if (windowMesh.instanceColor) windowMesh.instanceColor.needsUpdate = true;
  scene.add(windowMesh);

  // Nearer, taller buildings — the ones the camera actually passes close
  // to — keep the real photo-derived facade texture, split across the two
  // crops for variety.
  const detailedFacades = [
    makeBuildingMaterial(skylineFacade, 3.4, 0x50586a),
    makeBuildingMaterial(towerFacade, 4, 0x40465a),
  ];
  const detailedMeshes = detailedFacades.map(
    (material) => new THREE.InstancedMesh(buildingGeometry, material, detailedSpots.length),
  );
  const detailedCounts = [0, 0];
  detailedSpots.forEach((spot, index) => {
    const which = index % 2;
    dummy.position.set(spot.x, 0, spot.z);
    dummy.rotation.y = spot.rotation;
    dummy.scale.set(spot.width * 1.1, spot.height, spot.depth * 1.1);
    dummy.updateMatrix();
    detailedMeshes[which].setMatrixAt(detailedCounts[which], dummy.matrix);
    detailedCounts[which] += 1;
  });
  detailedMeshes.forEach((mesh, i) => {
    mesh.count = detailedCounts[i];
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  });

  const heroGroup = new THREE.Group();
  const heroMaterial = makeBuildingMaterial(heroFacade, 5.5, 0x8a7a56);
  heroMaterial.emissiveIntensity = 1.3;
  heroMaterial.metalness = 0.7;
  heroMaterial.roughness = 0.3;
  heroMaterial.envMapIntensity = 1.1;

  const tiers: [width: number, height: number][] = [
    [9, HERO_HEIGHT * 0.62],
    [6.4, HERO_HEIGHT * 0.24],
    [4.2, HERO_HEIGHT * 0.14],
  ];
  let tierY = 0;
  tiers.forEach(([width, height]) => {
    const tier = new THREE.Mesh(buildingGeometry, heroMaterial);
    tier.scale.set(width, height, width);
    tier.position.y = tierY;
    heroGroup.add(tier);
    tierY += height;
  });

  const spireGeometry = new THREE.ConeGeometry(0.55, 9, 8);
  spireGeometry.translate(0, 4.5, 0);
  const spireMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    emissive: GOLD,
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.75,
    envMapIntensity: 1.2,
  });
  const spire = new THREE.Mesh(spireGeometry, spireMaterial);
  spire.position.y = tierY;
  heroGroup.add(spire);

  const beacon = new THREE.PointLight(GOLD, 6, 30, 2);
  beacon.position.set(0, tierY + 6, 0);
  heroGroup.add(beacon);

  const tipMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3b30,
    emissive: 0xff3b30,
    emissiveIntensity: 2.2,
  });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), tipMaterial);
  tip.position.y = tierY + 9;
  heroGroup.add(tip);

  scene.add(heroGroup);

  const groundGeometry = new THREE.PlaneGeometry(CITY_RADIUS * 4, CITY_RADIUS * 4);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 1 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  scene.add(ground);

  return { beacon };
}

export function CityScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let cleanup = () => {};

    async function setup() {
      let skylineImg: HTMLImageElement;
      let towerImg: HTMLImageElement;
      try {
        [skylineImg, towerImg] = await Promise.all([
          loadImage("/scenes/city-skyline-wide.jpg"),
          loadImage("/scenes/city.jpg"),
        ]);
      } catch {
        if (!cancelled) setSupported(false);
        return;
      }
      if (cancelled || !container) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      } catch {
        setSupported(false);
        return;
      }

      const skylineFacade = makeFacadeSet(
        skylineImg,
        { x: 0.34, y: 0.66, w: 0.08, h: 0.16 },
        { lift: "rgba(70,76,96,0.28)", tint: "rgba(120,130,160,0.12)" },
      );
      const towerFacade = makeFacadeSet(
        towerImg,
        { x: 0.66, y: 0.55, w: 0.075, h: 0.35 },
        { lift: "rgba(64,70,90,0.3)", tint: "rgba(130,140,168,0.1)" },
      );
      const heroFacade = makeFacadeSet(
        towerImg,
        { x: 0.66, y: 0.55, w: 0.075, h: 0.35 },
        { lift: "rgba(120,96,55,0.32)", tint: "rgba(255,196,110,0.28)" },
      );

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(BG);
      scene.fog = new THREE.FogExp2(BG, 0.0045);

      const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 400);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      scene.environment = makeNightEnvironment(renderer);

      scene.add(new THREE.HemisphereLight(0x8fa2c8, 0x14161c, 0.7));
      scene.add(new THREE.AmbientLight(0x565e70, 0.35));
      const moon = new THREE.DirectionalLight(0xb9c6e8, 0.7);
      moon.position.set(-60, 90, 40);
      scene.add(moon);
      const fill = new THREE.DirectionalLight(0x8896b8, 0.4);
      fill.position.set(60, 40, -50);
      scene.add(fill);

      const { beacon } = buildCity(scene, skylineImg, skylineFacade, towerFacade, heroFacade);

      const curve = new THREE.CatmullRomCurve3(
        CAMERA_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        true,
        "catmullrom",
        0.5,
      );

      const cityLookTarget = new THREE.Vector3(0, 10, 0);
      const heroLookTarget = new THREE.Vector3(0, HERO_HEIGHT * 0.55, 0);
      const currentLookAt = new THREE.Vector3().copy(cityLookTarget);

      function resize() {
        if (!container) return;
        const { clientWidth, clientHeight } = container;
        if (clientWidth === 0 || clientHeight === 0) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      }

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      const LOOP_SECONDS = 46;
      let frameId = 0;
      let visible = true;
      let start = performance.now();

      function frame(now: number) {
        frameId = requestAnimationFrame(frame);
        if (!visible) return;

        const elapsed = (((now - start) / 1000) % LOOP_SECONDS + LOOP_SECONDS) % LOOP_SECONDS;
        const t = elapsed / LOOP_SECONDS;

        const position = curve.getPointAt(t);
        camera.position.copy(position);

        const radius = Math.hypot(position.x, position.z);
        const proximity = 1 - Math.min(Math.max((radius - 9) / (96 - 9), 0), 1);
        const focus = easeInOutCubic(proximity);
        currentLookAt.lerpVectors(cityLookTarget, heroLookTarget, focus);
        camera.lookAt(currentLookAt);

        beacon.intensity = 5 + Math.sin(now * 0.002) * 1.4;

        renderer.render(scene, camera);
      }

      if (reducedMotion) {
        const position = curve.getPointAt(0.02);
        camera.position.copy(position);
        camera.lookAt(cityLookTarget);
        renderer.render(scene, camera);
      } else {
        frameId = requestAnimationFrame(frame);
      }

      function handleVisibility() {
        visible = document.visibilityState === "visible";
        if (visible) start = performance.now() - ((performance.now() - start) % (LOOP_SECONDS * 1000));
      }
      document.addEventListener("visibilitychange", handleVisibility);

      cleanup = () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", handleVisibility);
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh) {
            object.geometry.dispose();
            const material = object.material;
            if (Array.isArray(material)) material.forEach((m) => m.dispose());
            else material.dispose();
          }
        });
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    void setup();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  if (!supported) {
    return (
      <div
        className="absolute inset-0 h-full w-full"
        style={{ background: "radial-gradient(circle at 50% 30%, #14161c, #0B0C0C 70%)" }}
      />
    );
  }

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
