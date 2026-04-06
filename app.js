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
    passiveOpen: false,
    showPaths: false,
    hvlsOn: false,
    hvlsSpeed: 50
};

const BARN_LENGTH = 100;
const EXTENSION_LENGTH = 20;
const TOTAL_LENGTH = BARN_LENGTH + EXTENSION_LENGTH;
const BAFFLES = [0.34, 0.67]; 
const HVLS_POS = [0.17, 0.505, 0.835]; 

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
    
    // Static Pressure Logic: If passive vent is closed, radiators (96sqft) 
    // are the only air path, slightly restricting flow.
    if (!config.passiveOpen) totalCFM *= 0.90; 

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
    drawFacade(); // Updated from drawTop
}

function updateViability(temp, nh3) {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    if (temp > 95 || nh3 > 25) {
        indicator.style.background = "#ff4444"; text.innerText = "CRITICAL"; text.style.color = "#ff4444";
    } else if (temp > 88 || nh3 > 15) {
        indicator.style.background = "#ffcc00"; text.innerText = "STRESS"; text.style.color = "#ffcc00";
    } else {
        indicator.style.background = "#44ffaa"; text.innerText = "OPTIMAL"; text.style.color = "#44ffaa";
    }
}

function drawSide(vel) {
    ctxSide.clearRect(0,0,sideCanvas.width,sideCanvas.height);
    const p = 60;
    const totalW = sideCanvas.width - (p*2);
    const extW = totalW * (EXTENSION_LENGTH / TOTAL_LENGTH);
    const barnW = totalW - extW;
    const ih = sideCanvas.height - (p*2);
    
    // 1. Arch Extension (Hydronic Buffer)
    ctxSide.strokeStyle = "#444"; ctxSide.setLineDash([5, 5]);
    ctxSide.strokeRect(p, p, extW, ih); ctxSide.setLineDash([]);
    ctxSide.fillStyle = "rgba(0, 255, 100, 0.05)"; ctxSide.fillRect(p, p, extW, ih);

    // 2. Barn Interior
    ctxSide.fillStyle = `rgba(0, 150, 255, ${Math.min(vel/1000, 0.3)})`;
    ctxSide.fillRect(p + extW, p, barnW, ih);

    // 3. Passive Vent (Above Radiators)
    if (config.passiveOpen) {
        ctxSide.save(); ctxSide.shadowBlur = 15; ctxSide.shadowColor = "#00d4ff";
        ctxSide.fillStyle = "rgba(0, 212, 255, 0.8)";
        // Located top of intake wall
        ctxSide.fillRect(p + extW - 5, p, 10, ih * 0.15); 
        ctxSide.restore();
    }

    // 4. Radiator Location (Side profile)
    ctxSide.fillStyle = "#333";
    ctxSide.fillRect(p + extW - 3, p + (ih * 0.3), 6, ih * 0.6);

    // 5. HVLS Fans
    const postH = ih * (4 / 11.5);
    HVLS_POS.forEach(pos => {
        const hX = p + extW + barnW * pos;
        ctxSide.strokeStyle = "#666"; ctxSide.beginPath(); ctxSide.moveTo(hX, p); ctxSide.lineTo(hX, p + postH); ctxSide.stroke();
        ctxSide.fillStyle = config.hvlsOn ? "#00d4ff" : "#444"; ctxSide.fillRect(hX - 15, p + postH, 30, 5); 
        if (config.hvlsOn) {
            let g = ctxSide.createLinearGradient(hX, p + postH, hX, p + ih);
            g.addColorStop(0, "rgba(0, 212, 255, 0.1)"); g.addColorStop(1, "rgba(0, 212, 255, 0)");
            ctxSide.fillStyle = g; ctxSide.fillRect(hX - 25, p + postH, 50, ih - postH);
        }
    });

    // 6. Airflow Paths
    if (config.showPaths) {
        ctxSide.strokeStyle = "rgba(255, 255, 255, 0.2)";
        const time = Date.now() * 0.002;
        for (let i = 0; i < 8; i++) {
            ctxSide.beginPath();
            let sY = p + (ih * (i / 7)); ctxSide.moveTo(p, sY);
            for (let x = 0; x <= totalW; x += 15) {
                let cX = p + x, cY = sY, relX = (x - extW) / barnW;
                if (config.hvlsOn && relX > 0) {
                    HVLS_POS.forEach(pos => {
                        const dH = Math.abs(relX - pos) * barnW;
                        if (dH < 60) cY += (p + ih - cY) * (1 - dH/60) * (config.hvlsSpeed/100) * 0.3;
                    });
                }
                if (relX > 0) {
                    BAFFLES.forEach(pos => {
                        const dB = Math.abs(relX - pos) * barnW;
                        if (dB < 40) cY += (p + ih - cY) * ((config.baffleDrop/11.5) * (1 - dB/40)) * 0.8;
                    });
                }
                ctxSide.setLineDash([10, 20]); ctxSide.lineDashOffset = -(time * vel * 0.05) % 30;
                ctxSide.lineTo(cX, Math.min(p + ih, cY));
            }
            ctxSide.stroke();
        }
        ctxSide.setLineDash([]);
    }

    // Baffles
    ctxSide.fillStyle = "#ff4444";
    BAFFLES.forEach(pos => ctxSide.fillRect(p + extW + barnW * pos, p, 4, ih*(config.baffleDrop/11.5)));
}

