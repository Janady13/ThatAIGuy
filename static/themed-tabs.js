/**
 * Themed 3D Interactive UI for AI Tools and Community tabs
 * 
 * Features:
 * - Tim Burton-inspired gothic, whimsical 3D environment for AI Tools
 * - Nickelodeon-inspired vibrant, playful 3D environment for Community
 * - Performance optimized with requestAnimationFrame
 * - Accessibility considerations
 * - Responsive design
 */

// Initialize Three.js library
function loadThreeJs() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Three.js'));
    document.head.appendChild(script);
  });
}

// Initialize GSAP for animations
function loadGSAP() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GSAP'));
    document.head.appendChild(script);
  });
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  // Load necessary libraries
  try {
    await Promise.all([loadThreeJs(), loadGSAP()]);
    initThemedTabs();
  } catch (error) {
    console.error('Failed to load required libraries:', error);
    fallbackToBasicUI();
  }
});

function fallbackToBasicUI() {
  // Provide a simpler fallback UI if 3D libraries fail to load
  const aiContent = document.getElementById('aiToolsContent');
  const communityContent = document.getElementById('communityContent');
  
  if (aiContent) {
    aiContent.innerHTML = `
      <div style="padding: 30px; text-align: center;">
        <h2>AI Tools</h2>
        <p>Our advanced AI tools are designed to enhance creativity and productivity.</p>
        <button onclick="document.getElementById('mainContent').style.display='block'; this.parentElement.parentElement.style.display='none';">
          Return to Main
        </button>
      </div>
    `;
  }
  
  if (communityContent) {
    communityContent.innerHTML = `
      <div style="padding: 30px; text-align: center;">
        <h2>Community</h2>
        <p>Join our vibrant community of AI enthusiasts and creators.</p>
        <button onclick="document.getElementById('mainContent').style.display='block'; this.parentElement.parentElement.style.display='none';">
          Return to Main
        </button>
      </div>
    `;
  }
}

function initThemedTabs() {
  // Initialize tab content once libraries are loaded
  initBurtonUI();
  initNickelodeonUI();
  
  // Add tab keyboard navigation
  const tabHeaders = document.querySelectorAll('.tab-header');
  tabHeaders.forEach((tab, index) => {
    tab.setAttribute('tabindex', '0');
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      }
    });
  });
}

//////////////////////////////////
// TIM BURTON UI - AI TOOLS TAB //
//////////////////////////////////

// Global variables for Burton UI
let burtonScene, burtonCamera, burtonRenderer, burtonClock;
let burtonAnimationFrame = null;
let burtonInitialized = false;

function initBurtonUI() {
  const container = document.getElementById('aiToolsContent');
  
  // Show loading indicator
  container.innerHTML = `
    <div class="burton-container">
      <div class="loading-container">
        <div class="loading-spinner"></div>
      </div>
      <button class="return-button" aria-label="Return to main content">Return</button>
    </div>
  `;
  
  // Set up return button
  const returnButton = container.querySelector('.return-button');
  returnButton.addEventListener('click', () => {
    cancelAnimationFrame(burtonAnimationFrame);
    document.getElementById('mainContent').style.display = 'block';
    container.style.display = 'none';
    document.getElementById('aiToolsTab').classList.remove('active');
  });
  
  // Create Burton 3D scene when tab is first clicked
  document.getElementById('aiToolsTab').addEventListener('click', () => {
    if (!burtonInitialized) {
      setupBurtonScene();
      burtonInitialized = true;
    } else {
      // If already initialized, just restart animation
      animateBurtonScene();
    }
  });
}

