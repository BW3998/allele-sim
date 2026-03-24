// ===== DNA BACKGROUND ANIMATION =====
const canvas = document.getElementById('dna-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];
const PARTICLE_COUNT = 60;

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: ['#6366f1', '#a855f7', '#ec4899'][Math.floor(Math.random() * 3)],
        opacity: Math.random() * 0.5 + 0.1,
    });
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = (1 - dist / 120) * 0.08;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
}
drawParticles();

// ===== CHART INSTANCES =====
let barChart = null;
let doughnutChart = null;
let hwChart = null;

// ===== INPUT HELPERS =====
function adjust(id, delta) {
    const input = document.getElementById(id);
    const newVal = Math.max(0, parseInt(input.value || 0) + delta);
    input.value = newVal;
    updateFrequencyPreview();
}

function setMatings(n) {
    document.getElementById('num_matings').value = n;
    document.getElementById('matings_slider').value = n;
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Sync slider and number input
document.getElementById('matings_slider').addEventListener('input', function () {
    document.getElementById('num_matings').value = this.value;
    updatePresetHighlight(parseInt(this.value));
});

document.getElementById('num_matings').addEventListener('input', function () {
    const val = Math.min(5000000, Math.max(1000, parseInt(this.value) || 1000));
    document.getElementById('matings_slider').value = val;
    updatePresetHighlight(val);
});

function updatePresetHighlight(val) {
    const presets = { 10000: 0, 100000: 1, 1000000: 2, 5000000: 3 };
    document.querySelectorAll('.preset-btn').forEach((btn, i) => {
        btn.classList.remove('active');
    });
    const idx = presets[val];
    if (idx !== undefined) {
        document.querySelectorAll('.preset-btn')[idx].classList.add('active');
    }
}

// Update frequency bar on input changes
['num_RR', 'num_Rr', 'num_rr'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateFrequencyPreview);
});

function updateFrequencyPreview() {
    const nRR = parseInt(document.getElementById('num_RR').value) || 0;
    const nRr = parseInt(document.getElementById('num_Rr').value) || 0;
    const nrr = parseInt(document.getElementById('num_rr').value) || 0;

    const totalAlleles = 2 * (nRR + nRr + nrr);
    if (totalAlleles === 0) return;

    const freqR = (2 * nRR + nRr) / totalAlleles;
    const freqr = 1 - freqR;

    const barR = document.getElementById('freqBarR');
    const barr = document.getElementById('freqBarr');

    barR.style.width = `${freqR * 100}%`;
    barr.style.width = `${freqr * 100}%`;
    barR.querySelector('span').textContent = `R: ${(freqR * 100).toFixed(1)}%`;
    barr.querySelector('span').textContent = `r: ${(freqr * 100).toFixed(1)}%`;
}

// ===== SIMULATION =====
async function runSimulation() {
    const btn = document.getElementById('simulateBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    const payload = {
        num_RR: parseInt(document.getElementById('num_RR').value) || 0,
        num_Rr: parseInt(document.getElementById('num_Rr').value) || 0,
        num_rr: parseInt(document.getElementById('num_rr').value) || 0,
        num_matings: parseInt(document.getElementById('num_matings').value) || 100000,
    };

    try {
        const resp = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await resp.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        displayResults(data);
    } catch (err) {
        alert('Simulation failed. Is the server running?');
        console.error(err);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ===== DISPLAY RESULTS =====
function displayResults(data) {
    const section = document.getElementById('resultsSection');
    section.classList.add('visible');

    animateCounter('countRR', data.counts.RR);
    animateCounter('countRr', data.counts.Rr);
    animateCounter('countrr', data.counts.rr);

    document.getElementById('pctRR').textContent = `${data.percentages.RR}%`;
    document.getElementById('pctRr').textContent = `${data.percentages.Rr}%`;
    document.getElementById('pctrr').textContent = `${data.percentages.rr}%`;

    setTimeout(() => {
        document.getElementById('barRR').style.width = `${data.percentages.RR}%`;
        document.getElementById('barRr').style.width = `${data.percentages.Rr}%`;
        document.getElementById('barrr').style.width = `${data.percentages.rr}%`;
    }, 100);

    renderBarChart(data);
    renderDoughnutChart(data);
    renderHWComparison(data);
    renderPunnettSquare(data);

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== ANIMATED NUMBER COUNTER =====
function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    const duration = 1200;
    const start = performance.now();
    const startVal = 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startVal + (target - startVal) * eased);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString();
        }
    }
    requestAnimationFrame(update);
}

// ===== CHART STYLING =====
const chartColors = {
    dominant: '#6366f1',
    dominantBg: 'rgba(99, 102, 241, 0.15)',
    hetero: '#a855f7',
    heteroBg: 'rgba(168, 85, 247, 0.15)',
    recessive: '#ec4899',
    recessiveBg: 'rgba(236, 72, 153, 0.15)',
};

Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;

