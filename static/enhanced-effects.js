/**
 * Enhanced Visual Effects for AI Charity Website
 * Creates dynamic visual elements and animations
 */

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  
  if (prefersReduced) return;

  // Initialize enhanced effects when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedEffects);
  } else {
    initEnhancedEffects();
  }

  function initEnhancedEffects() {
    createMatrixRain();
    createCyberGrid();
    createParticleSystem();
    createFloatingOrbs();
    createLightningEffect();
    createDNAHelix();
    createQuantumField();
    createFractalMandala();
    createDataStreams();
    createNeuralNetwork();
    enhanceButtons();
    initializeHolographicText();
    startPerformanceMonitoring();
  }

  // Create matrix rain effect
  function createMatrixRain() {
    const matrixRain = document.createElement('div');
    matrixRain.className = 'matrix-rain';
    document.body.appendChild(matrixRain);
  }

  // Create cyber grid overlay
  function createCyberGrid() {
    const cyberGrid = document.createElement('div');
    cyberGrid.className = 'cyber-grid';
    document.body.appendChild(cyberGrid);
  }

  // Create enhanced particle system
  function createParticleSystem() {
    const particleSystem = document.createElement('div');
    particleSystem.className = 'particle-system';
    
    // Create 50 particles with random properties
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random positioning and delay
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (6 + Math.random() * 8) + 's';
      
      particleSystem.appendChild(particle);
    }
    
    document.body.appendChild(particleSystem);
  }

  // Create floating orbs with variants
  function createFloatingOrbs() {
    const orbContainer = document.createElement('div');
    orbContainer.style.position = 'fixed';
    orbContainer.style.top = '0';
    orbContainer.style.left = '0';
    orbContainer.style.width = '100%';
    orbContainer.style.height = '100%';
    orbContainer.style.pointerEvents = 'none';
    orbContainer.style.zIndex = '1';
    orbContainer.style.overflow = 'hidden';

    // Create 15 orbs with different variants
    for (let i = 0; i < 15; i++) {
      const orb = document.createElement('div');
      const variants = ['', 'variant-2', 'variant-3'];
      const variant = variants[i % 3];
      
      orb.className = `floating-orb ${variant}`;
      orb.style.left = Math.random() * 100 + '%';
      orb.style.top = '-60px';
      orb.style.animationDelay = Math.random() * 10 + 's';
      
      // Different sizes for variety
      const size = 40 + Math.random() * 40;
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      
      orbContainer.appendChild(orb);
    }

    document.body.appendChild(orbContainer);
  }

  // Enhance buttons with neon border effects
  function enhanceButtons() {
    const buttons = document.querySelectorAll('.btn, .btn-omni, button');
    buttons.forEach(btn => {
      if (!btn.classList.contains('neon-border')) {
        btn.classList.add('neon-border');
      }
      
      // Add ripple effect on click
      btn.addEventListener('click', createRipple);
    });
  }

  // Create ripple effect for button clicks
  function createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(0, 225, 255, 0.6);
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize holographic text effects
  function initializeHolographicText() {
    const headings = document.querySelectorAll('h1, h2, h3, .hero h1, .hero h2');
    headings.forEach(heading => {
      if (!heading.classList.contains('holo-text')) {
        heading.classList.add('holo-text');
      }
    });
  }

  // Performance monitoring to adjust effects
  function startPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;

    function monitor() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Reduce effects if performance is poor
        if (fps < 30) {
          reduceEffects();
        } else if (fps > 50) {
          enableFullEffects();
        }
      }
      
      requestAnimationFrame(monitor);
    }
    
    requestAnimationFrame(monitor);
  }

  // Reduce effects for performance
  function reduceEffects() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
      if (index % 2 === 0) {
        particle.style.display = 'none';
      }
    });
    
    const orbs = document.querySelectorAll('.floating-orb');
    orbs.forEach((orb, index) => {
      if (index % 3 === 0) {
        orb.style.animationDuration = parseFloat(orb.style.animationDuration || '20s') * 1.5 + 's';
      }
    });
  }

  // Enable full effects
  function enableFullEffects() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
      particle.style.display = '';
    });
  }

  // Add dynamic glow effects on scroll
  let ticking = false;
  
  function updateGlowEffects() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    const glowElements = document.querySelectorAll('.glitch-omni, .holo-text');
    glowElements.forEach(el => {
      const intensity = 0.5 + Math.sin(scrolled * 0.01) * 0.3;
      el.style.filter = `brightness(${intensity}) saturate(${1 + intensity * 0.5})`;
    });
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateGlowEffects);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });

  // Add mouse trail effect
  const trail = [];
  const maxTrailLength = 20;
  
  document.addEventListener('mousemove', (e) => {
    if (isMobile) return;
    
    trail.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    });
    
    if (trail.length > maxTrailLength) {
      trail.shift();
    }
    
    updateTrail();
  }, { passive: true });
  
  function updateTrail() {
    const now = Date.now();
    trail.forEach((point, index) => {
      const age = now - point.time;
      if (age > 500) return;
      
      const trailElement = document.getElementById(`trail-${index}`) || createTrailElement(index);
      const opacity = 1 - (age / 500);
      const scale = opacity;
      
      trailElement.style.left = point.x + 'px';
      trailElement.style.top = point.y + 'px';
      trailElement.style.opacity = opacity;
      trailElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
  }
  
  function createTrailElement(index) {
    const element = document.createElement('div');
    element.id = `trail-${index}`;
    element.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: radial-gradient(circle, rgba(0, 225, 255, 0.8), transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      transition: opacity 0.1s ease, transform 0.1s ease;
    `;
    document.body.appendChild(element);
    return element;
  }

  // Create lightning effect
  function createLightningEffect() {
    const lightningContainer = document.createElement('div');
    lightningContainer.className = 'lightning-container';
    
    // Create 3 lightning bolts at different positions
    for (let i = 0; i < 3; i++) {
      const bolt = document.createElement('div');
      bolt.className = 'lightning-bolt';
      bolt.style.left = (20 + i * 30) + '%';
      bolt.style.animationDelay = (i * 1.5) + 's';
      lightningContainer.appendChild(bolt);
    }
    
    document.body.appendChild(lightningContainer);
  }

  // Create DNA helix effect
  function createDNAHelix() {
    const helix = document.createElement('div');
    helix.className = 'dna-helix';
    
    // Create two strands
    for (let i = 0; i < 2; i++) {
      const strand = document.createElement('div');
      strand.className = 'dna-strand';
      helix.appendChild(strand);
    }
    
    // Create rungs connecting the strands
    for (let i = 0; i < 20; i++) {
      const rung = document.createElement('div');
      rung.className = 'dna-rung';
      rung.style.top = (i * 5) + '%';
      rung.style.animationDelay = (i * 0.1) + 's';
      helix.appendChild(rung);
    }
    
    document.body.appendChild(helix);
  }

  // Create quantum field effect
  function createQuantumField() {
    const field = document.createElement('div');
    field.className = 'quantum-field';
    document.body.appendChild(field);
  }

  // Create fractal mandala
  function createFractalMandala() {
    const mandala = document.createElement('div');
    mandala.className = 'fractal-mandala';
    document.body.appendChild(mandala);
  }

  // Create data streams
  function createDataStreams() {
    for (let i = 0; i < 8; i++) {
      const stream = document.createElement('div');
      stream.className = 'data-stream';
      stream.style.left = (10 + i * 10) + '%';
      stream.style.animationDelay = (i * 0.8) + 's';
      stream.style.animationDuration = (4 + Math.random() * 4) + 's';
      document.body.appendChild(stream);
    }
  }

  // Create neural network visualization
  function createNeuralNetwork() {
    const network = document.createElement('div');
    network.className = 'neural-network';
    
    // Create nodes
    const nodes = [];
    for (let i = 0; i < 15; i++) {
      const node = document.createElement('div');
      node.className = 'neural-node';
      node.style.left = Math.random() * 100 + '%';
      node.style.top = Math.random() * 100 + '%';
      node.style.animationDelay = Math.random() * 3 + 's';
      network.appendChild(node);
      nodes.push({
        element: node,
        x: parseFloat(node.style.left),
        y: parseFloat(node.style.top)
      });
    }
    
    // Create connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + 
          Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        
        if (distance < 30) { // Only connect nearby nodes
          const connection = document.createElement('div');
          connection.className = 'neural-connection';
          
          const angle = Math.atan2(
            nodes[j].y - nodes[i].y, 
            nodes[j].x - nodes[i].x
          ) * 180 / Math.PI;
          
          connection.style.left = nodes[i].x + '%';
          connection.style.top = nodes[i].y + '%';
          connection.style.width = distance + 'vw';
          connection.style.transform = `rotate(${angle}deg)`;
          connection.style.animationDelay = Math.random() * 4 + 's';
          
          network.appendChild(connection);
        }
      }
    }
    
    document.body.appendChild(network);
  }

  // Add energy pulse rings on button clicks
  function createEnergyRing(x, y) {
    const ring = document.createElement('div');
    ring.className = 'energy-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.width = '20px';
    ring.style.height = '20px';
    ring.style.marginLeft = '-10px';
    ring.style.marginTop = '-10px';
    
    document.body.appendChild(ring);
    
    setTimeout(() => ring.remove(), 4000);
  }

  // Enhanced button clicks with energy rings
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn, .btn-omni, button, a')) {
      createEnergyRing(e.clientX, e.clientY);
    }
  }, { passive: true });

  // Cleanup function for when effects need to be removed
  window.removeEnhancedEffects = function() {
    const effectElements = document.querySelectorAll(`
      .matrix-rain, .cyber-grid, .particle-system, .floating-orb,
      .lightning-container, .dna-helix, .quantum-field, .fractal-mandala,
      .data-stream, .neural-network, .energy-ring
    `);
    effectElements.forEach(el => el.remove());
    
    const trailElements = document.querySelectorAll('[id^="trail-"]');
    trailElements.forEach(el => el.remove());
  };

})();