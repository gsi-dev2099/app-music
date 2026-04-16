// Audio Engine for Blazor - Final Architecture
// JS owns the audio element entirely. Time updates are pushed to Blazor
// via DotNet.invokeMethodAsync on a 250ms interval — zero Blazor event bindings.
let audioCtx;
let analyser;
let source;
let canvas;
let ctx;
let particles = [];
let audio;
let dotNetRef;    // Reference to Home.razor's [JSInvokable] method
let pollInterval; // setInterval handle for time polling

const colors = {
    primary:   '#ff3c3c',
    secondary: '#bb86fc',
    accent:    '#03dac6'
};

window.initMusicEngine = (audioElementId, canvasId, dotNetReference) => {
    audio      = document.getElementById(audioElementId);
    canvas     = document.getElementById(canvasId);
    dotNetRef  = dotNetReference;

    if (!audio || !canvas) return;
    ctx = canvas.getContext('2d');

    const resize = () => {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // ─── START TIME POLLING ────────────────────────────────────────────────
    // Push audio state to Blazor every 250ms without touching the audio DOM node.
    // This completely avoids the Blazor reconciler interfering with playback.
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        if (!audio || !dotNetRef) return;
        dotNetRef.invokeMethodAsync(
            'OnTimeUpdate',
            audio.currentTime,
            isFinite(audio.duration) ? audio.duration : 0,
            !audio.paused
        );
    }, 250);

    // ─── AUDIO CONTEXT INIT ────────────────────────────────────────────────
    // Initialize immediately on load; if AudioContext requires user gesture,
    // resume it on the first click (but do NOT re-create the MediaElementSource).
    _setupAnalyser();
};

function _setupAnalyser() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser  = audioCtx.createAnalyser();

        // crossOrigin is already set as HTML attribute — never touch it here.
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize               = 512;
        analyser.smoothingTimeConstant = 0.85;

        renderLoop();

        // If context started suspended, resume on first user interaction
        if (audioCtx.state === 'suspended') {
            const resume = () => { audioCtx.resume(); document.removeEventListener('click', resume); };
            document.addEventListener('click', resume);
        }
    } catch (err) {
        // Fallback: wait for a user gesture then retry once
        const retry = () => { _setupAnalyser(); document.removeEventListener('click', retry); };
        document.addEventListener('click', retry);
    }
}

// ─── CLEAN JS API (called by Blazor, no eval) ─────────────────────────────
window.audioPlay = () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audio.play();
};
window.audioPause     = () => audio.pause();
window.audioSeek      = (t) => { audio.currentTime = t; };
window.audioSeekByClick = (clientX, barLeft, barWidth) => {
    const pos = Math.max(0, Math.min((clientX - barLeft) / barWidth, 1));
    audio.currentTime = pos * audio.duration;
};

// ─── RENDER LOOP ──────────────────────────────────────────────────────────
function renderLoop() {
    const waveData = new Uint8Array(analyser.fftSize);           // 512 waveform samples
    const freqData = new Uint8Array(analyser.frequencyBinCount); // 256 frequency bins

    function render() {
        requestAnimationFrame(render);
        if (!audio || audio.paused) return;

        analyser.getByteTimeDomainData(waveData);
        analyser.getByteFrequencyData(freqData);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const W  = canvas.width;
        const H  = canvas.height;
        const cx = W / 2;
        const cy = H / 2;

        // BASE_R: the "resting" ring sits just at the edge of the art.
        // The art is 65% of the canvas, so its half-size = 32.5% of canvas.
        // Set BASE_R to 33% so the ring starts right at the art boundary.
        const artHalfSize = Math.min(W, H) * 0.325;
        const BASE_R      = artHalfSize;
        const MAX_WAVE    = Math.min(W, H) * 0.13; // max wave protrusion outward

        // Bass energy (for the ambient glow pulse)
        let bass = 0;
        for (let i = 0; i < 8; i++) bass += freqData[i] / 255;
        bass /= 8;

        // ── LAYER 1: Soft bass-reactive aura glow behind the art ───────────
        ctx.beginPath();
        ctx.arc(cx, cy, BASE_R + bass * 12, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 60, 60, ${0.05 + bass * 0.2})`;
        ctx.lineWidth   = 20;
        ctx.stroke();

        // ── LAYER 2: Time-domain waveform ring ─────────────────────────────
        // 512 uniformly-distributed samples ensure ALL points of the circle move.
        const NUM = analyser.fftSize;

        for (let pass = 0; pass < 2; pass++) {
            ctx.beginPath();
            for (let i = 0; i < NUM; i++) {
                // deviation: -1 (silence low) to +1 (silence high), 0 = true silence
                const deviation = (waveData[i] - 128) / 128;
                const angle     = (i / NUM) * Math.PI * 2 - Math.PI / 2;
                // Only protrude outward (positive deviation = outward bump)
                const r = BASE_R + Math.max(deviation, 0) * MAX_WAVE + bass * 8;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            if (pass === 0) {
                // Wide soft glow (blur-like effect via thick transparent stroke)
                ctx.lineWidth   = 16;
                ctx.strokeStyle = `rgba(255, 60, 60, ${0.06 + bass * 0.12})`;
                ctx.shadowBlur  = 0;
                ctx.stroke();
            } else {
                // Sharp neon core with Red→Violet gradient
                const grad = ctx.createLinearGradient(0, 0, W, H);
                grad.addColorStop(0.0, colors.primary);
                grad.addColorStop(0.5, colors.secondary);
                grad.addColorStop(1.0, colors.primary);
                ctx.lineWidth   = 3;
                ctx.strokeStyle = grad;
                ctx.shadowBlur  = 14;
                ctx.shadowColor = colors.primary;
                ctx.lineJoin    = 'round';
                ctx.stroke();
                ctx.shadowBlur  = 0;
            }
        }

        // ── LAYER 3: Outward particles on beat drops ────────────────────────
        if (bass > 0.42) {
            const angle = Math.random() * Math.PI * 2;
            createParticle(
                cx + Math.cos(angle) * BASE_R,
                cy + Math.sin(angle) * BASE_R,
                cx, cy
            );
        }

        updateAndDrawParticles();
    }
    render();
}

function createParticle(x, y, cx, cy) {
    const angle = Math.atan2(y - cy, x - cx);
    particles.push({
        x, y,
        size:   Math.random() * 2.5 + 0.5,
        speedX: Math.cos(angle) * (Math.random() * 2 + 0.5),
        speedY: Math.sin(angle) * (Math.random() * 2 + 0.5),
        life:   1.0,
        color:  Math.random() > 0.5 ? colors.primary : colors.secondary
    });
}

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.speedX;
        p.y    += p.speedY;
        p.life -= 0.018;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle  = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

window.scrollLyricIntoView = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
