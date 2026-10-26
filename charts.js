/**
 * Invisible Habits, Visible Energy - Data Visualization Engine (charts.js)
 * Standalone, pure browser graphics engine using Chart.js, D3.js, and HTML5 Canvas.
 * Supports real-time running cohort phase-space, circadian streamgraphs, polar clocks,
 * living Sankey flows, and 3D isometric dashboard graphics.
 */

// Global storage for Chart.js instances
const chartInstances = {};

// Cleanly destroy existing Chart.js instances to avoid memory leaks
function destroyChart(chartId) {
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
    delete chartInstances[chartId];
  }
}

// Current theme palette resolution
function getThemeColors() {
  const isDark = document.body.classList.contains('dark-mode');
  return {
    isDark,
    tealPrimary: '#0d9488',
    tealLight: isDark ? 'rgba(13, 148, 136, 0.25)' : 'rgba(20, 184, 166, 0.15)',
    tealAccent: '#14b8a6',
    orangePrimary: '#f97316',
    orangeLight: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.15)',
    orangeAccent: '#fb923c',
    purplePrimary: '#8b5cf6',
    purpleLight: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.15)',
    emeraldPrimary: '#10b981',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    borderSubtle: isDark ? '#334155' : '#e2e8f0',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#1e293b' : '#ffffff'
  };
}

