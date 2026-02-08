/**
 * ═══════════════════════════════════════════════════════════════
 * Playground - Framed Nature Experience
 * Interactive nature viewer with firefly cursor and media transitions
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────
// Ensure custom cursor re-applies on refresh/tab focus
// ─────────────────────────────────────────────────────
(function ensureCursorPaints() {
  const root = document.documentElement;
  function refreshCursor() {
    root.classList.remove('force-cursor');
    void root.offsetHeight; // force style recalc / repaint
    root.classList.add('force-cursor');
  }
  root.classList.add('force-cursor');
  window.addEventListener('pageshow', refreshCursor);
  window.addEventListener('focus', refreshCursor);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCursor();
  });
})();

// ─────────────────────────────────────────────────────
// Entrance overlay - auto fade after 4 seconds
// ─────────────────────────────────────────────────────
const entranceOverlay = document.getElementById('entranceOverlay');
const bounceChevron = document.querySelector('.bounce-chevron');
let entranceComplete = false;

setTimeout(() => {
  entranceOverlay.classList.add('hidden');
  // Mark entrance as complete after fade transition
  setTimeout(() => {
    entranceComplete = true;
  }, 1000); // Wait for 1s fade transition to complete
}, 4000);

// ─────────────────────────────────────────────────────
// Media switching setup (videos and images)
// ─────────────────────────────────────────────────────
const mediaItems = [
  { type: 'video', src: 'assets/2026/nature/1.MOV' },
  { type: 'video', src: 'assets/2026/nature/2.MOV' },
  { type: 'video', src: 'assets/2026/nature/3.MOV' },
  { type: 'video', src: 'assets/2026/nature/4.MOV' },
  { type: 'video', src: 'assets/2026/nature/5.MOV' },
  { type: 'video', src: 'assets/2026/nature/6.MOV' },
  { type: 'video', src: 'assets/2026/nature/7.MOV' },
  { type: 'video', src: 'assets/2026/nature/8.MOV' },
  { type: 'video', src: 'assets/2026/nature/9.MOV' },
  { type: 'video', src: 'assets/2026/nature/10.MOV' },
  { type: 'video', src: 'assets/2026/nature/11.MOV' },
  { type: 'video', src: 'assets/2026/nature/12.MOV' },
  { type: 'video', src: 'assets/2026/nature/13.MOV' },
  { type: 'video', src: 'assets/2026/nature/14.MOV' },
  { type: 'video', src: 'assets/2026/nature/15.MOV' },
  { type: 'video', src: 'assets/2026/nature/16.MOV' }
];

// Color palettes for each video
const colorPalettes = [
  {
    center: '#202F08',
    edge: '#121A02',
    vignette: 'rgba(18, 26, 2, 0.75)'
  },
  {
    center: '#486893',
    edge: '#0A182B',
    vignette: 'rgba(10, 24, 43, 0.75)'
  },
  {
    center: '#5E6764',
    edge: '#081901',
    vignette: 'rgba(8, 25, 1, 0.75)'
  },
  {
    center: '#4B5505',
    edge: '#171E01',
    vignette: 'rgba(23, 30, 1, 0.75)'
  },
  {
    center: '#223859',
    edge: '#100B00',
    vignette: 'rgba(16, 11, 0, 0.75)'
  },
  {
    center: '#23484E',
    edge: '#041312',
    vignette: 'rgba(4, 19, 18, 0.75)'
  },
  {
    center: '#44522B',
    edge: '#141D02',
    vignette: 'rgba(20, 29, 2, 0.75)'
  },
  {
    center: '#3F3233',
    edge: '#030303',
    vignette: 'rgba(3, 3, 3, 0.75)'
  },
  {
    center: '#4D7196',
    edge: '#21354B',
    vignette: 'rgba(33, 53, 75, 0.75)'
  },
  {
    center: '#494953',
    edge: '#100F0C',
    vignette: 'rgba(16, 15, 12, 0.75)'
  },
  {
    center: '#5C4735',
    edge: '#120D08',
    vignette: 'rgba(18, 13, 8, 0.75)'
  },
  {
    center: '#2E3C57',
    edge: '#010413',
    vignette: 'rgba(1, 4, 19, 0.75)'
  },
  {
    center: '#1F456C',
    edge: '#07121D',
    vignette: 'rgba(7, 18, 29, 0.75)'
  },
  {
    center: '#514643',
    edge: '#191413',
    vignette: 'rgba(25, 20, 19, 0.75)'
  },
  {
    center: '#765D4E',
    edge: '#0C1217',
    vignette: 'rgba(12, 18, 23, 0.75)'
  },
  {
    center: '#549DF2',
    edge: '#021021',
    vignette: 'rgba(2, 16, 33, 0.75)'
  }
];

const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
const image1 = document.getElementById('image1');
let currentMediaIndex = 0;
let isTransitioning = false;
let activeElement = video1;
let inactiveVideo = video2;

// Function to update background colors
function updateBackgroundColors(index) {
  const palette = colorPalettes[index];
  const root = document.documentElement;
  root.style.setProperty('--bg-center', palette.center);
  root.style.setProperty('--bg-edge', palette.edge);
  root.style.setProperty('--vignette', palette.vignette);
}

// ─────────────────────────────────────────────────────
// Scroll handling with smooth transitions
// ─────────────────────────────────────────────────────
let scrollCooldown = false;
const cooldownTime = 2000; // 1 second between transitions

function switchToNextVideo() {
  if (isTransitioning || scrollCooldown) return;
  
  isTransitioning = true;
  scrollCooldown = true;

  // Determine next media index
  const nextIndex = (currentMediaIndex + 1) % mediaItems.length;
  const nextMedia = mediaItems[nextIndex];
  
  // Update background colors
  updateBackgroundColors(nextIndex);
  
  let nextElement;
  
  // Prepare the next media element
  if (nextMedia.type === 'image') {
    nextElement = image1;
    nextElement.src = nextMedia.src;
  } else {
    // Use the inactive video element
    nextElement = inactiveVideo;
    nextElement.src = nextMedia.src;
    nextElement.currentTime = 0;
    nextElement.play();
  }

  // Start crossfade animation
  setTimeout(() => {
    activeElement.classList.remove('active');
    activeElement.classList.add('inactive');
    nextElement.classList.remove('inactive');
    nextElement.classList.add('active');

    // Update references
    if (nextMedia.type === 'video') {
      // If we're switching to a video, swap the inactive video reference
      if (activeElement === video1 || activeElement === video2) {
        const temp = activeElement;
        inactiveVideo = temp;
      } else {
        // Previous was an image, so inactiveVideo stays the same
      }
    }
    
    activeElement = nextElement;
    currentMediaIndex = nextIndex;
    
    // End transition after animation completes
    setTimeout(() => {
      isTransitioning = false;
    }, 800); // Match the CSS transition duration
  }, 50);

  // Reset cooldown
  setTimeout(() => {
    scrollCooldown = false;
  }, cooldownTime);
}

function switchToPrevVideo() {
  if (isTransitioning || scrollCooldown) return;
  
  isTransitioning = true;
  scrollCooldown = true;

  // Determine previous media index
  const prevIndex = (currentMediaIndex - 1 + mediaItems.length) % mediaItems.length;
  const prevMedia = mediaItems[prevIndex];
  
  // Update background colors
  updateBackgroundColors(prevIndex);
  
  let prevElement;
  
  // Prepare the previous media element
  if (prevMedia.type === 'image') {
    prevElement = image1;
    prevElement.src = prevMedia.src;
  } else {
    // Use the inactive video element
    prevElement = inactiveVideo;
    prevElement.src = prevMedia.src;
    prevElement.currentTime = 0;
    prevElement.play();
  }

  // Start crossfade animation
  setTimeout(() => {
    activeElement.classList.remove('active');
    activeElement.classList.add('inactive');
    prevElement.classList.remove('inactive');
    prevElement.classList.add('active');

    // Update references
    if (prevMedia.type === 'video') {
      // If we're switching to a video, swap the inactive video reference
      if (activeElement === video1 || activeElement === video2) {
        const temp = activeElement;
        inactiveVideo = temp;
      }
    }
    
    activeElement = prevElement;
    currentMediaIndex = prevIndex;
    
    // End transition after animation completes
    setTimeout(() => {
      isTransitioning = false;
    }, 800); // Match the CSS transition duration
  }, 50);

  // Reset cooldown
  setTimeout(() => {
    scrollCooldown = false;
  }, cooldownTime);
}

// Listen for wheel events (mouse scroll)
let scrollAccumulator = 0;
const scrollThreshold = 100; // Pixels needed to trigger transition

window.addEventListener('wheel', (e) => {
  // Hide chevron on first scroll
  if (bounceChevron && !bounceChevron.classList.contains('hidden')) {
    bounceChevron.classList.add('hidden');
  }

  if (isTransitioning || scrollCooldown) return;

  scrollAccumulator += e.deltaY;

  if (Math.abs(scrollAccumulator) >= scrollThreshold) {
    if (scrollAccumulator > 0) {
      // Scrolling down - next video
      switchToNextVideo();
    } else {
      // Scrolling up - previous video
      switchToPrevVideo();
    }
    scrollAccumulator = 0;
  }
}, { passive: true });

// ─────────────────────────────────────────────────────
// Audio control setup with auto-play and fade-in
// ─────────────────────────────────────────────────────
const audio = document.getElementById('bgMusic');
const audioControl = document.getElementById('audioControl');
let isPlaying = false;
let audioStarted = false;

// Start with volume at 0, will fade in later
audio.volume = 0;

// Start audio immediately (user clicked to get here, so autoplay is allowed)
audio.play().then(() => {
  isPlaying = true;
  audioStarted = true;
  
  // After 4 seconds (when entrance starts fading), fade in the volume
  setTimeout(() => {
    fadeInAudio();
  }, 4000);
}).catch(err => {
  console.log('Audio autoplay failed:', err);
  // Fallback: try on user interaction
  document.body.addEventListener('click', () => {
    if (!audioStarted) {
      audio.play().then(() => {
        isPlaying = true;
        audioStarted = true;
        fadeInAudio();
      });
    }
  }, { once: true });
});

// Fade in audio volume from 0 to 0.25 over 1 second
function fadeInAudio() {
  const targetVolume = 0.25;
  const fadeInDuration = 1000; // 1 second
  const steps = 50;
  const volumeStep = targetVolume / steps;
  const timeStep = fadeInDuration / steps;
  
  let currentStep = 0;
  const fadeInterval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(volumeStep * currentStep, targetVolume);
    
    if (currentStep >= steps) {
      clearInterval(fadeInterval);
      audio.volume = targetVolume;
      audioControl.classList.remove('muted');
    }
  }, timeStep);
}

// Toggle audio on button click
audioControl.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent triggering the body click listener
  if (isPlaying) {
    audio.pause();
    audioControl.classList.add('muted');
    isPlaying = false;
  } else {
    // Restore volume if it was muted
    if (audio.volume === 0) {
      audio.volume = 0.25;
    }
    audio.play().then(() => {
      audioControl.classList.remove('muted');
      isPlaying = true;
      audioStarted = true;
    }).catch(err => {
      console.error('Error playing audio:', err);
    });
  }
});

// Handle when audio actually starts playing
audio.addEventListener('play', () => {
  isPlaying = true;
  // Only show as unmuted if volume is audible
  if (audio.volume > 0.05) {
    audioControl.classList.remove('muted');
  }
});

// Handle when audio is paused
audio.addEventListener('pause', () => {
  audioControl.classList.add('muted');
  isPlaying = false;
});

// ─────────────────────────────────────────────────────
// Cursor proximity and idle state management
// ─────────────────────────────────────────────────────
const frame = document.querySelector('.frame');
const cursorGlowOverlay = document.getElementById('cursorGlowOverlay');
const idleDarkenOverlay = document.getElementById('idleDarkenOverlay');
const fireflyCanvas = document.getElementById('fireflyTrailCanvas');

// State tracking
let lastMouseX = 0;
let lastMouseY = 0;
let lastMoveTime = performance.now();
let lastInteractionTime = performance.now();
let isIdle = false;
let idleTimeout = null;
let volumeBreathingInterval = null;
let volumeBreathingPhase = 0;
const baseVolume = 0.45;
const idleThreshold = 5000; // 5 seconds
const proximityThreshold = 150; // pixels from frame edge

// Check if cursor is near the frame
function isCursorNearFrame(x, y) {
  if (!frame) return false;
  const rect = frame.getBoundingClientRect();
  const expandedRect = {
    left: rect.left - proximityThreshold,
    right: rect.right + proximityThreshold,
    top: rect.top - proximityThreshold,
    bottom: rect.bottom + proximityThreshold
  };
  return x >= expandedRect.left && x <= expandedRect.right &&
         y >= expandedRect.top && y <= expandedRect.bottom;
}

// Update cursor glow position
function updateCursorGlow(x, y) {
  if (cursorGlowOverlay) {
    cursorGlowOverlay.style.left = x + 'px';
    cursorGlowOverlay.style.top = y + 'px';
  }
}

// Enter idle state
function enterIdleState() {
  if (isIdle) return;
  isIdle = true;
  
  // Dim firefly trail
  if (fireflyCanvas) {
    fireflyCanvas.classList.add('idle-dim');
  }
  
  // Dim cursor itself
  document.documentElement.classList.add('cursor-idle');
  
  // Dim cursor glow overlay
  if (cursorGlowOverlay) {
    cursorGlowOverlay.classList.add('idle-dim');
  }
  
  // Darken background
  if (idleDarkenOverlay) {
    idleDarkenOverlay.classList.add('active');
  }
  
  // Start volume breathing
  startVolumeBreathing();
}

// Exit idle state
function exitIdleState() {
  if (!isIdle) return;
  isIdle = false;
  
  // Restore firefly trail
  if (fireflyCanvas) {
    fireflyCanvas.classList.remove('idle-dim');
  }
  
  // Restore cursor itself
  document.documentElement.classList.remove('cursor-idle');
  
  // Restore cursor glow overlay
  if (cursorGlowOverlay) {
    cursorGlowOverlay.classList.remove('idle-dim');
  }
  
  // Restore background
  if (idleDarkenOverlay) {
    idleDarkenOverlay.classList.remove('active');
  }
  
  // Stop volume breathing and restore volume
  stopVolumeBreathing();
}

// Volume breathing effect (±10% over ~10 seconds)
function startVolumeBreathing() {
  if (volumeBreathingInterval) return;
  
  volumeBreathingPhase = 0;
  const breathCycleDuration = 10000; // 10 seconds full cycle
  const updateInterval = 50; // Update every 50ms
  const steps = breathCycleDuration / updateInterval;
  const phaseIncrement = (Math.PI * 2) / steps;
  
  volumeBreathingInterval = setInterval(() => {
    if (!isPlaying || !isIdle) return;
    
    volumeBreathingPhase += phaseIncrement;
    // Oscillate between -10% and +10% (0.9 to 1.1 of base volume)
    const breathFactor = 1 + (Math.sin(volumeBreathingPhase) * 0.1);
    const targetVolume = Math.max(0, Math.min(1, baseVolume * breathFactor));
    
    // Smooth transition
    audio.volume += (targetVolume - audio.volume) * 0.1;
  }, updateInterval);
}

function stopVolumeBreathing() {
  if (volumeBreathingInterval) {
    clearInterval(volumeBreathingInterval);
    volumeBreathingInterval = null;
  }
  
  // Quickly restore to base volume
  if (isPlaying && audio.volume !== baseVolume) {
    const restoreInterval = setInterval(() => {
      const diff = baseVolume - audio.volume;
      if (Math.abs(diff) < 0.005) {
        audio.volume = baseVolume;
        clearInterval(restoreInterval);
      } else {
        audio.volume += diff * 0.4; // Faster restoration (was 0.15)
      }
    }, 30); // More frequent updates (was 50ms)
  }
}

// Reset idle timer on any interaction
function resetIdleTimer() {
  lastInteractionTime = performance.now();
  
  // Exit idle state if we were idle
  exitIdleState();
  
  // Reset idle timeout
  if (idleTimeout) {
    clearTimeout(idleTimeout);
  }
  idleTimeout = setTimeout(() => {
    enterIdleState();
  }, idleThreshold);
}

// Handle mouse movement for proximity and idle detection
function handleMouseMove(e) {
  const x = e.clientX;
  const y = e.clientY;
  
  // Update cursor glow position
  updateCursorGlow(x, y);
  
  // Check proximity to frame
  const nearFrame = isCursorNearFrame(x, y);
  if (nearFrame) {
    frame.classList.add('cursor-near');
    cursorGlowOverlay.classList.add('near-frame');
  } else {
    frame.classList.remove('cursor-near');
    cursorGlowOverlay.classList.remove('near-frame');
  }
  
  // Track movement for idle detection
  const moved = Math.abs(x - lastMouseX) > 2 || Math.abs(y - lastMouseY) > 2;
  if (moved) {
    lastMouseX = x;
    lastMouseY = y;
    lastMoveTime = performance.now();
    resetIdleTimer();
  }
}

// Handle scroll for idle detection
function handleScroll(e) {
  resetIdleTimer();
}

// Initialize event listeners (after entrance is complete)
function initCursorEffects() {
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('wheel', handleScroll, { passive: true });
  
  // Set initial idle timeout
  idleTimeout = setTimeout(() => {
    enterIdleState();
  }, idleThreshold);
}

// Start cursor effects after entrance overlay fades
setTimeout(() => {
  initCursorEffects();
}, 5000); // After entrance (4s) + fade (1s)

// ─────────────────────────────────────────────────────
// Firefly trail effect
// ─────────────────────────────────────────────────────
(function initFireflyTrail() {
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const canvas = document.getElementById('fireflyTrailCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    mouse: { x: 0, y: 0, active: false, lastMoveAt: 0 },
    trail: [],
    raf: 0,
    lastT: 0
  };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    state.dpr = dpr;
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    canvas.width = Math.floor(state.w * dpr);
    canvas.height = Math.floor(state.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointerMove(e) {
    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.mouse.active = true;
    state.mouse.lastMoveAt = performance.now();
  }

  function draw(t) {
    const dt = state.lastT ? Math.min(0.05, (t - state.lastT) / 1000) : 0.016;
    state.lastT = t;

    ctx.clearRect(0, 0, state.w, state.h);

    if (state.mouse.active) {
      const sinceMove = t - state.mouse.lastMoveAt;
      const isMoving = sinceMove < 150;

      // Add new trail points when moving
      if (isMoving && state.trail.length === 0 || 
          (isMoving && state.trail.length > 0)) {
        const lastPoint = state.trail[state.trail.length - 1];
        const dist = lastPoint 
          ? Math.hypot(state.mouse.x - lastPoint.x, state.mouse.y - lastPoint.y)
          : 999;
        
        if (dist > 3) {
          state.trail.push({
            x: state.mouse.x,
            y: state.mouse.y,
            t: t,
            size: 2 + Math.random() * 1.5
          });
        }
      }

      // Remove old trail points (fade after 400ms)
      const cutoff = t - 400;
      while (state.trail.length && state.trail[0].t < cutoff) {
        state.trail.shift();
      }

      // Draw trail
      if (state.trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < state.trail.length; i++) {
          const point = state.trail[i];
          const age = (t - point.t) / 400; // 0 to 1
          const alpha = (1 - age) * 0.10; // Very subtle: max 0.25 opacity
          const size = point.size * (1 - age * 0.5);

          // Warm amber/golden glow
          const gradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, size * 3
          );
          gradient.addColorStop(0, `rgba(255, 240, 180, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(255, 200, 100, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(200, 150, 50, 0)`);

          ctx.beginPath();
          ctx.arc(point.x, point.y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.restore();
      }
    }

    state.raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  state.raf = requestAnimationFrame(draw);
})();
