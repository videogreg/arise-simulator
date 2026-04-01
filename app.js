const sideCanvas = document.getElementById('sideView');
const ctxSide = sideCanvas.getContext('2d');
const topCanvas = document.getElementById('topView');
const ctxTop = topCanvas.getContext('2d');

let config = {
    birds: 2400,
    fans: 4,
    baffleDrop: 5,
    extTemp: 90,
    extHum: 85,
    preCoolEffect: 0,
    passiveOpen: false
};

function resize() {
    sideCanvas.width = sideCanvas.clientWidth;
    sideCanvas.height = sideCanvas.clientHeight;
    topCanvas.width = topCanvas.clientWidth;
    topCanvas.height = topCanvas.clientHeight;
    update();
}

function update() {
    const intakeTemp = config.extTemp - config.preCoolEffect;
    
    let totalCFM = config.fans * 22000;
    if (!config.passiveOpen) totalCFM *= 0.93;

    const effectiveArea = 192 * Math.pow((11.5 - config.baffleDrop) / 11.5, 1.3);
    const windChill = totalCFM / effectiveArea;

    const tempRiseTotal = (config.birds * 45) / (1.08 * totalCFM);
    const exitTemp = intakeTemp + tempRiseTotal;
    const ammoniaTotal = ((config.birds * 0.0005) / totalCFM) * 1000000;
    const exitHum = parseFloat(config.extHum) + (config.birds * 0.01 / (totalCFM / 1000));

    document.getElementById('exTemp').innerText = exitTemp.toFixed(1) + "°F";
    document.getElementById('exAmmonia').innerText = ammoniaTotal.toFixed(1) + " ppm";
    document.getElementById('exHum').innerText = Math.min(100, exitHum).toFixed(1) + "%";

    updateViability(exitTemp, ammoniaTotal);
    drawSide(windChill);
    drawTop(intakeTemp, exitTemp, ammoniaTotal, windChill);
}

function updateViability(temp, nh3) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    if (temp > 95 || nh3 > 25) {
        indicator.style.background = "#ff4444";
        text.innerText = "CRITICAL / LETHAL";
        text.style.color = "#ff4444";
    } else if (temp > 88 || nh3 > 15) {
        indicator.style.background = "#ffcc00";
        text.innerText = "WARNING / STRESS";
        text.style.color = "#ffcc00";
    } else {
        indicator.style.background = "#44ffaa";
        text.innerText = "OPTIMAL";
        text.style.color = "#44ffaa";
    }
}

// Support for Mouse AND Touch
function handleInteraction(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    // Support for touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    const x = clientX - rect.left;
    const padding = 60;
    const iw = canvas.width - (padding * 2);
    let pct = Math.max(0, Math.min(1, (x - padding) / iw));

    let totalCFM = config.fans * 22000;
    if (!config.passiveOpen) totalCFM *= 0.93;

    const intakeTemp = config.extTemp - config.preCoolEffect;
    const localT = intakeTemp + ((config.birds * 45) / (1.08 * totalCFM)) * pct;
    const localA = (((config.birds * 0.0005) / totalCFM) * 1000000) * pct;
    const localH = parseFloat(config.extHum) + (config.birds * 0.01 / (totalCFM/1000)) * pct;

    document.getElementById('pTemp').innerText = localT.toFixed(1) + "°F";
    document.getElementById('pAmmonia').innerText = localA.toFixed(1) + " ppm";
    document.getElementById('pHum').innerText = Math.min(100, localH).toFixed(1) + "%";
}

function drawSide(vel) {
    ctxSide.clearRect(0,0,sideCanvas.width,sideCanvas.height);
    const p = 60;
    const iw = sideCanvas.width - (p*2);
    const ih = sideCanvas.height - (p*2);
    ctxSide.fillStyle = `rgba(0, 150, 255, ${Math.min(vel/1000, 0.4)})`;
    ctxSide.fillRect(p, p, iw, ih);
    ctxSide.fillStyle = "#ff4444";
    [0.3, 0.6, 0.9].forEach(pos => {
        ctxSide.fillRect(p + iw*pos, p, 4, ih*(config.baffleDrop/11.5));
    });
}

function drawTop(inT, outT, nh3, vel) {
    ctxTop.clearRect(0,0,topCanvas.width,topCanvas.height);
    const p = 60;
    const iw = topCanvas.width - (p*2);
    const ih = topCanvas.height - (p*2);
    let tGrad = ctxTop.createLinearGradient(p, 0, p+iw, 0);
    tGrad.addColorStop(0, inT > 90 ? '#ff3300' : '#00ffff');
    tGrad.addColorStop(1, outT > 90 ? '#ff3300' : (outT > 85 ? '#ffcc00' : '#00ffaa'));
    ctxTop.globalAlpha = 0.5;
    ctxTop.fillStyle = tGrad;
    ctxTop.fillRect(p, p, iw, ih);
    ctxTop.globalAlpha = 1.0;
    ctxTop.fillStyle = "white";
    for(let i=0; i<30; i++) {
        let x = (p + (i*40 + Date.now()*0.005*vel)) % iw + p;
        ctxTop.beginPath(); ctxTop.arc(x, p+ih/2 + (i%5*20-40), 1.5, 0, Math.PI*2); ctxTop.fill();
    }
}

// Global Listeners with Mobile Touch Support
window.addEventListener('resize', resize);

[sideCanvas, topCanvas].forEach(canvas => {
    canvas.addEventListener('mousedown', (e) => handleInteraction(e, canvas));
    canvas.addEventListener('touchstart', (e) => {
        // e.preventDefault(); // Prevents accidental scrolling while probing
        handleInteraction(e, canvas);
    }, {passive: true});
});

document.getElementById('birdCount').oninput = (e) => { config.birds = e.target.value; document.getElementById('birdCountVal').innerText = e.target.value; update(); };
document.getElementById('fanCount').oninput = (e) => { config.fans = e.target.value; document.getElementById('fanCountVal').innerText = e.target.value; update(); };
document.getElementById('baffleDrop').oninput = (e) => { config.baffleDrop = e.target.value; document.getElementById('baffleVal').innerText = e.target.value; update(); };
document.getElementById('extTemp').oninput = (e) => { config.extTemp = parseFloat(e.target.value); document.getElementById('extTempVal').innerText = e.target.value; update(); };
document.getElementById('extHum').oninput = (e) => { config.extHum = e.target.value; document.getElementById('extHumVal').innerText = e.target.value; update(); };
document.getElementById('preCooling').onchange = (e) => { config.preCoolEffect = parseInt(e.target.value); update(); };
document.getElementById('louverToggle').onclick = (e) => {
    config.passiveOpen = !config.passiveOpen;
    e.target.innerText = config.passiveOpen ? "OPEN" : "CLOSED";
    e.target.classList.toggle('active');
    update();
};

resize();
setInterval(update, 50);