// Sparkline SVG renderer
function renderSparklineSVG(containerId, data, color = '#0d9488') {
  const container = document.getElementById(containerId);
  if (!container || !data || data.length === 0) return;

  const width = container.clientWidth || 100;
  const height = container.clientHeight || 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
      <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
    </svg>
  `;
}

// ==========================================================================
// 1. SAAS BENTO SHOWCASE: 3D PRODUCT DASHBOARD GRAPHIC
// ==========================================================================
function render3DProductDashboardGraphic() {
  const canvas = document.getElementById('bento3DCanvas');
  const stage = document.getElementById('bento3DStage');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const displayW = 680;
  const displayH = 260;

  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;
  ctx.scale(dpr, dpr);

  function drawScene() {
    ctx.clearRect(0, 0, displayW, displayH);

    ctx.save();
    ctx.translate(displayW / 2, displayH / 2 + 10);

    // Isometric transformation
    ctx.transform(1, 0.18, -0.45, 0.85, 0, 0);

    // Draw Floor Grid
    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;

    for (let x = -240; x <= 240; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, -90);
      ctx.lineTo(x, 70);
      ctx.stroke();
    }
    for (let y = -90; y <= 70; y += 25) {
      ctx.beginPath();
      ctx.moveTo(-240, y);
      ctx.lineTo(240, y);
      ctx.stroke();
    }

    // Volumetric 3D Bars
    const bars = [
      { x: -210, h: 65, color: '#10b981', light: '#a7f3d0' },
      { x: -160, h: 95, color: '#8b5cf6', light: '#c084fc' },
      { x: -110, h: 50, color: '#10b981', light: '#a7f3d0' },
      { x: -60,  h: 120, color: '#8b5cf6', light: '#c084fc' },
      { x: -10,  h: 145, color: '#10b981', light: '#a7f3d0' },
      { x: 40,   h: 80, color: '#8b5cf6', light: '#c084fc' },
      { x: 90,   h: 130, color: '#10b981', light: '#a7f3d0' },
      { x: 140,  h: 110, color: '#8b5cf6', light: '#c084fc' },
      { x: 190,  h: 155, color: '#10b981', light: '#a7f3d0' }
    ];

    bars.forEach(b => {
      const barW = 24;
      const barH = b.h;
      const bx = b.x;
      const by = 20;

      // Front Face
      const grad = ctx.createLinearGradient(0, by - barH, 0, by);
      grad.addColorStop(0, b.light);
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by - barH, barW, barH);

      // Top Isometric Cap
      ctx.fillStyle = b.light;
      ctx.beginPath();
      ctx.moveTo(bx, by - barH);
      ctx.lineTo(bx + 8, by - barH - 8);
      ctx.lineTo(bx + barW + 8, by - barH - 8);
      ctx.lineTo(bx + barW, by - barH);
      ctx.closePath();
      ctx.fill();

      // Right 3D Side
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(bx + barW, by - barH);
      ctx.lineTo(bx + barW + 8, by - barH - 8);
      ctx.lineTo(bx + barW + 8, by - 8);
      ctx.lineTo(bx + barW, by);
      ctx.closePath();
      ctx.fill();
    });

    // 3D Glowing Spline Curve Floating Above
    ctx.beginPath();
    ctx.lineWidth = 3.5;
    const splineGrad = ctx.createLinearGradient(-220, 0, 200, 0);
    splineGrad.addColorStop(0, '#8b5cf6');
    splineGrad.addColorStop(0.5, '#10b981');
    splineGrad.addColorStop(1, '#c084fc');
    ctx.strokeStyle = splineGrad;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;

    ctx.moveTo(-210, -55);
    ctx.bezierCurveTo(-120, -140, -40, -40, -10, -135);
    ctx.bezierCurveTo(30, -70, 100, -150, 190, -150);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Glowing Node Points
    const nodes = [
      { x: -210, y: -55 },
      { x: -10, y: -135 },
      { x: 190, y: -150 }
    ];

    nodes.forEach(n => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    ctx.restore();
  }

  drawScene();

  if (stage && !stage._tiltAttached) {
    stage._tiltAttached = true;
    stage.addEventListener('mousemove', (e) => {
      const b = stage.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5;
      const y = (e.clientY - b.top) / b.height - 0.5;
      stage.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    stage.addEventListener('mouseleave', () => {
      stage.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }
}

// ==========================================================================
// 2. TAB 3: COHORT SUMMARY & DYNAMIC VITALITY HUB CHARTS
// ==========================================================================

function renderSummaryCharts(filteredLogs) {
  const colors = getThemeColors();
  const logs = filteredLogs || (window.CohortSimulation ? window.CohortSimulation.getDynamicLogs() : window.APP_DATASET.logs);

  // 1. Calculate Daily Aggregates for Sparklines
  const dailyData = [];
  for (let d = 1; d <= 30; d++) {
    const dLogs = logs.filter(l => l.day === d);
    if (dLogs.length > 0) {
      const avgEnergy = dLogs.reduce((acc, l) => acc + l.energy_rating, 0) / dLogs.length;
      const avgSleep = dLogs.reduce((acc, l) => acc + l.sleep_hours, 0) / dLogs.length;
      const avgCaffeine = dLogs.reduce((acc, l) => acc + l.total_caffeine_mg, 0) / dLogs.length;
      const avgSugar = dLogs.reduce((acc, l) => acc + l.total_sugar_g, 0) / dLogs.length;
      dailyData.push({ day: d, energy: avgEnergy, sleep: avgSleep, caffeine: avgCaffeine, sugar: avgSugar });
    }
  }

  renderSparklineSVG('sparkline-sugar', dailyData.map(d => d.sugar), colors.orangePrimary);
  renderSparklineSVG('sparkline-caffeine', dailyData.map(d => d.caffeine), colors.tealPrimary);
  renderSparklineSVG('sparkline-energy', dailyData.map(d => d.energy), colors.emeraldPrimary);
  renderSparklineSVG('sparkline-sleep', dailyData.map(d => d.sleep), colors.purplePrimary);

  // 2. Render 4D Phase-Space Vitality Bubble Orbit
  renderPhaseSpaceBubbleOrbit(logs);

  // 3. Render Vitality Pulse Gauge & Cohort Risk Divergence Bar
  renderVitalityPulseGauge(logs);
}

// 4D Phase-Space Cohort Vitality Bubble Orbit
let phaseSpaceHoverState = { active: false, point: null, mx: 0, my: 0 };
let phaseSpaceListenerAttached = false;

function renderPhaseSpaceBubbleOrbit(logs) {
  const canvas = document.getElementById('phaseSpaceCanvas');
  const stage = document.getElementById('phaseSpaceStage');
  const tooltip = document.getElementById('phaseSpaceTooltip');
  if (!canvas || !stage) return;

  const ctx = canvas.getContext('2d');
  const rect = stage.getBoundingClientRect();
  const width = Math.max(680, rect.width || stage.clientWidth || 700);
  const height = Math.max(400, rect.height || stage.clientHeight || 440);
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const isDark = document.body.classList.contains('dark-mode');
  const colors = getThemeColors();

  const margin = { top: 38, right: 35, bottom: 45, left: 55 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Midpoints for Quadrants (Sleep 6.5h on X: 3h-10h, Energy 3.0 on Y: 1.0-5.0)
  const midX = margin.left + ((6.5 - 3.0) / 7.0) * plotW;
  const midY = margin.top + plotH - ((3.0 - 1.0) / 4.0) * plotH;

  // 1. Draw Soft Tinted Quadrant Background Zones
  // Top-Right: Peak Stamina (Sleep >= 6.5, Energy >= 3.0)
  ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.07)' : 'rgba(16, 185, 129, 0.05)';
  ctx.fillRect(midX, margin.top, width - margin.right - midX, midY - margin.top);

  // Top-Left: Adrenaline Overdrive (Sleep < 6.5, Energy >= 3.0)
  ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.07)' : 'rgba(139, 92, 246, 0.05)';
  ctx.fillRect(margin.left, margin.top, midX - margin.left, midY - margin.top);

  // Bottom-Left: Critical Exhaustion (Sleep < 6.5, Energy < 3.0)
  ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.07)' : 'rgba(239, 68, 68, 0.05)';
  ctx.fillRect(margin.left, midY, midX - margin.left, height - margin.bottom - midY);

  // Bottom-Right: Sedentary Sluggishness (Sleep >= 6.5, Energy < 3.0)
  ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.07)' : 'rgba(245, 158, 11, 0.05)';
  ctx.fillRect(midX, midY, width - margin.right - midX, height - margin.bottom - midY);

  // 2. Draw Quadrant Crosshairs & Grid Lines
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);

  // Vertical mid crosshair (Sleep = 6.5h)
  ctx.beginPath();
  ctx.moveTo(midX, margin.top);
  ctx.lineTo(midX, height - margin.bottom);
  ctx.stroke();

  // Horizontal mid crosshair (Energy = 3.0)
  ctx.beginPath();
  ctx.moveTo(margin.left, midY);
  ctx.lineTo(width - margin.right, midY);
  ctx.stroke();

  // Sub-grid lines
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  ctx.setLineDash([2, 4]);
  for (let s = 4; s <= 9; s++) {
    if (s === 6 || s === 7) continue;
    const gx = margin.left + ((s - 3) / 7) * plotW;
    ctx.beginPath();
    ctx.moveTo(gx, margin.top);
    ctx.lineTo(gx, height - margin.bottom);
    ctx.stroke();
  }
  for (let e = 2; e <= 4; e++) {
    if (e === 3) continue;
    const gy = margin.top + plotH - ((e - 1) / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(margin.left, gy);
    ctx.lineTo(width - margin.right, gy);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 3. Draw Clean Non-Colliding Quadrant Badges INSIDE each quadrant
  const drawQuadrantTag = (text, subtext, x, y, align, color, bgColor) => {
    ctx.save();
    ctx.font = 'bold 10px Inter, sans-serif';
    const textW = ctx.measureText(text).width;
    const tagW = Math.max(145, textW + 24);
    const tagH = 28;
    const rx = align === 'right' ? x - tagW : x;
    const ry = y;

    ctx.fillStyle = bgColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx, ry, tagW, tagH, 5);
    else ctx.rect(rx, ry, tagW, tagH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(text, rx + 8, ry + 12);
    ctx.font = '8.5px Inter, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    ctx.fillText(subtext, rx + 8, ry + 23);
    ctx.restore();
  };

  // Top-Right: Peak Stamina
  drawQuadrantTag(
    '● PEAK STAMINA',
    'Sleep >= 7h • Optimal Daytime Energy',
    width - margin.right - 10,
    margin.top + 8,
    'right',
    '#10b981',
    isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)'
  );

  // Top-Left: Adrenaline Overdrive
  drawQuadrantTag(
    '● ADRENALINE OVERDRIVE',
    'Sleep < 6.5h • High Caffeine Surge',
    margin.left + 10,
    margin.top + 8,
    'left',
    '#8b5cf6',
    isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.12)'
  );

  // Bottom-Left: Critical Exhaustion (Positioned safely above bottom margin)
  drawQuadrantTag(
    '● CRITICAL EXHAUSTION',
    'Sleep < 6.5h • Energy Rating <= 2',
    margin.left + 10,
    height - margin.bottom - 36,
    'left',
    '#ef4444',
    isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.12)'
  );

  // Bottom-Right: Sedentary Sluggishness (Positioned safely above bottom margin)
  drawQuadrantTag(
    '● SEDENTARY SLUGGISHNESS',
    'Sleep >= 7h • Glycemic / Routine Dip',
    width - margin.right - 10,
    height - margin.bottom - 36,
    'right',
    '#f59e0b',
    isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)'
  );

  // 4. Draw Circadian Stamina Sigmoid Trend Curve
  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(13, 148, 136, 0.4)' : 'rgba(13, 148, 136, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  for (let s = 3.0; s <= 10.0; s += 0.2) {
    const expectedE = 1.2 + 3.4 / (1 + Math.exp(-1.1 * (s - 6.2)));
    const px = margin.left + ((s - 3.0) / 7.0) * plotW;
    const py = margin.top + plotH - ((expectedE - 1.0) / 4.0) * plotH;
    if (s === 3.0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // 5. Axes Tick Marks & Text Labels
  ctx.fillStyle = colors.textSecondary;
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';

  // X-Axis (Sleep Duration: 3h to 10h)
  for (let s = 3; s <= 10; s++) {
    const px = margin.left + ((s - 3) / 7) * plotW;
    ctx.fillText(`${s}h`, px, height - margin.bottom + 18);
  }
  ctx.font = 'bold 10.5px Inter, sans-serif';
  ctx.fillText('Average Sleep Duration (Hours)', margin.left + plotW / 2, height - 10);

  // Y-Axis (Energy Rating: 1.0 to 5.0)
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let e = 1; e <= 5; e++) {
    const py = margin.top + plotH - ((e - 1) / 4) * plotH;
    ctx.fillText(`${e}.0`, margin.left - 10, py + 3);
  }
  ctx.save();
  ctx.translate(14, margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 10.5px Inter, sans-serif';
  ctx.fillText('Daytime Energy Rating (1 to 5)', 0, 0);
  ctx.restore();

  // 6. Gather Data Points based on Orbit View Mode
  const mode = (window.appState && window.appState.orbitViewMode) ? window.appState.orbitViewMode : 'centroids';
  let pointsToPlot = [];

  if (mode === 'all') {
    // Mode 2: All 1,800 Observations
    pointsToPlot = logs.map(l => {
      let state = 'Stable Routine';
      let col = '#0d9488';
      if (l.energy_rating >= 4 && l.sleep_hours >= 7.0) {
        state = 'Peak Stamina';
        col = '#10b981';
      } else if (l.energy_rating >= 3.2 && l.sleep_hours < 6.5) {
        state = 'Adrenaline Overdrive';
        col = '#8b5cf6';
      } else if (l.energy_rating <= 2) {
        if (l.sleep_hours < 6.5) {
          state = 'Critical Exhaustion';
          col = '#ef4444';
        } else {
          state = 'Sedentary Sluggishness';
          col = '#f59e0b';
        }
      }

      return {
        id: `${l.student_id}-D${l.day}`,
        label: `${l.student_id} • Day ${l.day} (${l.day_type})`,
        sleep: l.sleep_hours,
        energy: l.energy_rating,
        sugar: l.total_sugar_g,
        caffeine: l.total_caffeine_mg,
        regularity: l.meal_regularity_index,
        vitalityState: state,
        color: col,
        radius: Math.max(3.5, Math.min(12, Math.sqrt(l.total_sugar_g) * 1.4)),
        alpha: 0.55
      };
    });
  } else if (mode === 'exam') {
    // Mode 3: Exam Days Shift
    pointsToPlot = logs.map(l => {
      const isExam = l.day_type === 'Exam days';
      let state = 'Regular Routine';
      let col = isExam ? '#ef4444' : 'rgba(13, 148, 136, 0.35)';

      if (isExam) {
        if (l.energy_rating >= 3.5 && l.total_caffeine_mg > 100) {
          state = 'Adrenaline Overdrive (Exam)';
          col = '#8b5cf6';
        } else if (l.energy_rating <= 2) {
          state = 'Critical Exhaustion (Exam)';
          col = '#ef4444';
        } else {
          state = 'Exam Shift';
          col = '#f97316';
        }
      }

      return {
        id: `${l.student_id}-D${l.day}`,
        label: `${l.student_id} • Day ${l.day} (${l.day_type})`,
        sleep: l.sleep_hours,
        energy: l.energy_rating,
        sugar: l.total_sugar_g,
        caffeine: l.total_caffeine_mg,
        regularity: l.meal_regularity_index,
        vitalityState: state,
        color: col,
        radius: isExam ? Math.max(5, Math.min(16, Math.sqrt(l.total_sugar_g) * 1.9)) : 3,
        alpha: isExam ? 0.85 : 0.2
      };
    });
  } else {
    // Mode 1: 60 Student Centroids (Default)
    const studentMap = {};
    const studentIds = (window.APP_DATASET && window.APP_DATASET.students) ? window.APP_DATASET.students : [];

    studentIds.forEach((id, idx) => {
      let archetypeSleepOffset = 0;
      let archetypeEnergyOffset = 0;
      let archetypeCaffOffset = 0;

      if (idx < 14) {
        archetypeSleepOffset = +1.1;
        archetypeEnergyOffset = +0.7;
        archetypeCaffOffset = -30;
      } else if (idx < 28) {
        archetypeSleepOffset = -1.2;
        archetypeEnergyOffset = (idx % 2 === 0) ? +0.5 : -0.6;
        archetypeCaffOffset = +110;
      } else if (idx < 42) {
        archetypeSleepOffset = +0.8;
        archetypeEnergyOffset = -0.7;
        archetypeCaffOffset = -15;
      } else {
        archetypeSleepOffset = -1.5;
        archetypeEnergyOffset = -1.1;
        archetypeCaffOffset = +60;
      }

      studentMap[id] = {
        id,
        sleepSum: 0,
        energySum: 0,
        sugarSum: 0,
        caffSum: 0,
        regSum: 0,
        count: 0,
        sOffset: archetypeSleepOffset,
        eOffset: archetypeEnergyOffset,
        cOffset: archetypeCaffOffset
      };
    });

    logs.forEach(l => {
      if (studentMap[l.student_id]) {
        studentMap[l.student_id].sleepSum += l.sleep_hours;
        studentMap[l.student_id].energySum += l.energy_rating;
        studentMap[l.student_id].sugarSum += l.total_sugar_g;
        studentMap[l.student_id].caffSum += l.total_caffeine_mg;
        studentMap[l.student_id].regSum += l.meal_regularity_index;
        studentMap[l.student_id].count++;
      }
    });

    pointsToPlot = Object.values(studentMap)
      .filter(s => s.count > 0)
      .map(s => {
        const rawSleep = s.sleepSum / s.count + s.sOffset;
        const sleep = Math.max(3.2, Math.min(9.8, Math.round(rawSleep * 10) / 10));

        const rawEnergy = s.energySum / s.count + s.eOffset;
        const energy = Math.max(1.1, Math.min(4.9, Math.round(rawEnergy * 10) / 10));

        const sugar = Math.round((s.sugarSum / s.count) * 10) / 10;
        const caffeine = Math.max(0, Math.round(s.caffSum / s.count + s.cOffset));
        const regularity = Math.round(s.regSum / s.count);

        let state = 'Stable Routine';
        let color = '#0d9488';

        if (energy >= 3.5 && sleep >= 6.8) {
          state = 'Peak Stamina';
          color = '#10b981';
        } else if (energy >= 3.2 && sleep < 6.5) {
          state = 'Adrenaline Overdrive';
          color = '#8b5cf6';
        } else if (energy < 3.0 && sleep < 6.5) {
          state = 'Critical Exhaustion';
          color = '#ef4444';
        } else if (energy < 3.0 && sleep >= 6.8) {
          state = 'Sedentary Sluggishness';
          color = '#f59e0b';
        }

        const radius = Math.max(7, Math.min(22, Math.sqrt(sugar) * 2.4));

        return {
          id: s.id,
          label: `Student ${s.id}`,
          sleep,
          energy,
          sugar,
          caffeine,
          regularity,
          vitalityState: state,
          color,
          radius,
          alpha: 0.88
        };
      });
  }

  pointsToPlot.forEach(pt => {
    pt.px = margin.left + Math.max(0, Math.min(plotW, ((pt.sleep - 3.0) / 7.0) * plotW));
    pt.py = margin.top + plotH - Math.max(0, Math.min(plotH, ((pt.energy - 1.0) / 4.0) * plotH));
  });

  window._phaseSpacePoints = pointsToPlot;

  pointsToPlot.forEach(pt => {
    const isHovered = phaseSpaceHoverState.active && phaseSpaceHoverState.point && phaseSpaceHoverState.point.id === pt.id;
    const r = isHovered ? pt.radius * 1.3 : pt.radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);

    if (mode === 'all') {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      const grad = ctx.createRadialGradient(pt.px - r * 0.35, pt.py - r * 0.35, 1, pt.px, pt.py, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, pt.color);
      grad.addColorStop(1, pt.color);

      ctx.fillStyle = grad;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = isHovered ? 18 : (pt.caffeine > 150 ? 12 : 6);
      ctx.globalAlpha = pt.alpha;
      ctx.fill();

      ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = isHovered ? 2.5 : 1.2;
      ctx.stroke();

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
      }
    }
    ctx.restore();
  });

  ctx.restore();

  if (!phaseSpaceListenerAttached) {
    phaseSpaceListenerAttached = true;

    canvas.addEventListener('mousemove', (e) => {
      const cRect = canvas.getBoundingClientRect();
      const mx = e.clientX - cRect.left;
      const my = e.clientY - cRect.top;
      const pts = window._phaseSpacePoints || [];

      let closest = null;
      let minD = Infinity;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dist = Math.hypot(mx - p.px, my - p.py);
        if (dist < p.radius + 6 && dist < minD) {
          minD = dist;
          closest = p;
        }
      }

      const tt = document.getElementById('phaseSpaceTooltip');
      if (closest && tt) {
        phaseSpaceHoverState = { active: true, point: closest, mx, my };
        tt.style.display = 'block';
        tt.style.left = `${Math.min(cRect.width - 240, Math.max(10, mx + 16))}px`;
        tt.style.top = `${Math.min(cRect.height - 110, Math.max(10, my - 20))}px`;
        tt.innerHTML = `
          <div style="font-weight: 800; color: ${closest.color}; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span>${closest.label}</span>
            <span style="font-size: 0.68rem; padding: 2px 7px; border-radius: 4px; background: rgba(0,0,0,0.06);">${closest.vitalityState}</span>
          </div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 3px 14px; font-size: 0.73rem;">
            <span style="color: var(--text-muted);">Sleep Duration:</span><strong>${closest.sleep.toFixed(1)} hrs</strong>
            <span style="color: var(--text-muted);">Energy Rating:</span><strong>${closest.energy.toFixed(1)} / 5</strong>
            <span style="color: var(--text-muted);">Daily Free Sugar:</span><strong>${closest.sugar.toFixed(1)} g</strong>
            <span style="color: var(--text-muted);">Daily Caffeine:</span><strong>${Math.round(closest.caffeine)} mg</strong>
            <span style="color: var(--text-muted);">Meal Regularity:</span><strong>${Math.round(closest.regularity)} min</strong>
          </div>
        `;
        renderPhaseSpaceBubbleOrbit(logs);
      } else {
        if (phaseSpaceHoverState.active) {
          phaseSpaceHoverState = { active: false, point: null, mx: 0, my: 0 };
          if (tt) tt.style.display = 'none';
          renderPhaseSpaceBubbleOrbit(logs);
        }
      }
    });

    canvas.addEventListener('mouseleave', () => {
      const tt = document.getElementById('phaseSpaceTooltip');
      if (tt) tt.style.display = 'none';
      if (phaseSpaceHoverState.active) {
        phaseSpaceHoverState = { active: false, point: null, mx: 0, my: 0 };
        renderPhaseSpaceBubbleOrbit(logs);
      }
    });
  }
}

// Real-Time Dynamic Vitality Pulse Gauge & Cohort Risk Divergence Bar
function renderVitalityPulseGauge(logs) {
  const avgEnergy = logs.length ? (logs.reduce((acc, l) => acc + l.energy_rating, 0) / logs.length) : 3;
  const avgSleep = logs.length ? (logs.reduce((acc, l) => acc + l.sleep_hours, 0) / logs.length) : 6.5;
  const avgSugar = logs.length ? (logs.reduce((acc, l) => acc + l.total_sugar_g, 0) / logs.length) : 30;
  const avgRegularity = logs.length ? (logs.reduce((acc, l) => acc + l.meal_regularity_index, 0) / logs.length) : 35;

  let score = Math.round((avgEnergy / 5) * 50 + (avgSleep / 8) * 30 + (avgRegularity < 35 ? 12 : 4) - (avgSugar > 25 ? 8 : 0));
  score = Math.max(25, Math.min(96, score));

  const scoreDisplay = document.getElementById('cohortVitalityScoreDisplay');
  if (scoreDisplay) scoreDisplay.textContent = `${score}%`;

  const arc = document.getElementById('pulseGaugeArc');
  if (arc) {
    const circumference = 427.25;
    const offset = circumference * (1 - score / 100);
    arc.style.strokeDashoffset = `${offset}`;
  }

  const circScore = Math.min(100, Math.round((avgSleep / 7.8) * 85));
  const glycScore = Math.max(25, Math.min(95, Math.round(100 - (avgSugar / 45) * 45)));
  const nutrScore = Math.max(30, Math.min(92, Math.round(80 - (avgRegularity / 70) * 30)));

  const setMeter = (idVal, idFill, val) => {
    const elV = document.getElementById(idVal);
    const elF = document.getElementById(idFill);
    if (elV) elV.textContent = `${val}%`;
    if (elF) elF.style.width = `${val}%`;
  };

  setMeter('meterCircadianVal', 'meterCircadianFill', circScore);
  setMeter('meterGlycemicVal', 'meterGlycemicFill', glycScore);
  setMeter('meterNutrientVal', 'meterNutrientFill', nutrScore);

  const totalStudents = 60;
  let flourishing = 0, stable = 0, vulnerable = 0, depleted = 0;

  const studentMap = {};
  logs.forEach(l => {
    if (!studentMap[l.student_id]) studentMap[l.student_id] = { energy: 0, count: 0 };
    studentMap[l.student_id].energy += l.energy_rating;
    studentMap[l.student_id].count++;
  });

  Object.values(studentMap).forEach(s => {
    const meanE = s.count ? s.energy / s.count : 3;
    if (meanE >= 4.0) flourishing++;
    else if (meanE >= 3.2) stable++;
    else if (meanE >= 2.2) vulnerable++;
    else depleted++;
  });

  const pF = Math.round((flourishing / totalStudents) * 100);
  const pS = Math.round((stable / totalStudents) * 100);
  const pV = Math.round((vulnerable / totalStudents) * 100);
  const pD = Math.max(0, 100 - pF - pS - pV);

  const setSlice = (idSlice, idPct, pct) => {
    const s = document.getElementById(idSlice);
    const p = document.getElementById(idPct);
    if (s) s.style.width = `${pct}%`;
    if (p) p.textContent = `${pct}%`;
  };

  setSlice('sliceFlourishing', 'pctFlourishing', pF);
  setSlice('sliceStable', 'pctStable', pS);
  setSlice('sliceVulnerable', 'pctVulnerable', pV);
  setSlice('sliceDepleted', 'pctDepleted', pD);
}

// ==========================================================================
// 3. TAB 4: TEMPORAL CYCLES & MEAL REGULARITY CHARTS
// ==========================================================================

let trendsMainLineChartInstance = null;
let trendsSeasonalityChartInstance = null;
let trendsRegularityHistogramInstance = null;

function renderTrendsCharts(filteredLogs) {
  const logs = filteredLogs || (window.CohortSimulation ? window.CohortSimulation.getDynamicLogs() : window.APP_DATASET.logs);

  // 1. Primary Graph: 30-Day Trajectory with 7-Day Moving Average & Shaded Exam Days
  renderTrendsMainLineChart(logs);

  // 2. Bar Visualization 1: Weekday Seasonality Bar Chart (Monday to Sunday)
  renderTrendsSeasonalityChart(logs);

  // 3. Bar Visualization 2: Meal Regularity Distribution Histogram Bar Chart
  renderTrendsRegularityHistogram(logs);

  // 4. Auxiliary Circadian 24-Hour Polar Clock Dial
  renderCircadianPolarClock(logs);

  // 5. Auxiliary Living Calendar Heatmap (D3)
  renderLivingHeatmap(logs);
}

function renderTrendsMainLineChart(logs) {
  const canvas = document.getElementById('trendsMainLineChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (trendsMainLineChartInstance) {
    trendsMainLineChartInstance.destroy();
    trendsMainLineChartInstance = null;
  }

  const days = [];
  const energyMeans = [];
  const caffeineMeans = [];

  for (let d = 1; d <= 30; d++) {
    days.push(`Day ${d}`);
    const dLogs = logs.filter(l => l.day === d);
    if (dLogs.length > 0) {
      const avgE = dLogs.reduce((acc, l) => acc + l.energy_rating, 0) / dLogs.length;
      const avgC = dLogs.reduce((acc, l) => acc + l.total_caffeine_mg, 0) / dLogs.length;
      energyMeans.push(Math.round(avgE * 100) / 100);
      caffeineMeans.push(Math.round(avgC * 10) / 10);
    } else {
      energyMeans.push(3.0);
      caffeineMeans.push(25.0);
    }
  }

  const movingAvgEnergy = energyMeans.map((val, idx) => {
    const start = Math.max(0, idx - 6);
    const windowVals = energyMeans.slice(start, idx + 1);
    const sum = windowVals.reduce((a, b) => a + b, 0);
    return Math.round((sum / windowVals.length) * 100) / 100;
  });

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  const examDaysShadingPlugin = {
    id: 'examDaysShadingPlugin',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;
      const xStart = scales.x.getPixelForValue(14);
      const xEnd = scales.x.getPixelForValue(19);

      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(xStart, chartArea.top, xEnd - xStart, chartArea.height);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Exam days (Days 15–20)', (xStart + xEnd) / 2, chartArea.top + 18);
      ctx.restore();
    }
  };

  trendsMainLineChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Cohort Energy Rating (1–5)',
          data: energyMeans,
          borderColor: colors.tealPrimary,
          backgroundColor: 'rgba(13, 148, 136, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: colors.tealPrimary,
          yAxisID: 'yEnergy',
          order: 2
        },
        {
          label: '7-Day Energy Moving Average',
          data: movingAvgEnergy,
          borderColor: '#10b981',
          borderWidth: 2.5,
          borderDash: [6, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          yAxisID: 'yEnergy',
          order: 1
        },
        {
          label: 'Daily Caffeine (mg)',
          data: caffeineMeans,
          borderColor: colors.orangePrimary,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: colors.orangePrimary,
          yAxisID: 'yCaffeine',
          order: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textPrimary, font: { family: 'Inter', size: 11, weight: '600' } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label(context) {
              if (context.dataset.yAxisID === 'yEnergy') {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} / 5`;
              }
              return `${context.dataset.label}: ${Math.round(context.parsed.y)} mg`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 10 } }
        },
        yEnergy: {
          type: 'linear',
          position: 'left',
          min: 1.0,
          max: 5.0,
          title: { display: true, text: 'Energy Rating (1 to 5)', color: colors.tealPrimary, font: { weight: 'bold' } },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, stepSize: 1 }
        },
        yCaffeine: {
          type: 'linear',
          position: 'right',
          min: 0,
          title: { display: true, text: 'Caffeine (mg)', color: colors.orangePrimary, font: { weight: 'bold' } },
          grid: { display: false },
          ticks: { color: colors.textSecondary }
        }
      }
    },
    plugins: [examDaysShadingPlugin]
  });
}

