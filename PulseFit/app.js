// Initialize Lucide Icons
lucide.createIcons();

// --- STATE MANAGEMENT (LocalStorage) ---
const STORAGE_KEY = 'pulsefit_data';

// Default data structure if empty
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    history: {}, // Format: 'YYYY-MM-DD': { steps, sleep, water, strain, exercises: [] }
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getTodayData = () => {
    const today = getTodayStr();
    if (!appData.history[today]) {
        appData.history[today] = { steps: 0, sleep: 0, water: 0, strain: 0, exercises: [] };
    }
    return appData.history[today];
};

const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateDashboard();
};

// --- UI LOGIC ---

// Set current date
const dateElement = document.getElementById('current-date');
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateElement.textContent = new Date().toLocaleDateString('en-US', options);

// Tab Navigation
const navTabs = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view');

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        const targetView = document.getElementById(tab.dataset.tab);
        targetView.classList.add('active');

        if (tab.dataset.tab === 'analytics') {
            renderCharts();
        } else if (tab.dataset.tab === 'dashboard') {
            updateDashboard();
        }
    });
});

// --- DATA ENTRY FORMS ---

document.getElementById('vitals-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const today = getTodayData();
    today.steps = parseInt(document.getElementById('input-steps').value) || 0;
    today.sleep = parseFloat(document.getElementById('input-sleep').value) || 0;
    today.water = parseFloat(document.getElementById('input-water').value) || 0;
    
    // Calculate daily strain based on steps (simple mock metric)
    // 10000 steps = ~5 strain. Max strain 21.
    let baseStrain = (today.steps / 10000) * 5;
    
    // Add strain from exercises
    let exerciseStrain = today.exercises.reduce((acc, ex) => {
        return acc + (ex.sets * ex.reps * (ex.weight || 10) / 1000);
    }, 0);

    today.strain = Math.min(21, (baseStrain + exerciseStrain).toFixed(1));

    saveData();
    alert('Vitals Saved Successfully!');
});

document.getElementById('workout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const today = getTodayData();
    const exercise = document.getElementById('input-exercise').value;
    const sets = parseInt(document.getElementById('input-sets').value);
    const reps = parseInt(document.getElementById('input-reps').value);
    const weight = parseFloat(document.getElementById('input-weight').value) || 0;

    const exData = { exercise, sets, reps, weight };
    today.exercises.push(exData);
    
    // Re-calculate strain
    let baseStrain = (today.steps / 10000) * 5;
    let exerciseStrain = today.exercises.reduce((acc, ex) => {
        return acc + (ex.sets * ex.reps * (ex.weight || 10) / 1000);
    }, 0);
    today.strain = Math.min(21, (baseStrain + exerciseStrain).toFixed(1));

    saveData();
    renderWorkoutList();
    e.target.reset();
});