function setupBurtonScene() {
  const container = document.querySelector('.burton-container');
  
  // Create scene
  burtonScene = new THREE.Scene();
  burtonScene.background = new THREE.Color(0x1a1a2e);
  burtonScene.fog = new THREE.FogExp2(0x1a1a2e, 0.002);
  
  // Set up camera
  burtonCamera = new THREE.PerspectiveCamera(
    75, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  burtonCamera.position.z = 5;
  
  // Set up renderer
  burtonRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  burtonRenderer.setSize(container.clientWidth, container.clientHeight);
  burtonRenderer.setPixelRatio(window.devicePixelRatio);
  burtonRenderer.shadowMap.enabled = true;
  
  // Add canvas to container
  const canvas = burtonRenderer.domElement;
  canvas.classList.add('gpu-accelerated');
  container.appendChild(canvas);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x6c5b7b, 0.5);
  burtonScene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xc06c84, 0.8);
  directionalLight.position.set(0, 10, 5);
  directionalLight.castShadow = true;
  burtonScene.add(directionalLight);
  
  const pointLight = new THREE.PointLight(0x8a2be2, 1, 100);
  pointLight.position.set(0, 3, 5);
  burtonScene.add(pointLight);
  
  // Add whimsical gothic elements
  createBurtonElements();
  
  // Add interactive AI tools cards
  createAIToolsCards();
  
  // Add HTML overlay with tool information
  addBurtonHTMLOverlay();
  
  // Handle resize
  window.addEventListener('resize', onBurtonResize);
  
  // Start animation
  burtonClock = new THREE.Clock();
  animateBurtonScene();
  
  // Remove loading spinner after everything is set up
  setTimeout(() => {
    const loadingContainer = document.querySelector('.burton-container .loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }, 1000);
}

function createBurtonElements() {
  // Create twisted spiraling trees
  for (let i = 0; i < 8; i++) {
    const geometry = new THREE.CylinderGeometry(0.05, 0.2, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x2f243a,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const tree = new THREE.Mesh(geometry, material);
    
    // Position trees in circular pattern
    const angle = (i / 8) * Math.PI * 2;
    const radius = 8;
    tree.position.x = Math.cos(angle) * radius;
    tree.position.z = Math.sin(angle) * radius;
    
    // Add twist to the trees
    tree.rotation.x = Math.random() * 0.2;
    tree.rotation.z = Math.random() * 0.2;
    
    burtonScene.add(tree);
    
    // Add branches to each tree
    const branchCount = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < branchCount; j++) {
      const branchGeometry = new THREE.CylinderGeometry(0.03, 0.05, 1.5, 5);
      const branchMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2f243a,
        roughness: 0.9
      });
      
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      
      // Position branch on tree
      branch.position.y = (j / branchCount) * 2 - 1;
      branch.rotation.x = Math.PI / 2;
      branch.rotation.z = Math.random() * Math.PI * 2;
      
      tree.add(branch);
    }
  }
  
  // Create moon
  const moonGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const moonMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xe0e0e0,
    transparent: true,
    opacity: 0.8
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(5, 8, -10);
  burtonScene.add(moon);
  
  // Create fog particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 1000;
  const posArray = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Position particles in a sphere
    const radius = 10 + Math.random() * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
    posArray[i + 1] = (Math.random() - 0.5) * 5;
    posArray[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0xaaaadd,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  burtonScene.add(particles);
}

function createAIToolsCards() {
  // Create floating cards for AI tools
  const tools = [
    {
      name: "Neural Image Creator",
      position: { x: -2, y: 0.5, z: -1 },
      rotation: { x: 0.1, y: -0.2, z: 0 },
      color: 0x8a76ab
    },
    {
      name: "Story Generator",
      position: { x: 0, y: 0, z: -2 },
      rotation: { x: 0, y: 0, z: 0.05 },
      color: 0x644a8c
    },
    {
      name: "Voice Synthesizer",
      position: { x: 2, y: -0.5, z: -1 },
      rotation: { x: -0.1, y: 0.2, z: 0 },
      color: 0x44355b
    }
  ];
  
  tools.forEach(tool => {
    // Create card geometry
    const cardGeometry = new THREE.BoxGeometry(1.5, 1, 0.05);
    const cardMaterial = new THREE.MeshStandardMaterial({
      color: tool.color,
      roughness: 0.5,
      metalness: 0.2
    });
    
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    card.position.set(tool.position.x, tool.position.y, tool.position.z);
    card.rotation.set(tool.rotation.x, tool.rotation.y, tool.rotation.z);
    card.castShadow = true;
    card.receiveShadow = true;
    card.userData = { toolName: tool.name };
    
    // Add glow effect
    const glowGeometry = new THREE.BoxGeometry(1.6, 1.1, 0.01);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: tool.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    card.add(glow);
    
    burtonScene.add(card);
  });
}

function addBurtonHTMLOverlay() {
  const container = document.querySelector('.burton-container');
  
  // Create HTML overlay for AI tools descriptions
  const overlay = document.createElement('div');
  overlay.className = 'burton-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.flexDirection = 'column';
  overlay.style.padding = '20px';
  
  // Add title
  const title = document.createElement('h2');
  title.className = 'burton-title';
  title.textContent = 'AI Tools Suite';
  title.style.marginBottom = '30px';
  title.style.position = 'relative';
  title.style.zIndex = '10';
  title.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';
  overlay.appendChild(title);
  
  // Add tool cards
  const toolsContainer = document.createElement('div');
  toolsContainer.style.display = 'flex';
  toolsContainer.style.flexWrap = 'wrap';
  toolsContainer.style.justifyContent = 'center';
  toolsContainer.style.gap = '20px';
  toolsContainer.style.maxWidth = '1000px';
  toolsContainer.style.pointerEvents = 'auto';
  
  const tools = [
    {
      name: 'Neural Image Creator',
      description: 'Generate stunning, surreal artwork with our neural network. Perfect for creating Tim Burton-inspired imagery.',
      icon: '🎨'
    },
    {
      name: 'Story Generator',
      description: 'Craft whimsical, gothic tales with AI assistance. Develop characters, plots, and settings in the style of your favorite dark fantasy.',
      icon: '📖'
    },
    {
      name: 'Voice Synthesizer',
      description: 'Transform text into eerie, atmospheric voices. Create narrations for your stories or voice-overs for animations.',
      icon: '🎙️'
    }
  ];
  
  tools.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'burton-card gpu-accelerated';
    card.style.width = '280px';
    card.style.margin = '10px';
    card.style.transform = 'translateZ(0)';
    
    const toolTitle = document.createElement('h3');
    toolTitle.className = 'burton-title';
    toolTitle.innerHTML = `${tool.icon} ${tool.name}`;
    
    const toolDesc = document.createElement('p');
    toolDesc.className = 'burton-text';
    toolDesc.textContent = tool.description;
    
    const toolButton = document.createElement('button');
    toolButton.className = 'burton-button';
    toolButton.textContent = 'Try Now';
    toolButton.setAttribute('aria-label', `Try ${tool.name}`);
    
    card.appendChild(toolTitle);
    card.appendChild(toolDesc);
    card.appendChild(toolButton);
    
    // Add hover and focus effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateZ(50px) rotateX(5deg)';
      card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.5)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateZ(0)';
      card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.6)';
    });
    
    toolsContainer.appendChild(card);
  });
  
  overlay.appendChild(toolsContainer);
  container.appendChild(overlay);
}