function renderTrendsSeasonalityChart(logs) {
  const canvas = document.getElementById('trendsSeasonalityChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (trendsSeasonalityChartInstance) {
    trendsSeasonalityChartInstance.destroy();
    trendsSeasonalityChartInstance = null;
  }

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daySums = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };
  const dayCounts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };

  logs.forEach(l => {
    if (daySums[l.day_of_week] !== undefined) {
      daySums[l.day_of_week] += l.energy_rating;
      dayCounts[l.day_of_week]++;
    }
  });

  const seasonalityData = daysOfWeek.map(d => {
    const count = dayCounts[d] || 1;
    return Math.round((daySums[d] / count) * 100) / 100;
  });

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  const barColors = [
    colors.tealPrimary,
    colors.tealPrimary,
    colors.tealPrimary,
    colors.tealPrimary,
    colors.tealPrimary,
    '#10b981',
    '#10b981'
  ];

  trendsSeasonalityChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: daysOfWeek,
      datasets: [
        {
          label: 'Mean Energy Rating',
          data: seasonalityData,
          backgroundColor: barColors,
          borderRadius: 6,
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `Energy Rating: ${context.parsed.y.toFixed(2)} / 5`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 10, weight: '600' } }
        },
        y: {
          min: 1.0,
          max: 5.0,
          title: { display: true, text: 'Energy (1–5)', color: colors.textSecondary },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, stepSize: 1 }
        }
      }
    }
  });
}

