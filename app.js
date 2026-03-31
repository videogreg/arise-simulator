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
    preCoolEffect: 0
};

function update() {
    const intakeTemp = config.extTemp - config.preCoolEffect;
    const totalCFM = config.fans * 22000;
    const effectiveArea = 192 * Math.pow((11.5 - config.baffleDrop) / 11.5, 1.3);
    const windChill = totalCFM / effectiveArea;

    // Exhaust Calculations
    const tempRiseTotal = (config.birds * 45) / (1.08 * totalCFM);
    const exitTemp = intakeTemp + tempRiseTotal;
    const ammoniaTotal = ((config.birds * 0.0005) / totalCFM) * 1000000;

    // Update UI Summary
    document.getElementById('exTemp').innerText = exitTemp.toFixed(1);
    document.getElementById('exAmmonia').innerText = ammoniaTotal.toFixed(1);
    document.getElementById('exHum').innerText = (parseFloat(config.extHum) + (config.birds*0.01/(totalCFM/1000))).toFixed(1);

    // Update Viability Indicator based on Exhaust (Worst Case)
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

function handleCanvasClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 60;
    const iw = canvas.width - (padding * 2);
    let pct = Math.max(0, Math.min(1, (x - padding) / iw));

    const totalCFM = config.fans * 22000;
    const intakeTemp = config.extTemp - config.preCoolEffect;
    
    const localT = intakeTemp + ((config.birds * 45) / (1.08 * totalCFM)) * pct;
    const localA = (((config.birds * 0.0005) / totalCFM) * 1000000) * pct;
    const localH = parseFloat(config.extHum) + (config.birds * 0.01 / (totalCFM/1000)) * pct;

    document.getElementById('pTemp').innerText = localT.toFixed(1);
    document.getElementById('pAmmonia').innerText = localA.toFixed(1);
    document.getElementById('pHum').innerText = Math.min(100, localH).toFixed(1);
}

function drawSide(vel) {
    const w = sideCanvas.width = sideCanvas.offsetWidth;
    const h = sideCanvas.height = sideCanvas.offsetHeight;
    ctxSide.clearRect(0,0,w,h);
    const p = 60;
    ctxSide.fillStyle = `rgba(0, 150, 255, ${Math.min(vel/1000, 0.4)})`;
    ctxSide.fillRect(p, p, w-(p*2), h-(p*2));
    
    ctxSide.fillStyle = "#ff4444";
    [0.3, 0.6, 0.9].forEach(pos => {
        ctxSide.fillRect(p + (w-p*2)*pos, p, 4, (h-p*2)*(config.baffleDrop/11.5));
    });
}

function drawTop(inT, outT, nh3, vel) {
    const w = topCanvas.width = topCanvas.offsetWidth;
    const h = topCanvas.height = topCanvas.offsetHeight;
    ctxTop.clearRect(0,0,w,h);
    const p = 60;
    const iw = w-(p*2);
    const ih = h-(p*2);

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

// Listeners
sideCanvas.addEventListener('mousedown', (e) => handleCanvasClick(e, sideCanvas));
topCanvas.addEventListener('mousedown', (e) => handleCanvasClick(e, topCanvas));
document.getElementById('birdCount').oninput = (e) => { config.birds = e.target.value; document.getElementById('birdCountVal').innerText = e.target.value; update(); };
document.getElementById('fanCount').oninput = (e) => { config.fans = e.target.value; document.getElementById('fanCountVal').innerText = e.target.value; update(); };
document.getElementById('baffleDrop').oninput = (e) => { config.baffleDrop = e.target.value; document.getElementById('baffleVal').innerText = e.target.value; update(); };
document.getElementById('extTemp').oninput = (e) => { config.extTemp = parseFloat(e.target.value); document.getElementById('extTempVal').innerText = e.target.value; update(); };
document.getElementById('preCooling').onchange = (e) => { config.preCoolEffect = parseInt(e.target.value); update(); };

window.onload = update;