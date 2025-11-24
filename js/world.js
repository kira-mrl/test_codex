// world.js
// Three.js scene setup + LEGO-like builder + weather controls.
// THREE + OrbitControls are loaded as globals from CDN in index.html for GH Pages reliability.
/* global THREE */

let scene, camera, renderer, controls;
let islandGroup, houseGroup, propGroup, particleSystem, cloudGroup;
let directionalLight, fillLight, ambientLight;
let lightningTimeout = 0;
let currentWeather = 'sunny';
let clock;

const islandSize = 14;
const cubeSize = 1;

export function initWorld(canvas) {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(18, 14, 18);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  controls = new THREE.OrbitControls(camera, renderer.domElement || canvas);
  controls.target.set(0, 2, 0);
  controls.enableDamping = true;
  controls.minDistance = 10;
  controls.maxDistance = 35;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = 1.3;

  ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(8, 15, 6);
  directionalLight.castShadow = false;
  scene.add(directionalLight);

  fillLight = new THREE.DirectionalLight(0x88aaff, 0.35);
  fillLight.position.set(-10, 8, -6);
  scene.add(fillLight);

  scene.fog = new THREE.Fog(0x0c0c11, 18, 50);
  scene.background = new THREE.Color('#6d7082');

  islandGroup = createIsland();
  scene.add(islandGroup);

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createCube(color, size = cubeSize) {
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createIsland() {
  const group = new THREE.Group();
  const baseColor = new THREE.Color('#2c2f3a');
  const accent = new THREE.Color('#232531');

  // water plate underlay for blocky contrast
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(islandSize + 4, islandSize + 6, 1, 24),
    new THREE.MeshStandardMaterial({ color: '#1a2335', roughness: 0.6, metalness: 0.05 })
  );
  water.position.y = -0.7;
  group.add(water);

  for (let x = -islandSize; x <= islandSize; x++) {
    for (let z = -islandSize; z <= islandSize; z++) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > islandSize + Math.sin((x + z) * 0.2)) continue;
      const heightNoise = Math.sin(x * 0.4) * Math.cos(z * 0.3) * 0.6 + Math.random() * 0.3;
      const h = Math.max(1, Math.round(2 + heightNoise));
      for (let y = 0; y < h; y++) {
        const cube = createCube(baseColor.clone().lerp(accent, Math.random() * 0.3));
        cube.position.set(x * cubeSize, y * cubeSize, z * cubeSize);
        group.add(cube);
      }
    }
  }
  return group;
}

function buildHouseTier1() {
  const group = new THREE.Group();
  const palette = ['#4a3b33', '#6b574d', '#51443d'];
  const width = 4, depth = 3, height = 2;
  for (let y = 0; y < height; y++) {
    for (let x = -width / 2; x <= width / 2; x++) {
      for (let z = -depth / 2; z <= depth / 2; z++) {
        if (Math.random() < 0.12) continue;
        const cube = createCube(palette[Math.floor(Math.random() * palette.length)], 1);
        cube.position.set(x, y + 1, z);
        group.add(cube);
      }
    }
  }
  // crooked roof line
  for (let x = -width / 2; x <= width / 2; x++) {
    const roof = createCube('#3b332f', 1);
    roof.position.set(x, height + 1 + Math.sin(x) * 0.2, 0);
    group.add(roof);
  }

  // flickering street light
  const pole = createCube('#555', 0.3);
  pole.scale.y = 5;
  pole.position.set(-width, 0.6, depth * 0.6);
  group.add(pole);

  const bulb = new THREE.PointLight('#ffddaa', 1.5, 6);
  bulb.position.set(-width, 3.4, depth * 0.6);
  bulb.userData.flicker = true;
  group.add(bulb);

  // scattered crates
  for (let i = 0; i < 3; i++) {
    const crate = createCube('#6d5845', 0.8);
    crate.position.set(-2 + Math.random() * 4, 0.4, -2 + Math.random() * 4);
    group.add(crate);
  }
  return group;
}

function buildHouseTier2() {
  const group = new THREE.Group();
  const palette = ['#c8b5a6', '#c0a791', '#bca28b'];
  const width = 4, depth = 4, height = 3;
  for (let y = 0; y < height; y++) {
    for (let x = -width / 2; x <= width / 2; x++) {
      for (let z = -depth / 2; z <= depth / 2; z++) {
        const cube = createCube(palette[(x + z + y) % palette.length], 1);
        cube.position.set(x, y + 1, z);
        group.add(cube);
      }
    }
  }
  // roof
  for (let x = -width / 2; x <= width / 2; x++) {
    const roof = createCube('#7f6e63', 1);
    roof.position.set(x, height + 1, 0);
    group.add(roof);
  }
  // warm windows
  const windowLight = new THREE.PointLight('#ffcc88', 1.2, 8);
  windowLight.position.set(0, 2.5, depth / 2 + 0.5);
  group.add(windowLight);

  // porch
  const porch = createCube('#8a7a72', 0.4);
  porch.scale.set(6, 0.5, 2.5);
  porch.position.set(0, 0.4, depth / 2 + 0.8);
  group.add(porch);

  // small tree
  const trunk = createCube('#5d3b1a', 0.5);
  trunk.scale.y = 3;
  trunk.position.set(width, 1, depth * 0.6);
  group.add(trunk);
  const leaves = createCube('#3a9d62', 1.5);
  leaves.position.set(width, 2.8, depth * 0.6);
  group.add(leaves);
  return group;
}