function animateBurtonScene() {
  burtonAnimationFrame = requestAnimationFrame(animateBurtonScene);
  
  // Get elapsed time
  const elapsedTime = burtonClock.getElapsedTime();
  
  // Animate camera movement
  burtonCamera.position.y = Math.sin(elapsedTime * 0.2) * 0.5;
  
  // Animate tree twists
  burtonScene.children.forEach((child, index) => {
    if (child.type === 'Mesh' && child.geometry.type === 'CylinderGeometry') {
      child.rotation.y = elapsedTime * 0.1 + index;
      child.position.y = Math.sin(elapsedTime * 0.2 + index) * 0.2;
    }
  });
  
  // Animate tool cards
  burtonScene.children.forEach(child => {
    if (child.userData && child.userData.toolName) {
      child.rotation.x = child.rotation.x + Math.sin(elapsedTime * 0.5) * 0.001;
      child.rotation.y = child.rotation.y + Math.sin(elapsedTime * 0.3) * 0.001;
      child.position.y += Math.sin(elapsedTime * 0.5 + child.position.x) * 0.002;
    }
  });
  
  // Render scene
  burtonRenderer.render(burtonScene, burtonCamera);
}

function onBurtonResize() {
  const container = document.querySelector('.burton-container');
  
  if (!container || !burtonCamera || !burtonRenderer) return;
  
  // Update camera aspect ratio
  burtonCamera.aspect = container.clientWidth / container.clientHeight;
  burtonCamera.updateProjectionMatrix();
  
  // Update renderer size
  burtonRenderer.setSize(container.clientWidth, container.clientHeight);
}

