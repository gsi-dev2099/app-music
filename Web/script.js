const lyricsData = [
  { "time": 0.0, "text": "I walk a lonely road" },
  { "time": 15.0, "text": "The only one that I have ever known" },
  { "time": 18.5, "text": "Don't know where it goes" },
  { "time": 20.5, "text": "But it's home to me, and I walk alone" },
  { "time": 29.5, "text": "I walk this empty street" },
  { "time": 32.5, "text": "On the boulevard of broken dreams" },
  { "time": 36.0, "text": "Where the city sleeps" },
  { "time": 38.5, "text": "And I'm the only one, and I walk alone" },
  { "time": 44.5, "text": "I walk alone, I walk alone" },
  { "time": 50.5, "text": "I walk alone, I walk a-" },
  { "time": 53.5, "text": "My shadow's the only one that walks beside me" },
  { "time": 59.0, "text": "My shallow heart's the only thing that's beating" },
  { "time": 64.0, "text": "Sometimes I wish someone out there will find me" },
  { "time": 69.5, "text": "'Til then, I walk alone" },
  { "time": 75.5, "text": "Ah, ah, ah, ah" },
  { "time": 81.0, "text": "Ah, ah, ah" },
  { "time": 87.5, "text": "I'm walking down the line" },
  { "time": 90.0, "text": "That divides me somewhere in my mind" },
  { "time": 93.5, "text": "On the borderline" },
  { "time": 96.0, "text": "Of the edge and where I walk alone" },
  { "time": 105.5, "text": "Read between the lines" },
  { "time": 107.5, "text": "What's fucked up, and everything's all right" },
  { "time": 111.5, "text": "Check my vital signs" },
  { "time": 113.5, "text": "To know I'm still alive, and I walk alone" },
  { "time": 119.5, "text": "I walk alone, I walk alone" },
  { "time": 124.5, "text": "I walk alone, I walk a-" },
  { "time": 128.5, "text": "My shadow's the only one that walks beside me" },
  { "time": 133.5, "text": "My shallow heart's the only thing that's beating" },
  { "time": 139.0, "text": "Sometimes I wish someone out there will find me" },
  { "time": 145.0, "text": "'Til then, I walk alone" },
  { "time": 150.5, "text": "Ah, ah, ah, ah" },
  { "time": 157.0, "text": "Ah, ah" },
  { "time": 160.0, "text": "I walk alone, I walk a-" },
  { "time": 188.0, "text": "I walk this empty street" },
  { "time": 191.0, "text": "On the boulevard of broken dreams" },
  { "time": 194.0, "text": "Where the city sleeps" },
  { "time": 196.5, "text": "And I'm the only one, and I walk a-" },
  { "time": 200.5, "text": "My shadow's the only one that walks beside me" },
  { "time": 205.5, "text": "My shallow heart's the only thing that's beating" },
  { "time": 211.5, "text": "Sometimes I wish someone out there will find me" },
  { "time": 217.0, "text": "'Til then, I walk alone" }
];

const audio = document.getElementById('audio-player');
const lyricsContainer = document.getElementById('lyrics');
const playBtn = document.getElementById('play-pause-btn');
const playPath = document.getElementById('play-path');
const pausePath = document.getElementById('pause-path');
const progressBar = document.getElementById('progress-bar-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBg = document.getElementById('progress-bar-bg');

let lyricElements = [];

// Initialize lyrics
function initLyrics() {
    lyricsContainer.innerHTML = '';
    lyricsData.forEach((line, index) => {
        const el = document.createElement('div');
        el.classList.add('lyric-line');
        el.textContent = line.text;
        el.dataset.time = line.time;
        el.addEventListener('click', () => {
            audio.currentTime = line.time;
        });
        lyricsContainer.appendChild(el);
        lyricElements.push(el);
    });
}

// Audio Visualizer Setup
let audioCtx;
let analyser;
let source;
let canvas = document.getElementById('visualizer-canvas');
let ctx = canvas.getContext('2d');
let particles = [];

function initAudioContext() {
    if (audioCtx) return;
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        
        // Ensure CORS is handled
        audio.crossOrigin = "anonymous";
        source = audioCtx.createMediaElementSource(audio);
        
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        function render() {
            if (audio.paused) return requestAnimationFrame(render);
            
            requestAnimationFrame(render);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ... (rest of render logic remains the same)

        // Calculate Bass Intensity (First 10 bins)
        let bass = 0;
        for (let i = 0; i < 10; i++) bass += dataArray[i];
        bass = (bass / 10) / 255;

        // Draw Reactive Glow Ring
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 85 + (bass * 30);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 60, 60, ${0.1 + bass * 0.4})`;
        ctx.lineWidth = 15;
        ctx.stroke();

        // High Frequencies (Treble) for Particles
        let treble = 0;
        for (let i = bufferLength - 20; i < bufferLength; i++) treble += dataArray[i];
        treble = (treble / 20) / 255;

        if (treble > 0.1) {
            createParticle(centerX, centerY, treble);
        }

        updateParticles();
    }
    render();
}

function createParticle(x, y, intensity) {
    particles.push({
        x: x + (Math.random() - 0.5) * 150,
        y: y + (Math.random() - 0.5) * 150,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: -Math.random() * 3 - intensity * 5,
        life: 1.0,
        color: Math.random() > 0.5 ? '#ff3c3c' : '#bb86fc'
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.01;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Play/Pause toggle
playBtn.addEventListener('click', () => {
    if (audio.paused) {
        initAudioContext(); // Initialize context on first interaction
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        audio.play();
        playPath.style.display = 'none';
        pausePath.style.display = 'block';
    } else {
        audio.pause();
        playPath.style.display = 'block';
        pausePath.style.display = 'none';
    }
});

// Sync progress bar and current time
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    const progress = (currentTime / audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(currentTime);

    // Sync lyrics
    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        lyricElements.forEach((el, index) => {
            if (index === activeIndex) {
                if (!el.classList.contains('active')) {
                    el.classList.add('active');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                el.classList.remove('active');
            }
        });
    }
});

// Metadata loaded
audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
});

// Click to seek
progressBg.addEventListener('click', (e) => {
    const rect = progressBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

initLyrics();