function buildHouseTier3() {
  const group = new THREE.Group();
  const palette = ['#f2f5ff', '#e5e8f3', '#d9dce8'];
  const width = 6, depth = 5, height = 4;
  for (let y = 0; y < height; y++) {
    for (let x = -width / 2; x <= width / 2; x++) {
      for (let z = -depth / 2; z <= depth / 2; z++) {
        if (Math.abs(x) === width / 2 && Math.abs(z) === depth / 2) continue;
        const cube = createCube(palette[(x + y) % palette.length], 1);
        cube.position.set(x, y + 1, z);
        group.add(cube);
      }
    }
  }
  // terrace and glassy roofline
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width + 1, 0.2, depth + 1),
    new THREE.MeshStandardMaterial({ color: '#b7d7ff', transparent: true, opacity: 0.35, roughness: 0.1 })
  );
  glass.position.set(0, height + 1.4, 0);
  group.add(glass);

  // pool
  const pool = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.5, 3),
    new THREE.MeshStandardMaterial({ color: '#4fd4ff', transparent: true, opacity: 0.85, roughness: 0.05, metalness: 0.2 })
  );
  pool.position.set(width * 0.6, 0.25, -depth * 0.2);
  group.add(pool);

  const poolGlow = new THREE.PointLight('#6ff2ff', 2, 12);
  poolGlow.position.set(width * 0.6, 1, -depth * 0.2);
  group.add(poolGlow);

  // car block
  const car = createCube('#5562ff', 0.9);
  car.scale.set(2, 0.6, 1);
  car.position.set(-width, 0.4, depth * 0.6);
  group.add(car);

  // garden lights
  for (let i = 0; i < 3; i++) {
    const lamp = new THREE.PointLight('#c7fff6', 0.6, 5);
    lamp.position.set(-width + i * 2.5, 1.1, -depth * 0.8);
    group.add(lamp);
  }

  return group;
}

function spawnProps(tier) {
  const group = new THREE.Group();
  // shared foliage sprinkles
  for (let i = 0; i < 8; i++) {
    const bush = createCube('#2f6f4f', 0.6);
    bush.position.set(-6 + Math.random() * 12, 0.4, -6 + Math.random() * 12);
    bush.scale.y = 0.6 + Math.random() * 0.4;
    group.add(bush);
  }
  if (tier === 1) {
    for (let i = 0; i < 8; i++) {
      const debris = createCube('#3b3b3b', 0.6);
      debris.position.set(-4 + Math.random() * 8, 0.3, -4 + Math.random() * 8);
      debris.rotation.y = Math.random() * Math.PI;
      group.add(debris);
    }
    const barrel = createCube('#4b3b2a', 0.8);
    barrel.position.set(-5, 0.5, 4);
    group.add(barrel);
  }
  if (tier === 2) {
    const bench = createCube('#8b6b52', 0.4);
    bench.scale.set(3.5, 0.5, 1);
    bench.position.set(2, 0.3, -4);
    group.add(bench);

    const mailbox = createCube('#d14a4a', 0.5);
    mailbox.scale.y = 1.4;
    mailbox.position.set(-5, 0.35, 5);
    group.add(mailbox);
  }
  if (tier === 3) {
    const tree = createCube('#2f8f5a', 1.4);
    tree.position.set(7, 2.4, 3);
    const trunk = createCube('#6d4b2c', 0.6);
    trunk.scale.y = 3;
    trunk.position.set(7, 1.2, 3);
    group.add(tree, trunk);

    const path = createCube('#e7e9f2', 0.3);
    path.scale.set(8, 0.3, 2.5);
    path.position.set(0, 0.2, -6);
    group.add(path);
  }
  return group;
}

function clearGroups() {
  if (houseGroup) scene.remove(houseGroup);
  if (propGroup) scene.remove(propGroup);
  if (particleSystem) scene.remove(particleSystem);
  if (cloudGroup) scene.remove(cloudGroup);
  houseGroup = null;
  propGroup = null;
  particleSystem = null;
  cloudGroup = null;
}

export function buildWorld(state) {
  clearGroups();
  currentWeather = state.weather;

  switch (state.houseTier) {
    case 1:
      houseGroup = buildHouseTier1();
      break;
    case 2:
      houseGroup = buildHouseTier2();
      break;
    default:
      houseGroup = buildHouseTier3();
      break;
  }

  propGroup = spawnProps(state.houseTier);
  scene.add(houseGroup);
  scene.add(propGroup);

  updateWeather(state.weather, state.lifeLevel);
}