////////////////////////////////////////
// NICKELODEON UI - COMMUNITY TAB    //
////////////////////////////////////////

// Global variables for Nickelodeon UI
let nickScene, nickCamera, nickRenderer, nickClock;
let nickAnimationFrame = null;
let nickInitialized = false;

function initNickelodeonUI() {
  const container = document.getElementById('communityContent');
  
  // Show loading indicator
  container.innerHTML = `
    <div class="nickelodeon-container">
      <div class="loading-container">
        <div class="loading-spinner"></div>
      </div>
      <button class="return-button" aria-label="Return to main content">Return</button>
    </div>
  `;
  
  // Set up return button
  const returnButton = container.querySelector('.return-button');
  returnButton.addEventListener('click', () => {
    cancelAnimationFrame(nickAnimationFrame);
    document.getElementById('mainContent').style.display = 'block';
    container.style.display = 'none';
    document.getElementById('communityTab').classList.remove('active');
  });
  
  // Create Nickelodeon 3D scene when tab is first clicked
  document.getElementById('communityTab').addEventListener('click', () => {
    if (!nickInitialized) {
      setupNickScene();
      nickInitialized = true;
    } else {
      // If already initialized, just restart animation
      animateNickScene();
    }
  });
}

function setupNickScene() {
  const container = document.querySelector('.nickelodeon-container');
  
  // Create scene
  nickScene = new THREE.Scene();
  nickScene.background = new THREE.Color(0xff8c00);
  
  // Set up camera
  nickCamera = new THREE.PerspectiveCamera(
    75, 
    container.clientWidth / container.clientHeight, 
    0.1, 
    1000
  );
  nickCamera.position.z = 5;
  
  // Set up renderer
  nickRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  nickRenderer.setSize(container.clientWidth, container.clientHeight);
  nickRenderer.setPixelRatio(window.devicePixelRatio);
  
  // Add canvas to container
  const canvas = nickRenderer.domElement;
  canvas.classList.add('gpu-accelerated');
  container.appendChild(canvas);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  nickScene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 5);
  nickScene.add(directionalLight);
  
  // Add playful Nickelodeon-style elements
  createNickElements();
  
  // Add interactive community features
  createCommunityElements();
  
  // Add HTML overlay with community information
  addNickHTMLOverlay();
  
  // Handle resize
  window.addEventListener('resize', onNickResize);
  
  // Start animation
  nickClock = new THREE.Clock();
  animateNickScene();
  
  // Remove loading spinner after everything is set up
  setTimeout(() => {
    const loadingContainer = document.querySelector('.nickelodeon-container .loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
  }, 1000);
}

