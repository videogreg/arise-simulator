const sideCanvas = document.getElementById('sideView');
const ctxSide = sideCanvas.getContext('2d');
const topCanvas = document.getElementById('topView');
const ctxTop = topCanvas.getContext('2d');

// Constants
const BARN_LENGTH = 100; // ft
const BARN_WIDTH = 25;   // ft
const APEX_HEIGHT = 11.5; // ft
const ARCH_AREA = 192;   // sq ft
const CFM_PER_FAN = 22000; 

let config = {
    birds: 2400,
    fans: 4,
    baffleDrop: 5,
    passiveOpen: false
};

function update() {
    const totalCFM = config.fans * CFM_PER_FAN;
    const baffleFactor = (APEX_HEIGHT - config.baffleDrop) / APEX_HEIGHT;
    const effectiveArea = ARCH_AREA * Math.pow(baffleFactor, 1.2);
    
    const windChill = totalCFM / effectiveArea;
    const totalHeat = config.birds * 40; // BTU/hr
    const tempRise = totalHeat / (1.08 * totalCFM);
    const airEx = (20000 / totalCFM) * 60; // seconds

    document.getElementById('windChill').innerText = Math.round(windChill);
    document.getElementById('tempRise').innerText = tempRise.toFixed(1);
    document.getElementById('airEx').innerText = Math.round(airEx);

    drawSide(windChill);
    drawTop(tempRise);
}

function drawSide(velocity) {
    const w = sideCanvas.width = sideCanvas.offsetWidth;
    const h = sideCanvas.height = sideCanvas.offsetHeight;
    ctxSide.clearRect(0,0,w,h);

    // Draw Barn Outline
    ctxSide.strokeStyle = '#666';
    ctxSide.strokeRect(50, 50, w-100, h-100);

    // Draw Baffles
    ctxSide.fillStyle = '#ff0000';
    [0.33, 0.66].forEach(pos => {
        let x = 50 + (w-100) * pos;
        ctxSide.fillRect(x, 50, 2, (h-100) * (config.baffleDrop / APEX_HEIGHT));
    });

    // Draw Airflow Gradient
    let grad = ctxSide.createLinearGradient(50, 0, w-100, 0);
    // Color mapping: Higher velocity = Brighter Blue
    let colorIntensity = Math.min(velocity / 10, 255);
    grad.addColorStop(0, `rgba(0, 150, 255, 0.2)`);
    grad.addColorStop(1, `rgba(0, ${colorIntensity}, 255, 0.8)`);
    
    ctxSide.fillStyle = grad;
    ctxSide.fillRect(50, 50, w-100, h-100);

    // Dead Zones (Behind baffles)
    ctxSide.fillStyle = 'rgba(255, 165, 0, 0.4)'; // Orange stagnant zones
    [0.33, 0.66].forEach(pos => {
        let x = 50 + (w-100) * pos;
        ctxSide.fillRect(x + 2, 50, 40, (h-100) * (config.baffleDrop / APEX_HEIGHT));
    });
}

function drawTop(tRise) {
    const w = topCanvas.width = topCanvas.offsetWidth;
    const h = topCanvas.height = topCanvas.offsetHeight;
    ctxTop.clearRect(0,0,w,h);

    // Heat Gradient from Intake (Left) to Fans (Right)
    let heatGrad = ctxTop.createLinearGradient(50, 0, w-50, 0);
    heatGrad.addColorStop(0, '#00f'); // Cool intake
    let heatColor = tRise > 5 ? '#f00' : '#ff0'; // Red if high delta, Yellow if low
    heatGrad.addColorStop(1, heatColor);

    ctxTop.fillStyle = heatGrad;
    ctxTop.globalAlpha = 0.6;
    ctxTop.fillRect(50, 50, w-100, h-100);
}

// Event Listeners
document.getElementById('birdCount').oninput = (e) => { 
    config.birds = e.target.value; 
    document.getElementById('birdCountVal').innerText = config.birds;
    update(); 
};
document.getElementById('fanCount').oninput = (e) => { 
    config.fans = e.target.value; 
    document.getElementById('fanCountVal').innerText = config.fans;
    update(); 
};
document.getElementById('baffleDrop').oninput = (e) => { 
    config.baffleDrop = e.target.value; 
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