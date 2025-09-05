// Enhanced scroll reveal and smooth animations
document.addEventListener('DOMContentLoaded', () => {
  // Enhanced smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Progressive reveal animation
  const revealElements = document.querySelectorAll('.card, .btn, h1, h2, h3, p');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  };
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Add staggered delay based on element position
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
        
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Initialize all elements for reveal
  revealElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    
    revealObserver.observe(el);
  });
  
  // Add floating animation to specific elements
  const floatingElements = document.querySelectorAll('.card');
  floatingElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.5}s`;
    el.classList.add('float-gentle');
  });
  
  // Scroll progress indicator
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      scrollProgress.style.width = `${scrollPercent}%`;
    });
  }
  
  // Floating sidebar navigation
  const floatingSidebar = document.getElementById('floatingSidebar');
  if (floatingSidebar) {
    const navItems = floatingSidebar.querySelectorAll('.floating-nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = document.querySelector(item.dataset.target);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
    
    // Show/hide sidebar based on scroll position
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      if (scrollTop > 300) {
        floatingSidebar.style.opacity = '0.8';
        floatingSidebar.style.transform = 'translateY(-50%) translateX(0)';
      } else {
        floatingSidebar.style.opacity = '0';
        floatingSidebar.style.transform = 'translateY(-50%) translateX(20px)';
      }
    });
  }
  
  // Enhanced performance monitoring
  let performanceOptimized = false;
  const checkPerformance = () => {
    if (performance.now() > 16.67 && !performanceOptimized) {
      // If frame time > 16.67ms (less than 60fps), reduce animations
      document.body.classList.add('reduced-motion');
      performanceOptimized = true;
    }
  };
  
  requestAnimationFrame(checkPerformance);
});