function createNickElements() {
  // Create colorful floating shapes
  const shapes = [
    { geometry: new THREE.TorusGeometry(1, 0.3, 16, 50), color: 0x4caf50 },
    { geometry: new THREE.IcosahedronGeometry(0.8, 0), color: 0x2196f3 },
    { geometry: new THREE.ConeGeometry(0.7, 1.5, 20), color: 0xff5722 },
    { geometry: new THREE.BoxGeometry(1, 1, 1), color: 0xffeb3b }
  ];
  
  for (let i = 0; i < 15; i++) {
    const shapeIndex = i % shapes.length;
    const shape = shapes[shapeIndex];
    
    const material = new THREE.MeshToonMaterial({ 
      color: shape.color,
      flatShading: true
    });
    
    const mesh = new THREE.Mesh(shape.geometry, material);
    
    // Position shapes randomly
    mesh.position.x = (Math.random() - 0.5) * 15;
    mesh.position.y = (Math.random() - 0.5) * 15;
    mesh.position.z = (Math.random() - 0.5) * 10 - 5;
    
    // Random rotation
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    // Store original position for animation
    mesh.userData.originalPosition = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    };
    
    // Random animation parameters
    mesh.userData.speed = 0.1 + Math.random() * 0.3;
    mesh.userData.wobbleAmount = 0.5 + Math.random() * 1.5;
    
    nickScene.add(mesh);
  }
  
  // Create colorful particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 500;
  const posArray = new Float32Array(particleCount * 3);
  const colorArray = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Position particles randomly
    posArray[i] = (Math.random() - 0.5) * 20;
    posArray[i + 1] = (Math.random() - 0.5) * 20;
    posArray[i + 2] = (Math.random() - 0.5) * 20 - 5;
    
    // Assign random colors
    colorArray[i] = Math.random();
    colorArray[i + 1] = Math.random();
    colorArray[i + 2] = Math.random();
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  nickScene.add(particles);
}

function createCommunityElements() {
  // Create floating speech bubbles
  const bubbleGeometry = new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  
  for (let i = 0; i < 5; i++) {
    const bubbleMaterial = new THREE.MeshToonMaterial({
      color: 0xffffff,
      flatShading: true,
      side: THREE.DoubleSide
    });
    
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    
    // Position bubbles in a circle
    const angle = (i / 5) * Math.PI * 2;
    const radius = 4;
    bubble.position.x = Math.cos(angle) * radius;
    bubble.position.y = Math.sin(angle) * radius;
    bubble.position.z = -2;
    
    // Rotate to face center
    bubble.lookAt(0, 0, 0);
    
    // Store original position for animation
    bubble.userData.originalPosition = {
      x: bubble.position.x,
      y: bubble.position.y,
      z: bubble.position.z
    };
    
    bubble.userData.speed = 0.2 + Math.random() * 0.3;
    
    nickScene.add(bubble);
  }
}

function addNickHTMLOverlay() {
  const container = document.querySelector('.nickelodeon-container');
  
  // Create HTML overlay for Community features
  const overlay = document.createElement('div');
  overlay.className = 'nickelodeon-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.flexDirection = 'column';
  overlay.style.padding = '20px';
  
  // Add colorful blobs as background
  const colors = ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];
  for (let i = 0; i < 5; i++) {
    const blob = document.createElement('div');
    blob.className = 'blob';
    blob.style.width = (80 + Math.random() * 120) + 'px';
    blob.style.height = (80 + Math.random() * 120) + 'px';
    blob.style.backgroundColor = colors[i % colors.length];
    blob.style.left = (Math.random() * 80) + '%';
    blob.style.top = (Math.random() * 80) + '%';
    blob.style.animationDelay = (Math.random() * 5) + 's';
    overlay.appendChild(blob);
  }
  
  // Add title
  const title = document.createElement('h2');
  title.className = 'nickelodeon-title';
  title.textContent = 'Join Our Community';
  title.style.marginBottom = '30px';
  title.style.position = 'relative';
  title.style.zIndex = '10';
  overlay.appendChild(title);
  
  // Add community cards
  const communityContainer = document.createElement('div');
  communityContainer.style.display = 'flex';
  communityContainer.style.flexWrap = 'wrap';
  communityContainer.style.justifyContent = 'center';
  communityContainer.style.gap = '20px';
  communityContainer.style.maxWidth = '1000px';
  communityContainer.style.pointerEvents = 'auto';
  
  const communityFeatures = [
    {
      name: 'AI Creator Hub',
      description: 'Connect with fellow AI enthusiasts, share your projects, and collaborate on exciting new ideas.',
      icon: '🤝'
    },
    {
      name: 'Learning Resources',
      description: 'Access tutorials, workshops, and guides created by our community members and AI experts.',
      icon: '📚'
    },
    {
      name: 'Events & Challenges',
      description: 'Participate in AI hackathons, creative challenges, and virtual meetups with the community.',
      icon: '🏆'
    }
  ];
  
  communityFeatures.forEach(feature => {
    const card = document.createElement('div');
    card.className = 'nickelodeon-card gpu-accelerated';
    card.style.width = '280px';
    card.style.margin = '10px';
    
    const featureTitle = document.createElement('h3');
    featureTitle.className = 'nickelodeon-title';
    featureTitle.innerHTML = `${feature.icon} ${feature.name}`;
    
    const featureDesc = document.createElement('p');
    featureDesc.className = 'nickelodeon-text';
    featureDesc.textContent = feature.description;
    
    const featureButton = document.createElement('button');
    featureButton.className = 'nickelodeon-button';
    featureButton.textContent = 'Join Now';
    featureButton.setAttribute('aria-label', `Join ${feature.name}`);
    
    card.appendChild(featureTitle);
    card.appendChild(featureDesc);
    card.appendChild(featureButton);
    
    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateZ(50px) rotate(2deg)';
      card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateZ(0)';
      card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
    });
    
    communityContainer.appendChild(card);
  });
  
  overlay.appendChild(communityContainer);
  container.appendChild(overlay);
}

