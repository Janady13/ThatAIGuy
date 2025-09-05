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
  if (!canvas || !window.THREE) return;

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

  // Enhanced dynamic stars with varying sizes and colors
  const starGeo = new THREE.BufferGeometry();
  const count = 3200;
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    pos[i*3+0] = (Math.random() - 0.5) * 1000;
    pos[i*3+1] = (Math.random() - 0.5) * 600;
    pos[i*3+2] = (Math.random() - 0.5) * 1000;
    
    sizes[i] = Math.random() * 2.5 + 0.5;
    
    // Gradient colors from blue to purple to cyan
    const hue = Math.random() * 0.3 + 0.5; // 0.5-0.8 range
    const color = new THREE.Color().setHSL(hue, 0.8, 0.6 + Math.random() * 0.4);
    colors[i*3+0] = color.r;
    colors[i*3+1] = color.g;
    colors[i*3+2] = color.b;
  }
  
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const starMat = new THREE.PointsMaterial({ 
    size: 1.5, 
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Enhanced neural ring with ambient lighting
  const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0x7dd3fc, 1, 100);
  pointLight.position.set(0, 0, 50);
  scene.add(pointLight);
  
  const ring = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(0.9, 24, 24);
  const nodeColors = [0x7dd3fc, 0xa78bfa, 0xfca5a5, 0x34d399];
  
  for (let i = 0; i < 84; i++) {
    const a = i / 84 * Math.PI * 2;
    const r = 32 + Math.sin(i * 0.4) * 3;
    const colorIndex = Math.floor(Math.random() * nodeColors.length);
    
    const material = new THREE.MeshStandardMaterial({ 
      color: nodeColors[colorIndex],
      emissive: nodeColors[colorIndex],
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    const m = new THREE.Mesh(nodeGeo, material);
    m.position.set(Math.cos(a) * r, Math.sin(a * 1.3) * 5, Math.sin(a) * r);
    m.userData = { originalY: m.position.y, phase: Math.random() * Math.PI * 2 };
    ring.add(m);
  }
  scene.add(ring);

  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    
    // Enhanced star animation with subtle pulsing
    stars.rotation.y = t * 0.015;
    stars.rotation.z = Math.sin(t * 0.1) * 0.05;
    
    // Dynamic neural ring animation
    ring.rotation.y = t * 0.2;
    ring.rotation.x = Math.sin(t * 0.25) * 0.15;
    
    // Animate individual nodes with floating effect
    ring.children.forEach((node, index) => {
      if (node.userData) {
        const phase = node.userData.phase;
        node.position.y = node.userData.originalY + Math.sin(t * 0.5 + phase) * 0.8;
        node.rotation.x = t * 0.3 + index * 0.1;
        node.rotation.y = t * 0.2 + index * 0.05;
        
        // Subtle scale pulsing
        const scale = 1 + Math.sin(t * 2 + phase) * 0.1;
        node.scale.setScalar(scale);
      }
    });
    
    // Dynamic point light movement
    pointLight.position.x = Math.sin(t * 0.3) * 30;
    pointLight.position.z = Math.cos(t * 0.3) * 30 + 50;
    pointLight.intensity = 0.8 + Math.sin(t * 0.8) * 0.3;
    
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    renderer.setAnimationLoop(null);
  }
  
  // Scroll reveal animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all reveal elements
  document.querySelectorAll('.reveal-up').forEach(el => {
    revealObserver.observe(el);
  });
})();