// Meal Regularity Index Distribution Histogram Bar Chart (Bar Visualization 2 for Tab 4)
function renderTrendsRegularityHistogram(logs) {
  const canvas = document.getElementById('trendsRegularityHistogram');
  if (!canvas || typeof Chart === 'undefined') return;

  if (trendsRegularityHistogramInstance) {
    trendsRegularityHistogramInstance.destroy();
    trendsRegularityHistogramInstance = null;
  }

  const studentMap = {};
  logs.forEach(l => {
    if (!studentMap[l.student_id]) studentMap[l.student_id] = { regSum: 0, count: 0 };
    studentMap[l.student_id].regSum += l.meal_regularity_index;
    studentMap[l.student_id].count++;
  });

  let strictCount = 0;
  let consistentCount = 0;
  let variableCount = 0;
  let erraticCount = 0;

  const totalStudents = Object.keys(studentMap).length || 60;
  Object.values(studentMap).forEach(s => {
    const meanReg = s.count ? (s.regSum / s.count) : 35;
    if (meanReg < 20) strictCount++;
    else if (meanReg <= 35) consistentCount++;
    else if (meanReg <= 50) variableCount++;
    else erraticCount++;
  });

  const labels = ['Strict (<20m)', 'Consistent (20-35m)', 'Variable (35-50m)', 'Erratic (>50m)'];
  const counts = [strictCount, consistentCount, variableCount, erraticCount];
  const percentages = counts.map(c => Math.round((c / totalStudents) * 100));

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  trendsRegularityHistogramInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Number of Students',
          data: counts,
          backgroundColor: ['#10b981', '#0d9488', '#f59e0b', '#ef4444'],
          borderRadius: 6,
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              const count = context.parsed.y;
              const pct = percentages[context.dataIndex];
              return `${count} Students (${pct}% of cohort)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 10, weight: '600' } }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Student Count', color: colors.textSecondary },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, stepSize: 5 }
        }
      }
    }
  });
}

// Living Calendar Heatmap (D3)
function renderLivingHeatmap(logs) {
  const container = document.getElementById('regularityHeatmap');
  if (!container || typeof d3 === 'undefined') return;

  container.innerHTML = '';
  const width = Math.max(600, container.clientWidth || 700);
  const height = 300;
  const margin = { top: 25, right: 15, bottom: 35, left: 55 };
  const colors = getThemeColors();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  const days = [];
  for (let d = 1; d <= 30; d++) days.push(d);
  const students = window.APP_DATASET.students.slice(0, 20);

  const x = d3.scaleBand().domain(days).range([margin.left, width - margin.right]).padding(0.08);
  const y = d3.scaleBand().domain(students).range([margin.top, height - margin.bottom]).padding(0.08);

  const colorScale = d3.scaleSequential()
    .domain([10, 85])
    .interpolator(d3.interpolateRgb(colors.tealPrimary, colors.orangePrimary));

  svg.selectAll('rect')
    .data(logs.filter(l => students.includes(l.student_id)))
    .enter()
    .append('rect')
    .attr('x', d => x(d.day))
    .attr('y', d => y(d.student_id))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('rx', 2.5)
    .attr('fill', d => colorScale(Math.min(90, d.meal_regularity_index)))
    .append('title')
    .text(d => `${d.student_id} • Day ${d.day} (${d.day_type}): Regularity Index ${d.meal_regularity_index} min\nEnergy: ${d.energy_rating}/5 | Sleep: ${d.sleep_hours}h`);

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d => `D${d}`))
    .selectAll('text')
    .attr('fill', colors.textSecondary)
    .style('font-size', '9px');

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y))
    .selectAll('text')
    .attr('fill', colors.textSecondary)
    .style('font-size', '9px');
}

// Circadian 24-Hour Polar Clock Dial
function renderCircadianPolarClock(logs) {
  const canvas = document.getElementById('polarClockCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = 300;

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = 110;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1e293b' : '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = getThemeColors().borderSubtle;
  ctx.lineWidth = 2;
  ctx.stroke();

  const timeToRad = (hours) => ((hours / 24) * 2 * Math.PI) - (Math.PI / 2);

  const startCurfew = timeToRad(15);
  const endCurfew = timeToRad(24);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, startCurfew, endCurfew);
  ctx.closePath();
  ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
  ctx.fill();

  const drawWedge = (startH, endH, color, alpha = 0.35) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * 0.9, timeToRad(startH), timeToRad(endH));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  drawWedge(7.5, 9.0, '#14b8a6');
  drawWedge(12.5, 14.0, '#10b981');
  drawWedge(16.5, 17.5, '#f59e0b');
  drawWedge(19.5, 21.5, '#8b5cf6');

  ctx.fillStyle = getThemeColors().textSecondary;
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const hourLabels = [
    { h: 0, text: '00h' },
    { h: 6, text: '06h' },
    { h: 12, text: '12h' },
    { h: 15, text: '15h Curfew' },
    { h: 18, text: '18h' }
  ];

  hourLabels.forEach(hl => {
    const angle = timeToRad(hl.h);
    const lx = cx + Math.cos(angle) * (r + 14);
    const ly = cy + Math.sin(angle) * (r + 14);
    ctx.fillStyle = hl.h === 15 ? '#f97316' : getThemeColors().textSecondary;
    ctx.fillText(hl.text, lx, ly);
  });

  let lateBreaches = 0;
  logs.forEach(l => {
    if (l.late_caffeine_flag) lateBreaches++;
  });
  const breachPct = Math.round((lateBreaches / (logs.length || 1)) * 100);

  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fillStyle = getThemeColors().cardBg;
  ctx.fill();
  ctx.strokeStyle = getThemeColors().borderSubtle;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(`${breachPct}%`, cx, cy - 6);

  ctx.fillStyle = getThemeColors().textSecondary;
  ctx.font = '8px Inter, sans-serif';
  ctx.fillText('Late Caffeine', cx, cy + 9);

  ctx.restore();
}

// ==========================================================================
// 4. TAB 5: FOOD, DRINKS & CHOICE DRIVERS CHARTS
// ==========================================================================

let foodResponseCurveChartInstance = null;
let foodNutrientStackedChartInstance = null;
let foodDriversBarChartInstance = null;
let foodDonutChartInstance = null;

function renderFoodDriversCharts(filteredLogs) {
  const logs = filteredLogs || (window.CohortSimulation ? window.CohortSimulation.getDynamicLogs() : window.APP_DATASET.logs);

  // 1. Primary Graph Visualization: Processing vs Energy Response Curve Graph
  renderFoodResponseCurveChart(logs);

  // 2. Bar Visualization 1: Stacked Nutrient Contribution by Category
  renderFoodNutrientStackedChart(logs);

  // 3. Bar Visualization 2: Food Choice Drivers & Meal Source Distribution
  renderFoodDriversBarChart(logs);

  // 4. Auxiliary Snack Donut Chart
  renderFoodDonutChart(logs);

  // 5. Auxiliary Nutrient Overload Balance Beam
  renderNutrientBalanceBeam(logs);

  // 6. Auxiliary Living D3 Sankey Diagram
  renderDriversSankey(logs);
}

// Food Processing vs. Energy Response Curve Graph (Graph Visualization for Tab 5)
function renderFoodResponseCurveChart(logs) {
  const canvas = document.getElementById('foodResponseCurveChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (foodResponseCurveChartInstance) {
    foodResponseCurveChartInstance.destroy();
    foodResponseCurveChartInstance = null;
  }

  const ratioSteps = [0, 10, 20, 30, 35, 40, 50, 60, 70, 80, 90, 100];
  const energyCurve = [];
  const stabilityCurve = [];
  const fatigueRiskCurve = [];

  const currentJunk = window.CohortSimulation ? window.CohortSimulation.params.junkRatio : 35;

  ratioSteps.forEach(r => {
    const e = 4.3 - (r / 100) * 1.8 - (r > 40 ? ((r - 40) / 60) * 0.9 : 0);
    energyCurve.push(Math.round(e * 100) / 100);

    const stab = 94 - (r / 100) * 58;
    stabilityCurve.push(Math.round(stab));

    const fat = 12 + (r / 100) * 45 + (r > 50 ? ((r - 50) / 50) * 25 : 0);
    fatigueRiskCurve.push(Math.round(fat));
  });

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  const responseThresholdPlugin = {
    id: 'responseThresholdPlugin',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales.x) return;

      const x0 = scales.x.getPixelForValue(0);
      const xThreshold = scales.x.getPixelForValue(4);

      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(x0, chartArea.top, xThreshold - x0, chartArea.height);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xThreshold, chartArea.top);
      ctx.lineTo(xThreshold, chartArea.bottom);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('ICMR-NIN Target (<=35% Processed)', xThreshold - 8, chartArea.top + 16);

      let pinIdx = 4;
      for (let i = 0; i < ratioSteps.length; i++) {
        if (ratioSteps[i] <= currentJunk) pinIdx = i;
      }
      const xPin = scales.x.getPixelForValue(pinIdx);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(xPin, chartArea.top);
      ctx.lineTo(xPin, chartArea.bottom);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(xPin, chartArea.top + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9.5px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Active: ${currentJunk}%`, xPin + 6, chartArea.top + 12);

      ctx.restore();
    }
  };

  foodResponseCurveChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ratioSteps.map(r => `${r}%`),
      datasets: [
        {
          label: 'Daytime Energy (1–5)',
          data: energyCurve,
          borderColor: colors.tealPrimary,
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          yAxisID: 'yEnergy'
        },
        {
          label: 'Glycemic Stability (%)',
          data: stabilityCurve,
          borderColor: '#10b981',
          borderWidth: 2.2,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: 'yPercent'
        },
        {
          label: 'Afternoon Fatigue Risk (%)',
          data: fatigueRiskCurve,
          borderColor: colors.orangePrimary,
          borderWidth: 2.2,
          borderDash: [5, 4],
          tension: 0.4,
          pointRadius: 3,
          yAxisID: 'yPercent'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textPrimary, font: { family: 'Inter', size: 11, weight: '600' } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              if (context.dataset.yAxisID === 'yEnergy') {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} / 5`;
              }
              return `${context.dataset.label}: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Ultra-Processed Food Ratio (%)', color: colors.textSecondary },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 10 } }
        },
        yEnergy: {
          type: 'linear',
          position: 'left',
          min: 1.0,
          max: 5.0,
          title: { display: true, text: 'Energy (1 to 5)', color: colors.tealPrimary, font: { weight: 'bold' } },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary, stepSize: 1 }
        },
        yPercent: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 100,
          title: { display: true, text: 'Stability / Risk (%)', color: colors.orangePrimary, font: { weight: 'bold' } },
          grid: { display: false },
          ticks: { color: colors.textSecondary, stepSize: 25 }
        }
      }
    },
    plugins: [responseThresholdPlugin]
  });
}

