(() => {
  const HALO_BASE_SIZE = 672;
  const HALO_CORE_DIAMETER = 280;
  const HALO_GLOW_DIAMETER = HALO_CORE_DIAMETER * 2.4;
  const HALO_GAUSSIAN_STOPS = [
    { loc: 0.0, alpha: 1.0 },
    { loc: 0.083, alpha: 0.92 },
    { loc: 0.167, alpha: 0.8 },
    { loc: 0.25, alpha: 0.65 },
    { loc: 0.333, alpha: 0.5 },
    { loc: 0.417, alpha: 0.36 },
    { loc: 0.5, alpha: 0.24 },
    { loc: 0.583, alpha: 0.15 },
    { loc: 0.667, alpha: 0.085 },
    { loc: 0.75, alpha: 0.045 },
    { loc: 0.833, alpha: 0.02 },
    { loc: 0.917, alpha: 0.007 },
    { loc: 1.0, alpha: 0.0 }
  ];
  const COUNTDOWN_STEPS = [
    { text: "3", role: "exhale", accent: 0.65, durationMs: 1000, pulse: 0.04 },
    { text: "2", role: "exhale", accent: 0.65, durationMs: 1000, pulse: 0.04 },
    { text: "1", role: "exhale", accent: 0.65, durationMs: 1000, pulse: 0.04 },
    { text: "Go", role: "inhale", accent: 1.0, durationMs: 600, pulse: 0.08 }
  ];
  const IDLE_HALO = {
    scale: 0.54,
    glow: 0.34,
    intensity: 0.14
  };
  const DEFAULT_MODE_BACKGROUND_SIGNATURE = {
    tempBias: -0.04,
    intensityLift: 0.008,
    tintRGB: [66, 86, 118],
    tintOpacity: 0.1
  };
  const ENTRY_CUE_DURATION_MS = 4000;
  const MODE_BACKGROUND_SIGNATURES = {
    box: {
      tempBias: -0.04,
      intensityLift: 0.008,
      tintRGB: [66, 86, 118],
      tintOpacity: 0.2
    },
    box_8888: {
      tempBias: -0.12,
      intensityLift: 0.012,
      tintRGB: [84, 86, 154],
      tintOpacity: 0.225
    },
    coherent_55: {
      tempBias: -0.05,
      intensityLift: 0.01,
      tintRGB: [54, 118, 116],
      tintOpacity: 0.215
    },
    relax_478: {
      tempBias: 0.16,
      intensityLift: 0.016,
      tintRGB: [156, 98, 58],
      tintOpacity: 0.23
    },
    physiological_sigh_326: {
      tempBias: -0.1,
      intensityLift: 0.012,
      tintRGB: [66, 128, 140],
      tintOpacity: 0.22
    }
  };

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const elements = {
    layout: document.querySelector(".layout"),
    entranceOverlay: document.getElementById("entranceOverlay"),
    modeSelect: document.getElementById("modeSelect"),
    startBtn: document.getElementById("startBtn"),
    stopBtn: document.getElementById("stopBtn"),
    modeDescription: document.getElementById("modeDescription"),
    timerSelect: document.getElementById("timerSelect"),
    sessionBar: document.getElementById("sessionBar"),
    sessionBarFill: document.getElementById("sessionBarFill"),
    haloCanvas: document.getElementById("haloCanvas"),
    haloText: document.getElementById("haloText"),
    haloLabel: document.getElementById("haloLabel"),
    haloCountdown: document.getElementById("haloCountdown")
  };

  if (
    !elements.layout ||
    !elements.modeSelect ||
    !elements.startBtn ||
    !elements.stopBtn ||
    !elements.modeDescription ||
    !elements.timerSelect ||
    !elements.sessionBar ||
    !elements.sessionBarFill ||
    !elements.haloCanvas ||
    !elements.haloText ||
    !elements.haloLabel ||
    !elements.haloCountdown
  ) {
    return;
  }

  const haloCtx = elements.haloCanvas.getContext("2d");
  if (!haloCtx) return;

  const state = {
    spec: null,
    modeId: "",
    specsByModeId: {},
    running: false,
    isCountingDown: false,
    startPending: false,
    startTime: 0,
    sessionDurationSec: null,
    sessionEndTime: 0,
    lastPhaseIndex: -1,
    audioCtx: null,
    rafId: null,
    tempScalar: 0,
    lastBeatIndex: "",
    prefersReducedMotion: reducedMotionQuery.matches,
    countdownToken: 0,
    currentHaloScale: IDLE_HALO.scale,
    currentHaloGlow: IDLE_HALO.glow,
    currentHaloTemp: 0,
    currentHaloPulse: 0,
    sessionHandoffActive: false,
    sessionHandoffScale: IDLE_HALO.scale,
    sessionHandoffGlow: IDLE_HALO.glow,
    stopSequenceActive: false,
    stopSequenceToken: 0,
    currentAmbientIntensity: IDLE_HALO.intensity,
    currentModeBackgroundSignature: { ...DEFAULT_MODE_BACKGROUND_SIGNATURE },
    modeSignatureRafId: null,
    modeDescriptionTimeoutId: null,
    entryAmbientAttempted: false
  };

  const modeSpecPaths = {
    box: "assets/breathing/box.json",
    box_8888: "assets/breathing/box_8888.json",
    relax_478: "assets/breathing/relax_478.json",
    coherent_55: "assets/breathing/coherent_55.json",
    physiological_sigh_326: "assets/breathing/physiological_sigh_326.json"
  };

  const modeDescriptions = {
    box: "A steady, balanced rhythm to ground your attention.",
    box_8888: "A slower, deeper version for sustained calm.",
    coherent_55:
      "A smooth, continuous breath with no pauses, supporting balance and heart-rate variability.",
    relax_478:
      "Longer exhales to gently quiet the nervous system, often used for rest and sleep.",
    physiological_sigh_326:
      "A double inhale followed by a long release, helping the body settle into rapid calm."
  };

  const phaseLabels = {
    inhale: "Inhale",
    exhale: "Exhale",
    hold: "Hold"
  };

  const AMBIENT_SOURCE_OPTIONS = [
    { id: "ocean", kind: "synth" },
    { id: "forest", kind: "file", path: "assets/2026/nature/forest.wav" },
    { id: "water", kind: "file", path: "assets/2026/nature/water.wav" }
  ];

  const audioConfig = {
    basePitch: 220,
    beat: {
      pulsesPerSecond: 1,
      quietScalar: 0.1,
      leadInSec: 0.04,
      pulseDurationSec: 0.42
    },
    countdown: {
      finishDelayMs: 200
    },
    voice: {
      formant: {
        inhale: 1100,
        holdIn: 1200,
        exhale: 650,
        holdOut: 460
      }
    },
    cues: {
      durationMin: 0.3,
      durationMax: 0.55,
      attack: 0.04,
      peakVoice: 0.28,
      masterDb: 3.0
    },
    ambient: {
      loopSec: 28.6,
      welcomeGain: 0.04,
      sessionGain: 0.02,
      finishGain: 0.04,
      browserMakeupGain: 18.0,
      fadeInSec: 2.6,
      duckSec: 1.8,
      fadeInDelaySec: 0.12,
      renderWarmupSec: 0.18,
      fadeOutSec: 3.0,
      seamBlendSec: 1.2,
      preset: {
        surfCenterHz: 220,
        surfQ: 0.7,
        swellHz: 0.07,
        swellBase: 0.6,
        swellDepth: 0.25,
        synthGain: 0.06,
        oceanWeight: 1,
        rainWeight: 0
      }
    },
    finishChord: {
      durationSec: 6.8,
      attackSec: 1.4,
      releaseSec: 3.4
    },
    stopSequence: {
      settleDurationMs: 5500
    }
  };

  const audioState = {
    cueMaster: null,
    noiseBuffer: null,
    prewarmPromise: null,
    voiceBeat: null,
    ambientSourceId: "",
    ambientSelectionPromise: null,
    ambientBuffer: null,
    ambientBufferSampleRate: 0,
    ambientLoopPromise: null,
    ambientLoopSource: null,
    ambientLoopGain: null,
    ambientFileBuffers: {},
    ambientFileLoadPromises: {},
    finishChordBuffer: null,
    finishChordBufferSampleRate: 0,
    finishChordSource: null
  };

  init();

  function init() {
    elements.modeSelect.disabled = true;
    state.sessionDurationSec = parseTimerValue(elements.timerSelect.value);
    initEntranceOverlay();
    bindEvents();
    bindAudioPrewarm();
    bindEntryAmbientAttempt();
    renderIdle();

    loadModeSpecs()
      .then(() => {
        const initialMode = state.specsByModeId[elements.modeSelect.value]
          ? elements.modeSelect.value
          : "box";
        elements.modeSelect.value = initialMode;
        setMode(initialMode);
        elements.modeSelect.disabled = false;
        renderIdle();
      })
      .catch(() => {
        elements.startBtn.disabled = true;
        elements.modeDescription.textContent = "Unable to load breathing modes";
        elements.modeDescription.classList.remove("is-faded");
      });

    requestAnimationFrame(() => {
      syncCanvasSize();
      drawHalo(state.currentHaloScale, state.currentHaloGlow, state.currentHaloTemp);
    });
  }

  function bindEvents() {
    elements.startBtn.addEventListener("click", beginStartFlow);
    elements.stopBtn.addEventListener("click", handleStopRequest);

    elements.modeSelect.addEventListener("change", (event) => {
      setMode(event.target.value);
    });

    elements.timerSelect.addEventListener("change", (event) => {
      state.sessionDurationSec = parseTimerValue(event.target.value);
      if (state.running) {
        resetRunningSessionTiming();
      }
    });

    elements.layout.addEventListener("click", (event) => {
      if (shouldIgnoreSurfaceClick(event.target)) return;
      if (state.startPending || state.isCountingDown || state.running) {
        handleStopRequest();
        return;
      }
      beginStartFlow();
    });

    window.addEventListener("resize", syncCanvasSize);

    const motionHandler = (event) => {
      state.prefersReducedMotion = event.matches;
      if (!state.running && !state.isCountingDown) {
        renderIdle();
        return;
      }
      drawHalo(state.currentHaloScale, state.currentHaloGlow, state.currentHaloTemp, 0);
    };

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", motionHandler);
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(motionHandler);
    }
  }

  function bindEntryAmbientAttempt() {
    const tryEntryAmbient = () => {
      if (state.entryAmbientAttempted) return;
      state.entryAmbientAttempted = true;
      unlockAudio().catch(() => {
        state.entryAmbientAttempted = false;
      });
    };

    window.addEventListener(
      "pageshow",
      () => {
        window.setTimeout(tryEntryAmbient, 0);
      },
      { once: true }
    );

    window.setTimeout(tryEntryAmbient, 0);
  }

  function initEntranceOverlay() {
    if (!elements.entranceOverlay) return;
    window.setTimeout(() => {
      elements.entranceOverlay.classList.add("hidden");
    }, ENTRY_CUE_DURATION_MS);
  }

  function shouldIgnoreSurfaceClick(target) {
    return Boolean(
      target &&
        target.closest(".controls, .home-button, select, button, label, a")
    );
  }

  function loadModeSpecs() {
    const requests = Object.entries(modeSpecPaths).map(([modeId, path]) =>
      fetch(path)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load mode: ${modeId}`);
          }
          return response.json();
        })
        .then((spec) => ({ modeId, spec }))
    );

    return Promise.all(requests).then((entries) => {
      entries.forEach(({ modeId, spec }) => {
        state.specsByModeId[modeId] = spec;
      });
    });
  }

  function setMode(modeId) {
    const nextSpec = state.specsByModeId[modeId];
    if (!nextSpec) return;
    const shouldShowDescription =
      !state.running &&
      !state.isCountingDown &&
      !state.startPending &&
      !state.stopSequenceActive;
    state.modeId = modeId;
    state.spec = nextSpec;
    animateModeBackgroundSignature(getModeBackgroundSignature(modeId));
    renderModeDescription(shouldShowDescription, { animateChange: shouldShowDescription });
    if (state.running) {
      resetRunningSessionTiming();
    }
  }

  function getModeBackgroundSignature(modeId) {
    const signature = MODE_BACKGROUND_SIGNATURES[modeId] || DEFAULT_MODE_BACKGROUND_SIGNATURE;
    return {
      tempBias: signature.tempBias,
      intensityLift: signature.intensityLift,
      tintRGB: [...signature.tintRGB],
      tintOpacity: signature.tintOpacity
    };
  }

  function animateModeBackgroundSignature(targetSignature) {
    if (state.modeSignatureRafId) {
      cancelAnimationFrame(state.modeSignatureRafId);
      state.modeSignatureRafId = null;
    }

    const fromSignature = {
      tempBias: state.currentModeBackgroundSignature.tempBias,
      intensityLift: state.currentModeBackgroundSignature.intensityLift,
      tintRGB: [...state.currentModeBackgroundSignature.tintRGB],
      tintOpacity: state.currentModeBackgroundSignature.tintOpacity
    };

    const durationMs = state.prefersReducedMotion ? 0 : 800;
    if (durationMs <= 0) {
      state.currentModeBackgroundSignature = {
        tempBias: targetSignature.tempBias,
        intensityLift: targetSignature.intensityLift,
        tintRGB: [...targetSignature.tintRGB],
        tintOpacity: targetSignature.tintOpacity
      };
      if (!state.running && !state.isCountingDown && !state.startPending && !state.stopSequenceActive) {
        setAmbient(state.currentHaloTemp, state.currentAmbientIntensity);
      }
      return;
    }

    const startTime = performance.now();
    const frame = (now) => {
      const progress = clamp((now - startTime) / durationMs, 0, 1);
      const eased = easeInOutSine(progress);

      state.currentModeBackgroundSignature = {
        tempBias: lerp(fromSignature.tempBias, targetSignature.tempBias, eased),
        intensityLift: lerp(fromSignature.intensityLift, targetSignature.intensityLift, eased),
        tintRGB: fromSignature.tintRGB.map((value, index) =>
          lerp(value, targetSignature.tintRGB[index], eased)
        ),
        tintOpacity: lerp(fromSignature.tintOpacity, targetSignature.tintOpacity, eased)
      };

      if (!state.running && !state.isCountingDown && !state.startPending && !state.stopSequenceActive) {
        setAmbient(state.currentHaloTemp, state.currentAmbientIntensity);
      }

      if (progress < 1) {
        state.modeSignatureRafId = requestAnimationFrame(frame);
        return;
      }

      state.modeSignatureRafId = null;
    };

    state.modeSignatureRafId = requestAnimationFrame(frame);
  }

  function clearModeDescriptionTransition() {
    if (state.modeDescriptionTimeoutId) {
      window.clearTimeout(state.modeDescriptionTimeoutId);
      state.modeDescriptionTimeoutId = null;
    }
    elements.modeDescription.classList.remove("is-transitioning");
  }

  function renderModeDescription(isVisible, options = {}) {
    const { animateChange = false } = options;
    const description = modeDescriptions[state.modeId] || "";
    clearModeDescriptionTransition();

    if (!isVisible || !description) {
      elements.modeDescription.textContent = description;
      elements.modeDescription.classList.toggle("is-faded", !isVisible || !description);
      return;
    }

    if (!animateChange || state.prefersReducedMotion || !elements.modeDescription.textContent) {
      elements.modeDescription.textContent = description;
      elements.modeDescription.classList.remove("is-faded");
      return;
    }

    elements.modeDescription.classList.remove("is-faded");
    elements.modeDescription.classList.add("is-transitioning");

    state.modeDescriptionTimeoutId = window.setTimeout(() => {
      elements.modeDescription.textContent = description;
      requestAnimationFrame(() => {
        elements.modeDescription.classList.remove("is-transitioning");
      });
      state.modeDescriptionTimeoutId = null;
    }, 420);
  }

  function setControlsState({ startDisabled, stopDisabled }) {
    elements.startBtn.disabled = Boolean(startDisabled);
    elements.stopBtn.disabled = Boolean(stopDisabled);
  }

  function setHaloTextState(kind, label = "", countdown = "") {
    elements.haloText.dataset.state = kind;

    if (kind === "idle") {
      elements.haloLabel.hidden = true;
      elements.haloCountdown.hidden = true;
      elements.haloLabel.textContent = "";
      elements.haloCountdown.textContent = "";
      elements.haloText.setAttribute("aria-label", "");
      return;
    }

    if (kind === "countdown") {
      elements.haloLabel.hidden = true;
      elements.haloCountdown.hidden = false;
      elements.haloLabel.textContent = "";
      elements.haloCountdown.textContent = countdown;
      elements.haloText.setAttribute("aria-label", countdown);
      return;
    }

    elements.haloLabel.hidden = false;
    elements.haloCountdown.hidden = false;
    elements.haloLabel.textContent = label;
    elements.haloCountdown.textContent = countdown;
    elements.haloText.setAttribute("aria-label", `${label} ${countdown}`.trim());
  }

  function renderIdle() {
    stopAnimationLoop();
    state.running = false;
    state.isCountingDown = false;
    state.startPending = false;
    state.lastPhaseIndex = -1;
    state.lastBeatIndex = "";
    state.tempScalar = 0;
    state.currentHaloPulse = 0;
    state.sessionHandoffActive = false;
    state.sessionHandoffScale = IDLE_HALO.scale;
    state.sessionHandoffGlow = IDLE_HALO.glow;
    state.stopSequenceActive = false;
    state.stopSequenceToken += 1;
    state.currentAmbientIntensity = IDLE_HALO.intensity;
    setControlsState({ startDisabled: false, stopDisabled: true });
    setSessionBarVisible(false);
    updateSessionBar(0);
    renderModeDescription(true);
    setHaloTextState("idle");
    drawHalo(IDLE_HALO.scale, IDLE_HALO.glow, 0);
    setAmbient(0, IDLE_HALO.intensity);
  }

  function beginStartFlow() {
    if (
      !state.spec ||
      state.running ||
      state.isCountingDown ||
      state.startPending ||
      state.stopSequenceActive
    ) {
      return;
    }
    stopFinishChord();
    state.startPending = true;
    renderModeDescription(false);
    setControlsState({ startDisabled: true, stopDisabled: false });

    unlockAudio()
      .catch(() => undefined)
      .then(() => {
        if (!state.startPending || state.running || state.isCountingDown) return;
        return startCountdown();
      })
      .finally(() => {
        state.startPending = false;
      });
  }

  async function startCountdown() {
    if (!state.spec) return;
    state.isCountingDown = true;
    const token = state.countdownToken + 1;
    state.countdownToken = token;

    for (const step of COUNTDOWN_STEPS) {
      if (token !== state.countdownToken || !state.isCountingDown) return;
      setHaloTextState("countdown", "", step.text);
      playCountdownCue(step.role, step.accent);

      if (state.prefersReducedMotion) {
        drawHalo(IDLE_HALO.scale, IDLE_HALO.glow, 0);
        await sleep(step.durationMs);
      } else {
        await animateCountdownPulse(token, step.durationMs, step.pulse);
      }
    }

    if (token !== state.countdownToken || !state.isCountingDown) return;
    await sleep(audioConfig.countdown.finishDelayMs);
    if (token !== state.countdownToken || !state.isCountingDown) return;

    state.isCountingDown = false;
    beginSession();
  }

  function handleStopRequest() {
    if (state.startPending) {
      state.startPending = false;
      state.countdownToken += 1;
      fadeOutAmbient(audioConfig.ambient.fadeOutSec);
      renderIdle();
      return;
    }

    if (state.isCountingDown) {
      state.countdownToken += 1;
      state.isCountingDown = false;
      fadeOutAmbient(audioConfig.ambient.fadeOutSec);
      renderIdle();
      return;
    }

    if (state.running) {
      stopSession({ natural: false });
    }
  }

  function beginSession() {
    if (!state.spec || state.running) return;
    const leadInSec = audioConfig.beat.leadInSec || 0;
    state.running = true;
    state.stopSequenceActive = false;
    state.stopSequenceToken += 1;
    state.currentHaloPulse = 0;
    state.startTime = performance.now() + leadInSec * 1000;
    state.sessionEndTime = getSessionEndTime(state.startTime, state.sessionDurationSec);
    state.lastPhaseIndex = -1;
    state.lastBeatIndex = "";
    setControlsState({ startDisabled: true, stopDisabled: false });
    setSessionBarVisible(Boolean(state.sessionDurationSec));
    startAudioForSession();
    duckAmbientForSessionStart();
    state.sessionHandoffActive = true;
    state.sessionHandoffScale = state.currentHaloScale;
    state.sessionHandoffGlow = state.currentHaloGlow;

    const firstPhase = state.spec.phases[0];
    setHaloTextState(
      "running",
      phaseLabels[firstPhase.type] || "",
      formatCountdown(firstPhase.durationSec)
    );

    primeFirstPulse(leadInSec);
    tick();
  }

  function stopSession({ natural }) {
    state.running = false;
    state.isCountingDown = false;
    state.startPending = false;
    state.countdownToken += 1;
    stopAnimationLoop();
    state.lastBeatIndex = "";
    setSessionBarVisible(false);
    state.sessionHandoffActive = false;
    state.currentHaloPulse = 0;
    setControlsState({ startDisabled: true, stopDisabled: true });
    setHaloTextState("idle");
    renderModeDescription(false);

    playFinishChord();
    restoreAmbientAfterNaturalCompletion();
    startStopSequence();
  }

  function stopAnimationLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  function resetRunningSessionTiming() {
    state.startTime = performance.now();
    state.sessionEndTime = getSessionEndTime(state.startTime, state.sessionDurationSec);
    state.lastPhaseIndex = -1;
    state.lastBeatIndex = "";
    setSessionBarVisible(Boolean(state.sessionDurationSec));
  }

  function bindAudioPrewarm() {
    const warm = () => {
      unlockAudio().catch(() => undefined);
    };

    window.addEventListener("pointerdown", warm, { once: true, capture: true });
    window.addEventListener("keydown", warm, { once: true, capture: true });
  }

  function unlockAudio() {
    ensureAudioContext();
    if (!state.audioCtx) return Promise.resolve();

    const resumePromise =
      state.audioCtx.state === "suspended" ? state.audioCtx.resume() : Promise.resolve();

    return resumePromise
      .then(() => prewarmAudio(state.audioCtx))
      .then(() => {
        if (!state.running) {
          return beginWelcomeAmbient();
        }
        return undefined;
      });
  }

  function parseTimerValue(value) {
    if (value === "infinity") return null;
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return seconds;
  }

  function getSessionEndTime(startTime, durationSec) {
    if (!durationSec) return 0;
    return startTime + durationSec * 1000;
  }

  function ensureAudioContext() {
    if (state.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    state.audioCtx = new AudioContext();
  }

  function ensureNoiseBuffer(ctx) {
    if (audioState.noiseBuffer) return;
    const duration = 2;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    audioState.noiseBuffer = buffer;
  }

  function ensureCueMaster(ctx) {
    if (!audioState.cueMaster) {
      audioState.cueMaster = ctx.createGain();
      audioState.cueMaster.connect(ctx.destination);
    }
    audioState.cueMaster.gain.value = dbToGain(audioConfig.cues.masterDb);
  }

  function ensureVoiceBeat(ctx) {
    if (audioState.voiceBeat) return;
    ensureCueMaster(ctx);
    ensureNoiseBuffer(ctx);

    const osc = ctx.createOscillator();
    osc.type = "sine";

    const formantFilter = ctx.createBiquadFilter();
    formantFilter.type = "lowpass";
    formantFilter.Q.value = 0.7;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = audioState.noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;

    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.0001;

    osc.connect(formantFilter);
    formantFilter.connect(pulseGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(pulseGain);
    pulseGain.connect(audioState.cueMaster);

    osc.start();
    noiseSource.start();

    audioState.voiceBeat = {
      osc,
      formantFilter,
      noiseSource,
      noiseFilter,
      noiseGain,
      pulseGain
    };
  }

  function ensureAmbientLoop(ctx) {
    ensureCueMaster(ctx);

    if (
      audioState.ambientBuffer &&
      audioState.ambientBufferSampleRate !== ctx.sampleRate
    ) {
      audioState.ambientBuffer = null;
      audioState.ambientBufferSampleRate = 0;
    }

    if (audioState.ambientLoopSource && audioState.ambientLoopGain) {
      return Promise.resolve();
    }

    if (audioState.ambientLoopPromise) {
      return audioState.ambientLoopPromise;
    }

    audioState.ambientLoopPromise = ensureAmbientBuffer(ctx)
      .then((buffer) => {
        if (audioState.ambientLoopSource && audioState.ambientLoopGain) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;

        source.connect(gainNode);
        gainNode.connect(audioState.cueMaster);
        source.start();

        audioState.ambientLoopSource = source;
        audioState.ambientLoopGain = gainNode;
      })
      .finally(() => {
        audioState.ambientLoopPromise = null;
      });

    return audioState.ambientLoopPromise;
  }

  function ensureAmbientBuffer(ctx) {
    if (
      audioState.ambientBuffer &&
      audioState.ambientBufferSampleRate === ctx.sampleRate
    ) {
      return Promise.resolve(audioState.ambientBuffer);
    }

    if (audioState.ambientSelectionPromise) {
      return audioState.ambientSelectionPromise;
    }

    audioState.ambientSelectionPromise = selectAmbientSource(ctx)
      .then(({ id, buffer }) => {
        audioState.ambientSourceId = id;
        audioState.ambientBuffer = buffer;
        audioState.ambientBufferSampleRate = ctx.sampleRate;
        return buffer;
      })
      .finally(() => {
        audioState.ambientSelectionPromise = null;
      });

    return audioState.ambientSelectionPromise;
  }

  async function selectAmbientSource(ctx) {
    const lockedSource = getAmbientSourceById(audioState.ambientSourceId);
    if (lockedSource) {
      return {
        id: lockedSource.id,
        buffer: await getAmbientBufferForSource(ctx, lockedSource)
      };
    }

    const shuffledSources = shuffleArray(AMBIENT_SOURCE_OPTIONS);
    for (const source of shuffledSources) {
      try {
        return {
          id: source.id,
          buffer: await getAmbientBufferForSource(ctx, source)
        };
      } catch (error) {
        if (source.kind === "file") {
          console.warn(`Unable to load ambient source "${source.id}".`, error);
        }
      }
    }

    return {
      id: "ocean",
      buffer: buildAmbientBuffer(ctx)
    };
  }

  function getAmbientSourceById(sourceId) {
    return AMBIENT_SOURCE_OPTIONS.find((source) => source.id === sourceId) || null;
  }

  function getAmbientBufferForSource(ctx, source) {
    if (!source || source.kind === "synth") {
      return Promise.resolve(buildAmbientBuffer(ctx));
    }

    if (audioState.ambientFileBuffers[source.id]) {
      return Promise.resolve(audioState.ambientFileBuffers[source.id]);
    }

    if (audioState.ambientFileLoadPromises[source.id]) {
      return audioState.ambientFileLoadPromises[source.id];
    }

    const loadPromise = fetch(source.path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ambient audio: ${source.path}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => decodeAudioDataCompat(ctx, arrayBuffer))
      .then((buffer) => {
        audioState.ambientFileBuffers[source.id] = buffer;
        return buffer;
      })
      .finally(() => {
        delete audioState.ambientFileLoadPromises[source.id];
      });

    audioState.ambientFileLoadPromises[source.id] = loadPromise;
    return loadPromise;
  }

  function buildAmbientBuffer(ctx) {
    const loopFrameCount = Math.max(1, Math.ceil(ctx.sampleRate * audioConfig.ambient.loopSec));
    const seamFrames = Math.max(
      1,
      Math.min(loopFrameCount / 4, Math.ceil(ctx.sampleRate * audioConfig.ambient.seamBlendSec))
    );
    const renderFrameCount = loopFrameCount + seamFrames;
    const buffer = ctx.createBuffer(1, loopFrameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const preset = audioConfig.ambient.preset;
    const lowpass = createOnePoleLowpass(ctx.sampleRate, 1400);
    const surfBand = createBiquadBandpass(ctx.sampleRate, preset.surfCenterHz, preset.surfQ);
    const warmupFrames = Math.max(0, Math.ceil(ctx.sampleRate * audioConfig.ambient.renderWarmupSec));
    const rainWeight = 0;
    const oceanWeight = 0.65;
    const totalWeight = Math.max(0.0001, rainWeight + oceanWeight);
    const rawSamples = new Float32Array(renderFrameCount);

    for (let i = 0; i < warmupFrames; i += 1) {
      const t = i / ctx.sampleRate;
      renderAmbientSample(t, preset, lowpass, surfBand, rainWeight, oceanWeight, totalWeight);
    }

    for (let i = 0; i < renderFrameCount; i += 1) {
      const t = (i + warmupFrames) / ctx.sampleRate;
      rawSamples[i] = renderAmbientSample(
        t,
        preset,
        lowpass,
        surfBand,
        rainWeight,
        oceanWeight,
        totalWeight
      );
    }

    for (let i = 0; i < loopFrameCount; i += 1) {
      if (i < seamFrames && seamFrames > 1) {
        const x = i / (seamFrames - 1);
        const continuationGain = Math.cos(0.5 * Math.PI * x);
        const restartGain = Math.sin(0.5 * Math.PI * x);
        data[i] =
          rawSamples[loopFrameCount + i] * continuationGain +
          rawSamples[i] * restartGain;
      } else {
        data[i] = rawSamples[i];
      }
    }

    return buffer;
  }

  function renderAmbientSample(
    timeSec,
    preset,
    lowpass,
    surfBand,
    rainWeight,
    oceanWeight,
    totalWeight
  ) {
    const white = Math.random() * 2 - 1;
    const rain = lowpass.process(white);
    const swell = 0.5 + 0.5 * Math.sin(Math.PI * 2 * preset.swellHz * timeSec);
    const ocean = surfBand.process(white) * (preset.swellBase + preset.swellDepth * swell);
    return (((rain * rainWeight) + (ocean * oceanWeight)) / totalWeight) * preset.synthGain;
  }

  function getFinishChordBuffer(ctx) {
    if (
      audioState.finishChordBuffer &&
      audioState.finishChordBufferSampleRate === ctx.sampleRate
    ) {
      return audioState.finishChordBuffer;
    }

    const durationSec = audioConfig.finishChord.durationSec;
    const frameCount = Math.ceil(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const components = [
      { freq: 110.0, amp: 0.55 },
      { freq: 165.0, amp: 0.32 },
      { freq: 220.0, amp: 0.28 },
      { freq: 247.5, amp: 0.16 }
    ];
    const normalizer = components.reduce((sum, component) => sum + component.amp, 0);
    const attackSec = audioConfig.finishChord.attackSec;
    const releaseSec = audioConfig.finishChord.releaseSec;
    const sustainSec = Math.max(0, durationSec - attackSec - releaseSec);
    const peak = audioConfig.cues.peakVoice * 0.7;
    const filter = createBiquadBandpass(
      ctx.sampleRate,
      audioConfig.voice.formant.exhale * 0.85,
      0.6
    );

    for (let i = 0; i < frameCount; i += 1) {
      const t = i / ctx.sampleRate;

      let envelope = 0;
      if (t < attackSec) {
        const x = t / Math.max(0.0001, attackSec);
        envelope = 0.5 * (1 - Math.cos(Math.PI * x));
      } else if (t < attackSec + sustainSec) {
        envelope = 1;
      } else {
        const releaseT = (t - attackSec - sustainSec) / Math.max(0.0001, releaseSec);
        envelope = Math.pow(0.0001, releaseT);
      }

      let tone = 0;
      for (const component of components) {
        tone += Math.sin(Math.PI * 2 * component.freq * t) * component.amp;
      }
      tone /= Math.max(0.0001, normalizer);

      const noise = filter.process(Math.random() * 2 - 1);
      data[i] = (tone + noise * 0.04) * peak * envelope;
    }

    audioState.finishChordBuffer = buffer;
    audioState.finishChordBufferSampleRate = ctx.sampleRate;
    return buffer;
  }

  function prewarmAudio(ctx) {
    if (!ctx) return Promise.resolve();
    if (audioState.prewarmPromise) return audioState.prewarmPromise;

    audioState.prewarmPromise = new Promise((resolve) => {
      ensureCueMaster(ctx);
      ensureNoiseBuffer(ctx);
      ensureVoiceBeat(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.frequency.value = 200;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startAt = ctx.currentTime + 0.02;
      osc.start(startAt);
      osc.stop(startAt + 0.06);

      setTimeout(resolve, 120);
    });

    return audioState.prewarmPromise;
  }

  function startAudioForSession() {
    if (!state.audioCtx) return;
    ensureVoiceBeat(state.audioCtx);
    ensureAmbientLoop(state.audioCtx).catch(() => undefined);
  }

  function startStopSequence() {
    const token = state.stopSequenceToken + 1;
    state.stopSequenceToken = token;
    state.stopSequenceActive = true;

    const settleDurationMs = state.prefersReducedMotion
      ? Math.min(1200, audioConfig.stopSequence.settleDurationMs)
      : audioConfig.stopSequence.settleDurationMs;
    const fromScale = state.currentHaloScale;
    const fromGlow = state.currentHaloGlow;
    const fromTemp = state.currentHaloTemp;
    const fromIntensity = state.currentAmbientIntensity;
    const startTime = performance.now();

    const frame = (now) => {
      if (!state.stopSequenceActive || token !== state.stopSequenceToken) return;

      const progress = clamp((now - startTime) / settleDurationMs, 0, 1);
      const eased = easeInOutSine(progress);

      const nextScale = lerp(fromScale, IDLE_HALO.scale, eased);
      const nextGlow = lerp(fromGlow, IDLE_HALO.glow, eased);
      const nextTemp = lerp(fromTemp, 0, eased);
      const nextIntensity = lerp(fromIntensity, IDLE_HALO.intensity, eased);

      drawHalo(nextScale, nextGlow, nextTemp);
      setAmbient(nextTemp, nextIntensity);

      if (progress < 1) {
        state.rafId = requestAnimationFrame(frame);
        return;
      }

      if (token !== state.stopSequenceToken) return;
      renderIdle();
    };

    state.rafId = requestAnimationFrame(frame);
  }

  function beginWelcomeAmbient() {
    if (!state.audioCtx) return;
    return ensureAmbientLoop(state.audioCtx)
      .then(() => {
        rampAmbientGain(
          audioConfig.ambient.welcomeGain,
          audioConfig.ambient.fadeInSec,
          audioConfig.ambient.fadeInDelaySec
        );
      })
      .catch(() => undefined);
  }

  function duckAmbientForSessionStart() {
    if (!state.audioCtx) return;
    ensureAmbientLoop(state.audioCtx)
      .then(() => {
        rampAmbientGain(audioConfig.ambient.sessionGain, audioConfig.ambient.duckSec);
      })
      .catch(() => undefined);
  }

  function restoreAmbientAfterNaturalCompletion() {
    if (!state.audioCtx) return;
    ensureAmbientLoop(state.audioCtx)
      .then(() => {
        rampAmbientGain(audioConfig.ambient.finishGain, audioConfig.ambient.fadeInSec);
      })
      .catch(() => undefined);
  }

  function fadeOutAmbient(durationSec) {
    if (!audioState.ambientLoopGain || !state.audioCtx) return;
    rampAmbientGain(0, durationSec);
  }

  function rampAmbientGain(target, durationSec, delaySec = 0) {
    if (!audioState.ambientLoopGain || !state.audioCtx) return;
    const now = state.audioCtx.currentTime;
    const param = audioState.ambientLoopGain.gain;
    const targetWithMakeup = target * audioConfig.ambient.browserMakeupGain;
    const nextTarget = state.prefersReducedMotion ? targetWithMakeup * 0.8 : targetWithMakeup;
    const rampDelay = Math.max(0, delaySec);

    if (typeof param.cancelAndHoldAtTime === "function") {
      param.cancelAndHoldAtTime(now);
    } else {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
    }

    const holdValue = Math.max(0, param.value);
    param.setValueAtTime(holdValue, now);
    if (rampDelay > 0) {
      param.linearRampToValueAtTime(holdValue, now + rampDelay);
    }
    param.linearRampToValueAtTime(nextTarget, now + rampDelay + Math.max(0.01, durationSec));
  }

  function playCountdownCue(role, accent) {
    if (!state.audioCtx) return;
    playVoiceCue(state.audioCtx, role, accent, null, audioConfig.beat.pulseDurationSec);
  }

  function playFinishChord() {
    if (!state.audioCtx) return;
    ensureCueMaster(state.audioCtx);
    stopFinishChord();

    const source = state.audioCtx.createBufferSource();
    source.buffer = getFinishChordBuffer(state.audioCtx);
    source.connect(audioState.cueMaster);
    source.start();

    source.addEventListener(
      "ended",
      () => {
        if (audioState.finishChordSource === source) {
          audioState.finishChordSource = null;
        }
      },
      { once: true }
    );

    audioState.finishChordSource = source;
  }

  function stopFinishChord() {
    if (!audioState.finishChordSource) return;
    try {
      audioState.finishChordSource.stop();
    } catch {
      // Ignore repeated stop attempts on already-ended sources.
    }
    audioState.finishChordSource = null;
  }

  function getCycleDuration(spec) {
    return spec.phases.reduce((sum, phase) => sum + phase.durationSec, 0);
  }

  function computeState(spec, elapsedSec) {
    const cycle = getCycleDuration(spec);
    const timeInCycle = ((elapsedSec % cycle) + cycle) % cycle;

    let acc = 0;
    for (let i = 0; i < spec.phases.length; i += 1) {
      const phase = spec.phases[i];
      const start = acc;
      const end = acc + phase.durationSec;
      if (timeInCycle >= start && timeInCycle < end) {
        const phaseElapsed = timeInCycle - start;
        const phaseProgress = phaseElapsed / phase.durationSec;
        return {
          phaseIndex: i,
          phaseType: phase.type,
          phaseProgress,
          timeRemaining: phase.durationSec - phaseElapsed
        };
      }
      acc = end;
    }

    const lastIndex = spec.phases.length - 1;
    return {
      phaseIndex: lastIndex,
      phaseType: spec.phases[lastIndex].type,
      phaseProgress: 1,
      timeRemaining: 0
    };
  }

  function tick() {
    if (!state.running || !state.spec) return;

    const now = performance.now();
    const elapsedSec = (now - state.startTime) / 1000;

    if (elapsedSec < 0) {
      state.rafId = requestAnimationFrame(tick);
      return;
    }

    if (state.sessionDurationSec && now >= state.sessionEndTime) {
      stopSession({ natural: true });
      return;
    }

    if (state.sessionDurationSec) {
      const elapsed = Math.min(state.sessionDurationSec, Math.max(0, elapsedSec));
      updateSessionBar(elapsed / state.sessionDurationSec);
    }

    const frame = computeState(state.spec, elapsedSec);
    state.lastPhaseIndex = frame.phaseIndex;

    const label = phaseLabels[frame.phaseType] || "";
    setHaloTextState("running", label, formatCountdown(frame.timeRemaining));

    const useSessionHandoff =
      state.sessionHandoffActive &&
      frame.phaseIndex === 0 &&
      frame.phaseType === "inhale";

    if (state.sessionHandoffActive && !useSessionHandoff) {
      state.sessionHandoffActive = false;
      state.sessionHandoffScale = IDLE_HALO.scale;
      state.sessionHandoffGlow = IDLE_HALO.glow;
    }

    const baseScale = 0.45;
    const peakScale = 1.0;
    const isInhale = frame.phaseType === "inhale";
    const isExhale = frame.phaseType === "exhale";
    let scale = baseScale;
    let glow = 0.2;
    let intensity = 0.25;

    if (isInhale) {
      const inhaleBaseScale = useSessionHandoff
        ? Math.max(baseScale, state.sessionHandoffScale)
        : baseScale;
      const inhaleBaseGlow = useSessionHandoff
        ? Math.max(0.2, state.sessionHandoffGlow)
        : 0.2;
      const inhaleBaseIntensity = useSessionHandoff ? 0.18 : 0.25;
      scale = inhaleBaseScale + (peakScale - inhaleBaseScale) * frame.phaseProgress;
      glow = inhaleBaseGlow + (0.7 - inhaleBaseGlow) * frame.phaseProgress;
      intensity = inhaleBaseIntensity + (0.85 - inhaleBaseIntensity) * frame.phaseProgress;
    } else if (isExhale) {
      scale = peakScale - (peakScale - baseScale) * frame.phaseProgress;
      glow = 0.7 - 0.45 * frame.phaseProgress;
      intensity = 0.85 - 0.5 * frame.phaseProgress;
    } else if (getPreviousActivePhaseType(state.spec, frame.phaseIndex) === "inhale") {
      scale = peakScale;
      glow = 0.7;
      intensity = 0.85;
    } else {
      scale = baseScale;
      glow = 0.45;
      intensity = 0.2;
    }

    if (state.prefersReducedMotion) {
      scale = baseScale + (scale - baseScale) * 0.72;
      glow = 0.2 + (glow - 0.2) * 0.7;
      intensity *= 0.75;
    }

    const targetScalar = isInhale ? 1 : isExhale ? -1 : 0;
    state.tempScalar +=
      (targetScalar - state.tempScalar) * (state.prefersReducedMotion ? 0.025 : 0.04);

    drawHalo(scale, glow, state.tempScalar);
    setAmbient(state.tempScalar, intensity);
    handleBeatPulse(frame);
    state.rafId = requestAnimationFrame(tick);
  }

  function handleBeatPulse(frame) {
    if (!state.audioCtx || !state.spec) return;

    const pulsesPerSecond = audioConfig.beat.pulsesPerSecond || 1;
    const phase = state.spec.phases[frame.phaseIndex];
    const duration = phase && phase.durationSec ? phase.durationSec : 1;
    const pulses = Math.max(1, Math.round(duration * pulsesPerSecond));
    if (duration <= 0 || pulses <= 0) return;

    const interval = duration / pulses;
    const phaseElapsed = Math.min(
      duration - 0.0001,
      Math.max(0, duration * frame.phaseProgress)
    );
    const pulseIndex = Math.min(pulses - 1, Math.floor(phaseElapsed / interval));
    const beatKey = `${frame.phaseIndex}:${pulseIndex}`;
    if (beatKey === state.lastBeatIndex) return;
    state.lastBeatIndex = beatKey;

    const role = getPhaseRole(state.spec, frame.phaseIndex);
    const accent = pulseIndex === 0 ? 1 : audioConfig.beat.quietScalar;
    playVoiceCue(state.audioCtx, role, accent, null, audioConfig.beat.pulseDurationSec);
  }

  function playVoiceCue(ctx, role, level = 1, startAt = null, durationSec = null) {
    ensureVoiceBeat(ctx);
    const voice = audioState.voiceBeat;
    const duration = Number.isFinite(durationSec)
      ? durationSec
      : randomInRange(audioConfig.cues.durationMin, audioConfig.cues.durationMax);
    const attack = Math.min(audioConfig.cues.attack, duration * 0.5);
    const cueStartTime = Number.isFinite(startAt) ? startAt : ctx.currentTime;
    const endTime = cueStartTime + duration;

    const params = getVoiceParams(role);
    voice.osc.frequency.setValueAtTime(params.pitch, cueStartTime);
    voice.formantFilter.frequency.setValueAtTime(params.formant, cueStartTime);
    voice.noiseFilter.frequency.setValueAtTime(params.formant * 0.85, cueStartTime);
    voice.noiseGain.gain.setValueAtTime(params.breath, cueStartTime);

    const gain = voice.pulseGain.gain;
    gain.cancelScheduledValues(cueStartTime);
    gain.setValueAtTime(0.0001, cueStartTime);
    gain.exponentialRampToValueAtTime(audioConfig.cues.peakVoice * level, cueStartTime + attack);
    gain.exponentialRampToValueAtTime(0.0001, endTime);
  }

  function primeFirstPulse(leadInSec = null) {
    if (!state.audioCtx || !state.spec) return;
    const delay = Number.isFinite(leadInSec) ? leadInSec : audioConfig.beat.leadInSec || 0;
    const startAt = state.audioCtx.currentTime + delay;
    const role = getPhaseRole(state.spec, 0);
    state.lastBeatIndex = "0:0";
    playVoiceCue(state.audioCtx, role, 1, startAt, audioConfig.beat.pulseDurationSec);
  }

  function getVoiceParams(role) {
    const base = audioConfig.basePitch;
    let pitch = base * 1.1;
    if (role === "holdIn") pitch = base * 1.3;
    if (role === "exhale") pitch = base * 0.75;
    if (role === "holdOut") pitch = base * 0.6;

    const formant = audioConfig.voice.formant[role] || 900;
    const breath = role === "exhale" ? 0.12 : role === "inhale" ? 0.08 : 0.02;

    return { pitch, formant, breath };
  }

  function getPhaseRole(spec, phaseIndex) {
    if (!spec || !spec.phases || !spec.phases[phaseIndex]) return "inhale";
    const phase = spec.phases[phaseIndex];
    if (phase.type === "inhale") return "inhale";
    if (phase.type === "exhale") return "exhale";
    if (phase.type === "hold") {
      const prev = spec.phases[(phaseIndex - 1 + spec.phases.length) % spec.phases.length];
      if (prev && prev.type === "inhale") return "holdIn";
      if (prev && prev.type === "exhale") return "holdOut";
      return phaseIndex < spec.phases.length / 2 ? "holdIn" : "holdOut";
    }
    return phase.type;
  }

  function getPreviousActivePhaseType(spec, phaseIndex) {
    if (!spec || !spec.phases || !spec.phases.length) return null;
    for (let step = 1; step <= spec.phases.length; step += 1) {
      const idx = (phaseIndex - step + spec.phases.length) % spec.phases.length;
      const type = spec.phases[idx].type;
      if (type !== "hold") return type;
    }
    return null;
  }

  function syncCanvasSize() {
    const width = elements.haloCanvas.clientWidth || HALO_BASE_SIZE;
    const height = elements.haloCanvas.clientHeight || HALO_BASE_SIZE;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    if (
      elements.haloCanvas.width !== pixelWidth ||
      elements.haloCanvas.height !== pixelHeight
    ) {
      elements.haloCanvas.width = pixelWidth;
      elements.haloCanvas.height = pixelHeight;
    }
  }

  function drawHalo(scale, glow, tempScalar, pulseScale = 0) {
    syncCanvasSize();

    const width = elements.haloCanvas.clientWidth || HALO_BASE_SIZE;
    const height = elements.haloCanvas.clientHeight || HALO_BASE_SIZE;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const baseUnit = Math.min(width, height) / HALO_BASE_SIZE;
    const effectiveScale = Math.max(0.1, scale) * (1 + (state.prefersReducedMotion ? 0 : pulseScale));
    const coreRadius = (HALO_CORE_DIAMETER / 2) * baseUnit * effectiveScale;
    const glowRadius = (HALO_GLOW_DIAMETER / 2) * baseUnit * effectiveScale;
    const centerX = width / 2;
    const centerY = height / 2;
    const glowColor = getGlowColor(tempScalar);
    const rimColor = getRimColor(tempScalar);
    const clampedGlow = clamp(glow, 0, 1);

    haloCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    haloCtx.clearRect(0, 0, width, height);

    haloCtx.save();
    haloCtx.globalCompositeOperation = "lighter";
    const gradient = haloCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
    HALO_GAUSSIAN_STOPS.forEach((stop) => {
      gradient.addColorStop(
        stop.loc,
        `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${(stop.alpha * 0.45 * clampedGlow).toFixed(4)})`
      );
    });
    haloCtx.fillStyle = gradient;
    haloCtx.beginPath();
    haloCtx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    haloCtx.fill();
    haloCtx.restore();

    haloCtx.fillStyle = "rgba(13, 15, 23, 0.98)";
    haloCtx.beginPath();
    haloCtx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    haloCtx.fill();

    haloCtx.strokeStyle = `rgba(${rimColor[0]}, ${rimColor[1]}, ${rimColor[2]}, 0.25)`;
    haloCtx.lineWidth = Math.max(1, 1.5 * baseUnit * effectiveScale);
    haloCtx.beginPath();
    haloCtx.arc(centerX, centerY, Math.max(0, coreRadius - haloCtx.lineWidth * 0.5), 0, Math.PI * 2);
    haloCtx.stroke();

    state.currentHaloScale = scale;
    state.currentHaloGlow = glow;
    state.currentHaloTemp = tempScalar;
    state.currentHaloPulse = pulseScale;
  }

  function getGlowColor(tempScalar) {
    const t = Math.min(1, Math.abs(tempScalar));
    const warm = [255, 160, 110];
    const cool = [120, 170, 255];
    const neutral = [250, 250, 250];
    const target = tempScalar > 0 ? warm : cool;
    return blend(neutral, target, t);
  }

  function getRimColor(tempScalar) {
    const t = Math.min(1, Math.abs(tempScalar));
    const warm = [255, 190, 140];
    const cool = [150, 190, 255];
    const neutral = [255, 255, 255];
    const target = tempScalar > 0 ? warm : cool;
    return blend(neutral, target, t);
  }

  function setAmbient(tempScalar, intensity) {
    const modeSignature = state.currentModeBackgroundSignature || DEFAULT_MODE_BACKGROUND_SIGNATURE;
    const modeSignatureIdleWeight = getModeSignatureIdleWeight(tempScalar, intensity);
    const backgroundTempScalar = clamp(
      tempScalar + modeSignature.tempBias * modeSignatureIdleWeight,
      -1,
      1
    );
    const backgroundIntensity = Math.max(
      0,
      intensity + modeSignature.intensityLift * modeSignatureIdleWeight
    );
    const warmCenter = [44, 30, 22];
    const warmEdge = [18, 13, 10];
    const coolCenter = [18, 28, 52];
    const coolEdge = [6, 10, 24];
    const neutralCenter = [14, 14, 16];
    const neutralEdge = [6, 6, 8];
    const centerTarget = backgroundTempScalar > 0 ? warmCenter : coolCenter;
    const edgeTarget = backgroundTempScalar > 0 ? warmEdge : coolEdge;
    const center = blendFloat(neutralCenter, centerTarget, Math.abs(backgroundTempScalar));
    const edge = blendFloat(neutralEdge, edgeTarget, Math.abs(backgroundTempScalar));
    const inner = blendFloat(center, edge, 0.08);
    const mid = blendFloat(center, edge, 0.38);
    const outer = blendFloat(center, edge, 0.72);
    const brightnessMultiplier = state.prefersReducedMotion ? 16 : 24;
    const brighten = (rgb, amount) =>
      rgb.map((value) => value + Math.max(0, amount) * brightnessMultiplier);

    const innerColor = formatRgb(brighten(inner, backgroundIntensity * 1.06));
    const centerColor = formatRgb(brighten(center, backgroundIntensity));
    const midColor = formatRgb(brighten(mid, backgroundIntensity * 0.72));
    const outerColor = formatRgb(brighten(outer, backgroundIntensity * 0.38));
    const edgeColor = formatRgb(brighten(edge, backgroundIntensity * 0.14));
    const tintOpacity = modeSignature.tintOpacity * modeSignatureIdleWeight;

    document.documentElement.style.setProperty("--bg-inner", innerColor);
    document.documentElement.style.setProperty("--bg-center", centerColor);
    document.documentElement.style.setProperty("--bg-mid", midColor);
    document.documentElement.style.setProperty("--bg-outer", outerColor);
    document.documentElement.style.setProperty("--bg-edge", edgeColor);
    document.documentElement.style.setProperty(
      "--mode-tint-rgb",
      `${modeSignature.tintRGB[0].toFixed(2)}, ${modeSignature.tintRGB[1].toFixed(2)}, ${modeSignature.tintRGB[2].toFixed(2)}`
    );
    document.documentElement.style.setProperty("--mode-tint-opacity", tintOpacity.toFixed(4));
    document.documentElement.style.setProperty(
      "--mode-tint-opacity-soft",
      (tintOpacity * 0.35).toFixed(4)
    );
    state.currentAmbientIntensity = intensity;
  }

  function getModeSignatureIdleWeight(tempScalar, intensity) {
    const phasePresence = Math.abs(tempScalar);
    const ambientPresence = Math.min(
      1,
      Math.max(0, intensity - IDLE_HALO.intensity) / 0.22
    );
    return Math.max(0, 1 - Math.max(phasePresence, ambientPresence));
  }

  function animateCountdownPulse(token, durationMs, pulseAmount) {
    const start = performance.now();
    const riseMs = Math.min(120, durationMs * 0.18);

    return new Promise((resolve) => {
      const frame = (now) => {
        if (token !== state.countdownToken || !state.isCountingDown) {
          drawHalo(state.currentHaloScale, state.currentHaloGlow, state.currentHaloTemp, 0);
          resolve();
          return;
        }

        const elapsed = now - start;
        if (elapsed >= durationMs) {
          drawHalo(state.currentHaloScale, state.currentHaloGlow, state.currentHaloTemp, 0);
          resolve();
          return;
        }

        let pulse = 0;
        if (elapsed < riseMs) {
          pulse = easeOutCubic(elapsed / Math.max(1, riseMs)) * pulseAmount;
        } else {
          const decayProgress =
            1 - (elapsed - riseMs) / Math.max(1, durationMs - riseMs);
          pulse = pulseAmount * Math.pow(Math.max(0, decayProgress), 1.4);
        }

        drawHalo(IDLE_HALO.scale, IDLE_HALO.glow, 0, pulse);
        requestAnimationFrame(frame);
      };

      requestAnimationFrame(frame);
    });
  }

  function createBiquadBandpass(sampleRate, centerHz, q) {
    const omega = 2 * Math.PI * (centerHz / sampleRate);
    const alpha = Math.sin(omega) / (2 * Math.max(0.0001, q));
    const bb0 = alpha;
    const bb1 = 0;
    const bb2 = -alpha;
    const aa0 = 1 + alpha;
    const aa1 = -2 * Math.cos(omega);
    const aa2 = 1 - alpha;

    const filter = {
      b0: bb0 / aa0,
      b1: bb1 / aa0,
      b2: bb2 / aa0,
      a1: aa1 / aa0,
      a2: aa2 / aa0,
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
      process(x0) {
        const y0 =
          this.b0 * x0 +
          this.b1 * this.x1 +
          this.b2 * this.x2 -
          this.a1 * this.y1 -
          this.a2 * this.y2;
        this.x2 = this.x1;
        this.x1 = x0;
        this.y2 = this.y1;
        this.y1 = y0;
        return y0;
      }
    };

    return filter;
  }

  function createOnePoleLowpass(sampleRate, cutoffHz) {
    const sr = Math.max(1, sampleRate);
    const wc = 2 * Math.PI * Math.max(1, cutoffHz);
    const dt = 1 / sr;
    const rc = 1 / wc;
    const alpha = dt / (rc + dt);

    return {
      y1: 0,
      process(x) {
        this.y1 += alpha * (x - this.y1);
        return this.y1;
      }
    };
  }

  function decodeAudioDataCompat(ctx, arrayBuffer) {
    const clonedBuffer = arrayBuffer.slice(0);
    return new Promise((resolve, reject) => {
      let settled = false;
      const settleResolve = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const settleReject = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      try {
        const result = ctx.decodeAudioData(clonedBuffer, settleResolve, settleReject);
        if (result && typeof result.then === "function") {
          result.then(settleResolve, settleReject);
        }
      } catch (error) {
        settleReject(error);
      }
    });
  }

  function blend(from, to, t) {
    return from.map((value, index) =>
      Math.round(value + (to[index] - value) * clamp(t, 0, 1))
    );
  }

  function blendFloat(from, to, t) {
    return from.map((value, index) =>
      value + (to[index] - value) * clamp(t, 0, 1)
    );
  }

  function formatRgb(rgb) {
    const clamped = rgb.map((value) => clamp(value, 0, 255));
    return `rgb(${clamped[0].toFixed(2)}, ${clamped[1].toFixed(2)}, ${clamped[2].toFixed(2)})`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function shuffleArray(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function formatCountdown(timeRemaining) {
    const seconds = Math.max(1, Math.ceil(timeRemaining));
    return String(seconds).padStart(2, "0");
  }

  function setSessionBarVisible(isVisible) {
    elements.sessionBar.classList.toggle("is-visible", Boolean(isVisible));
  }

  function updateSessionBar(progress) {
    const clampedProgress = clamp(progress, 0, 1);
    elements.sessionBarFill.style.transform = `scaleX(${clampedProgress.toFixed(4)})`;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
  }

  function lerp(from, to, t) {
    return from + (to - from) * clamp(t, 0, 1);
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
})();