function updateWeather(type, lifeLevel) {
  const skyColors = {
    sunny: '#7fc5ff',
    cloudy: '#6d7082',
    rain: '#475265',
    storm: '#1a1c25',
    snow: '#8fb4d9',
    night: '#0b0c14',
  };

  scene.background = new THREE.Color(skyColors[type]);
  scene.fog.color = new THREE.Color(skyColors[type]).multiplyScalar(0.6);

  const sunIntensity = {
    sunny: 1.35,
    cloudy: 0.65,
    rain: 0.5,
    storm: 0.25,
    snow: 0.65,
    night: 0.1,
  }[type];

  directionalLight.intensity = sunIntensity;
  directionalLight.color.set(type === 'storm' ? '#b9c5ff' : '#ffffff');
  ambientLight.intensity = 0.35 + lifeLevel / 300;
  fillLight.intensity = type === 'night' ? 0.1 : 0.35;

  // subtle god-ray style bloom via emissive floor lights
  if (type === 'sunny') {
    addHalo('#ffe2b8', 1.5);
  } else if (type === 'night') {
    addHalo('#8dd1ff', 1.8);
  }

  buildClouds(type);
  buildParticles(type, lifeLevel);
}

function addHalo(color, intensity) {
  const halo = new THREE.PointLight(color, intensity, 20);
  halo.position.set(0, 10, 0);
  scene.add(halo);
  setTimeout(() => scene.remove(halo), 900);
}

function buildClouds(type) {
  if (cloudGroup) scene.remove(cloudGroup);
  const cloudPalette = {
    sunny: '#ffffff',
    cloudy: '#d6dae8',
    rain: '#b0b4c1',
    storm: '#7b7f8c',
    night: '#7f8bb8',
  };
  const density = type === 'sunny' ? 3 : type === 'storm' ? 10 : 6;
  if (type === 'snow') return; // snow uses falling particles only
  cloudGroup = new THREE.Group();
  for (let i = 0; i < density; i++) {
    const cloud = createCube(cloudPalette[type] || '#d6dae8', 2 + Math.random() * 1.5);
    cloud.scale.y = 0.5;
    cloud.position.set(-8 + Math.random() * 16, 9 + Math.random() * 4, -8 + Math.random() * 16);
    cloudGroup.add(cloud);
  }
  scene.add(cloudGroup);
}

function buildParticles(type, lifeLevel) {
  if (particleSystem) scene.remove(particleSystem);

  if (type === 'rain' || type === 'storm') {
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 15 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: '#a3b7ff', size: 0.05, transparent: true, opacity: 0.9 });
    particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData.type = 'rain';
    scene.add(particleSystem);
  } else if (type === 'snow') {
    const count = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 12 + 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: '#e5f5ff', size: 0.1, transparent: true, opacity: 0.9 });
    particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData.type = 'snow';
    scene.add(particleSystem);
  } else if (type === 'sunny' && lifeLevel > 75) {
    const count = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 8 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: '#fff6d1', size: 0.06, transparent: true, opacity: 0.9 });
    particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData.type = 'sparkle';
    scene.add(particleSystem);
  }
}

function updateParticles(delta) {
  if (!particleSystem) return;
  const positions = particleSystem.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    if (particleSystem.userData.type === 'rain') {
      positions[i + 1] -= 25 * delta;
      if (positions[i + 1] < 0) positions[i + 1] = 15;
    } else if (particleSystem.userData.type === 'snow') {
      positions[i + 1] -= 6 * delta;
      positions[i] += Math.sin(positions[i + 1] + i) * 0.02;
      if (positions[i + 1] < 0) positions[i + 1] = 12;
    } else if (particleSystem.userData.type === 'sparkle') {
      positions[i + 1] += Math.sin(clock.getElapsedTime() + i) * 0.01;
    }
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}

function updateLightning(delta) {
  if (currentWeather !== 'storm') return;
  lightningTimeout -= delta;
  if (lightningTimeout <= 0) {
    const flash = new THREE.PointLight('#a6c8ff', 5, 30);
    flash.position.set((Math.random() - 0.5) * 12, 8 + Math.random() * 4, (Math.random() - 0.5) * 12);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 150);
    lightningTimeout = 2 + Math.random() * 4;
  }
}

export function update(delta, state) {
  controls.update();
  updateParticles(delta);
  updateLightning(delta);
  animateCamera(delta, state.lifeLevel);
  flickerLights();
}

function flickerLights() {
  if (!houseGroup) return;
  houseGroup.traverse((obj) => {
    if (obj.isPointLight && obj.userData.flicker) {
      obj.intensity = 0.8 + Math.random() * 0.6;
    }
  });
}

let cameraLerp = { value: 0 };
function animateCamera(delta, lifeLevel) {
  const targetDistance = 16 + (100 - lifeLevel) * 0.06;
  const currentDistance = camera.position.length();
  const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, delta * 0.6);
  camera.position.setLength(newDistance);
  cameraLerp.value = THREE.MathUtils.lerp(cameraLerp.value, lifeLevel / 100, delta * 0.5);
  camera.position.y = 10 + cameraLerp.value * 4;
  controls.target.y = 1.5 + Math.sin(clock.getElapsedTime() * 0.4) * 0.4;
}

export function render() {
  renderer.render(scene, camera);
}

export function getRenderer() {
  return renderer;
}

export function getClock() {
  return clock;
}