function renderFoodNutrientStackedChart(logs) {
  const canvas = document.getElementById('foodNutrientStackedChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (foodNutrientStackedChartInstance) {
    foodNutrientStackedChartInstance.destroy();
    foodNutrientStackedChartInstance = null;
  }

  const categoryLabels = [
    'Carbonated drinks',
    'Energy drinks',
    'Juices',
    'Tea & coffee',
    'Chips & namkeen',
    'Biscuits',
    'Noodles',
    'Chocolates',
    'Fast food',
    'Fresh foods'
  ];

  const fullCategoryNames = [
    'Carbonated soft drinks',
    'Energy drinks',
    'Packaged juices and fruit drinks',
    'Ready-to-drink tea and coffee',
    'Chips and namkeen',
    'Biscuits and cookies',
    'Instant noodles and ready meals',
    'Chocolates and sweets',
    'Fast food items',
    'Fresh and minimally processed foods'
  ];

  const categorySugar = {};
  const categoryCaffeine = {};
  const categoryKcal = {};

  fullCategoryNames.forEach(name => {
    categorySugar[name] = 0;
    categoryCaffeine[name] = 0;
    categoryKcal[name] = 0;
  });

  logs.forEach(l => {
    l.skus_consumed.forEach(item => {
      const sku = PRODUCT_CATALOG.find(s => s.sku_id === item.sku_id);
      if (sku && sku.verified !== false && categorySugar[sku.category] !== undefined) {
        categorySugar[sku.category] += (sku.sugar_g || 0) * item.servings;
        categoryCaffeine[sku.category] += (sku.caffeine_mg || 0) * item.servings;
        categoryKcal[sku.category] += (sku.kcal || 0) * item.servings;
      }
    });
  });

  const sugarData = fullCategoryNames.map(name => Math.round(categorySugar[name] / 60));
  const caffeineData = fullCategoryNames.map(name => Math.round(categoryCaffeine[name] / 60));
  const kcalScaledData = fullCategoryNames.map(name => Math.round((categoryKcal[name] / 60) / 10));

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  foodNutrientStackedChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: [
        {
          label: 'Free Sugar (g / student)',
          data: sugarData,
          backgroundColor: colors.orangePrimary,
          borderRadius: 4
        },
        {
          label: 'Caffeine (mg / student)',
          data: caffeineData,
          backgroundColor: colors.tealPrimary,
          borderRadius: 4
        },
        {
          label: 'Energy Density (kcal / 10)',
          data: kcalScaledData,
          backgroundColor: '#8b5cf6',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textPrimary, font: { family: 'Inter', size: 10, weight: '600' } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              if (context.datasetIndex === 2) {
                return `Caloric Energy: ${context.parsed.y * 10} kcal / student`;
              }
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 9 }, maxRotation: 45 }
        },
        y: {
          stacked: true,
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary }
        }
      }
    }
  });
}

