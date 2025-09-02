/**
 * Splash Screen Manager for Tab Transitions
 * 
 * Handles the splash screen animations when switching between tabs.
 * Creates dynamic particles and shapes for visual interest.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get splash screen elements
  const burtonSplash = document.getElementById('burtonSplash');
  const nickSplash = document.getElementById('nickelodeonSplash');
  const burtonParticles = document.getElementById('burtonParticles');
  const nickShapes = document.getElementById('nickelodeonShapes');
  
  // Tab elements
  const aiTab = document.getElementById('aiToolsTab');
  const commTab = document.getElementById('communityTab');
  
  // Initialize particles for Burton splash
  initBurtonParticles();
  
  // Initialize shapes for Nickelodeon splash
  initNickShapes();
  
  // Add click event listeners to tabs
  if (aiTab) {
    aiTab.addEventListener('click', () => {
      showSplash('burton');
    });
  }
  
  if (commTab) {
    commTab.addEventListener('click', () => {
      showSplash('nickelodeon');
    });
  }
  
  /**
   * Show a splash screen for the selected tab
   * @param {string} type - 'burton' or 'nickelodeon'
   */
  function showSplash(type) {
    if (type === 'burton') {
      burtonSplash.classList.add('active');
      
      // Hide splash after animation
      setTimeout(() => {
        burtonSplash.classList.remove('active');
      }, 2000);
    } else if (type === 'nickelodeon') {
      nickSplash.classList.add('active');
      
      // Hide splash after animation
      setTimeout(() => {
        nickSplash.classList.remove('active');
      }, 2000);
    }
  }
  
  /**
   * Initialize particles for Burton splash screen
   */
  function initBurtonParticles() {
    if (!burtonParticles) return;
    
    // Clear existing particles
    burtonParticles.innerHTML = '';
    
    // Create new particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'burton-particle';
      
      // Random position
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // Random size
      const size = 2 + Math.random() * 6;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      
      // Random animation delay
      particle.style.animationDelay = Math.random() * 5 + 's';
      
      // Random color variation
      const hue = 250 + Math.random() * 30; // Purple range
      const sat = 50 + Math.random() * 30;
      const light = 50 + Math.random() * 30;
      particle.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
      
      burtonParticles.appendChild(particle);
    }
  }
  
  /**
   * Initialize shapes for Nickelodeon splash screen
   */
  function initNickShapes() {
    if (!nickShapes) return;
    
    // Clear existing shapes
    nickShapes.innerHTML = '';
    
    // Shape types
    const shapeTypes = ['circle', 'square', 'triangle'];
    
    // Colors
    const colors = [
      '#FF9800', // Orange
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#E91E63', // Pink
      '#FFEB3B'  // Yellow
    ];
    
    // Create new shapes
    for (let i = 0; i < 30; i++) {
      const shape = document.createElement('div');
      const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      shape.className = `nickelodeon-shape ${shapeType}`;
      
      // Random position
      shape.style.left = Math.random() * 100 + '%';
      
      // Random size
      const size = 20 + Math.random() * 40;
      if (shapeType !== 'triangle') {
        shape.style.width = size + 'px';
        shape.style.height = size + 'px';
      }
      
      // Random animation duration and delay
      const duration = 5 + Math.random() * 10;
      shape.style.animationDuration = duration + 's';
      shape.style.animationDelay = Math.random() * 5 + 's';
      
      // Random color
      const color = colors[Math.floor(Math.random() * colors.length)];
      if (shapeType !== 'triangle') {
        shape.style.backgroundColor = color;
      } else {
        shape.style.borderBottomColor = color;
      }
      
      nickShapes.appendChild(shape);
    }
  }
});
