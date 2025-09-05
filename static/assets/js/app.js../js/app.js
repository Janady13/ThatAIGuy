/* global THREE */
(() => {
  'use strict';
  
  // Theme manager with modern object shorthand and destructuring
  const themes = {
    galaxy: { bg: '#0b0f18', accent: '#7dd3fc' },
    neural: { bg: '#0a0a0a', accent: '#a78bfa' },
    sunrise: { bg: '#1a2235', accent: '#fca5a5' }
  };

  // Optimized theme application using destructuring
  const applyTheme = (name) => {
    const { bg, accent } = themes[name] || themes.galaxy;
    const root = document.documentElement.style;
    root.setProperty('--bg', bg);
    root.setProperty('--accent', accent);
    localStorage.setItem('fic_theme', name);
  };

  // Use modern event delegation and arrow functions
  document.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', () => applyTheme(el.dataset.theme));
  });
  
  // Apply saved theme or default
  applyTheme(localStorage.getItem('fic_theme') || 'galaxy');

  // Early return for missing dependencies
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  // Scene setup with destructuring
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true,
    powerPreference: 'high-performance' // Optimize for performance
  });

  // Optimized resize handler using modern syntax
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || Math.max(300, window.innerHeight * 0.7);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  resize();
  window.addEventListener('resize', resize);
  camera.position.z = 75;

  // Optimized star generation using modern array methods
  const createStars = () => {
    const starGeo = new THREE.BufferGeometry();
    const count = 2400;
    const positions = new Float32Array(count * 3);
    
    // Use more efficient generation
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 800;
      positions[i3 + 1] = (Math.random() - 0.5) * 500;
      positions[i3 + 2] = (Math.random() - 0.5) * 800;
    }
    
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.2, color: 0x9fd0ff });
    return new THREE.Points(starGeo, starMat);
  };

  // Create and add stars
  const stars = createStars();
  scene.add(stars);

  // Optimized neural ring creation
  const createNeuralRing = () => {
    const ring = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    
    // Use constants and reduce calculations
    const nodeCount = 72;
    const baseRadius = 30;
    const radiusVariation = 0.35;
    const heightVariation = 1.2;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = baseRadius + Math.sin(i * radiusVariation) * 2;
      const mesh = new THREE.Mesh(nodeGeo, nodeMaterial);
      
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * heightVariation) * 4,
        Math.sin(angle) * radius
      );
      ring.add(mesh);
    }
    
    return ring;
  };

  // Create and add neural ring
  const ring = createNeuralRing();
  scene.add(ring);

  // Optimized animation loop with performance considerations
  const clock = new THREE.Clock();
  let animationId;
  
  const tick = () => {
    const t = clock.getElapsedTime();
    
    // Use more efficient rotation updates
    stars.rotation.y = t * 0.02;
    ring.rotation.y = t * 0.25;
    ring.rotation.x = Math.sin(t * 0.3) * 0.2;
    
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(tick);
  };

  // Respect user's motion preferences
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    tick();
  } else {
    // Render a single frame for static display
    renderer.render(scene, camera);
  }

  // Cleanup function for better memory management
  const cleanup = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    renderer.dispose();
  };

  // Optional: cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
})();
