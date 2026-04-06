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

// Barn Geometry Constants
const BARN_LENGTH = 100;
const EXTENSION_LENGTH = 20;
const TOTAL_LENGTH = BARN_LENGTH + EXTENSION_LENGTH;
// Baffle positions from BACK (exit wall): 33' and 66'. 
// In 0-100' coordinates from front: 100-33=67 and 100-66=34.
const BAFFLES = [0.34, 0.67]; 
// HVLS centered between wall-baffle, baffle-baffle, baffle-wall
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
        indicator.style.background = "#ff4444"; text.innerText = "CRITICAL / LETHAL"; text.style.color = "#ff4444";
    } else if (temp > 88 || nh3 > 15) {
        indicator.style.background = "#ffcc00"; text.innerText = "WARNING / STRESS"; text.style.color = "#ffcc00";
    } else {
        indicator.style.background = "#44ffaa"; text.innerText = "OPTIMAL"; text.style.color = "#44ffaa";
    }
}

function handleInteraction(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const padding = 60;
    const barnStartX = padding + (canvas.width - padding*2) * (EXTENSION_LENGTH / TOTAL_LENGTH);
    const iw = canvas.width - padding - barnStartX;
    
    let pct = Math.max(0, Math.min(1, (x - barnStartX) / iw));

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
    const totalW = sideCanvas.width - (p*2);
    const extW = totalW * (EXTENSION_LENGTH / TOTAL_LENGTH);
    const barnW = totalW - extW;
    const ih = sideCanvas.height - (p*2);
    
    // 1. Draw Extension (Garden Arch)
    ctxSide.strokeStyle = "#444";
    ctxSide.setLineDash([5, 5]);
    ctxSide.strokeRect(p, p, extW, ih);
    ctxSide.setLineDash([]);
    ctxSide.fillStyle = "rgba(0, 255, 100, 0.1)";
    ctxSide.fillRect(p, p, extW, ih);

    // 2. Draw Barn Main Body
    ctxSide.fillStyle = `rgba(0, 150, 255, ${Math.min(vel/1000, 0.4)})`;
    ctxSide.fillRect(p + extW, p, barnW, ih);

    // 3. HVLS Fans (Located on 4' posts from 11' ceiling)
    const postHeight = ih * (4 / 11.5);
    HVLS_POS.forEach(pos => {
        const hX = p + extW + barnW * pos;
        // Post
        ctxSide.strokeStyle = "#666";
        ctxSide.beginPath(); ctxSide.moveTo(hX, p); ctxSide.lineTo(hX, p + postHeight); ctxSide.stroke();
        // Fan Unit
        ctxSide.fillStyle = config.hvlsOn ? "#00d4ff" : "#444";
        ctxSide.fillRect(hX - 15, p + postHeight, 30, 5); 
        if (config.hvlsOn) {
            let grad = ctxSide.createLinearGradient(hX, p + postHeight, hX, p + ih);
            grad.addColorStop(0, "rgba(0, 212, 255, 0.2)");
            grad.addColorStop(1, "rgba(0, 212, 255, 0)");
            ctxSide.fillStyle = grad;
            ctxSide.fillRect(hX - 25, p + postHeight, 50, ih - postHeight);
        }
    });

    // 4. Airflow Paths
    if (config.showPaths) {
        ctxSide.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctxSide.lineWidth = 1;
        const numLines = 10;
        const time = Date.now() * 0.002;

        for (let i = 0; i < numLines; i++) {
            ctxSide.beginPath();
            let startY = p + (ih * (i / (numLines - 1)));
            ctxSide.moveTo(p, startY);

            for (let x = 0; x <= totalW; x += 15) {
                let currentX = p + x;
                let currentY = startY;
                let relativeX = (x - extW) / barnW;

                if (config.hvlsOn && relativeX > 0) {
                    HVLS_POS.forEach(pos => {
                        const distH = Math.abs(relativeX - pos) * barnW;
                        if (distH < 60) {
                            const force = (1 - distH / 60) * (config.hvlsSpeed / 100);
                            currentY += (p + ih - currentY) * force * 0.3;
                        }
                    });
                }

                if (relativeX > 0) {
                    BAFFLES.forEach(pos => {
                        const distB = Math.abs(relativeX - pos) * barnW;
                        if (distB < 40) {
                            const pinch = (config.baffleDrop / 11.5) * (1 - distB / 40);
                            currentY += (p + ih - currentY) * pinch * 0.8;
                        }
                    });
                }

                const dashOffset = (time * vel * 0.05) % 40;
                ctxSide.setLineDash([15, 25]);
                ctxSide.lineDashOffset = -dashOffset;
                ctxSide.lineTo(currentX, Math.min(p + ih, currentY));
            }
            ctxSide.stroke();
        }
        ctxSide.setLineDash([]);
    }

    // 5. Passive Vent (Exit Wall)
    if (config.passiveOpen) {
        const ventY = p + ih - (ih * (7 / 11.5)); 
        ctxSide.save();
        ctxSide.shadowBlur = 20;
        ctxSide.shadowColor = "#00d4ff";
        ctxSide.fillStyle = "rgba(0, 212, 255, 0.6)";
        ctxSide.fillRect(p + totalW - 5, ventY - (ih*(2/11.5)), 10, ih*(2/11.5));
        ctxSide.restore();
    }

    // 6. Baffles (Now only 2)
    ctxSide.fillStyle = "#ff4444";
    BAFFLES.forEach(pos => {
        ctxSide.fillRect(p + extW + barnW * pos, p, 4, ih*(config.baffleDrop/11.5));
    });
}

