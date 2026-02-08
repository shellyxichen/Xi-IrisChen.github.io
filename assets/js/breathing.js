(() => {
  const state = {
    spec: null,
    running: false,
    startTime: 0,
    sessionDurationSec: null,
    sessionEndTime: 0,
    lastPhaseIndex: -1,
    audioCtx: null,
    rafId: null,
    tempScalar: 0,
    lastBeatIndex: ""
  };

  const elements = {
    modeSelect: document.getElementById("modeSelect"),
    startBtn: document.getElementById("startBtn"),
    stopBtn: document.getElementById("stopBtn"),
    phaseText: document.getElementById("phaseText"),
    timerText: document.getElementById("timerText"),
    halo: document.getElementById("halo"),
    timerSelect: document.getElementById("timerSelect"),
    sessionBar: document.getElementById("sessionBar"),
    sessionBarFill: document.getElementById("sessionBarFill"),
    entranceOverlay: document.getElementById("entranceOverlay")
  };

  const phaseLabels = {
    inhale: "Inhale",
    exhale: "Exhale",
    hold: "Hold"
  };

  const audioConfig = {
    basePitch: 220,
    beat: {
      pulsesPerSecond: 1,
      quietScalar: 0.1,
      leadInSec: 0.04,
      pulseDurationSec: 0.42
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
      peakVoice: 0.22,
      masterDb: -8
    }
  };

  const audioState = {
    cueMaster: null,
    noiseBuffer: null,
    prewarmPromise: null,
    voiceBeat: null
  };

  function init() {
    fetch("assets/breathing/box.json")
      .then((res) => res.json())
      .then((spec) => {
        state.spec = spec;
        renderIdle();
      })
      .catch(() => {
        elements.phaseText.textContent = "Unable to load breathing spec";
      });

    elements.startBtn.addEventListener("click", startSession);
    elements.stopBtn.addEventListener("click", stopSession);
    elements.timerSelect.addEventListener("change", (event) => {
      state.sessionDurationSec = parseTimerValue(event.target.value);
      if (state.running) {
        state.startTime = performance.now();
        state.sessionEndTime = getSessionEndTime(state.startTime, state.sessionDurationSec);
        state.lastPhaseIndex = -1;
        setSessionBarVisible(Boolean(state.sessionDurationSec));
      }
    });

    bindAudioPrewarm();

    setTimeout(() => {
      elements.entranceOverlay.classList.add("hidden");
    }, 4000);

    state.sessionDurationSec = parseTimerValue(elements.timerSelect.value);
    setSessionBarVisible(false);
  }

  function bindAudioPrewarm() {
    const warm = () => {
      if (audioState.prewarmPromise) return;
      ensureAudioContext();
      if (!state.audioCtx) return;
      const resumePromise =
        state.audioCtx.state === "suspended" ? state.audioCtx.resume() : Promise.resolve();
      resumePromise.then(() => prewarmAudio(state.audioCtx));
    };

    window.addEventListener("pointerdown", warm, { once: true, capture: true });
    window.addEventListener("keydown", warm, { once: true, capture: true });
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
    noiseGain.gain.value = 0.0;

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
  }

  function startSession() {
    if (!state.spec || state.running) return;
    ensureAudioContext();
    const beginSession = () => {
      if (state.running) return;
      const leadInSec = audioConfig.beat.leadInSec || 0;
      state.running = true;
      state.startTime = performance.now() + leadInSec * 1000;
      state.sessionEndTime = getSessionEndTime(state.startTime, state.sessionDurationSec);
      state.lastPhaseIndex = -1;
      state.lastBeatIndex = "";
      elements.startBtn.disabled = true;
      elements.stopBtn.disabled = false;
      setSessionBarVisible(Boolean(state.sessionDurationSec));
      startAudioForSession();
      primeFirstPulse(leadInSec);
      tick();
    };

    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx
        .resume()
        .then(() => prewarmAudio(state.audioCtx))
        .then(beginSession)
        .catch(beginSession);
      return;
    }

    prewarmAudio(state.audioCtx).then(beginSession);
  }

  function stopSession() {
    state.running = false;
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    setSessionBarVisible(false);
    renderIdle();
  }

  function renderIdle() {
    elements.phaseText.textContent = "";
    elements.timerText.textContent = "";
    state.tempScalar = 0;
    setHalo(0.3, 0.2, 0);
    setAmbient(0, 0.1);
    updateSessionBar(0);
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
          timeRemaining: phase.durationSec - phaseElapsed,
          cycleProgress: timeInCycle / cycle
        };
      }
      acc = end;
    }

    const lastIndex = spec.phases.length - 1;
    return {
      phaseIndex: lastIndex,
      phaseType: spec.phases[lastIndex].type,
      phaseProgress: 1,
      timeRemaining: 0,
      cycleProgress: 1
    };
  }

  function setHalo(scale, glow, tempScalar) {
    const root = document.documentElement;
    root.style.setProperty("--halo-scale", scale.toFixed(3));
    root.style.setProperty("--halo-glow", glow.toFixed(3));

    const warm = [255, 190, 140, 0.26];
    const cool = [120, 170, 255, 0.22];
    const neutral = [40, 40, 40, 0.2];
    const warmGlow = [255, 160, 110, 0.35];
    const coolGlow = [120, 170, 255, 0.35];
    const neutralGlow = [250, 250, 250, 0.25];
    const color = blendColor(neutral, tempScalar > 0 ? warm : cool, Math.abs(tempScalar));
    const glowColor = blendColor(neutralGlow, tempScalar > 0 ? warmGlow : coolGlow, Math.abs(tempScalar));
    root.style.setProperty("--halo-color", color);
    root.style.setProperty("--halo-glow-color", glowColor);
  }

  function setAmbient(tempScalar, intensity) {
    const warmCenter = [36, 28, 22];
    const warmEdge = [14, 12, 10];
    const coolCenter = [20, 28, 46];
    const coolEdge = [8, 12, 20];
    const neutralCenter = [14, 14, 16];
    const neutralEdge = [6, 6, 8];
    const centerTarget = tempScalar > 0 ? warmCenter : coolCenter;
    const edgeTarget = tempScalar > 0 ? warmEdge : coolEdge;
    const center = blend(neutralCenter, centerTarget, Math.abs(tempScalar));
    const edge = blend(neutralEdge, edgeTarget, Math.abs(tempScalar));
    const mix = (value, amount) => Math.round(value + amount * 18);
    const centerColor = `rgb(${mix(center[0], intensity)}, ${mix(center[1], intensity)}, ${mix(center[2], intensity)})`;
    const edgeColor = `rgb(${mix(edge[0], intensity)}, ${mix(edge[1], intensity)}, ${mix(edge[2], intensity)})`;
    document.documentElement.style.setProperty("--bg-center", centerColor);
    document.documentElement.style.setProperty("--bg-edge", edgeColor);
  }

  function blend(from, to, t) {
    return from.map((value, idx) => Math.round(value + (to[idx] - value) * t));
  }

  function blendColor(from, to, t) {
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    const a = from[3] + (to[3] - from[3]) * t;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
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
      stopSession();
      return;
    }
    if (state.sessionDurationSec) {
      const elapsed = Math.min(state.sessionDurationSec, Math.max(0, elapsedSec));
      updateSessionBar(elapsed / state.sessionDurationSec);
    }
    const frame = computeState(state.spec, elapsedSec);

    if (frame.phaseIndex !== state.lastPhaseIndex) {
      state.lastPhaseIndex = frame.phaseIndex;
    }

    const label = phaseLabels[frame.phaseType] || "";
    elements.phaseText.textContent = label;
    elements.timerText.textContent = formatCountdown(frame.timeRemaining);

    const isInhale = frame.phaseType === "inhale";
    const isExhale = frame.phaseType === "exhale";
    const baseScale = 0.3;
    const peakScale = 1.0;
    let scale = baseScale;
    let glow = 0.2;
    let intensity = 0.25;

    if (isInhale) {
      scale = baseScale + (peakScale - baseScale) * frame.phaseProgress;
      glow = 0.2 + 0.5 * frame.phaseProgress;
      intensity = 0.25 + 0.6 * frame.phaseProgress;
    } else if (isExhale) {
      scale = peakScale - (peakScale - baseScale) * frame.phaseProgress;
      glow = 0.7 - 0.45 * frame.phaseProgress;
      intensity = 0.85 - 0.5 * frame.phaseProgress;
    } else {
      scale = frame.phaseIndex === 1 ? peakScale : baseScale;
      glow = 0.45;
      intensity = 0.2;
    }

    const targetScalar = isInhale ? 1 : isExhale ? -1 : 0;
    state.tempScalar += (targetScalar - state.tempScalar) * 0.06;
    setHalo(scale, glow, state.tempScalar);
    setAmbient(state.tempScalar, intensity);
    handleBeatPulse(elapsedSec, frame);
    state.rafId = requestAnimationFrame(tick);
  }

  function handleBeatPulse(elapsedSec, frame) {
    if (!state.audioCtx) return;
    const pulsesPerSecond = audioConfig.beat.pulsesPerSecond || 1;
    const phase = state.spec && state.spec.phases ? state.spec.phases[frame.phaseIndex] : null;
    const duration = phase && phase.durationSec ? phase.durationSec : 1;
    const pulses = Math.max(1, Math.round(duration * pulsesPerSecond));
    if (duration <= 0 || pulses <= 0) return;
    const interval = duration / pulses;
    const phaseElapsed = Math.min(duration - 0.0001, Math.max(0, duration * frame.phaseProgress));
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
    const startTime = Number.isFinite(startAt) ? startAt : ctx.currentTime;
    const endTime = startTime + duration;

    const params = getVoiceParams(role);
    voice.osc.frequency.setValueAtTime(params.pitch, startTime);
    voice.formantFilter.frequency.setValueAtTime(params.formant, startTime);
    voice.noiseFilter.frequency.setValueAtTime(params.formant * 0.85, startTime);
    voice.noiseGain.gain.setValueAtTime(params.breath, startTime);

    const gain = voice.pulseGain.gain;
    gain.cancelScheduledValues(startTime);
    gain.setValueAtTime(0.0001, startTime);
    gain.exponentialRampToValueAtTime(audioConfig.cues.peakVoice * level, startTime + attack);
    gain.exponentialRampToValueAtTime(0.0001, endTime);
  }

  function primeFirstPulse(leadInSec = null) {
    if (!state.audioCtx) return;
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function formatCountdown(timeRemaining) {
    const seconds = Math.max(1, Math.ceil(timeRemaining));
    return String(seconds).padStart(2, "0");
  }

  function setSessionBarVisible(isVisible) {
    if (!elements.sessionBar) return;
    elements.sessionBar.classList.toggle("is-visible", isVisible);
  }

  function updateSessionBar(progress) {
    if (!elements.sessionBarFill) return;
    const clamped = Math.max(0, Math.min(1, progress));
    elements.sessionBarFill.style.transform = `scaleX(${clamped.toFixed(4)})`;
  }

  init();
})();