// ===== BAR CHART =====
function renderBarChart(data) {
    const canvasEl = document.getElementById('barChart');
    if (barChart) barChart.destroy();

    barChart = new Chart(canvasEl, {
        type: 'bar',
        data: {
            labels: ['RR', 'Rr', 'rr'],
            datasets: [{
                label: 'Offspring Count',
                data: [data.counts.RR, data.counts.Rr, data.counts.rr],
                backgroundColor: [
                    chartColors.dominant,
                    chartColors.hetero,
                    chartColors.recessive,
                ],
                borderColor: [
                    chartColors.dominant,
                    chartColors.hetero,
                    chartColors.recessive,
                ],
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a2235',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { family: "'JetBrains Mono', monospace", weight: '600' },
                    bodyFont: { family: "'JetBrains Mono', monospace" },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: ctx => `  ${ctx.parsed.y.toLocaleString()} offspring`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'JetBrains Mono', monospace", weight: '700', size: 14 },
                    },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        font: { family: "'JetBrains Mono', monospace", size: 11 },
                        callback: val => val >= 1000000
                            ? (val / 1000000).toFixed(1) + 'M'
                            : val >= 1000
                                ? (val / 1000).toFixed(0) + 'K'
                                : val,
                    },
                },
            },
        },
    });
}

// ===== DOUGHNUT CHART =====
function renderDoughnutChart(data) {
    const canvasEl = document.getElementById('doughnutChart');
    if (doughnutChart) doughnutChart.destroy();

    doughnutChart = new Chart(canvasEl, {
        type: 'doughnut',
        data: {
            labels: ['RR', 'Rr', 'rr'],
            datasets: [{
                data: [data.percentages.RR, data.percentages.Rr, data.percentages.rr],
                backgroundColor: [
                    chartColors.dominant,
                    chartColors.hetero,
                    chartColors.recessive,
                ],
                borderColor: '#1a2235',
                borderWidth: 3,
                hoverBorderColor: '#f1f5f9',
                hoverBorderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            animation: {
                animateRotate: true,
                duration: 1400,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'JetBrains Mono', monospace", weight: '600', size: 12 },
                        padding: 20,
                    },
                },
                tooltip: {
                    backgroundColor: '#1a2235',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { family: "'JetBrains Mono', monospace", weight: '600' },
                    bodyFont: { family: "'JetBrains Mono', monospace" },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: ctx => `  ${ctx.parsed}%`,
                    },
                },
            },
        },
    });
}

// ===== HARDY-WEINBERG COMPARISON CHART =====
function renderHWComparison(data) {
    const hw = data.hardy_weinberg;

    document.getElementById('hwFreqR').textContent = hw.freq_R;
    document.getElementById('hwFreqr').textContent = hw.freq_r;
    document.getElementById('hwExpRR').textContent = hw.expected_RR;
    document.getElementById('hwExpRr').textContent = hw.expected_Rr;
    document.getElementById('hwExprr').textContent = hw.expected_rr;

    const canvasEl = document.getElementById('hwChart');
    if (hwChart) hwChart.destroy();

    hwChart = new Chart(canvasEl, {
        type: 'bar',
        data: {
            labels: ['RR', 'Rr', 'rr'],
            datasets: [
                {
                    label: 'Observed',
                    data: [data.percentages.RR, data.percentages.Rr, data.percentages.rr],
                    backgroundColor: [
                        chartColors.dominant,
                        chartColors.hetero,
                        chartColors.recessive,
                    ],
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.8,
                    categoryPercentage: 0.6,
                },
                {
                    label: 'Expected (H-W)',
                    data: [hw.expected_RR, hw.expected_Rr, hw.expected_rr],
                    backgroundColor: [
                        chartColors.dominantBg,
                        chartColors.heteroBg,
                        chartColors.recessiveBg,
                    ],
                    borderColor: [
                        chartColors.dominant,
                        chartColors.hetero,
                        chartColors.recessive,
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.8,
                    categoryPercentage: 0.6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    labels: {
                        font: { weight: '600', size: 12 },
                    },
                },
                tooltip: {
                    backgroundColor: '#1a2235',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: ctx => `  ${ctx.dataset.label}: ${ctx.parsed.y}%`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'JetBrains Mono', monospace", weight: '700', size: 14 },
                    },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        font: { family: "'JetBrains Mono', monospace", size: 11 },
                        callback: val => val + '%',
                    },
                    title: {
                        display: true,
                        text: 'Frequency (%)',
                        font: { size: 12, weight: '500' },
                        color: '#64748b',
                    },
                },
            },
        },
    });
}

// ===== PUNNETT SQUARE =====
function renderPunnettSquare(data) {
    const hw = data.hardy_weinberg;
    const p = hw.freq_R;
    const q = hw.freq_r;

    document.getElementById('punnR1').textContent = p.toFixed(2);
    document.getElementById('punnr1').textContent = q.toFixed(2);
    document.getElementById('punnR2').textContent = p.toFixed(2);
    document.getElementById('punnr2').textContent = q.toFixed(2);

    document.getElementById('punnRR').textContent = (p * p * 100).toFixed(2) + '%';
    document.getElementById('punnRr1').textContent = (p * q * 100).toFixed(2) + '%';
    document.getElementById('punnRr2').textContent = (q * p * 100).toFixed(2) + '%';
    document.getElementById('punnrr').textContent = (q * q * 100).toFixed(2) + '%';

    document.querySelectorAll('.punnett-cell').forEach((cell, i) => {
        cell.style.animation = 'none';
        cell.offsetHeight;
        cell.style.animation = `fadeInUp 0.4s ease ${0.1 + i * 0.1}s forwards`;
        cell.style.opacity = '0';
    });
}

// Initial frequency preview
updateFrequencyPreview();
