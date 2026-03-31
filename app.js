const sideCanvas = document.getElementById('sideView');
const ctxSide = sideCanvas.getContext('2d');
const topCanvas = document.getElementById('topView');
const ctxTop = topCanvas.getContext('2d');

// Fixed Barn Specifications
const BARN_LENGTH = 100; 
const BARN_WIDTH = 25;   
const APEX_HEIGHT = 11.5; 
const ARCH_AREA = 192;   
const VOLUME = 20000;
const CFM_PER_FAN = 22000; 

let config = {
    birds: 2400,
    fans: 4,
    baffleDrop: 5,
    passiveOpen: false
};

function update() {
    // 1. Calculate Core Metrics
    let totalCFM = config.fans * CFM_PER_FAN;
    
    // Adjust CFM for Static Pressure if louver is closed
    if (!config.passiveOpen) totalCFM *= 0.95; 

    const baffleFactor = (APEX_HEIGHT - config.baffleDrop) / APEX_HEIGHT;
    const effectiveArea = ARCH_AREA * Math.pow(baffleFactor, 1.3);
    
    const windChill = totalCFM / effectiveArea;
    const totalHeatBTU = config.birds * 45; // 45 BTU/hr sensible heat per bird
    const tempRise = totalHeatBTU / (1.08 * totalCFM);
    const airEx = (VOLUME / totalCFM) * 60;
    
    // Static Pressure approximation (Pa)
    const intakeArea = config.passiveOpen ? 136 : 96;
    const faceVelocity = (totalCFM / intakeArea) / 196.85; // fpm to m/s
    const staticPressure = 1.5 * Math.pow(faceVelocity, 2);

    // 2. Update UI Metrics
    document.getElementById('windChill').innerText = Math.round(windChill);
    document.getElementById('tempRise').innerText = tempRise.toFixed(1);
    document.getElementById('airEx').innerText = Math.round(airEx);
    document.getElementById('statPres').innerText = Math.round(staticPressure);

    // 3. Render Visuals
    drawSide(windChill);
    drawTop(tempRise, windChill);
}

function drawSide(velocity) {
    const w = sideCanvas.width = sideCanvas.offsetWidth;
    const h = sideCanvas.height = sideCanvas.offsetHeight;
    ctxSide.clearRect(0,0,w,h);

    const padding = 60;
    const innerW = w - (padding * 2);
    const innerH = h - (padding * 2);

    // Draw Barn Background Flow
    let flowGrad = ctxSide.createLinearGradient(padding, 0, padding + innerW, 0);
    let intensity = Math.min(velocity / 1000, 1);
    flowGrad.addColorStop(0, `rgba(0, 100, 255, 0.1)`);
    flowGrad.addColorStop(1, `rgba(0, 200, 255, ${0.2 + intensity * 0.5})`);
    
    ctxSide.fillStyle = flowGrad;
    ctxSide.fillRect(padding, padding, innerW, innerH);

    // Draw Baffles
    ctxSide.fillStyle = "#ff4444";
    [0.33, 0.66].forEach(pos => {
        let bx = padding + (innerW * pos);
        let bHeight = innerH * (config.baffleDrop / APEX_HEIGHT);
        ctxSide.fillRect(bx, padding, 4, bHeight);
        
        // Draw Dead Zone behind baffle
        let deadZoneGrad = ctxSide.createLinearGradient(bx, 0, bx + 60, 0);
        deadZoneGrad.addColorStop(0, 'rgba(255, 150, 0, 0.4)');
        deadZoneGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctxSide.fillStyle = deadZoneGrad;
        ctxSide.fillRect(bx + 4, padding, 60, bHeight);
    });

    // Draw Ground Level (Bird Level)
    ctxSide.fillStyle = "#333";
    ctxSide.fillRect(padding, padding + innerH - 5, innerW, 5);

    // Barn Labels
    ctxSide.fillStyle = "#888";
    ctxSide.font = "12px Arial";
    ctxSide.fillText("INTAKE (RADIATORS)", padding, padding - 10);
    ctxSide.fillText("EXHAUST FANS", padding + innerW - 80, padding - 10);
}

function drawTop(tRise, velocity) {
    const w = topCanvas.width = topCanvas.offsetWidth;
    const h = topCanvas.height = topCanvas.offsetHeight;
    ctxTop.clearRect(0,0,w,h);

    const padding = 60;
    const innerW = w - (padding * 2);
    const innerH = h - (padding * 2);

    // 1. Dynamic Thermal Gradient (Heat Accumulation)
    let thermalGrad = ctxTop.createLinearGradient(padding, 0, padding + innerW, 0);
    thermalGrad.addColorStop(0, '#0066ff'); // Cool Start
    
    // Midpoint color based on temp rise
    let midColor = tRise > 2.5 ? '#ffcc00' : '#00ffaa';
    thermalGrad.addColorStop(0.6, midColor);
    
    // End color
    let endColor = tRise > 5 ? '#ff3300' : (tRise > 2 ? '#ff9900' : '#00ffaa');
    thermalGrad.addColorStop(1, endColor);

    ctxTop.fillStyle = thermalGrad;
    ctxTop.globalAlpha = 0.6;
    ctxTop.fillRect(padding, padding, innerW, innerH);
    ctxTop.globalAlpha = 1.0;

    // 2. Draw Birds (White dots)
    ctxTop.fillStyle = "rgba(255, 255, 255, 0.4)";
    let birdDensity = Math.floor(config.birds / 15);
    for(let i=0; i<birdDensity; i++) {
        let rx = padding + (Math.random() * innerW);
        let ry = padding + (Math.random() * innerH);
        ctxTop.beginPath();
        ctxTop.arc(rx, ry, 1.2, 0, Math.PI*2);
        ctxTop.fill();
    }

    // 3. Draw Airflow Vectors
    ctxTop.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctxTop.lineWidth = 1;
    let spacing = 50;
    for(let x = padding + 20; x < padding + innerW; x += spacing) {
        for(let y = padding + 20; y < padding + innerH; y += 40) {
            ctxTop.beginPath();
            ctxTop.moveTo(x, y);
            ctxTop.lineTo(x + (velocity/100), y);
            ctxTop.stroke();
        }
    }
}

// Listeners
document.getElementById('birdCount').oninput = (e) => {
    config.birds = parseInt(e.target.value);
    document.getElementById('birdCountVal').innerText = config.birds;
    update();
};
document.getElementById('fanCount').oninput = (e) => {
    config.fans = parseInt(e.target.value);
    document.getElementById('fanCountVal').innerText = config.fans;
    update();
};
document.getElementById('baffleDrop').oninput = (e) => {
    config.baffleDrop = parseFloat(e.target.value);
    document.getElementById('baffleVal').innerText = config.baffleDrop;
    update();
};
document.getElementById('louverToggle').onclick = (e) => {
    config.passiveOpen = !config.passiveOpen;
    e.target.innerText = config.passiveOpen ? "OPEN" : "CLOSED";
    e.target.classList.toggle('active');
    update();
};

window.onload = update;
window.onresize = update;