const renderWorkoutList = () => {
    const today = getTodayData();
    const list = document.getElementById('workout-list');
    list.innerHTML = '';
    today.exercises.forEach((ex, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${ex.exercise.toUpperCase()}</strong>: ${ex.sets}x${ex.reps} @ ${ex.weight}kg</span>`;
        list.appendChild(li);
    });
};

// --- DASHBOARD UPDATES ---

const updateDashboard = () => {
    const today = getTodayData();
    
    // Update basic metrics
    document.getElementById('dash-steps').textContent = today.steps.toLocaleString();
    document.getElementById('dash-sleep').textContent = `${today.sleep}h`;
    document.getElementById('dash-water').textContent = `${today.water} L`;

    // Pre-fill vitals form
    document.getElementById('input-steps').value = today.steps || '';
    document.getElementById('input-sleep').value = today.sleep || '';
    document.getElementById('input-water').value = today.water || '';
    renderWorkoutList();

    // Calculate Readiness (0-100)
    // Formula: good sleep (8h) + low strain yesterday = high readiness.
    // Since we only have today's simple data, we'll make a composite score.
    // 8 hours sleep = 100 base score. -10 for every hour under 8.
    let readiness = 100;
    if (today.sleep < 8) {
        readiness -= (8 - today.sleep) * 12; 
    }
    // High strain today drops readiness for tomorrow. We'll show today's "Remaining Readiness"
    readiness -= (today.strain * 2);
    
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));

    document.getElementById('readiness-value').textContent = readiness;
    document.getElementById('readiness-path').style.strokeDasharray = `${readiness}, 100`;

    const svg = document.getElementById('readiness-svg');
    const text = document.getElementById('readiness-text');
    svg.className.baseVal = 'circular-chart';
    if (readiness >= 70) {
        svg.classList.add('green');
        text.textContent = "Prime for optimal performance today.";
    } else if (readiness >= 40) {
        svg.classList.add('yellow');
        text.textContent = "Moderate recovery. Keep intensity medium.";
    } else {
        svg.classList.add('red');
        text.textContent = "Low readiness. Focus on active recovery or rest.";
    }

    renderMuscleMap();
};


// --- MUSCLE MAP LOGIC ---
const renderMuscleMap = () => {
    const container = document.getElementById('muscle-map');
    
    // Analyze recent exercises (last 3 days)
    const dates = Object.keys(appData.history).sort().slice(-3);
    const muscleStress = { chest: 0, legs: 0, arms: 0, abs: 0, cardio: 0, back: 0, shoulders: 0 };
    
    dates.forEach(d => {
        appData.history[d].exercises.forEach(ex => {
            if (muscleStress[ex.exercise] !== undefined) {
                muscleStress[ex.exercise] += ex.sets * ex.reps;
            }
        });
    });

    const getColor = (stress) => {
        if (stress > 50) return '#ef4444'; // Exhausted
        if (stress > 20) return '#f59e0b'; // Fatigued
        return '#10b981'; // Fresh
    };

    const svg = `
        <svg viewBox="0 0 100 200" style="height: 100%; max-width: 100%;">
            <!-- Head/Cardio -->
            <circle cx="50" cy="20" r="15" fill="${getColor(muscleStress.cardio)}" />
            <!-- Shoulders -->
            <rect x="25" y="38" width="50" height="10" rx="3" fill="${getColor(muscleStress.shoulders)}" />
            <!-- Chest -->
            <rect x="35" y="48" width="30" height="20" rx="5" fill="${getColor(muscleStress.chest)}" />
            <!-- Back (Lats on sides) -->
            <rect x="30" y="50" width="5" height="30" rx="2" fill="${getColor(muscleStress.back)}" />
            <rect x="65" y="50" width="5" height="30" rx="2" fill="${getColor(muscleStress.back)}" />
            <!-- Abs -->
            <rect x="40" y="70" width="20" height="30" rx="3" fill="${getColor(muscleStress.abs)}" />
            <!-- Arms -->
            <rect x="20" y="48" width="10" height="40" rx="5" fill="${getColor(muscleStress.arms)}" />
            <rect x="70" y="48" width="10" height="40" rx="5" fill="${getColor(muscleStress.arms)}" />
            <!-- Legs -->
            <rect x="35" y="105" width="12" height="60" rx="5" fill="${getColor(muscleStress.legs)}" />
            <rect x="53" y="105" width="12" height="60" rx="5" fill="${getColor(muscleStress.legs)}" />
        </svg>
    `;
    container.innerHTML = svg;
};

// --- CHARTS LOGIC ---
let chartInstances = {};

const renderCharts = () => {
    // Generate an array of the last 30 days
    const dates = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const labels = dates.map(d => d.slice(5)); // MM-DD
    
    const stepsData = [];
    const sleepData = [];
    const waterData = [];
    const strainData = [];

    dates.forEach(d => {
        const dayData = appData.history[d] || { steps: 0, sleep: 0, water: 0, strain: 0 };
        stepsData.push(dayData.steps);
        sleepData.push(dayData.sleep);
        waterData.push(dayData.water);
        strainData.push(dayData.strain);
    });

    // Calculate Averages
    const validDays = dates.filter(d => appData.history[d]);
    const numDays = validDays.length || 1;
    
    const avgSteps = stepsData.reduce((a,b)=>a+b,0) / numDays;
    const avgSleep = sleepData.reduce((a,b)=>a+b,0) / numDays;
    const avgWater = waterData.reduce((a,b)=>a+b,0) / numDays;

    document.getElementById('avg-steps').textContent = Math.round(avgSteps).toLocaleString();
    document.getElementById('avg-sleep').textContent = avgSleep.toFixed(1) + 'h';
    document.getElementById('avg-water').textContent = avgWater.toFixed(1) + ' L';

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    if (chartInstances.correlation) chartInstances.correlation.destroy();
    if (chartInstances.strain) chartInstances.strain.destroy();

    const ctxCorrelation = document.getElementById('correlationChart').getContext('2d');
    chartInstances.correlation = new Chart(ctxCorrelation, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Steps (k)',
                    data: stepsData.map(s => (s/1000).toFixed(1)),
                    borderColor: '#10b981',
                    tension: 0.4
                },
                {
                    label: 'Sleep (hrs)',
                    data: sleepData,
                    borderColor: '#3b82f6',
                    yAxisID: 'y1',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { position: 'left' },
                y1: { position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });

    const ctxStrain = document.getElementById('strainChart').getContext('2d');
    chartInstances.strain = new Chart(ctxStrain, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Strain Score',
                data: strainData,
                backgroundColor: strainData.map(v => v > 14 ? '#ef4444' : v > 10 ? '#f59e0b' : '#10b981')
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
};

// Init
updateDashboard();
