/*
 * OMNI MOZART INTERACTIONS (extended)
 *
 * This script bundles multiple micro‑interaction modules for the charity site:
 *  – Scroll reveal: reveals elements with the class `.reveal-in` as they
 *    intersect the viewport.
 *  – Magnetic hover: subtle translation effect on `.btn-omni` buttons.
 *  – 3D tilt: tilt effect on `.card-omni` panels.
 *  – Click spark burst: radial particle explosion on `.btn-omni` clicks.
 *  – Cursor comet: trailing particles behind the pointer.
 *  – Custom cursor ball: a bespoke cursor that enlarges on interactive elements.
 *  – Floating orbs: ambient orbs drifting downwards for added depth.
 *  – Animated progress bars: fills progress bars when they scroll into view.
 *
 * All effects honor the user's motion preferences (prefers-reduced-motion) and
 * disable themselves when appropriate or on mobile to preserve performance.
 */

(() => {
  /* Tab switching logic for AI Tools and Community tabs */
  document.addEventListener('DOMContentLoaded', () => {
    const aiTab = document.getElementById('aiToolsTab');
    const commTab = document.getElementById('communityTab');
    const aiContent = document.getElementById('aiToolsContent');
    const commContent = document.getElementById('communityContent');
    const mainContent = document.getElementById('mainContent');
    
    // Only proceed if the required elements exist (i.e., we're on the main page, not backend)
    if (!aiTab || !commTab || !aiContent || !commContent || !mainContent) {
      return;
    }
    
    // Define splash screens
    const burtonSplash = document.getElementById('burtonSplash');
    const nickSplash = document.getElementById('nickelodeonSplash');
    
    function showTab(tab) {
      // Delay the tab switch to allow splash screen to show
      const switchDelay = 1000; // 1 second
      
      if (tab === 'ai') {
        setTimeout(() => {
          aiContent.style.display = 'block';
          commContent.style.display = 'none';
          mainContent.style.display = 'none';
          aiTab.classList.add('active');
          commTab.classList.remove('active');
        }, switchDelay);
      } else if (tab === 'community') {
        setTimeout(() => {
          aiContent.style.display = 'none';
          commContent.style.display = 'block';
          mainContent.style.display = 'none';
          aiTab.classList.remove('active');
          commTab.classList.add('active');
        }, switchDelay);
      } else {
        aiContent.style.display = 'none';
        commContent.style.display = 'none';
        mainContent.style.display = 'block';
        aiTab.classList.remove('active');
        commTab.classList.remove('active');
      }
    }
    
    aiTab.addEventListener('click', () => showTab('ai'));
    commTab.addEventListener('click', () => showTab('community'));
    aiTab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showTab('ai'); });
    commTab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showTab('community'); });
    
    // Default: show main content
    showTab();
  });
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  /* Scroll reveal */
  (function() {
    const els = document.querySelectorAll('.reveal-in');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  })();

  /* Magnetic hover for buttons */
  (function() {
    if (prefersReduced || isMobile) return;
    const strength = 14;
    document.querySelectorAll('.btn-omni').forEach(btn => {
      let raf = 0;
      btn.addEventListener('mouseenter', () => {
        btn.style.willChange = 'transform';
      });
      btn.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        btn.style.transform = '';
        btn.style.willChange = '';
      });
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          btn.style.transform = `translate(${x / strength}px, ${y / strength}px) scale(1.015)`;
        });
      });
    });
  })();

  /* 3D tilt for cards */
  (function() {
    if (prefersReduced || isMobile) return;
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    document.querySelectorAll('.card-omni').forEach(card => {
      let raf = 0;
      const onMove = e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rx = clamp(-py * 8, -10, 10);
        const ry = clamp(px * 12, -12, 12);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      };
      const reset = () => {
        cancelAnimationFrame(raf);
        card.style.transform = '';
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', reset);
    });
  })();

  /* Click spark burst on buttons */
  (function() {
    if (prefersReduced || isMobile) return;
    const spawn = (x, y, root) => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'omni-spark';
        const a = (i / n) * Math.PI * 2;
        const v = 40 + Math.random() * 40;
        p.style.setProperty('--dx', Math.cos(a) * v + 'px');
        p.style.setProperty('--dy', Math.sin(a) * v + 'px');
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        root.appendChild(p);
        setTimeout(() => p.remove(), 700);
      }
    };
    document.addEventListener('click', e => {
      const btn = e.target.closest('.btn-omni');
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top, btn);
    });
  })();

  /* Cursor comet trailing particles */
  (function() {
    if (prefersReduced || isMobile) return;
    const comet = document.createElement('canvas');
    comet.className = 'hero-canvas';
    const ctx = comet.getContext('2d');
    let w = 0, h = 0;
    const trail = [];
    const resize = () => {
      w = comet.width = window.innerWidth;
      h = comet.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    document.body.appendChild(comet);
    let lastX = 0, lastY = 0;
    document.addEventListener('pointermove', e => {
      lastX = e.clientX;
      lastY = e.clientY;
      trail.push({ x: lastX, y: lastY, a: 1, r: 2 + Math.random() * 2, c: [0, 225, 255] });
      if (trail.length > 120) trail.shift();
    }, { passive: true });
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const t of trail) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${t.c[0]}, ${t.c[1]}, ${t.c[2]}, ${t.a})`;
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        t.x *= 0.985;
        t.y *= 0.985;
        t.a *= 0.94;
      }
      requestAnimationFrame(tick);
    };
    tick();
  })();

  /* Custom cursor ball that follows pointer and responds to interactive elements */
  (function() {
    if (prefersReduced || isMobile) return;
    const cursor = document.createElement('div');
    cursor.className = 'omni-cursor';
    document.body.appendChild(cursor);
    document.body.classList.add('has-omni-cursor');
    document.addEventListener('pointermove', e => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
    const interactiveSelector = '.btn-omni, .tag-omni, .card-omni, a, button';
    document.addEventListener('pointerover', e => {
      const target = e.target.closest(interactiveSelector);
      if (target) {
        cursor.style.width = cursor.style.height = '48px';
        cursor.style.background = 'radial-gradient(circle, var(--secondary-gradient), var(--primary-gradient))';
      }
    });
    document.addEventListener('pointerout', e => {
      const target = e.target.closest(interactiveSelector);
      if (target) {
        cursor.style.width = cursor.style.height = '18px';
        cursor.style.background = 'radial-gradient(circle, var(--primary-gradient), var(--secondary-gradient))';
      }
    });
  })();

  /* Floating orbs that drift across the viewport */
  (function() {
    if (prefersReduced || isMobile) return;
    const createOrb = () => {
      const orb = document.createElement('div');
      orb.className = 'floating-orb';
      orb.style.left = Math.random() * 100 + 'vw';
      orb.style.top = '-100px';
      orb.style.animationDuration = 15 + Math.random() * 10 + 's';
      orb.style.animationDelay = -(Math.random() * 15) + 's';
      document.body.appendChild(orb);
      orb.addEventListener('animationend', () => {
        orb.remove();
        createOrb();
      });
    };
    for (let i = 0; i < 6; i++) createOrb();
  })();

  /* Animate progress bars when they come into view */
  (function() {
    const bars = document.querySelectorAll('.progress-bar-omni[data-progress]');
    if (!bars.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const pct = parseFloat(bar.getAttribute('data-progress') || '0');
        const fill = bar.querySelector('.progress');
        if (fill) {
          const clamped = Math.max(0, Math.min(pct, 100));
          fill.style.width = clamped + '%';
        }
        io.unobserve(bar);
      });
    }, { threshold: 0.35 });
    bars.forEach(bar => io.observe(bar));
  })();
})();
