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

  // Starfield hero (lightweight)
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  
  // If Three.js is not available, provide a simple fallback
  if (!window.THREE) {
    console.log('Three.js not available, using CSS fallback for visuals');
    // Add a simple CSS animation fallback
    canvas.style.background = 'radial-gradient(ellipse at center, #1a2235 0%, #0b0f18 70%)';
    canvas.style.animation = 'pulse 4s ease-in-out infinite alternate';
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 0.8; }
        100% { opacity: 1; }
      }
      #hero-canvas {
        background: radial-gradient(ellipse at center, #1a2235 0%, #0b0f18 70%);
        background-size: 200% 200%;
        animation: pulse 4s ease-in-out infinite alternate;
      }
    `;
    document.head.appendChild(style);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });

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

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const count = 2400;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3+0] = (Math.random() - 0.5) * 800;
    pos[i*3+1] = (Math.random() - 0.5) * 500;
    pos[i*3+2] = (Math.random() - 0.5) * 800;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({ size: 1.2, color: 0x9fd0ff });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Neural ring
  const ring = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(0.9, 16, 16);
  for (let i = 0; i < 72; i++) {
    const a = i / 72 * Math.PI * 2;
    const r = 30 + Math.sin(i * 0.35) * 2;
    const m = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: 0x7dd3fc }));
    m.position.set(Math.cos(a) * r, Math.sin(a * 1.2) * 4, Math.sin(a) * r);
    ring.add(m);
  }
  scene.add(ring);

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    stars.rotation.y = t * 0.02;
    ring.rotation.y = t * 0.25;
    ring.rotation.x = Math.sin(t * 0.3) * 0.2;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderer.setAnimationLoop(null);
  }
})();