function drawFacade() {
    ctxTop.clearRect(0,0,topCanvas.width,topCanvas.height);
    const p = 40;
    const w = topCanvas.width - (p*2);
    const h = topCanvas.height - (p*2);
    const scale = w / 25; // 25ft wide barn

    // 1. Draw Barn Arch Outline
    ctxTop.strokeStyle = "#555";
    ctxTop.beginPath();
    ctxTop.moveTo(p, p + h);
    ctxTop.lineTo(p + w, p + h);
    ctxTop.lineTo(p + w, p + h * 0.4);
    ctxTop.quadraticCurveTo(p + w/2, p - 20, p, p + h * 0.4);
    ctxTop.closePath();
    ctxTop.stroke();

    // 2. Central Double Doors (approx 6' wide)
    ctxTop.fillStyle = "#222";
    const doorW = 6 * scale;
    const doorH = 7 * scale;
    ctxTop.fillRect(p + (w - doorW)/2, p + h - doorH, doorW, doorH);

    // 3. Radiator Array (96 sq ft total)
    ctxTop.fillStyle = config.preCoolEffect > 0 ? "#00d4ff" : "#444";
    
    // 6x4 Radiators
    const r64W = 4 * scale;
    const r64H = 6 * scale;
    ctxTop.fillRect(p + (w - doorW)/2 - r64W - 5, p + h - r64H, r64W, r64H); // Left
    ctxTop.fillRect(p + (w + doorW)/2 + 5, p + h - r64H, r64W, r64H); // Right

    // 4x4 Radiators
    const r44W = 4 * scale;
    const r44H = 4 * scale;
    ctxTop.fillRect(p + (w - doorW)/2 - r64W - r44W - 10, p + h - r44H, r44W, r44H); // Far Left
    ctxTop.fillRect(p + (w + doorW)/2 + r64W + 10, p + h - r44H, r44W, r44H); // Far Right

    // 4. Passive Vent (Above doors/radiators)
    ctxTop.strokeStyle = config.passiveOpen ? "#00d4ff" : "#333";
    ctxTop.setLineDash([5, 5]);
    ctxTop.strokeRect(p + (w - 20 * scale)/2, p + h - doorH - 25, 20 * scale, 2 * scale);
    ctxTop.setLineDash([]);
    if (config.passiveOpen) {
        ctxTop.fillStyle = "rgba(0, 212, 255, 0.3)";
        ctxTop.fillRect(p + (w - 20 * scale)/2, p + h - doorH - 25, 20 * scale, 2 * scale);
    }

    // Legend
    ctxTop.fillStyle = "#888"; ctxTop.font = "10px Inter";
    ctxTop.fillText("RADIATOR ARRAY (96 SQ FT)", p, p + h + 20);
}

window.addEventListener('resize', resize);
document.getElementById('birdCount').oninput = (e) => { config.birds = e.target.value; document.getElementById('birdCountVal').innerText = e.target.value; update(); };
document.getElementById('fanCount').oninput = (e) => { config.fans = e.target.value; document.getElementById('fanCountVal').innerText = e.target.value; update(); };
document.getElementById('baffleDrop').oninput = (e) => { config.baffleDrop = e.target.value; document.getElementById('baffleVal').innerText = e.target.value; update(); };
document.getElementById('extTemp').oninput = (e) => { config.extTemp = parseFloat(e.target.value); document.getElementById('extTempVal').innerText = e.target.value; update(); };
document.getElementById('hvlsSpeed').oninput = (e) => { config.hvlsSpeed = e.target.value; document.getElementById('hvlsSpeedVal').innerText = e.target.value; update(); };
document.getElementById('preCooling').onchange = (e) => { config.preCoolEffect = parseInt(e.target.value); update(); };
document.getElementById('hvlsToggle').onclick = (e) => { config.hvlsOn = !config.hvlsOn; e.target.innerText = config.hvlsOn ? "HVLS ON" : "HVLS OFF"; e.target.classList.toggle('active'); update(); };
document.getElementById('louverToggle').onclick = (e) => { config.passiveOpen = !config.passiveOpen; e.target.innerText = config.passiveOpen ? "OPEN" : "CLOSED"; e.target.classList.toggle('active'); update(); };
document.getElementById('pathToggle').onclick = (e) => { config.showPaths = !config.showPaths; e.target.innerText = config.showPaths ? "HIDE PATHS" : "SHOW PATHS"; e.target.classList.toggle('active'); update(); };

resize();
setInterval(update, 50);