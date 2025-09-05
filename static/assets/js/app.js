/* global THREE */
(() => {
  // Theme manager
  const themes = {
    galaxy: { bg:"#0b0f18", accent:"#7dd3fc" },
    neural:  { bg:"#0a0a0a", accent:"#a78bfa" },
    sunrise:{ bg:"#1a2235", accent:"#fca5a5" }
  };
  function applyTheme(name) {
    const t = themes[name] || themes.galaxy;
    document.documentElement.style.setProperty('--bg', t.bg);
    document.documentElement.style.setProperty('--accent', t.accent);
    localStorage.setItem('fic_theme', name);
  }
  document.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.theme));
  });
  applyTheme(localStorage.getItem('fic_theme') || 'galaxy');

  // Enhanced Starfield hero with advanced particle effects
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || Math.max(300, window.innerHeight * 0.7);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);
  camera.position.z = 75;

  // Enhanced Stars with multiple layers
  const createStarField = (count, size, color, speed) => {
    const starGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3+0] = (Math.random() - 0.5) * 1200;
      pos[i*3+1] = (Math.random() - 0.5) * 800;
      pos[i*3+2] = (Math.random() - 0.5) * 1200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ 
      size: size, 
      color: color,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starGeo, starMat);
    stars.userData = { speed };
    return stars;
  };

  // Multiple star layers for depth
  const starLayers = [
    createStarField(2000, 1.5, 0x9fd0ff, 0.02),
    createStarField(1500, 2.0, 0xffffff, 0.015),
    createStarField(1000, 2.5, 0xa78bfa, 0.01)
  ];

  starLayers.forEach(layer => scene.add(layer));

  // Enhanced Neural ring with pulsing effect
  const ring = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(0.9, 16, 16);
  const nodes = [];
  
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2;
    const r = 30 + Math.sin(i * 0.35) * 3;
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.7
    });
    const m = new THREE.Mesh(nodeGeo, material);
    m.position.set(Math.cos(a) * r, Math.sin(a * 1.2) * 4, Math.sin(a) * r);
    m.userData = { originalScale: 1, phase: i * 0.1 };
    nodes.push(m);
    ring.add(m);
  }
  scene.add(ring);

  // Floating particles
  const particleCount = 500;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  const particleVel = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    particlePos[i*3+0] = (Math.random() - 0.5) * 200;
    particlePos[i*3+1] = (Math.random() - 0.5) * 200;
    particlePos[i*3+2] = (Math.random() - 0.5) * 200;
    
    particleVel[i*3+0] = (Math.random() - 0.5) * 0.02;
    particleVel[i*3+1] = (Math.random() - 0.5) * 0.02;
    particleVel[i*3+2] = (Math.random() - 0.5) * 0.02;
  }
  
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x00aaff,
    size: 1.0,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const clock = new THREE.Clock();
  let frameCount = 0;

  function tick() {
    const t = clock.getElapsedTime();
    frameCount++;

    // Animate star layers
    starLayers.forEach(layer => {
      layer.rotation.y = t * layer.userData.speed;
      layer.rotation.x = Math.sin(t * 0.1) * 0.1;
    });

    // Enhanced ring animation
    ring.rotation.y = t * 0.3;
    ring.rotation.x = Math.sin(t * 0.4) * 0.3;
    ring.rotation.z = Math.cos(t * 0.2) * 0.1;

    // Pulsing nodes
    nodes.forEach((node, i) => {
      const pulse = Math.sin(t * 2 + node.userData.phase) * 0.3 + 1;
      node.scale.setScalar(pulse);
      node.material.opacity = 0.4 + pulse * 0.3;
    });

    // Animate floating particles
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i*3+0] += particleVel[i*3+0];
      positions[i*3+1] += particleVel[i*3+1];
      positions[i*3+2] += particleVel[i*3+2];
      
      // Wrap around boundaries
      if (Math.abs(positions[i*3+0]) > 100) particleVel[i*3+0] *= -1;
      if (Math.abs(positions[i*3+1]) > 100) particleVel[i*3+1] *= -1;
      if (Math.abs(positions[i*3+2]) > 100) particleVel[i*3+2] *= -1;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Camera gentle movement
    camera.position.x = Math.sin(t * 0.1) * 2;
    camera.position.y = Math.cos(t * 0.15) * 1;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Respect reduced motion preference
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderer.setAnimationLoop(null);
  }
})();