(() => {
  const COPY = {
    sunrise: "Good morning. Catch the first light.",
    sunset: "Goodnight. Let the body rest.",
    love: "I love Oura.",
    dragHint: "Drag to move through the day"
  };

  /* Sunrise (0) → noon (0.5) → sunset (1); no midnight at the drag edges */
  const SKY_STOPS = [
    { t: 0, top: [72, 48, 88], mid: [140, 72, 100], bottom: [200, 120, 90] },
    { t: 0.12, top: [120, 100, 140], mid: [200, 160, 120], bottom: [240, 200, 160] },
    { t: 0.28, top: [100, 140, 180], mid: [140, 170, 200], bottom: [180, 200, 220] },
    { t: 0.5, top: [110, 150, 190], mid: [150, 175, 205], bottom: [185, 205, 225] },
    { t: 0.72, top: [140, 90, 110], mid: [200, 110, 85], bottom: [235, 145, 95] },
    { t: 0.88, top: [60, 40, 80], mid: [100, 50, 70], bottom: [140, 70, 90] },
    { t: 1, top: [40, 32, 72], mid: [72, 48, 88], bottom: [110, 65, 95] }
  ];

  const HALO_STOPS = [
    { loc: 0, alpha: 1 },
    { loc: 0.25, alpha: 0.65 },
    { loc: 0.5, alpha: 0.24 },
    { loc: 0.75, alpha: 0.045 },
    { loc: 1, alpha: 0 }
  ];

  const EDGE_COPY_BAND_MIN_H = 1.25;
  const EDGE_COPY_BAND_FRAC = 0.12;
  const DRAG_TRAVEL_FRAC = 0.52;
  const LOVE_WINDOW_MIN = 18;
  const DRAG_THRESHOLD_PX = 8;
  const INTRO_HINT_HOLD_MS = 3500;
  const INTRO_HINT_FADE_MS = 1000;
  const ENTRANCE_MS = 4000;
  const HEART_COOLDOWN_MS = 1500;
  const HEART_COUNT = 12;
  const HEART_EMIT_MS = 900;
  const HEART_GLYPH = "♥";
  const LOVE_TEXT_MS = 2800;
  const RING_TAP_SOUND_SRC = "assets/2026/sfx/for-oura/wind-chimes-single-04.wav";
  const RING_TAP_VOLUME = 0.14;

  const elements = {
    sky: document.getElementById("sky"),
    stars: document.getElementById("stars"),
    ringCanvas: document.getElementById("ringCanvas"),
    ringWrap: document.getElementById("ringWrap"),
    dayline: document.getElementById("dayline"),
    heartBurstLayer: document.getElementById("heartBurstLayer"),
    fxLayer: document.getElementById("fxLayer"),
    entranceOverlay: document.getElementById("entranceOverlay"),
    timeSlider: document.getElementById("timeSlider")
  };

  if (!elements.sky || !elements.ringCanvas) return;

  const ctx = elements.ringCanvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ringTapAudio = null;

  const state = {
    hour: 12,
    lat: 37.7749,
    sunriseH: 6,
    sunsetH: 19,
    dragging: false,
    dragActive: false,
    dragStartX: 0,
    dragStartHour: 12,
    introActive: false,
    introDone: false,
    loveTextShown: false,
    loveTextTimeout: null,
    lastHeartBurstAt: 0,
    tapGlowUntil: 0,
    dragRafId: 0,
    pendingHour: null
  };

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function lerpRgb(a, b, u) {
    return [
      Math.round(lerp(a[0], b[0], u)),
      Math.round(lerp(a[1], b[1], u)),
      Math.round(lerp(a[2], b[2], u))
    ];
  }

  function rgbCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function daySpan() {
    return Math.max(state.sunsetH - state.sunriseH, 1);
  }

  function edgeCopyBandH() {
    return Math.max(EDGE_COPY_BAND_MIN_H, daySpan() * EDGE_COPY_BAND_FRAC);
  }

  function dragTravelPx() {
    return Math.max(window.innerWidth * DRAG_TRAVEL_FRAC, 240);
  }

  function solarMidHour() {
    return (state.sunriseH + state.sunsetH) / 2;
  }

  function normalizedWithinRange(hour, start, end) {
    return clamp((hour - start) / (end - start), 0, 1);
  }

  function hourToSkyFraction(hour) {
    return normalizedWithinRange(hour, state.sunriseH, state.sunsetH);
  }

  function interpolateSky(t) {
    const x = clamp(t, 0, 1);
    let i = 0;
    while (i < SKY_STOPS.length - 1 && SKY_STOPS[i + 1].t <= x) i += 1;
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[Math.min(i + 1, SKY_STOPS.length - 1)];
    const span = b.t - a.t || 1;
    const u = clamp((x - a.t) / span, 0, 1);
    return {
      top: lerpRgb(a.top, b.top, u),
      mid: lerpRgb(a.mid, b.mid, u),
      bottom: lerpRgb(a.bottom, b.bottom, u)
    };
  }

  function dayOfYear(date) {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((now - start) / 86400000);
  }

  function updateSunTimes() {
    const date = new Date();
    const doy = dayOfYear(date);
    const seasonal = Math.sin(((doy - 172) * 2 * Math.PI) / 365) * 1.2;
    const latAdjust = (state.lat - 40) * 0.04;
    state.sunriseH = clamp(6.2 - seasonal - latAdjust, 4.5, 8.5);
    state.sunsetH = clamp(18.8 + seasonal - latAdjust, 16, 21.5);
    if (state.sunsetH <= state.sunriseH + 2) {
      state.sunsetH = state.sunriseH + 10;
    }
  }

  function currentLocalHour() {
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  function initialHour() {
    return clamp(currentLocalHour(), state.sunriseH, state.sunsetH);
  }

  function minutesFromMidnight(hours) {
    return hours * 60;
  }

  function isNearHour(hour, targetHour, windowMin) {
    const diff = Math.abs(minutesFromMidnight(hour) - minutesFromMidnight(targetHour));
    return diff <= windowMin;
  }

  function copyForTime(hour) {
    const band = edgeCopyBandH();
    if (hour - state.sunriseH <= band) return COPY.sunrise;
    if (state.sunsetH - hour <= band) return COPY.sunset;
    return "";
  }

  function setDaylineMode({ text, visible, hint = false, love = false, fading = false }) {
    if (!elements.dayline) return;
    elements.dayline.textContent = text;
    elements.dayline.classList.toggle("is-visible", visible);
    elements.dayline.classList.toggle("is-hint", hint);
    elements.dayline.classList.toggle("is-love", love);
    elements.dayline.classList.toggle("is-fading", fading);
  }

  function showDayline(text, { hint = false, love = false } = {}) {
    if (state.loveTextTimeout) {
      clearTimeout(state.loveTextTimeout);
      state.loveTextTimeout = null;
    }
    setDaylineMode({ text, visible: Boolean(text), hint, love, fading: false });
  }

  function refreshDayline() {
    if (state.introActive || state.loveTextTimeout) return;
    if (!state.introDone) return;
    const text = copyForTime(state.hour);
    showDayline(text, { hint: false, love: false });
  }

  function finishIntro() {
    state.introActive = false;
    state.introDone = true;
    setDaylineMode({ text: "", visible: false, hint: false, fading: false });
    refreshDayline();
  }

  function startIntroHint() {
    if (state.introDone) return;
    state.introActive = true;
    showDayline(COPY.dragHint, { hint: true });

    setTimeout(() => {
      if (!state.introActive) return;
      setDaylineMode({
        text: COPY.dragHint,
        visible: true,
        hint: true,
        fading: true
      });
      setTimeout(finishIntro, INTRO_HINT_FADE_MS);
    }, INTRO_HINT_HOLD_MS);
  }

  function ensureRingTapAudio() {
    if (!ringTapAudio) {
      ringTapAudio = new Audio(RING_TAP_SOUND_SRC);
      ringTapAudio.preload = "auto";
      ringTapAudio.volume = RING_TAP_VOLUME;
    }
    return ringTapAudio;
  }

  function playRingTapSound() {
    try {
      const audio = ensureRingTapAudio();
      audio.currentTime = 0;
      void audio.play();
    } catch {
      /* ignore */
    }
  }

  const RING_TAP_GLOW_MS = 1400;

  function pulseRing() {
    if (!elements.ringWrap || reducedMotion) return;
    elements.ringWrap.classList.add("is-pulse");
    setTimeout(() => {
      elements.ringWrap?.classList.remove("is-pulse");
    }, 320);
  }

  function pulseRingTap() {
    if (!elements.ringWrap) return;
    if (reducedMotion) {
      pulseRing();
      return;
    }
    elements.ringWrap.classList.remove("is-tap-pulse");
    void elements.ringWrap.offsetWidth;
    elements.ringWrap.classList.add("is-tap-pulse");
    const clear = () => elements.ringWrap?.classList.remove("is-tap-pulse");
    elements.ringWrap.addEventListener("animationend", clear, { once: true });
    setTimeout(clear, 1200);
  }

  function createHeartParticle() {
    if (!elements.ringWrap || !elements.heartBurstLayer) return;
    const rect = elements.ringWrap.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const particle = document.createElement("span");
    particle.className = "heart-burst";
    particle.textContent = HEART_GLYPH;

    const size = 12 + Math.random() * 10;
    const rise = 90 + Math.random() * 70;
    const sway = (Math.random() - 0.5) * 90;
    const rot = (Math.random() - 0.5) * 40;
    const life = 1.6 + Math.random() * 0.6;
    const peakOpacity = 0.55 + Math.random() * 0.35;
    const jitterX = (Math.random() - 0.5) * 14;
    const jitterY = (Math.random() - 0.5) * 8;

    particle.style.left = `${originX - size / 2 + jitterX}px`;
    particle.style.top = `${originY - size / 2 + jitterY}px`;
    particle.style.fontSize = `${size}px`;
    particle.style.setProperty("--rise", `${rise}px`);
    particle.style.setProperty("--sway", `${sway}px`);
    particle.style.setProperty("--rot", `${rot}deg`);
    particle.style.setProperty("--life", `${life}s`);
    particle.style.setProperty("--peak-opacity", peakOpacity.toFixed(2));

    elements.heartBurstLayer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }

  function spawnHeartBurst() {
    const now = performance.now();
    if (now - state.lastHeartBurstAt < HEART_COOLDOWN_MS) return;
    state.lastHeartBurstAt = now;
    pulseRing();

    if (reducedMotion) return;

    for (let i = 0; i < HEART_COUNT; i++) {
      const baseDelay = (i / HEART_COUNT) * HEART_EMIT_MS;
      const jitter = Math.random() * 60;
      setTimeout(createHeartParticle, baseDelay + jitter);
    }
  }

  function mountFx(el) {
    if (!elements.fxLayer) return;
    elements.fxLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }

  function spawnWarmBloom(x, y) {
    if (reducedMotion || !elements.fxLayer) return;
    const bloom = document.createElement("span");
    bloom.className = "sky-bloom-warm";
    bloom.style.left = `${x}px`;
    bloom.style.top = `${y}px`;
    mountFx(bloom);
  }

  function spawnRingTapBloom() {
    if (reducedMotion || !elements.fxLayer || !elements.ringWrap) return;
    const rect = elements.ringWrap.getBoundingClientRect();
    const bloom = document.createElement("span");
    bloom.className = "ring-tap-bloom";
    bloom.style.left = `${rect.left + rect.width / 2}px`;
    bloom.style.top = `${rect.top + rect.height / 2}px`;
    mountFx(bloom);
  }

  function triggerRingGlow() {
    playRingTapSound();
    pulseRingTap();
    spawnRingTapBloom();
    if (reducedMotion) return;
    state.tapGlowUntil = performance.now() + RING_TAP_GLOW_MS;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        /* ignore */
      }
    }
  }

  function tapGlowBoost() {
    if (!state.tapGlowUntil) return 0;
    const left = state.tapGlowUntil - performance.now();
    if (left <= 0) {
      state.tapGlowUntil = 0;
      return 0;
    }
    const t = left / RING_TAP_GLOW_MS;
    // Quick rise, slower fade — reads clearly on tap.
    return t < 0.2 ? t / 0.2 : t * t;
  }

  function isPointOnRing(x, y) {
    if (!elements.ringWrap) return false;
    const rect = elements.ringWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Ring core renders at ~0.2 of canvas; use a forgiving tap radius.
    const hitR = rect.width * 0.28;
    return Math.hypot(x - cx, y - cy) <= hitR;
  }

  function handleTap(x, y) {
    if (isPointOnRing(x, y)) {
      triggerRingGlow();
    } else {
      spawnWarmBloom(x, y);
    }
  }

  function showLoveTextOnce() {
    if (state.loveTextShown) return;
    state.loveTextShown = true;
    if (state.introActive) {
      finishIntro();
    }
    showDayline(COPY.love, { love: true });
    state.loveTextTimeout = setTimeout(() => {
      state.loveTextTimeout = null;
      refreshDayline();
    }, LOVE_TEXT_MS);
  }

  function triggerSolarMidMoment() {
    const mid = solarMidHour();
    if (!isNearHour(state.hour, mid, LOVE_WINDOW_MIN)) return;
    spawnHeartBurst();
    showLoveTextOnce();
  }

  function crossedSolarMid(prev, next) {
    const mid = solarMidHour();
    return (prev < mid && next >= mid) || (prev > mid && next <= mid);
  }

  function applySky() {
    const hour = state.hour;
    const progress = hourToSkyFraction(hour);
    const colors = interpolateSky(progress);
    elements.sky.style.setProperty("--sky-top", rgbCss(colors.top));
    elements.sky.style.setProperty("--sky-mid", rgbCss(colors.mid));
    elements.sky.style.setProperty("--sky-bottom", rgbCss(colors.bottom));

    const ringX = 12 + progress * 76;
    const ringY = 72 - Math.sin(progress * Math.PI) * 52;
    elements.ringWrap.style.left = `${ringX}%`;
    elements.ringWrap.style.top = `${ringY}%`;

    const horizonBoost =
      Math.max(
        0,
        1 -
          Math.min(Math.abs(hour - state.sunriseH), Math.abs(hour - state.sunsetH)) /
            1.2
      ) * 0.18;
    elements.ringWrap.style.opacity = "1";
    elements.stars.style.opacity = String(
      clamp(Math.max(0, progress - 0.55) * 0.5, 0, 0.28)
    );
    elements.ringWrap.style.filter = `brightness(${(1 + horizonBoost).toFixed(3)})`;
  }

  function ringTempScalar(hour) {
    const dawn = Math.exp(-((hour - state.sunriseH) ** 2) / 1.8);
    const dusk = Math.exp(-((hour - state.sunsetH) ** 2) / 1.8);
    const noonWarm = Math.exp(-((hour - solarMidHour()) ** 2) / 4);
    return Math.max(dawn, dusk) * 0.85 + noonWarm * 0.25;
  }

  function blendRgb(a, b, u) {
    return [
      Math.round(lerp(a[0], b[0], u)),
      Math.round(lerp(a[1], b[1], u)),
      Math.round(lerp(a[2], b[2], u))
    ];
  }

  function drawRing() {
    const canvas = elements.ringCanvas;
    const size = canvas.clientWidth || 280;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }

    const hour = state.hour;
    const temp = ringTempScalar(hour);
    const warm = [255, 175, 120];
    const neutral = [235, 238, 245];
    const glowRgb = blendRgb(neutral, warm, Math.min(1, temp));

    const horizonProximity = Math.max(
      0,
      1 - Math.min(Math.abs(hour - state.sunriseH), Math.abs(hour - state.sunsetH)) / 1.2
    );
    // Very slow, subtle breath near horizons; nearly still at midday.
    const breathBpm = 10 - horizonProximity * 2;
    const breathDepth = 0.01 + horizonProximity * 0.018;
    const breathPhase = reducedMotion
      ? 0
      : Math.sin((performance.now() / 1000) * (breathBpm / 60) * 2 * Math.PI);
    const breath = breathPhase * breathDepth;
    const tapBoost = tapGlowBoost();
    const scale = 0.52 + breath;
    const center = size / 2;
    const coreR = size * 0.2 * scale;
    const glowR = size * 0.42 * scale * (1 + tapBoost * 0.16);
    const breathGlow = ((breathPhase + 1) / 2) * horizonProximity * 0.05;
    const glowAlpha =
      0.34 + 0.16 * temp + 0.08 * horizonProximity + breathGlow + tapBoost * 0.38;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(center, center, 0, center, center, glowR);
    HALO_STOPS.forEach((stop) => {
      g.addColorStop(
        stop.loc,
        `rgba(${glowRgb[0]}, ${glowRgb[1]}, ${glowRgb[2]}, ${(stop.alpha * glowAlpha).toFixed(3)})`
      );
    });
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(center, center, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(12, 14, 22, 0.97)";
    ctx.beginPath();
    ctx.arc(center, center, coreR, 0, Math.PI * 2);
    ctx.fill();

    const rimAlpha = 0.24 + 0.18 * temp + tapBoost * 0.35;
    ctx.strokeStyle = `rgba(${glowRgb[0]}, ${glowRgb[1]}, ${glowRgb[2]}, ${rimAlpha})`;
    ctx.lineWidth = Math.max(1, size * 0.006);
    ctx.beginPath();
    ctx.arc(center, center, Math.max(0, coreR - ctx.lineWidth * 0.5), 0, Math.PI * 2);
    ctx.stroke();
  }

  function syncSlider() {
    if (!elements.timeSlider) return;
    elements.timeSlider.min = String(Math.round(state.sunriseH * 60));
    elements.timeSlider.max = String(Math.round(state.sunsetH * 60));
    elements.timeSlider.value = String(Math.round(state.hour * 60));
  }

  function setHour(hour, { fromDrag = false } = {}) {
    const prevHour = state.hour;
    state.hour = clamp(hour, state.sunriseH, state.sunsetH);
    syncSlider();
    applySky();
    if (fromDrag) {
      endIntroEarly();
    }
    refreshDayline();
    if (fromDrag && crossedSolarMid(prevHour, state.hour)) {
      spawnHeartBurst();
      if (isNearHour(state.hour, solarMidHour(), LOVE_WINDOW_MIN)) {
        showLoveTextOnce();
      }
    }
    if (!fromDrag || reducedMotion) {
      drawRing();
    }
  }

  function endIntroEarly() {
    if (!state.introActive) return;
    state.introActive = false;
    state.introDone = true;
    setDaylineMode({ text: "", visible: false, hint: false, fading: false });
  }

  function flushDragUpdate() {
    state.dragRafId = 0;
    if (state.pendingHour === null) return;
    const hour = state.pendingHour;
    state.pendingHour = null;
    setHour(hour, { fromDrag: true });
  }

  function scheduleDragHour(hour) {
    state.pendingHour = hour;
    if (state.dragRafId) return;
    state.dragRafId = requestAnimationFrame(flushDragUpdate);
  }

  function hourFromDragDelta(clientX) {
    const dx = clientX - state.dragStartX;
    const hourDelta = (dx / dragTravelPx()) * daySpan();
    return clamp(state.dragStartHour + hourDelta, state.sunriseH, state.sunsetH);
  }

  function onPointerDown(e) {
    if (e.target.closest(".home-button")) return;
    ensureRingTapAudio();
    state.dragging = true;
    state.dragActive = false;
    state.dragStartX = e.clientX;
    state.dragStartHour = state.hour;
    elements.sky.classList.add("is-dragging");
    elements.sky.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragStartX;
    if (!state.dragActive && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    state.dragActive = true;
    scheduleDragHour(hourFromDragDelta(e.clientX));
  }

  function onPointerUp(e) {
    if (!state.dragging) return;
    state.dragging = false;
    elements.sky.classList.remove("is-dragging");
    if (state.dragRafId) {
      cancelAnimationFrame(state.dragRafId);
      state.dragRafId = 0;
    }
    if (state.dragActive && state.pendingHour !== null) {
      setHour(state.pendingHour, { fromDrag: true });
      state.pendingHour = null;
    }
    try {
      elements.sky.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endIntroEarly();
    refreshDayline();
    if (state.dragActive) {
      triggerSolarMidMoment();
    } else {
      handleTap(e.clientX, e.clientY);
    }
    state.dragActive = false;
  }

  function onKeyDown(e) {
    const hourStep = e.shiftKey ? 0.5 : 0.15;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setHour(state.hour + hourStep);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setHour(state.hour - hourStep);
    }
  }

  function onSliderInput() {
    if (!elements.timeSlider) return;
    const minutes = Number(elements.timeSlider.value);
    setHour(minutes / 60);
  }

  function onResize() {
    drawRing();
  }

  function requestGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.lat = pos.coords.latitude;
        updateSunTimes();
        setHour(clamp(state.hour, state.sunriseH, state.sunsetH));
      },
      () => updateSunTimes(),
      { maximumAge: 86400000, timeout: 8000 }
    );
  }

  function initEntrance() {
    if (!elements.entranceOverlay) {
      startIntroHint();
      return;
    }
    setTimeout(() => {
      elements.entranceOverlay.classList.add("hidden");
      startIntroHint();
    }, ENTRANCE_MS);
  }

  elements.sky.addEventListener("pointerdown", onPointerDown);
  elements.sky.addEventListener("pointermove", onPointerMove);
  elements.sky.addEventListener("pointerup", onPointerUp);
  elements.sky.addEventListener("pointercancel", onPointerUp);
  elements.timeSlider?.addEventListener("input", onSliderInput);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", onResize);

  updateSunTimes();
  setHour(initialHour());
  requestGeo();
  initEntrance();

  if (!reducedMotion) {
    let rafId = 0;
    const tick = () => {
      drawRing();
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    window.addEventListener(
      "beforeunload",
      () => cancelAnimationFrame(rafId),
      { once: true }
    );
  }
})();