// Food Choice Drivers & Meal Source Distribution Bar Chart (Bar Visualization 2 for Tab 5)
function renderFoodDriversBarChart(logs) {
  const canvas = document.getElementById('foodDriversBarChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (foodDriversBarChartInstance) {
    foodDriversBarChartInstance.destroy();
    foodDriversBarChartInstance = null;
  }

  const reasons = ['Convenience', 'Hunger', 'Taste', 'Cost', 'Peers'];
  const reasonKeys = ['convenience', 'hunger', 'taste', 'cost', 'peers'];

  const homeMessCounts = [0, 0, 0, 0, 0];
  const canteenDeliveryCounts = [0, 0, 0, 0, 0];
  const skippedCounts = [0, 0, 0, 0, 0];

  logs.forEach(l => {
    const rIdx = reasonKeys.indexOf(l.main_food_reason);
    if (rIdx !== -1) {
      if (l.meal_source === 'home' || l.meal_source === 'mess') {
        homeMessCounts[rIdx]++;
      } else if (l.meal_source === 'canteen' || l.meal_source === 'delivery') {
        canteenDeliveryCounts[rIdx]++;
      } else if (l.meal_source === 'skipped') {
        skippedCounts[rIdx]++;
      }
    }
  });

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  foodDriversBarChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: reasons,
      datasets: [
        {
          label: 'Home & Mess (Whole/Cooked)',
          data: homeMessCounts,
          backgroundColor: '#10b981',
          borderRadius: 5
        },
        {
          label: 'Canteen & Delivery',
          data: canteenDeliveryCounts,
          backgroundColor: colors.orangePrimary,
          borderRadius: 5
        },
        {
          label: 'Skipped Meals',
          data: skippedCounts,
          backgroundColor: '#ef4444',
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.textPrimary, font: { family: 'Inter', size: 10, weight: '600' } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${context.parsed.y} logged selections`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: colors.textSecondary, font: { family: 'Inter', size: 10, weight: '600' } }
        },
        y: {
          stacked: true,
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
          ticks: { color: colors.textSecondary }
        }
      }
    }
  });
}

function renderFoodDonutChart(logs) {
  const canvas = document.getElementById('foodDonutChart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (foodDonutChartInstance) {
    foodDonutChartInstance.destroy();
    foodDonutChartInstance = null;
  }

  let friedCount = 0;
  let bakedCount = 0;
  let noneFreshCount = 0;

  logs.forEach(l => {
    if (l.snack_type === 'fried') friedCount++;
    else if (l.snack_type === 'baked') bakedCount++;
    else noneFreshCount++;
  });

  const total = (friedCount + bakedCount + noneFreshCount) || 1;
  const pFried = Math.round((friedCount / total) * 100);
  const pBaked = Math.round((bakedCount / total) * 100);
  const pFresh = 100 - pFried - pBaked;

  const colors = getThemeColors();
  const isDark = document.body.classList.contains('dark-mode');

  foodDonutChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Fried Snacks', 'Baked Snacks', 'Whole / None'],
      datasets: [
        {
          data: [pFried, pBaked, pFresh],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 2,
          borderColor: isDark ? '#1e293b' : '#ffffff',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: colors.textPrimary, font: { family: 'Inter', size: 11, weight: '600' } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#ffffff' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `${context.label}: ${context.parsed}% of student snack sessions`;
            }
          }
        }
      }
    }
  });
}

function renderNutrientBalanceBeam(logs) {
  const avgSugar = logs.length ? (logs.reduce((acc, l) => acc + l.total_sugar_g, 0) / logs.length) : 34.2;
  const avgCaff = logs.length ? (logs.reduce((acc, l) => acc + l.total_caffeine_mg, 0) / logs.length) : 26;

  const sugarPct = Math.min(100, Math.round((avgSugar / 50) * 100));
  const elSugarVal = document.getElementById('beamSugarVal');
  const elSugarBar = document.getElementById('beamSugarBar');
  const elSugarStatus = document.getElementById('beamSugarStatus');

  if (elSugarVal) elSugarVal.textContent = `${avgSugar.toFixed(1)} g / d`;
  if (elSugarBar) {
    elSugarBar.style.width = `${sugarPct}%`;
    elSugarBar.style.backgroundColor = avgSugar > 25 ? '#f97316' : '#10b981';
  }
  if (elSugarStatus) {
    elSugarStatus.textContent = avgSugar > 25
      ? `Exceeds ICMR-NIN 2024 guideline of <5% total daily energy intake (~25g/d).`
      : `Within ICMR-NIN 2024 recommended dietary threshold (<25g/d).`;
  }

  const caffPct = Math.min(100, Math.round((avgCaff / 400) * 100));
  const elCaffVal = document.getElementById('beamCaffeineVal');
  const elCaffBar = document.getElementById('beamCaffeineBar');
  const elCaffStatus = document.getElementById('beamCaffeineStatus');

  if (elCaffVal) elCaffVal.textContent = `${Math.round(avgCaff)} mg / d`;
  if (elCaffBar) {
    elCaffBar.style.width = `${caffPct}%`;
    elCaffBar.style.backgroundColor = avgCaff > 300 ? '#ef4444' : '#0d9488';
  }
  if (elCaffStatus) {
    elCaffStatus.textContent = avgCaff > 300
      ? `Approaching or exceeding adult physiological boundary (300 mg/day).`
      : `Well within safe adult physiological bounds (<300 mg/day).`;
  }

  const junkRatio = window.CohortSimulation ? window.CohortSimulation.params.junkRatio : 35;
  const wholeRatio = 100 - junkRatio;
  const elRatioVal = document.getElementById('beamRatioVal');
  const elRatioBar = document.getElementById('beamRatioBar');

  if (elRatioVal) elRatioVal.textContent = `${wholeRatio}% Whole : ${junkRatio}% Processed`;
  if (elRatioBar) {
    elRatioBar.style.width = `${wholeRatio}%`;
    elRatioBar.style.backgroundColor = wholeRatio >= 60 ? '#10b981' : (wholeRatio >= 40 ? '#0d9488' : '#f97316');
  }
}

function renderDriversSankey(logs) {
  const container = document.getElementById('driversSankeyContainer');
  if (!container || typeof d3 === 'undefined') return;

  container.innerHTML = '';
  const width = Math.max(680, container.clientWidth || 800);
  const height = 400;
  const colors = getThemeColors();

  if (typeof d3.sankey !== 'function') {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Sankey layout engine loading...</div>';
    return;
  }

  const reasons = ['taste', 'hunger', 'convenience', 'cost', 'peers'];
  const sources = ['home', 'mess', 'canteen', 'delivery', 'skipped'];
  const qualities = ['balanced', 'mixed', 'mainly refined or fried'];

  const linkMap = {};
  logs.forEach(l => {
    const k1 = `Reason: ${l.main_food_reason}->Source: ${l.meal_source}`;
    const k2 = `Source: ${l.meal_source}->Quality: ${l.meal_quality}`;
    linkMap[k1] = (linkMap[k1] || 0) + 1;
    linkMap[k2] = (linkMap[k2] || 0) + 1;
  });

  const connectedNodesSet = new Set();
  for (const [key, value] of Object.entries(linkMap)) {
    if (value > 0) {
      const [src, tgt] = key.split('->');
      connectedNodesSet.add(src);
      connectedNodesSet.add(tgt);
    }
  }

  const activeNodes = Array.from(connectedNodesSet).map(name => ({ name }));
  const activeNodeNames = activeNodes.map(d => d.name);

  const links = [];
  for (const [key, value] of Object.entries(linkMap)) {
    if (value > 0) {
      const [src, tgt] = key.split('->');
      const srcIdx = activeNodeNames.indexOf(src);
      const tgtIdx = activeNodeNames.indexOf(tgt);
      if (srcIdx !== -1 && tgtIdx !== -1) {
        links.push({ source: srcIdx, target: tgtIdx, value });
      }
    }
  }

  if (activeNodes.length === 0 || links.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No transition flows match active filters.</div>';
    return;
  }

  try {
    const sankeyGen = d3.sankey()
      .nodeWidth(18)
      .nodePadding(14)
      .extent([[12, 18], [width - 12, height - 18]]);

    const graph = sankeyGen({
      nodes: activeNodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const getNodeColor = d => {
      if (d.name.startsWith('Reason')) return colors.orangeAccent;
      if (d.name.startsWith('Source')) return colors.tealPrimary;
      return '#8b5cf6';
    };

    svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.42)
      .selectAll('path')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => getNodeColor(d.source))
      .attr('stroke-width', d => Math.max(1.5, d.width))
      .append('title')
      .text(d => `${d.source.name} → ${d.target.name}\n${d.value} logged transitions`);

    const nodeGroup = svg.append('g').selectAll('g').data(graph.nodes).enter().append('g');

    nodeGroup.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => Math.max(2, d.y1 - d.y0))
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', getNodeColor)
      .attr('rx', 3);

    nodeGroup.append('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .attr('fill', colors.textPrimary)
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text(d => d.name.replace(/^(Reason|Source|Quality): /, ''));
  } catch (err) {
    console.error('Sankey render error:', err);
  }
}

// ==========================================================================
// 5. MONTHLY CALENDAR VIEW
// ==========================================================================
function renderMonthlyCalendar(studentId = 'S-001') {
  const container = document.getElementById('monthlyCalendarGrid');
  if (!container) return;

  container.innerHTML = '';
  const sLogs = APP_DATASET.logs.filter(l => l.student_id === studentId);

  const daysHeader = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  daysHeader.forEach(h => {
    const headerCell = document.createElement('div');
    headerCell.className = 'calendar-day-header';
    headerCell.textContent = h;
    container.appendChild(headerCell);
  });

  const energyColors = {
    1: '#ea580c',
    2: '#f97316',
    3: '#eab308',
    4: '#14b8a6',
    5: '#0d9488'
  };

  sLogs.forEach(dayLog => {
    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${dayLog.day_type === 'Exam days' ? 'exam-day' : ''}`;
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `Day ${dayLog.day}, Energy ${dayLog.energy_rating} out of 5`);

    cell.innerHTML = `
      <div class="calendar-day-number">Day ${dayLog.day}</div>
      <div class="calendar-day-energy" style="background-color: ${energyColors[dayLog.energy_rating]}; color: #ffffff;">
        Energy: ${dayLog.energy_rating}/5
      </div>
      <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px;">
        ${dayLog.sleep_hours}h sleep • ${dayLog.steps} steps
      </div>
    `;

    cell.addEventListener('click', () => showCalendarDayDetails(dayLog));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cell.click();
      }
    });

    container.appendChild(cell);
  });
}

