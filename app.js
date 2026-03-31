const sideCanvas = document.getElementById('sideView');
const ctxSide = sideCanvas.getContext('2d');
const topCanvas = document.getElementById('topView');
const ctxTop = topCanvas.getContext('2d');

// Fixed Barn Specifications
const BARN_LENGTH = 100; 
const APEX_HEIGHT = 11.5; 
const ARCH_AREA = 192;   
const VOLUME = 20000;
const CFM_PER_FAN = 22000; 

let config = {
    birds: 2400,
    fans: 4,
    baffleDrop: 5,
    passiveOpen: false,
    extTemp: 90,
    extHum: 85,
    preCoolEffect: 0
};

function update() {
    // 1. Intake Temperature Calculation (Pre-Cooling)
    let intakeTemp = config.extTemp - config.preCoolEffect;
    
    // 2. Airflow Metrics
    let totalCFM = config.fans * CFM_PER_FAN;
    if (!config.passiveOpen) totalCFM *= 0.93; // Resistance factor

    const effectiveArea = ARCH_AREA * Math.pow((APEX_HEIGHT - config.baffleDrop) / APEX_HEIGHT, 1.3);
    const windChill = totalCFM / effectiveArea;
    
    // 3. Thermal & Ammonia Accumulation
    const totalHeatBTU = config.birds * 45; 
    const tempRise = totalHeatBTU / (1.08 * totalCFM);
    const exitTemp = intakeTemp + tempRise;

    // Ammonia: Approx 0.02 CFM of NH3 per bird at 2400 density
    // ppm = (V_nh3 / V_air) * 1,000,000
    const ammoniaPPM = ((config.birds * 0.0005) / totalCFM) * 1000000;

    // 4. Update UI
    document.getElementById('windChill').innerText = Math.round(windChill);
    document.getElementById('tempRise').innerText = tempRise.toFixed(1);
    document.getElementById('ammonia').innerText = ammoniaPPM.toFixed(1);
    document.getElementById('airEx').innerText = Math.round((VOLUME / totalCFM) * 60);

    drawSide(windChill);
    drawTop(intakeTemp, exitTemp, ammoniaPPM, windChill);
}

function drawSide(velocity) {
    const w = sideCanvas.width = sideCanvas.offsetWidth;
    const h = sideCanvas.height = sideCanvas.offsetHeight;
    ctxSide.clearRect(0,0,w,h);
    const p = 50; // padding

    // Flow Visualization
    let grad = ctxSide.createLinearGradient(p, 0, w-p, 0);
    grad.addColorStop(0, 'rgba(0, 150, 255, 0.1)');
    grad.addColorStop(1, `rgba(0, 200, 255, ${Math.min(velocity/800, 0.8)})`);
    ctxSide.fillStyle = grad;
    ctxSide.fillRect(p, p, w-(p*2), h-(p*2));

    // Baffles
    ctxSide.fillStyle = "#ff4444";
    [0.3, 0.6, 0.9].forEach(pos => {
        let x = p + (w-(p*2)) * pos;
        ctxSide.fillRect(x, p, 3, (h-(p*2)) * (config.baffleDrop / APEX_HEIGHT));
    });
}

function drawTop(inT, outT, nh3, vel) {
    const w = topCanvas.width = topCanvas.offsetWidth;
    const h = topCanvas.height = topCanvas.offsetHeight;
    ctxTop.clearRect(0,0,w,h);
    const p = 50;
    const iw = w-(p*2);
    const ih = h-(p*2);

    // 1. Thermal Gradient
    let tGrad = ctxTop.createLinearGradient(p, 0, p+iw, 0);
    // Dynamic color mapping based on Temp
    const getTempColor = (t) => {
        if (t < 80) return '#00ffff';
        if (t < 90) return '#ffff00';
        return '#ff3300';
    };
    tGrad.addColorStop(0, getTempColor(inT));
    tGrad.addColorStop(1, getTempColor(outT));
    
    ctxTop.globalAlpha = 0.5;
    ctxTop.fillStyle = tGrad;
    ctxTop.fillRect(p, p, iw, ih);

    // 2. Ammonia Haze (Green Overlay)
    // Becomes more opaque toward the fan end
    let aGrad = ctxTop.createLinearGradient(p, 0, p+iw, 0);
    let nh3Alpha = Math.min(nh3 / 25, 0.6); // Cap visual at 25ppm
    aGrad.addColorStop(0, 'rgba(0, 255, 0, 0)');
    aGrad.addColorStop(1, `rgba(150, 255, 0, ${nh3Alpha})`);
    ctxTop.fillStyle = aGrad;
    ctxTop.fillRect(p, p, iw, ih);

    // 3. Laminar Flow Particles
    ctxTop.globalAlpha = 1.0;
    ctxTop.fillStyle = "white";
    let time = Date.now() * 0.002;
    for (let i = 0; i < 40; i++) {
        let speed = (vel / 400);
        let x = (p + (i * 30 + time * speed * 20)) % (iw) + p;
        let y = p + (Math.sin(x * 0.05) * 10) + (ih/2) + (i % 5 * 20 - 40);
        ctxTop.beginPath();
        ctxTop.arc(x, y, 1.5, 0, Math.PI*2);
        ctxTop.fill();
    }

    // Labels
    ctxTop.fillStyle = "white";
    ctxTop.font = "10px Arial";
    ctxTop.fillText(`In: ${inT}°F`, p, p-10);
    ctxTop.fillText(`Out: ${outT.toFixed(1)}°F`, p+iw-50, p-10);
}

// Event Listeners
document.getElementById('birdCount').oninput = (e) => { config.birds = e.target.value; document.getElementById('birdCountVal').innerText = e.target.value; update(); };
document.getElementById('fanCount').oninput = (e) => { config.fans = e.target.value; document.getElementById('fanCountVal').innerText = e.target.value; update(); };
document.getElementById('baffleDrop').oninput = (e) => { config.baffleDrop = e.target.value; document.getElementById('baffleVal').innerText = e.target.value; update(); };
document.getElementById('extTemp').oninput = (e) => { config.extTemp = parseFloat(e.target.value); document.getElementById('extTempVal').innerText = e.target.value; update(); };
document.getElementById('extHum').oninput = (e) => { config.extHum = e.target.value; document.getElementById('extHumVal').innerText = e.target.value; update(); };
document.getElementById('preCooling').onchange = (e) => { config.preCoolEffect = parseInt(e.target.value); update(); };
document.getElementById('louverToggle').onclick = (e) => { config.passiveOpen = !config.passiveOpen; e.target.innerText = config.passiveOpen ? "OPEN" : "CLOSED"; e.target.classList.toggle('active'); update(); };

window.onload = update;