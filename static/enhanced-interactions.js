/*
 * Enhanced AI Charity Interactions & Animations
 * Optimized for performance and stunning visual effects
 */

(() => {
  // Performance and device detection
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const isLowPower = navigator.hardwareConcurrency <= 2;

  // Optimized scroll reveal with Intersection Observer
  (function initScrollReveal() {
    const elements = document.querySelectorAll('.card, h1, h2, h3, p');
    if (!elements.length) return;

    // Add reveal class to elements
    elements.forEach((el, index) => {
      el.classList.add('reveal-in');
      el.style.transitionDelay = `${index * 0.1}s`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1, 
      rootMargin: '0px 0px -50px 0px' 
    });

    elements.forEach(el => observer.observe(el));
  })();

  // Enhanced magnetic hover for buttons (desktop only)
  (function initMagneticButtons() {
    if (prefersReduced || isMobile) return;

    const buttons = document.querySelectorAll('.btn, .theme-chip');
    const strength = 12;

    buttons.forEach(btn => {
      let rafId = 0;
      
      const handleMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          btn.style.transform = `translate(${x / strength}px, ${y / strength}px) scale(1.05)`;
        });
      };

      const handleMouseLeave = () => {
        cancelAnimationFrame(rafId);
        btn.style.transform = '';
      };

      btn.addEventListener('mouseenter', () => {
        btn.style.willChange = 'transform';
      });
      
      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });
  })();

  // Enhanced 3D tilt effect for cards
  (function init3DTilt() {
    if (prefersReduced || isMobile) return;

    const cards = document.querySelectorAll('.card');
    const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

    cards.forEach(card => {
      let rafId = 0;

      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        const rotateX = clamp(-y * 15, -12, 12);
        const rotateY = clamp(x * 15, -12, 12);
        
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
      };

      const handleMouseLeave = () => {
        cancelAnimationFrame(rafId);
        card.style.transform = '';
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
  })();

  // Particle burst effect on button clicks
  (function initParticleBurst() {
    if (prefersReduced || isMobile) return;

    const createParticle = (x, y, parent) => {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: linear-gradient(45deg, #7dd3fc, #a78bfa);
        border-radius: 50%;
        pointer-events: none;
        left: ${x}px;
        top: ${y}px;
        animation: particleBurst 0.8s ease-out forwards;
        z-index: 1000;
      `;
      
      // Add random velocity
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      particle.style.setProperty('--vx', vx + 'px');
      particle.style.setProperty('--vy', vy + 'px');
      
      parent.appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    };

    // Add particle burst animation CSS
    if (!document.getElementById('particle-styles')) {
      const style = document.createElement('style');
      style.id = 'particle-styles';
      style.textContent = `
        @keyframes particleBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), var(--vy)) scale(0);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create multiple particles
      for (let i = 0; i < 8; i++) {
        setTimeout(() => createParticle(x, y, btn), i * 20);
      }
    });
  })();

  // Dynamic background gradient based on scroll
  (function initDynamicBackground() {
    if (prefersReduced) return;

    let rafId = 0;
    const updateBackground = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const hue = 220 + (scrollPercent * 60); // Shift from blue to purple
      
      document.documentElement.style.setProperty(
        '--bg-primary', 
        `hsl(${hue}, 45%, 8%)`
      );
      document.documentElement.style.setProperty(
        '--bg-secondary', 
        `hsl(${hue + 20}, 55%, 12%)`
      );
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateBackground);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  })();

  // Floating orbs ambient effect
  (function initFloatingOrbs() {
    if (prefersReduced || isMobile || isLowPower) return;

    const orbContainer = document.createElement('div');
    orbContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    `;
    document.body.appendChild(orbContainer);

    const createOrb = () => {
      const orb = document.createElement('div');
      const size = 20 + Math.random() * 40;
      const opacity = 0.1 + Math.random() * 0.3;
      const duration = 15 + Math.random() * 20;
      
      orb.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(125, 211, 252, ${opacity}), transparent);
        top: 100vh;
        left: ${Math.random() * 100}vw;
        animation: floatUp ${duration}s linear infinite;
        filter: blur(1px);
      `;
      
      orbContainer.appendChild(orb);
      
      // Remove after animation
      setTimeout(() => orb.remove(), duration * 1000);
    };

    // Add floating animation CSS
    if (!document.getElementById('float-styles')) {
      const style = document.createElement('style');
      style.id = 'float-styles';
      style.textContent = `
        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px) scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create orbs periodically
    setInterval(createOrb, 3000);
    
    // Create initial orbs
    for (let i = 0; i < 3; i++) {
      setTimeout(createOrb, i * 1000);
    }
  })();

  // Enhanced cursor trail effect
  (function initCursorTrail() {
    if (prefersReduced || isMobile) return;

    const trail = [];
    const trailLength = 20;

    const updateTrail = (e) => {
      trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      
      // Limit trail length
      if (trail.length > trailLength) {
        trail.shift();
      }
      
      // Update trail elements
      trail.forEach((point, index) => {
        const age = Date.now() - point.time;
        const opacity = Math.max(0, 1 - age / 1000);
        const scale = 0.3 + (index / trailLength) * 0.7;
        
        if (!point.element) {
          point.element = document.createElement('div');
          point.element.style.cssText = `
            position: fixed;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(125, 211, 252, 0.8), transparent);
            pointer-events: none;
            z-index: 9999;
            mix-blend-mode: screen;
            transform-origin: center;
          `;
          document.body.appendChild(point.element);
        }
        
        point.element.style.left = point.x + 'px';
        point.element.style.top = point.y + 'px';
        point.element.style.opacity = opacity;
        point.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        if (opacity <= 0) {
          point.element.remove();
          trail.splice(index, 1);
        }
      });
    };

    document.addEventListener('mousemove', updateTrail);
  })();

  // Performance monitoring and adaptive quality
  (function initPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const checkPerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {
          // Reduce quality if FPS is too low
          document.documentElement.classList.add('low-performance');
          console.log('Low performance detected, reducing effects');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkPerformance);
    };
    
    requestAnimationFrame(checkPerformance);
  })();

})();