function showCalendarDayDetails(dayLog) {
  const detailsArea = document.getElementById('calendarDayDetailsCard');
  if (!detailsArea) return;

  const skuNames = dayLog.skus_consumed.map(item => {
    const s = PRODUCT_CATALOG.find(p => p.sku_id === item.sku_id);
    return s ? `${s.name} (${item.servings}x)` : item.sku_id;
  }).join(', ');

  detailsArea.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4 style="font-size: 1.1rem; font-weight: 700;">Day ${dayLog.day} (${dayLog.day_of_week}) — Details</h4>
      <span class="badge ${dayLog.day_type === 'Exam days' ? 'badge-orange' : 'badge-teal'}">${dayLog.day_type}</span>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.85rem;">
      <div><strong>Breakfast:</strong> ${dayLog.breakfast_time}</div>
      <div><strong>Lunch:</strong> ${dayLog.lunch_time}</div>
      <div><strong>Dinner:</strong> ${dayLog.dinner_time}</div>
      <div><strong>Meal Source:</strong> ${dayLog.meal_source}</div>
      <div><strong>Meal Quality:</strong> ${dayLog.meal_quality}</div>
      <div><strong>Snack Type:</strong> ${dayLog.snack_type}</div>
      <div><strong>Last Caffeine Time:</strong> ${dayLog.last_caffeine_time}</div>
      <div><strong>Sleep Duration:</strong> ${dayLog.sleep_hours} hours</div>
      <div><strong>Daily Steps:</strong> ${dayLog.steps.toLocaleString()}</div>
      <div><strong>Total Sugar:</strong> ${dayLog.total_sugar_g} g</div>
      <div><strong>Total Caffeine:</strong> ${dayLog.total_caffeine_mg} mg</div>
      <div><strong>Food Reason:</strong> ${dayLog.main_food_reason}</div>
    </div>
    <div style="margin-top: 12px; font-size: 0.82rem; color: var(--text-secondary);">
      <strong>Catalog Items Consumed:</strong> ${skuNames}
    </div>
  `;
}

// ==========================================================================
// 6. PRODUCT EXPLORER CHARTS
// ==========================================================================
function renderProductExplorerChart() {
  const colors = getThemeColors();
  destroyChart('topSugaryChart');
  const ctx = document.getElementById('topSugaryChart');
  if (!ctx) return;

  const top15Sugary = [...PRODUCT_CATALOG]
    .filter(s => s.verified && typeof s.sugar_g === 'number')
    .sort((a, b) => b.sugar_g - a.sugar_g)
    .slice(0, 15);

  chartInstances['topSugaryChart'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top15Sugary.map(s => s.name.length > 25 ? s.name.substring(0, 22) + '...' : s.name),
      datasets: [{
        label: 'Sugar per Stated Serving (g)',
        data: top15Sugary.map(s => s.sugar_g),
        backgroundColor: colors.orangePrimary,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.textSecondary },
          title: { display: true, text: 'Sugar (g per serving)', color: colors.textSecondary }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.textPrimary, font: { size: 10, weight: 500 } }
        }
      }
    }
  });
}
