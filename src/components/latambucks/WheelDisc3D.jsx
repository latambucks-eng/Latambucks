import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Rueda de la suerte tridimensional (three.js) con el acabado de la referencia:
// oro cepillado y gris-azul alternados, aro dorado con luces embutidas, buje
// metálico, aguja neón y monedas flotantes. Los tamaños de cada sector son los
// reales (45 % / 30 % / 20 % / 5 %): el dibujo no altera las probabilidades.
// El ángulo lo fija el padre con `rotation` (grados, acumulativo) y el frenado
// de 2,7 s se resuelve acá igual que antes.

const DEG = Math.PI / 180;
const SPIN_MS = 2700;
const LIGHTS = 24;

const GOLD = "#d4af37";
const GOLD_DARK = "#a6892a";
const SLATE = "#2c3e50";

// Sector con ángulo medido desde arriba y en sentido horario (igual que el padre).
function sectorShape(from, to, radius) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = Math.max(10, Math.round(Math.abs(to - from) / 3));
  for (let i = 0; i <= steps; i += 1) {
    const a = (from + ((to - from) * i) / steps) * DEG;
    shape.lineTo(Math.sin(a) * radius, Math.cos(a) * radius);
  }
  shape.closePath();
  return shape;
}

function labelCanvas(text, glow, radial) {
  const canvas = document.createElement("canvas");
  canvas.width = radial ? 512 : 512;
  canvas.height = radial ? 200 : 240;
  const ctx = canvas.getContext("2d");
  const size = radial ? 120 : 150;
  ctx.font = `900 ${size}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  // Halo neón del color del premio
  ctx.shadowColor = glow;
  ctx.shadowBlur = 34;
  ctx.fillStyle = glow;
  ctx.fillText(text, x, y);
  ctx.fillText(text, x, y);

  // Núcleo luminoso
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(text, x, y + 1);
  return canvas;
}

// Entorno sintético: el oro y el vidrio necesitan reflejos para verse metálicos.
function environmentCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#fff8e2");
  gradient.addColorStop(0.3, "#b8a271");
  gradient.addColorStop(0.58, "#2a2f38");
  gradient.addColorStop(1, "#05060a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);
  [
    [96, 52, 92],
    [350, 34, 78],
    [250, 98, 60],
    [446, 128, 54],
  ].forEach(([x, y, r]) => {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.45, "rgba(255,228,164,0.35)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  return canvas;
}

function sparkleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.3, "rgba(255,236,170,0.65)");
  glow.addColorStop(1, "rgba(255,236,170,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const SPARKLES = [
  [2.9, 0.9, 1.2, 0.26],
  [-2.8, 1.6, 1.5, 0.2],
  [2.4, -1.9, 0.9, 0.17],
  [-2.5, -1.5, 1.3, 0.22],
  [1.2, 2.8, 1.1, 0.15],
  [-1.5, 2.7, 1.4, 0.18],
  [3.1, -0.5, 0.8, 0.14],
  [-3.05, 0.1, 1.0, 0.16],
];

const COINS = [
  [-3.0, 1.85, 1.3, 0.5],
  [3.02, 1.05, 0.95, -0.35],
  [-2.7, -1.95, 1.45, 0.25],
  [2.85, -2.25, 1.15, -0.55],
];

export default function WheelDisc3D({ segments = [], rotation = 0, spinning = false, className = "" }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animRef = useRef({ from: 0, to: 0, start: 0 });
  const spinRef = useRef(spinning);
  spinRef.current = spinning;

  // Construcción de la escena (una sola vez).
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.15, 10);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = new THREE.CanvasTexture(environmentCanvas());
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envTexture.colorSpace = THREE.SRGBColorSpace;
    const envTarget = pmrem.fromEquirectangular(envTexture);
    scene.environment = envTarget.texture;
    envTexture.dispose();
    pmrem.dispose();

    scene.add(new THREE.AmbientLight(0xd9cba6, 0.5));
    const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.1);
    keyLight.position.set(-4.5, 6.5, 8);
    scene.add(keyLight);
    const warmLight = new THREE.DirectionalLight(0xffb457, 0.85);
    warmLight.position.set(6, 2.5, 5);
    scene.add(warmLight);
    const greenLight = new THREE.PointLight(0x00ff9f, 12, 14, 2);
    greenLight.position.set(0, 3.6, 3);
    scene.add(greenLight);

    // El mueble se inclina para atrás: se ve el canto y la profundidad real.
    const wheel = new THREE.Group();
    wheel.rotation.x = -0.3;
    scene.add(wheel);

    const goldMaterial = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 0.95,
      roughness: 0.28,
      envMapIntensity: 1.35,
    });
    const goldDeep = new THREE.MeshStandardMaterial({
      color: GOLD_DARK,
      metalness: 1,
      roughness: 0.42,
      envMapIntensity: 1.1,
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: 0xe8e2cf,
      metalness: 1,
      roughness: 0.16,
      envMapIntensity: 1.5,
    });

    // Respaldo: evita ver a través de la rueda por la inclinación.
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.44, 2.44, 0.2, 96),
      new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.7, roughness: 0.4 })
    );
    plate.rotation.x = Math.PI / 2;
    plate.position.z = -0.26;
    wheel.add(plate);

    // Disco giratorio
    const disc = new THREE.Group();
    wheel.add(disc);

    segments.forEach((segment, index) => {
      const surface =
        segment.accent === SLATE
          ? new THREE.MeshStandardMaterial({
              color: SLATE,
              metalness: 0.6,
              roughness: 0.42,
              envMapIntensity: 0.85,
            })
          : goldMaterial;

      const geometry = new THREE.ExtrudeGeometry(sectorShape(segment.from, segment.to, 2.42), {
        depth: 0.24,
        curveSegments: 24,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.024,
        bevelSegments: 2,
      });
      geometry.translate(0, 0, -0.12);
      disc.add(new THREE.Mesh(geometry, surface));

      // Canto dorado entre sector y sector
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 2.44, 0.3),
        goldDeep
      );
      edge.position.y = 1.22;
      edge.rotation.z = -segment.from * DEG;
      disc.add(edge);

      // Etiqueta: radial en los sectores angostos, horizontal en los amplios
      const span = Math.abs(segment.to - segment.from);
      const radial = span < 40;
      const mid = segment.mid * DEG;
      const radius = radial ? 1.6 : 1.55;
      const canvas = labelCanvas(segment.label, segment.glow || "#ffd166", radial);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const width = radial ? 1.6 : Math.min(1.45, Math.max(0.62, span * DEG * radius * 0.9));
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(width, width * (canvas.height / canvas.width)),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      label.position.set(Math.sin(mid) * radius, Math.cos(mid) * radius, 0.16);
      label.rotation.z = radial ? Math.PI / 2 - mid : -mid;
      disc.add(label);
      void index;
    });

    // Aro dorado grueso con doble perfil
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.17, 32, 128), goldMaterial);
    rim.position.z = 0.02;
    wheel.add(rim);
    const rimBack = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.2, 24, 128), goldDeep);
    rimBack.position.z = -0.16;
    wheel.add(rimBack);
    const rimInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.39, 0.04, 16, 128),
      new THREE.MeshStandardMaterial({ color: 0x0d1014, metalness: 0.85, roughness: 0.3 })
    );
    rimInner.position.z = 0.14;
    wheel.add(rimInner);

    // Luces embutidas en el aro
    const bulbs = [];
    const bulbGeometry = new THREE.SphereGeometry(0.062, 14, 10);
    for (let i = 0; i < LIGHTS; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xfff2c4,
        emissive: new THREE.Color(i % 4 === 0 ? 0x00ff9f : 0xffe9a8),
        emissiveIntensity: 1.2,
        metalness: 0.1,
        roughness: 0.3,
        toneMapped: false,
      });
      const bulb = new THREE.Mesh(bulbGeometry, material);
      const angle = (i * 360) / LIGHTS * DEG;
      bulb.position.set(Math.sin(angle) * 2.58, Math.cos(angle) * 2.58, 0.17);
      wheel.add(bulb);
      bulbs.push(bulb);
    }

    // Buje dorado escalonado con cuatro luces y eje central
    const hubGeometry = new THREE.CylinderGeometry(0.48, 0.58, 0.44, 48);
    hubGeometry.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeometry, goldMaterial);
    hub.position.z = 0.2;
    wheel.add(hub);

    const hubFaceGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 40);
    hubFaceGeometry.rotateX(Math.PI / 2);
    const hubFace = new THREE.Mesh(hubFaceGeometry, goldDeep);
    hubFace.position.z = 0.44;
    wheel.add(hubFace);

    const hubLights = [];
    for (let i = 0; i < 4; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xfff6d6,
        emissive: new THREE.Color(0x00ff9f),
        emissiveIntensity: 1.4,
        toneMapped: false,
        roughness: 0.3,
      });
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), material);
      const angle = i * 90 * DEG;
      light.position.set(Math.sin(angle) * 0.27, Math.cos(angle) * 0.27, 0.5);
      wheel.add(light);
      hubLights.push(light);
    }

    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 24), chrome);
    spindle.rotation.x = Math.PI / 2;
    spindle.position.z = 0.56;
    wheel.add(spindle);

    // Aguja: triángulo oscuro con contorno neón verde
    const pointer = new THREE.Group();
    const needleGlow = new THREE.Mesh(
      new THREE.ConeGeometry(0.245, 0.66, 3),
      new THREE.MeshBasicMaterial({ color: 0x00ff9f, toneMapped: false })
    );
    needleGlow.rotation.z = Math.PI;
    needleGlow.position.z = -0.02;
    pointer.add(needleGlow);
    const needleCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.205, 0.58, 3),
      new THREE.MeshStandardMaterial({ color: 0x11161c, metalness: 0.7, roughness: 0.35 })
    );
    needleCore.rotation.z = Math.PI;
    needleCore.position.z = 0.04;
    pointer.add(needleCore);
    pointer.position.set(0, 2.98, 0.34);
    wheel.add(pointer);

    // Monedas doradas flotando
    const coinMaterial = new THREE.MeshStandardMaterial({
      color: GOLD,
      metalness: 1,
      roughness: 0.3,
      envMapIntensity: 1.3,
    });
    const coinGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 30);
    coinGeometry.rotateX(Math.PI / 2);
    const coinInnerGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.075, 26);
    coinInnerGeometry.rotateX(Math.PI / 2);
    const coins = COINS.map(([x, y, z, tilt], i) => {
      const coin = new THREE.Group();
      coin.add(new THREE.Mesh(coinGeometry, coinMaterial));
      coin.add(new THREE.Mesh(coinInnerGeometry, goldDeep));
      coin.position.set(x, y, z);
      coin.rotation.set(tilt * 0.4, tilt, tilt);
      coin.userData.baseY = y;
      coin.userData.phase = i * 1.3;
      wheel.add(coin);
      return coin;
    });

    // Destellos suaves alrededor
    const sparkleMap = sparkleTexture();
    const sparkles = SPARKLES.map(([x, y, z, size], i) => {
      const material = new THREE.SpriteMaterial({
        map: sparkleMap,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(x, y, z);
      sprite.scale.setScalar(size);
      sprite.userData.base = size;
      sprite.userData.phase = i * 0.8;
      wheel.add(sprite);
      return sprite;
    });

    const state = { display: 0, disc, bulbs, hubLights, pointer };
    sceneRef.current = state;

    const resize = () => {
      const width = mount.clientWidth || 240;
      const height = mount.clientHeight || 240;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const now = performance.now();
      const animation = animRef.current;
      const t = Math.min(1, Math.max(0, (now - animation.start) / SPIN_MS));
      const eased = 1 - Math.pow(1 - t, 4);
      state.display = animation.from + (animation.to - animation.from) * eased;
      disc.rotation.z = -state.display * DEG;

      const beat = now * (spinRef.current ? 0.0075 : 0.0018);
      state.bulbs.forEach((bulb, i) => {
        bulb.material.emissiveIntensity = 0.9 + 1.5 * (0.5 + 0.5 * Math.sin(beat + i * 0.55));
      });
      state.hubLights.forEach((light, i) => {
        light.material.emissiveIntensity = 1 + Math.sin(beat * 1.6 + i) * 0.6;
      });
      pointer.rotation.z = spinRef.current ? Math.sin(now * 0.032) * 0.1 : 0;

      coins.forEach((coin) => {
        coin.position.y = coin.userData.baseY + Math.sin(now * 0.0014 + coin.userData.phase) * 0.1;
        coin.rotation.y += 0.006;
        coin.rotation.z += 0.003;
      });
      sparkles.forEach((sprite) => {
        const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(now * 0.0022 + sprite.userData.phase));
        sprite.material.opacity = pulse;
        sprite.scale.setScalar(sprite.userData.base * (0.85 + pulse * 0.35));
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      sparkleMap.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
     
  }, []);

  // Cada nuevo ángulo retargetea el frenado desde la posición actual.
  useEffect(() => {
    animRef.current = {
      from: sceneRef.current ? sceneRef.current.display : 0,
      to: rotation,
      start: performance.now(),
    };
  }, [rotation]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}