function drawTop(inT, outT, nh3, vel) {
    ctxTop.clearRect(0,0,topCanvas.width,topCanvas.height);
    const p = 60; 
    const totalW = topCanvas.width - (p*2);
    const extW = totalW * (EXTENSION_LENGTH / TOTAL_LENGTH);
    const barnW = totalW - extW;
    const ih = topCanvas.height - (p*2);

    // Extension Zone
    ctxTop.fillStyle = "rgba(0, 255, 100, 0.05)";
    ctxTop.fillRect(p, p, extW, ih);
    
    // Heat Gradient in Barn
    let tGrad = ctxTop.createLinearGradient(p + extW, 0, p + totalW, 0);
    tGrad.addColorStop(0, inT > 90 ? '#ff3300' : '#00ffff');
    tGrad.addColorStop(1, outT > 90 ? '#ff3300' : (outT > 85 ? '#ffcc00' : '#00ffaa'));
    ctxTop.globalAlpha = 0.5; ctxTop.fillStyle = tGrad; 
    ctxTop.fillRect(p + extW, p, barnW, ih); 
    ctxTop.globalAlpha = 1.0;
    
    // HVLS Circles
    HVLS_POS.forEach(pos => {
        ctxTop.strokeStyle = config.hvlsOn ? "rgba(0, 212, 255, 0.8)" : "#333";
        ctxTop.beginPath();
        ctxTop.arc(p + extW + barnW*pos, p + ih/2, ih*0.2, 0, Math.PI*2);
        ctxTop.stroke();
    });
}

window.addEventListener('resize', resize);
[sideCanvas, topCanvas].forEach(canvas => {
    canvas.addEventListener('mousedown', (e) => handleInteraction(e, canvas));
    canvas.addEventListener('touchstart', (e) => handleInteraction(e, canvas), {passive: true});
});

document.getElementById('birdCount').oninput = (e) => { config.birds = e.target.value; document.getElementById('birdCountVal').innerText = e.target.value; update(); };
document.getElementById('fanCount').oninput = (e) => { config.fans = e.target.value; document.getElementById('fanCountVal').innerText = e.target.value; update(); };
document.getElementById('baffleDrop').oninput = (e) => { config.baffleDrop = e.target.value; document.getElementById('baffleVal').innerText = e.target.value; update(); };
document.getElementById('extTemp').oninput = (e) => { config.extTemp = parseFloat(e.target.value); document.getElementById('extTempVal').innerText = e.target.value; update(); };
document.getElementById('extHum').oninput = (e) => { config.extHum = e.target.value; document.getElementById('extHumVal').innerText = e.target.value; update(); };
document.getElementById('hvlsSpeed').oninput = (e) => { config.hvlsSpeed = e.target.value; document.getElementById('hvlsSpeedVal').innerText = e.target.value; update(); };
document.getElementById('preCooling').onchange = (e) => { config.preCoolEffect = parseInt(e.target.value); update(); };

document.getElementById('hvlsToggle').onclick = (e) => {
    config.hvlsOn = !config.hvlsOn;
    e.target.innerText = config.hvlsOn ? "HVLS ON" : "HVLS OFF";
    e.target.classList.toggle('active');
    update();
};

document.getElementById('louverToggle').onclick = (e) => {
    config.passiveOpen = !config.passiveOpen;
    e.target.innerText = config.passiveOpen ? "OPEN" : "CLOSED";
    e.target.classList.toggle('active');
    update();
};

document.getElementById('pathToggle').onclick = (e) => {
    config.showPaths = !config.showPaths;
    e.target.innerText = config.showPaths ? "HIDE PATHS" : "SHOW PATHS";
    e.target.classList.toggle('active');
    update();
};

resize();
setInterval(update, 50);