function animateNickScene() {
  nickAnimationFrame = requestAnimationFrame(animateNickScene);
  
  // Get elapsed time
  const elapsedTime = nickClock.getElapsedTime();
  
  // Animate shapes
  nickScene.children.forEach(child => {
    if (child.type === 'Mesh' && child.userData.originalPosition) {
      // Wobble effect
      child.position.x = child.userData.originalPosition.x + Math.sin(elapsedTime * child.userData.speed) * child.userData.wobbleAmount;
      child.position.y = child.userData.originalPosition.y + Math.cos(elapsedTime * child.userData.speed) * child.userData.wobbleAmount;
      
      // Rotation
      child.rotation.x += 0.003;
      child.rotation.y += 0.005;
    }
  });
  
  // Animate particles
  const particles = nickScene.children.find(child => child.type === 'Points');
  if (particles) {
    particles.rotation.y = elapsedTime * 0.05;
  }
  
  // Slowly rotate camera
  nickCamera.position.x = Math.sin(elapsedTime * 0.1) * 2;
  nickCamera.position.y = Math.cos(elapsedTime * 0.1) * 1;
  nickCamera.lookAt(0, 0, -3);
  
  // Render scene
  nickRenderer.render(nickScene, nickCamera);
}

function onNickResize() {
  const container = document.querySelector('.nickelodeon-container');
  
  if (!container || !nickCamera || !nickRenderer) return;
  
  // Update camera aspect ratio
  nickCamera.aspect = container.clientWidth / container.clientHeight;
  nickCamera.updateProjectionMatrix();
  
  // Update renderer size
  nickRenderer.setSize(container.clientWidth, container.clientHeight);
}

// Add a performance monitoring function to automatically adjust quality if FPS drops
function monitorPerformance() {
  let lastTime = 0;
  let frames = 0;
  let fps = 60;
  
  function checkFPS(timestamp) {
    frames++;
    
    if (timestamp - lastTime >= 1000) {
      fps = frames;
      frames = 0;
      lastTime = timestamp;
      
      // If FPS drops too low, reduce quality
      if (fps < 30) {
        reduceQuality();
      }
    }
    
    requestAnimationFrame(checkFPS);
  }
  
  requestAnimationFrame(checkFPS);
}

function reduceQuality() {
  // Reduce quality in both scenes if they exist
  if (burtonRenderer) {
    burtonRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
  }
  
  if (nickRenderer) {
    nickRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
  }
}

// Start performance monitoring
monitorPerformance();
