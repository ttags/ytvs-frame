// ── Shield + audio control (styles injected at runtime) ──────────────
(function initShield() {
    const beat = document.getElementById('bg-beat');
    const shield = document.getElementById('click-shield');
    const btn = document.getElementById('audio-toggle-btn');
    if (!beat || !shield || !btn) return;

// ── Crossfade loop (2 layers, one audible at a time) ─────────────
const URL_SRC = "https://cdn.pixabay.com/audio/2026/01/29/audio_7866a4ba81.mp3";	
const VOL = 0.6, FADE = 5;
const beat2 = new Audio();            // no src yet = no download
beat2.playsInline = true;
const layers = [beat, beat2];
let cur = 0, timer = null;

function tick() {
    const x = layers[cur], y = layers[1 - cur];
    const left = x.duration - x.currentTime;
    if (!(left <= FADE)) return;      // not near the end (or still loading)

    if (y.paused) { y.currentTime = 0; y.volume = 0; y.play().catch(() => {}); }

    const p = 1 - left / FADE;        // 0 -> 1 during the fade
    x.volume = VOL * Math.cos(p * Math.PI / 2);
    y.volume = VOL * Math.sin(p * Math.PI / 2);

    if (p >= 1 || x.ended) { x.pause(); y.volume = VOL; cur = 1 - cur; }
}

function startLoop() {
	layers.forEach(el => {            // load both on demand, first time only
        if (!el.src) { el.preload = 'auto'; el.src = URL_SRC; }
    });
    cur = 0;
    try { beat.currentTime = 0; } catch (e) {}
    beat.volume = VOL;
    beat.play().catch(() => {});
    timer = setInterval(tick, 50);
}

function stopLoop() {
    clearInterval(timer); timer = null;
    layers.forEach(el => {
        el.pause();
        try { el.currentTime = 0; } catch (e) {}
    });
}

    (function _injectStyles() {
        const css = [
            '#click-shield{display:none;position:absolute;inset:0;z-index:5;',
            'background:rgba(0,0,0,.90);cursor:default;',
            'transition:background .4s ease}',
            'body.unlocked-mode #click-shield{display:flex;align-items:center;',
            'justify-content:center}',
            'body.unlocked-mode.audio-on #click-shield{background:transparent}',
            
            '.shield-brand{position:absolute;top:0;left:0;right:0;',
			'display:flex;align-items:center;justify-content:center;gap:10px;',
			'padding:14px 18px;pointer-events:none;min-height:45px;box-sizing:border-box;',
			'background:rgba(0,0,0,.94);',
			'border-bottom:1px solid rgba(255,255,255,.06);',
			'opacity:1;transition:opacity .35s ease}',
            
            '.shield-brand img{height:26px;width:auto;border-radius:999px;',
            'filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))}',
            '.shield-brand-live{font-size:12px;font-weight:800;',
            'letter-spacing:1.5px;color:#FFF;',
            'text-shadow:0 0 8px rgba(255,74,74,.6)}',
            '',

            '#audio-toggle-btn{background:rgba(0,0,0,.78);color:#fff;',
            'border:2px solid rgba(255,255,255,.22);padding:14px 26px;',
            'border-radius:999px;font-size:14px;font-weight:700;',
            "font-family:inherit;cursor:pointer;display:flex;",
            'align-items:center;gap:10px;letter-spacing:.3px;',
            'transition:all .25s ease;backdrop-filter:blur(10px);',
            '-webkit-backdrop-filter:blur(10px)}',
            '#audio-toggle-btn:hover{border-color:rgba(255,255,255,.45);',
            'transform:scale(1.05)}',
            '#audio-toggle-btn:active{transform:scale(.98)}',

'body.unlocked-mode.audio-on #audio-toggle-btn{position:absolute;',
'top:14px;right:14px;padding:6px 10px;font-size:14px;',
'background:rgba(0,0,0,.4);border-width:1px;border-color:transparent;',
'width:32px;height:32px;display:flex;align-items:center;justify-content:center;}',
'body.unlocked-mode.audio-on #audio-toggle-btn .audio-label{display:none}',
            
            
        ].join('');

        const tag = document.createElement('style');
        tag.id = 'ytvs-shield-styles';
        tag.textContent = css;
        document.head.appendChild(tag);
    })();

    // ── Wire the audio toggle ────────────────────────────────────────
    const icon  = btn.querySelector('.audio-icon');
    const label = btn.querySelector('.audio-label');
    let audioOn = false;

    function applyState(on) {
        audioOn = on;
        if (on) {
            document.body.classList.add('audio-on');
            startLoop(); 
            if (icon)  icon.textContent  = '🔇';
            if (label) label.textContent = 'Mute';
            btn.title = 'Pause background audio';
        } else {
            document.body.classList.remove('audio-on');
            stopLoop();
            try { beat.currentTime = 0; } catch (e) {}
            if (icon)  icon.textContent  = '🔊';
            if (label) label.textContent = 'Play with sound';
            btn.title = 'Start background audio';
        }
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        applyState(!audioOn);
    });

[beat, beat2].forEach(el => el.addEventListener('error', () => {
    if (audioOn) applyState(false);
    btn.disabled = true;
    btn.title = 'Background audio unavailable';
}));

    applyState(false);
})();
