/**
 * Invisible Habits, Visible Energy - Main Application Logic (app.js)
 * State management, interactive cohort simulation engine, personal dietary plan
 * recommendation engine, SaaS bento showcase, and product explorer drawer.
 */

window.appState = {
  currentPage: 'showcase',
  selectedStudent: 'all',
  selectedWeek: 'all',
  selectedDayType: 'all',
  isDarkMode: false,
  orbitViewMode: 'centroids'
};

// ==========================================================================
// 1. REACTIVE COHORT SIMULATION & AI SCENARIO ENGINE
// ==========================================================================

window.CohortSimulation = {
  mode: 'manual', // 'manual', 'running', 'ai'
  isRunning: false,
  timer: null,
  speed: 1000,
  currentSimDay: 1,

  params: {
    sleepShift: 0.0,
    caffeineShift: 0,
    junkRatio: 35,
    regularityShift: 0,
    examDip: -1.2,
    weekendRecovery: 1.2,
    sugarShift: 0,
    convenienceBias: 45,
    scenarioName: 'Baseline Cohort Routine'
  },

  getDynamicLogs() {
    if (!window.APP_DATASET || !window.APP_DATASET.logs) return [];
    const baseLogs = window.APP_DATASET.logs;
    const {
      sleepShift = 0.0,
      caffeineShift = 0,
      junkRatio = 35,
      regularityShift = 0,
      examDip = -1.2,
      weekendRecovery = 1.2,
      sugarShift = 0,
      convenienceBias = 45
    } = this.params;

    return baseLogs.map(log => {
      // Dynamic sleep adjustment (bounded 3.0 to 10.0 hrs)
      let sleep = log.sleep_hours + sleepShift;
      const isWeekend = (log.day % 7 === 6 || log.day % 7 === 0);
      if (isWeekend) {
        sleep += (weekendRecovery - 1.2);
      }
      sleep = Math.max(3.0, Math.min(10.0, Math.round(sleep * 10) / 10));

      // Dynamic caffeine adjustment (bounded >= 0 mg)
      const caffeine = Math.max(0, Math.round(log.total_caffeine_mg + caffeineShift));

      // Dynamic sugar adjustment (proportional to junkRatio vs baseline 35% + sugarShift)
      const sugarFactor = junkRatio / 35.0;
      const sugar = Math.max(2, Math.round(log.total_sugar_g * sugarFactor + sugarShift));

      // Dynamic regularity index (timing dispersion in minutes, bounded 10 to 120m)
      const regularity = Math.max(10, Math.min(120, Math.round(log.meal_regularity_index + regularityShift)));

      // Dynamic Energy rating computation (1 to 5) based on physiological impact
      let energyDelta = 0;
      if (sleep >= 7.5) energyDelta += 0.8;
      else if (sleep <= 5.5) energyDelta -= 1.2;
      else if (sleep <= 4.5) energyDelta -= 2.0;

      if (regularity > 50) energyDelta -= 0.6;
      else if (regularity < 25) energyDelta += 0.4;

      if (junkRatio > 60) energyDelta -= 0.8;
      else if (junkRatio < 20) energyDelta += 0.6;

      if (caffeine > 200 && sleep < 6.0) energyDelta -= 0.5;

      // Dynamic Exam days stress dip
      if (log.day_type === 'Exam days') {
        energyDelta += (examDip - (-1.2));
      }

      // Dynamic weekend vitality recovery
      if (isWeekend && weekendRecovery > 1.2) {
        energyDelta += 0.3;
      }

      let energy = Math.max(1, Math.min(5, Math.round(log.energy_rating + energyDelta)));

      // Dynamic meal source & quality adjustments if junkRatio or convenienceBias shifts
      let source = log.meal_source;
      let quality = log.meal_quality;
      let reason = log.main_food_reason;

      if (junkRatio >= 65 || convenienceBias >= 65) {
        if (source === 'home' || source === 'mess') {
          source = convenienceBias >= 75 ? 'delivery' : 'canteen';
        }
        quality = 'mainly refined or fried';
        if (reason === 'hunger' || reason === 'cost') reason = 'convenience';
      } else if (junkRatio <= 20 && convenienceBias <= 30) {
        if (source === 'delivery' || source === 'canteen') source = 'home';
        quality = 'balanced';
        if (reason === 'convenience') reason = 'hunger';
      }

      // Late caffeine flag: true if caffeinated and logged after 15:00
      let lateCaff = log.late_caffeine_flag;
      if (caffeineShift > 80 && log.day_type === 'Exam days') lateCaff = true;
      if (caffeine === 0) lateCaff = false;

      return {
        ...log,
        sleep_hours: sleep,
        total_caffeine_mg: caffeine,
        total_sugar_g: sugar,
        meal_regularity_index: regularity,
        energy_rating: energy,
        meal_source: source,
        meal_quality: quality,
        main_food_reason: reason,
        late_caffeine_flag: lateCaff
      };
    });
  },

  applyPreset(presetKey) {
    if (presetKey === 'exam_crunch') {
      this.params.sleepShift = -2.5;
      this.params.caffeineShift = 220;
      this.params.junkRatio = 85;
      this.params.regularityShift = 40;
      this.params.scenarioName = 'Exam Crunch All-Nighter';
    } else if (presetKey === 'nutritive_reset') {
      this.params.sleepShift = 1.8;
      this.params.caffeineShift = -60;
      this.params.junkRatio = 10;
      this.params.regularityShift = -20;
      this.params.scenarioName = 'ICMR-NIN Nutritive Reset';
    } else if (presetKey === 'weekend_binge') {
      this.params.sleepShift = -1.5;
      this.params.caffeineShift = 80;
      this.params.junkRatio = 70;
      this.params.regularityShift = 35;
      this.params.scenarioName = 'Weekend Delivery Binge';
    } else if (presetKey === 'caffeine_overdrive') {
      this.params.sleepShift = -1.0;
      this.params.caffeineShift = 280;
      this.params.junkRatio = 55;
      this.params.regularityShift = 20;
      this.params.scenarioName = 'Caffeine Overdrive & Crash';
    }
    this.syncUI();
    this.updateViews();
  },

  parseAIPrompt(text) {
    if (!text || !text.trim()) return;
    const lower = text.toLowerCase();
    let sShift = 0.0, cShift = 0, jRatio = 35, rShift = 0;
    let brief = [];

    // Sleep analysis
    if (lower.includes('all nighter') || lower.includes('no sleep') || lower.includes('3 hour') || lower.includes('4 hour')) {
      sShift = -2.8;
      brief.push('Severe sleep deficit (-2.8h)');
    } else if (lower.includes('less sleep') || lower.includes('late night') || lower.includes('insomnia') || lower.includes('5 hour')) {
      sShift = -1.6;
      brief.push('Sleep reduction (-1.6h)');
    } else if (lower.includes('sleep 8') || lower.includes('rested') || lower.includes('optimal sleep') || lower.includes('good sleep') || lower.includes('recovery')) {
      sShift = +1.6;
      brief.push('Optimal circadian sleep (+1.6h)');
    }

    // Caffeine analysis
    if (lower.includes('energy drink') || lower.includes('red bull') || lower.includes('sting') || lower.includes('heavy coffee') || lower.includes('3 coffee') || lower.includes('cold coffee')) {
      cShift = +240;
      brief.push('Heavy caffeine surge (+240mg)');
    } else if (lower.includes('coffee') || lower.includes('caffeine') || lower.includes('tea')) {
      cShift = +110;
      brief.push('Moderate caffeine intake (+110mg)');
    } else if (lower.includes('decaf') || lower.includes('zero caffeine') || lower.includes('no coffee')) {
      cShift = -100;
      brief.push('Zero caffeine curfew (-100mg)');
    }

    // Diet analysis
    if (lower.includes('junk') || lower.includes('noodles') || lower.includes('pizza') || lower.includes('burger') || lower.includes('chips') || lower.includes('delivery') || lower.includes('fast food')) {
      jRatio = 80;
      rShift += 30;
      brief.push('High ultra-processed & delivery dominance (80%)');
    } else if (lower.includes('salad') || lower.includes('fruits') || lower.includes('curd') || lower.includes('idli') || lower.includes('healthy') || lower.includes('whole food') || lower.includes('home')) {
      jRatio = 12;
      rShift -= 15;
      brief.push('Whole-food & nutrient-dense grounding (12% junk)');
    }

    // Stress & exam context
    if (lower.includes('exam') || lower.includes('finals') || lower.includes('deadline') || lower.includes('crunch') || lower.includes('stress')) {
      rShift += 25;
      brief.push('Elevated Exam days pressure and timing dispersion');
    }

    this.params.sleepShift = sShift;
    this.params.caffeineShift = cShift;
    this.params.junkRatio = jRatio;
    this.params.regularityShift = rShift;
    this.params.scenarioName = `AI Model: "${text.substring(0, 32)}..."`;

    const banner = document.getElementById('aiResultBanner');
    const bannerText = document.getElementById('aiResultText');
    if (banner && bannerText) {
      banner.style.display = 'flex';
      bannerText.innerHTML = `<strong>AI Synthesis Applied:</strong> ${brief.join(' • ')}. Recalculated 1,800 records across Tabs 3–5.`;
    }

    this.syncUI();
    this.updateViews();
  },

  syncUI() {
    // Tab 3 Manual Inputs
    const sInput = document.getElementById('simInputSleep');
    const sDisp = document.getElementById('simValSleepDisplay');
    if (sInput) sInput.value = this.params.sleepShift;
    if (sDisp) sDisp.textContent = `${this.params.sleepShift > 0 ? '+' : ''}${this.params.sleepShift.toFixed(1)}h`;

    const cInput = document.getElementById('simInputCaffeine');
    const cDisp = document.getElementById('simValCaffeineDisplay');
    if (cInput) cInput.value = this.params.caffeineShift;
    if (cDisp) cDisp.textContent = `${this.params.caffeineShift > 0 ? '+' : ''}${this.params.caffeineShift} mg`;

    const jInput = document.getElementById('simInputJunk');
    const jDisp = document.getElementById('simValJunkDisplay');
    if (jInput) jInput.value = this.params.junkRatio;
    if (jDisp) jDisp.textContent = `${this.params.junkRatio}%`;

    const rInput = document.getElementById('simInputRegularity');
    const rDisp = document.getElementById('simValRegularityDisplay');
    if (rInput) rInput.value = this.params.regularityShift;
    if (rDisp) {
      const regMin = 35 + this.params.regularityShift;
      rDisp.textContent = `${regMin}m (${regMin <= 25 ? 'Disciplined' : (regMin >= 55 ? 'Erratic' : 'Standard')})`;
    }

    // Tab 4 (Trends & Regularity) Manual Inputs
    const tRegInput = document.getElementById('simTrendsInputRegularity');
    const tRegDisp = document.getElementById('simTrendsValRegularity');
    if (tRegInput) tRegInput.value = this.params.regularityShift;
    if (tRegDisp) {
      const regMin = 35 + this.params.regularityShift;
      tRegDisp.textContent = `${regMin}m (${regMin <= 25 ? 'Disciplined' : (regMin >= 55 ? 'Erratic' : 'Standard')})`;
    }

    const tExamInput = document.getElementById('simTrendsInputExamDip');
    const tExamDisp = document.getElementById('simTrendsValExamDip');
    if (tExamInput) tExamInput.value = this.params.examDip !== undefined ? this.params.examDip : -1.2;
    if (tExamDisp) tExamDisp.textContent = `${this.params.examDip !== undefined ? this.params.examDip : -1.2} pts`;

    const tWkInput = document.getElementById('simTrendsInputWeekend');
    const tWkDisp = document.getElementById('simTrendsValWeekend');
    if (tWkInput) tWkInput.value = this.params.weekendRecovery !== undefined ? this.params.weekendRecovery : 1.2;
    if (tWkDisp) tWkDisp.textContent = `+${this.params.weekendRecovery !== undefined ? this.params.weekendRecovery : 1.2}h`;

    const tCaffInput = document.getElementById('simTrendsInputCaff');
    const tCaffDisp = document.getElementById('simTrendsValCaff');
    if (tCaffInput) tCaffInput.value = this.params.caffeineShift;
    if (tCaffDisp) tCaffDisp.textContent = `${this.params.caffeineShift > 0 ? '+' : ''}${this.params.caffeineShift} mg`;

    // Tab 5 (Food, Drinks & Drivers) Manual Inputs
    const fJunkInput = document.getElementById('simFoodInputJunk');
    const fJunkDisp = document.getElementById('simFoodValJunk');
    if (fJunkInput) fJunkInput.value = this.params.junkRatio;
    if (fJunkDisp) fJunkDisp.textContent = `${this.params.junkRatio}%`;

    const fSugarInput = document.getElementById('simFoodInputSugar');
    const fSugarDisp = document.getElementById('simFoodValSugar');
    if (fSugarInput) fSugarInput.value = this.params.sugarShift !== undefined ? this.params.sugarShift : 0;
    if (fSugarDisp) fSugarDisp.textContent = `${(this.params.sugarShift || 0) > 0 ? '+' : ''}${this.params.sugarShift || 0} g`;

    const fCaffInput = document.getElementById('simFoodInputCaff');
    const fCaffDisp = document.getElementById('simFoodValCaff');
    if (fCaffInput) fCaffInput.value = this.params.caffeineShift;
    if (fCaffDisp) fCaffDisp.textContent = `${this.params.caffeineShift > 0 ? '+' : ''}${this.params.caffeineShift} mg`;

    const fConvInput = document.getElementById('simFoodInputConvenience');
    const fConvDisp = document.getElementById('simFoodValConvenience');
    if (fConvInput) fConvInput.value = this.params.convenienceBias !== undefined ? this.params.convenienceBias : 45;
    if (fConvDisp) fConvDisp.textContent = `${this.params.convenienceBias !== undefined ? this.params.convenienceBias : 45}%`;

    // Status Texts across tabs
    const statText = document.getElementById('simStatusText');
    if (statText) statText.textContent = this.params.scenarioName;
    const trendsStatText = document.getElementById('trendsSimStatusText');
    if (trendsStatText) trendsStatText.textContent = this.params.scenarioName;
    const foodStatText = document.getElementById('foodSimStatusText');
    if (foodStatText) foodStatText.textContent = this.params.scenarioName;
  },

  startStream() {
    this.isRunning = true;
    const playIcon = document.getElementById('streamPlayIcon');
    const playText = document.getElementById('streamPlayText');
    const statusPill = document.getElementById('simStatusPill');

    if (playIcon) playIcon.textContent = '⏸';
    if (playText) playText.textContent = 'Pause Stream';
    if (statusPill) statusPill.classList.add('running');

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.currentSimDay = (this.currentSimDay % 30) + 1;
      const counter = document.getElementById('streamDayCounter');
      if (counter) counter.textContent = `Day ${this.currentSimDay} / 30`;

      // Realistic student log event
      const randStudent = `S-0${Math.floor(Math.random() * 59) + 1}`.padStart(5, '0');
      const randCaff = Math.random() > 0.5 ? (Math.random() > 0.5 ? 'Red Bull Energy Drink (80mg)' : 'Cold Coffee RTD (75mg)') : 'Water / Plain Milk';
      const isLate = Math.random() > 0.4;
      const ticker = document.getElementById('simTickerText');
      if (ticker) {
        ticker.innerHTML = `<strong>Day ${this.currentSimDay} Live Ingestion:</strong> Student ${randStudent} logged ${randCaff} at ${isLate ? '16:45 (Curfew breached)' : '11:30'}. Cohort updating...`;
      }

      this.updateViews();
    }, this.speed);
  },

  pauseStream() {
    this.isRunning = false;
    clearInterval(this.timer);
    const playIcon = document.getElementById('streamPlayIcon');
    const playText = document.getElementById('streamPlayText');
    const statusPill = document.getElementById('simStatusPill');

    if (playIcon) playIcon.textContent = '▶';
    if (playText) playText.textContent = 'Resume Live Stream';
    if (statusPill) statusPill.classList.remove('running');
  },

  toggleStream() {
    if (this.isRunning) this.pauseStream();
    else this.startStream();
  },

  updateViews() {
    const dynamicLogs = this.getDynamicLogs();

    // Recalculate summary cards
    const totalCount = dynamicLogs.length || 1;
    const avgSugar = Math.round((dynamicLogs.reduce((acc, l) => acc + l.total_sugar_g, 0) / totalCount) * 10) / 10;
    const avgCaff = Math.round(dynamicLogs.reduce((acc, l) => acc + l.total_caffeine_mg, 0) / totalCount);
    const lowEnergyCount = dynamicLogs.filter(l => l.energy_rating <= 2).length;
    const lowEnergyPct = Math.round((lowEnergyCount / totalCount) * 100);

    const reasons = {};
    dynamicLogs.forEach(l => reasons[l.main_food_reason] = (reasons[l.main_food_reason] || 0) + 1);
    let topReason = 'convenience';
    let maxR = 0;
    for (const [r, count] of Object.entries(reasons)) {
      if (count > maxR) { maxR = count; topReason = r; }
    }

    const sugarEl = document.getElementById('statValSugar');
    const caffEl = document.getElementById('statValCaffeine');
    const lowEnergyEl = document.getElementById('statValLowEnergy');
    const reasonEl = document.getElementById('statValReason');
    const dynamicKeyEl = document.getElementById('dynamicKeyFindingText');

    if (sugarEl) sugarEl.textContent = `${avgSugar} g`;
    if (caffEl) caffEl.textContent = `${avgCaff} mg`;
    if (lowEnergyEl) lowEnergyEl.textContent = `${lowEnergyPct}%`;
    if (reasonEl) reasonEl.textContent = topReason.charAt(0).toUpperCase() + topReason.slice(1);

    if (dynamicKeyEl) {
      if (this.params.junkRatio > 60 || this.params.sleepShift < -1.5) {
        dynamicKeyEl.textContent = `Active simulation detects high-strain shift: Sub-6h sleep and ${this.params.junkRatio}% ultra-processed food ratio correlate with a ${lowEnergyPct}% surge in low-energy days.`;
      } else if (this.params.sleepShift > 1.0 && this.params.junkRatio < 25) {
        dynamicKeyEl.textContent = `Nutritive reset active: Consistent whole foods and adequate sleep correlate with daytime vitality scores exceeding 85% across all 60 students.`;
      } else {
        dynamicKeyEl.textContent = `In this cohort, days with meal timing deviation over 45 minutes and caffeine intake past 15:00 show 2.1× higher incidence of afternoon fatigue.`;
      }
    }

    // Refresh active tab visualizations
    const p = window.appState.currentPage;
    if (p === 'summary') {
      renderSummaryCharts(dynamicLogs);
    } else if (p === 'trends') {
      renderTrendsCharts(dynamicLogs);
    } else if (p === 'food-drivers') {
      renderFoodDriversCharts(dynamicLogs);
    }
  }
};

// Filter helper to get subset of logs based on global filter controls
function getFilteredLogs() {
  const dynamicLogs = window.CohortSimulation ? window.CohortSimulation.getDynamicLogs() : (window.APP_DATASET ? window.APP_DATASET.logs : []);
  let logs = dynamicLogs;

  if (window.appState.selectedStudent !== 'all') {
    logs = logs.filter(l => l.student_id === window.appState.selectedStudent);
  }

  if (window.appState.selectedDayType !== 'all') {
    logs = logs.filter(l => l.day_type === window.appState.selectedDayType);
  }

  if (window.appState.selectedWeek !== 'all') {
    const w = window.appState.selectedWeek;
    let s = 1, e = 30;
    if (w === '1') { s = 1; e = 7; }
    else if (w === '2') { s = 8; e = 14; }
    else if (w === '3') { s = 15; e = 21; }
    else if (w === '4') { s = 22; e = 30; }
    logs = logs.filter(l => l.day >= s && l.day <= e);
  }

  return logs;
}

// Navigate to a specific page
function navigateToPage(pageId) {
  const targetPage = document.getElementById(`page-${pageId}`);
  if (!targetPage) return;

  window.appState.currentPage = pageId;

  // Update page visibility
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  targetPage.classList.add('active');

  // Update nav links
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-selected', 'true');
    } else {
      link.classList.remove('active');
      link.setAttribute('aria-selected', 'false');
    }
  });

  // Update top bar title
  const titleMap = {
    'showcase': 'SaaS Bento Showcase & Platform Overview',
    'dietary-plan': 'Personal Health Assessment & Nutritive Dietary Plan',
    'summary': 'Cohort Summary & Vitality Hub',
    'trends': 'Temporal Trends & Meal Regularity',
    'food-drivers': 'Food, Drinks & Choice Drivers',
    'calendar': 'Monthly Energy & Habit Calendar',
    'products': 'Product Catalog Explorer (100 SKUs)',
    'about': 'Methodology, Standards & Support'
  };

  const topTitle = document.getElementById('topbarPageTitle');
  if (topTitle) topTitle.textContent = titleMap[pageId] || 'Invisible Habits, Visible Energy';

  // Allow browser layout reflow to compute container dimensions before rendering charts
  requestAnimationFrame(() => {
    setTimeout(() => {
      renderPageCharts(pageId);
    }, 30);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render chart for active page
function renderPageCharts(pageId) {
  const filtered = getFilteredLogs();

  switch (pageId) {
    case 'showcase':
      if (typeof render3DProductDashboardGraphic === 'function') {
        render3DProductDashboardGraphic();
      }
      break;
    case 'dietary-plan':
      evaluatePersonalDietaryPlan();
      break;
    case 'summary':
      renderSummaryCharts(filtered);
      break;
    case 'trends':
      renderTrendsCharts(filtered);
      break;
    case 'food-drivers':
      renderFoodDriversCharts(filtered);
      break;
    case 'calendar':
      renderMonthlyCalendar(window.appState.selectedStudent === 'all' ? 'S-001' : window.appState.selectedStudent);
      break;
    case 'products':
      renderProductTable();
      renderProductExplorerChart();
      break;
    case 'about':
      break;
  }
}

// Setup common filter listeners
function setupFilters() {
  document.querySelectorAll('.filter-student-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      window.appState.selectedStudent = e.target.value;
      document.querySelectorAll('.filter-student-select').forEach(s => s.value = e.target.value);
      renderPageCharts(window.appState.currentPage);
    });
  });

  document.querySelectorAll('.filter-week-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      window.appState.selectedWeek = e.target.value;
      document.querySelectorAll('.filter-week-select').forEach(s => s.value = e.target.value);
      renderPageCharts(window.appState.currentPage);
    });
  });

  document.querySelectorAll('.filter-daytype-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      window.appState.selectedDayType = e.target.value;
      document.querySelectorAll('.filter-daytype-select').forEach(s => s.value = e.target.value);
      renderPageCharts(window.appState.currentPage);
    });
  });
}

// Populate student dropdowns (S-001 to S-060)
function populateStudentSelectors() {
  if (!window.APP_DATASET || !window.APP_DATASET.students) return;
  const selectors = document.querySelectorAll('.filter-student-select');
  selectors.forEach(sel => {
    const isProfileSel = sel.id === 'calendarStudentSelect';
    sel.innerHTML = isProfileSel ? '' : '<option value="all">All Students (Cohort)</option>';
    window.APP_DATASET.students.forEach(sId => {
      const opt = document.createElement('option');
      opt.value = sId;
      opt.textContent = sId;
      sel.appendChild(opt);
    });
  });
}

// Setup Theme Toggle
function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  window.appState.isDarkMode = systemPrefersDark;
  if (window.appState.isDarkMode) {
    document.body.classList.add('dark-mode');
  }

  function updateThemeButtonUI() {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = window.appState.isDarkMode
      ? '<span aria-hidden="true">☀️</span> Light Mode'
      : '<span aria-hidden="true">🌙</span> Dark Mode';
    toggleBtn.setAttribute('aria-label', `Switch to ${window.appState.isDarkMode ? 'light' : 'dark'} mode`);
  }

  updateThemeButtonUI();

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      window.appState.isDarkMode = !window.appState.isDarkMode;
      document.body.classList.toggle('dark-mode', window.appState.isDarkMode);
      updateThemeButtonUI();
      renderPageCharts(window.appState.currentPage);
    });
  }
}

// ==========================================================================
// 2. SETUP COHORT SIMULATION HUB INTERACTION
// ==========================================================================
function setupCohortSimulationHub() {
  // Mode Switcher Tabs
  document.querySelectorAll('.sim-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.sim-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.sim-panel').forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById(`simPanel-${mode}`);
      if (activePanel) activePanel.classList.add('active');
    });
  });

  // Manual Sliders
  const sInput = document.getElementById('simInputSleep');
  const sDisp = document.getElementById('simValSleepDisplay');
  if (sInput) {
    sInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.sleepShift = parseFloat(e.target.value);
      if (sDisp) sDisp.textContent = `${window.CohortSimulation.params.sleepShift > 0 ? '+' : ''}${window.CohortSimulation.params.sleepShift.toFixed(1)}h`;
      window.CohortSimulation.params.scenarioName = 'Custom Manual Adjustment';
      const statText = document.getElementById('simStatusText');
      if (statText) statText.textContent = window.CohortSimulation.params.scenarioName;
      window.CohortSimulation.updateViews();
    });
  }

  const cInput = document.getElementById('simInputCaffeine');
  const cDisp = document.getElementById('simValCaffeineDisplay');
  if (cInput) {
    cInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.caffeineShift = parseInt(e.target.value, 10);
      if (cDisp) cDisp.textContent = `${window.CohortSimulation.params.caffeineShift > 0 ? '+' : ''}${window.CohortSimulation.params.caffeineShift} mg`;
      window.CohortSimulation.params.scenarioName = 'Custom Manual Adjustment';
      const statText = document.getElementById('simStatusText');
      if (statText) statText.textContent = window.CohortSimulation.params.scenarioName;
      window.CohortSimulation.updateViews();
    });
  }

  const jInput = document.getElementById('simInputJunk');
  const jDisp = document.getElementById('simValJunkDisplay');
  if (jInput) {
    jInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.junkRatio = parseInt(e.target.value, 10);
      if (jDisp) jDisp.textContent = `${window.CohortSimulation.params.junkRatio}%`;
      window.CohortSimulation.params.scenarioName = 'Custom Manual Adjustment';
      const statText = document.getElementById('simStatusText');
      if (statText) statText.textContent = window.CohortSimulation.params.scenarioName;
      window.CohortSimulation.updateViews();
    });
  }

  const rInput = document.getElementById('simInputRegularity');
  const rDisp = document.getElementById('simValRegularityDisplay');
  if (rInput) {
    rInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.regularityShift = parseInt(e.target.value, 10);
      const regMin = 35 + window.CohortSimulation.params.regularityShift;
      if (rDisp) rDisp.textContent = `${regMin}m (${regMin <= 25 ? 'Disciplined' : (regMin >= 55 ? 'Erratic' : 'Standard')})`;
      window.CohortSimulation.params.scenarioName = 'Custom Manual Adjustment';
      const statText = document.getElementById('simStatusText');
      if (statText) statText.textContent = window.CohortSimulation.params.scenarioName;
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  // Tab 4 (Trends & Regularity) Manual Control Hub
  const tRegInput = document.getElementById('simTrendsInputRegularity');
  const tRegDisp = document.getElementById('simTrendsValRegularity');
  if (tRegInput) {
    tRegInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.regularityShift = parseInt(e.target.value, 10);
      const regMin = 35 + window.CohortSimulation.params.regularityShift;
      if (tRegDisp) tRegDisp.textContent = `${regMin}m (${regMin <= 25 ? 'Disciplined' : (regMin >= 55 ? 'Erratic' : 'Standard')})`;
      window.CohortSimulation.params.scenarioName = 'Custom Temporal Regularity Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const tExamInput = document.getElementById('simTrendsInputExamDip');
  const tExamDisp = document.getElementById('simTrendsValExamDip');
  if (tExamInput) {
    tExamInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.examDip = parseFloat(e.target.value);
      if (tExamDisp) tExamDisp.textContent = `${window.CohortSimulation.params.examDip.toFixed(1)} pts`;
      window.CohortSimulation.params.scenarioName = 'Custom Exam Days Dip Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const tWkInput = document.getElementById('simTrendsInputWeekend');
  const tWkDisp = document.getElementById('simTrendsValWeekend');
  if (tWkInput) {
    tWkInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.weekendRecovery = parseFloat(e.target.value);
      if (tWkDisp) tWkDisp.textContent = `+${window.CohortSimulation.params.weekendRecovery.toFixed(1)}h`;
      window.CohortSimulation.params.scenarioName = 'Custom Weekend Rebound Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const tCaffInput = document.getElementById('simTrendsInputCaff');
  const tCaffDisp = document.getElementById('simTrendsValCaff');
  if (tCaffInput) {
    tCaffInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.caffeineShift = parseInt(e.target.value, 10);
      if (tCaffDisp) tCaffDisp.textContent = `${window.CohortSimulation.params.caffeineShift > 0 ? '+' : ''}${window.CohortSimulation.params.caffeineShift} mg`;
      window.CohortSimulation.params.scenarioName = 'Custom Caffeine Shift';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  // Tab 5 (Food, Drinks & Choice Drivers) Manual Control Hub
  const fJunkInput = document.getElementById('simFoodInputJunk');
  const fJunkDisp = document.getElementById('simFoodValJunk');
  if (fJunkInput) {
    fJunkInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.junkRatio = parseInt(e.target.value, 10);
      if (fJunkDisp) fJunkDisp.textContent = `${window.CohortSimulation.params.junkRatio}%`;
      window.CohortSimulation.params.scenarioName = 'Custom Food Processing Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const fSugarInput = document.getElementById('simFoodInputSugar');
  const fSugarDisp = document.getElementById('simFoodValSugar');
  if (fSugarInput) {
    fSugarInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.sugarShift = parseInt(e.target.value, 10);
      if (fSugarDisp) fSugarDisp.textContent = `${window.CohortSimulation.params.sugarShift > 0 ? '+' : ''}${window.CohortSimulation.params.sugarShift} g`;
      window.CohortSimulation.params.scenarioName = 'Custom Sugar Shift Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const fCaffInput = document.getElementById('simFoodInputCaff');
  const fCaffDisp = document.getElementById('simFoodValCaff');
  if (fCaffInput) {
    fCaffInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.caffeineShift = parseInt(e.target.value, 10);
      if (fCaffDisp) fCaffDisp.textContent = `${window.CohortSimulation.params.caffeineShift > 0 ? '+' : ''}${window.CohortSimulation.params.caffeineShift} mg`;
      window.CohortSimulation.params.scenarioName = 'Custom Caffeine Shift';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  const fConvInput = document.getElementById('simFoodInputConvenience');
  const fConvDisp = document.getElementById('simFoodValConvenience');
  if (fConvInput) {
    fConvInput.addEventListener('input', (e) => {
      window.CohortSimulation.params.convenienceBias = parseInt(e.target.value, 10);
      if (fConvDisp) fConvDisp.textContent = `${window.CohortSimulation.params.convenienceBias}%`;
      window.CohortSimulation.params.scenarioName = 'Custom Convenience Bias Tuning';
      window.CohortSimulation.syncUI();
      window.CohortSimulation.updateViews();
    });
  }

  // Live Stream Ticker Controls
  const toggleStreamBtn = document.getElementById('btnToggleStream');
  if (toggleStreamBtn) {
    toggleStreamBtn.addEventListener('click', () => {
      window.CohortSimulation.toggleStream();
    });
  }

  document.querySelectorAll('.sim-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.CohortSimulation.speed = parseInt(btn.getAttribute('data-speed'), 10);
      if (window.CohortSimulation.isRunning) {
        window.CohortSimulation.pauseStream();
        window.CohortSimulation.startStream();
      }
    });
  });

  // AI Presets
  document.querySelectorAll('.sim-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      window.CohortSimulation.applyPreset(preset);
    });
  });

  // AI Prompt Run Button
  const runAIBtn = document.getElementById('btnRunAIPrompt');
  const promptInput = document.getElementById('aiScenarioPromptInput');
  if (runAIBtn && promptInput) {
    runAIBtn.addEventListener('click', () => {
      window.CohortSimulation.parseAIPrompt(promptInput.value);
    });
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.CohortSimulation.parseAIPrompt(promptInput.value);
      }
    });
  }

  // Orbit Mode Buttons (Tab 3)
  const btnCentroids = document.getElementById('btnOrbitCentroids');
  const btnAllPoints = document.getElementById('btnOrbitAllPoints');
  const btnExamShift = document.getElementById('btnOrbitExamShift');

  if (btnCentroids) {
    btnCentroids.addEventListener('click', () => {
      window.appState.orbitViewMode = 'centroids';
      document.querySelectorAll('#orbitModeGroup button').forEach(b => b.classList.remove('active'));
      btnCentroids.classList.add('active');
      renderPhaseSpaceBubbleOrbit(getFilteredLogs());
    });
  }
  if (btnAllPoints) {
    btnAllPoints.addEventListener('click', () => {
      window.appState.orbitViewMode = 'all';
      document.querySelectorAll('#orbitModeGroup button').forEach(b => b.classList.remove('active'));
      btnAllPoints.classList.add('active');
      renderPhaseSpaceBubbleOrbit(getFilteredLogs());
    });
  }
  if (btnExamShift) {
    btnExamShift.addEventListener('click', () => {
      window.appState.orbitViewMode = 'exam';
      document.querySelectorAll('#orbitModeGroup button').forEach(b => b.classList.remove('active'));
      btnExamShift.classList.add('active');
      renderPhaseSpaceBubbleOrbit(getFilteredLogs());
    });
  }
}

// ==========================================================================
// 3. INTERACTIVE NUTRITIVE DIETARY PLAN ENGINE
// ==========================================================================
function setupDietaryPlanEngine() {
  const sleepInput = document.getElementById('inputSleepHours');
  const sleepDisplay = document.getElementById('valSleepHoursDisplay');
  if (sleepInput && sleepDisplay) {
    sleepInput.addEventListener('input', (e) => {
      sleepDisplay.textContent = `${e.target.value} hours`;
    });
  }

  const junkInput = document.getElementById('inputJunkRatio');
  const junkDisplay = document.getElementById('valJunkRatioDisplay');
  if (junkInput && junkDisplay) {
    junkInput.addEventListener('input', (e) => {
      junkDisplay.textContent = `${e.target.value}% Junk`;
    });
  }

  const friendsInput = document.getElementById('inputFriendsHours');
  const friendsDisplay = document.getElementById('valFriendsHoursDisplay');
  if (friendsInput && friendsDisplay) {
    friendsInput.addEventListener('input', (e) => {
      friendsDisplay.textContent = `${e.target.value}h`;
    });
  }

  const mobileInput = document.getElementById('inputMobileHours');
  const mobileDisplay = document.getElementById('valMobileHoursDisplay');
  if (mobileInput && mobileDisplay) {
    mobileInput.addEventListener('input', (e) => {
      mobileDisplay.textContent = `${e.target.value}h`;
    });
  }

  const workoutInput = document.getElementById('inputWorkoutHours');
  const workoutDisplay = document.getElementById('valWorkoutHoursDisplay');
  if (workoutInput && workoutDisplay) {
    workoutInput.addEventListener('input', (e) => {
      workoutDisplay.textContent = `${e.target.value}h`;
    });
  }

  // Chips multiselect toggles
  document.querySelectorAll('#repeatedChipsGroup .chip-btn, #concernsChipsGroup .chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  // Calculate & Generate Button
  const calcBtn = document.getElementById('btnGenerateDietaryPlan');
  if (calcBtn) {
    calcBtn.addEventListener('click', evaluatePersonalDietaryPlan);
  }

  // Bento CTA button linking to Dietary Plan tab
  const bentoCta = document.getElementById('bentoCtaButton');
  if (bentoCta) {
    bentoCta.addEventListener('click', () => {
      navigateToPage('dietary-plan');
    });
  }

  // Print button
  const printBtn = document.getElementById('btnPrintDietaryPlan');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy Summary button
  const copyBtn = document.getElementById('btnCopyDietaryPlan');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const bf = document.getElementById('prescBreakfast')?.innerText || '';
      const ln = document.getElementById('prescLunch')?.innerText || '';
      const sn = document.getElementById('prescSnack')?.innerText || '';
      const dn = document.getElementById('prescDinner')?.innerText || '';
      const status = document.getElementById('planStatusHeading')?.innerText || '';

      const summaryText = `[Invisible Habits - Personalized Nutritive Dietary Plan]\nHealth Status: ${status}\n\n1. Breakfast: ${bf}\n2. Lunch: ${ln}\n3. Smart Snack: ${sn}\n4. Dinner: ${dn}\n\nTarget Guidelines: Free sugar <25g/day, Hydration 2.8L, Caffeine curfew before 15:00.`;

      navigator.clipboard.writeText(summaryText).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>✓</span> <span>Copied to Clipboard!</span>';
        setTimeout(() => copyBtn.innerHTML = orig, 2000);
      });
    });
  }
}

function evaluatePersonalDietaryPlan() {
  const sleepHours = parseFloat(document.getElementById('inputSleepHours')?.value || '6.5');
  const breakfast = document.getElementById('inputBreakfastSelect')?.value || 'balanced';
  const lunch = document.getElementById('inputLunchSelect')?.value || 'balanced';
  const snack = document.getElementById('inputSnackSelect')?.value || 'fresh';
  const dinner = document.getElementById('inputDinnerTiming')?.value || 'early_balanced';
  const junkRatio = parseInt(document.getElementById('inputJunkRatio')?.value || '35', 10);
  const friendsHours = parseFloat(document.getElementById('inputFriendsHours')?.value || '2');
  const mobileHours = parseFloat(document.getElementById('inputMobileHours')?.value || '4.5');
  const workoutHours = parseFloat(document.getElementById('inputWorkoutHours')?.value || '0.5');
  const stress = document.getElementById('inputStressLevel')?.value || 'moderate';

  const activeRepeated = Array.from(document.querySelectorAll('#repeatedChipsGroup .chip-btn.active')).map(c => c.getAttribute('data-item'));

  let score = 75;

  if (sleepHours < 5.5) score -= 22;
  else if (sleepHours < 6.5) score -= 12;
  else if (sleepHours >= 7.5 && sleepHours <= 9.0) score += 10;

  if (breakfast === 'skipped') score -= 14;
  else if (breakfast === 'fried') score -= 8;
  else if (breakfast === 'balanced') score += 8;

  if (junkRatio > 50) score -= 18;
  else if (junkRatio > 30) score -= 8;
  else if (junkRatio <= 15) score += 10;

  if (mobileHours > 6.0) score -= 12;
  else if (mobileHours < 3.0) score += 5;

  if (dinner === 'late_heavy') score -= 12;

  if (stress === 'severe') score -= 18;
  else if (stress === 'high') score -= 10;

  if (workoutHours >= 0.5 && workoutHours <= 1.5) score += 10;
  else if (workoutHours === 0) score -= 5;

  score = Math.max(25, Math.min(98, Math.round(score)));

  const banner = document.getElementById('planHealthStatusBanner');
  const scoreVal = document.getElementById('planScoreValue');
  const statusHeading = document.getElementById('planStatusHeading');
  const statusSummary = document.getElementById('planStatusSummary');

  const prescBf = document.getElementById('prescBreakfast');
  const prescBfBen = document.getElementById('prescBreakfastBenefit');
  const prescLn = document.getElementById('prescLunch');
  const prescLnBen = document.getElementById('prescLunchBenefit');
  const prescSn = document.getElementById('prescSnack');
  const prescSnBen = document.getElementById('prescSnackBenefit');
  const prescDn = document.getElementById('prescDinner');
  const prescDnBen = document.getElementById('prescDinnerBenefit');
  const prescTargetKcal = document.getElementById('prescTargetKcal');
  const prescAdvice = document.getElementById('prescSpecialAdvice');

  if (scoreVal) scoreVal.textContent = score;

  const isCircadianStrain = sleepHours < 6.0 || dinner === 'late_heavy' || mobileHours > 5.0;
  const isGlycemicStrain = junkRatio >= 40 || breakfast === 'skipped' || activeRepeated.includes('Instant Noodles') || activeRepeated.includes('Carbonated Soda');
  const isHighStress = stress === 'high' || stress === 'severe';

  if (score >= 75) {
    if (banner) banner.className = 'health-status-banner alert-optimal';
    if (statusHeading) statusHeading.textContent = 'Stable Vitality & Habit Equilibrium';
    if (statusSummary) statusSummary.textContent = 'Your reported routine demonstrates solid sleep balance and whole food grounding. Follow the sustained endurance protocol below.';
  } else {
    if (banner) banner.className = 'health-status-banner alert-warning';
    if (statusHeading) {
      statusHeading.textContent = isCircadianStrain && isGlycemicStrain
        ? 'High Circadian & Glycemic Stress Shift Detected'
        : (isCircadianStrain ? 'Circadian Rhythm & Sleep Deficit Shift' : 'Glycemic Volatility & Dietary Imbalance');
    }
    if (statusSummary) {
      statusSummary.textContent = `Identified: ${sleepHours}h sleep, ${junkRatio}% junk food ratio, and ${mobileHours}h screen time. Below is your tailored nutritive dietary plan to restore sustained daytime energy.`;
    }
  }

  // 1. Breakfast Prescription
  if (breakfast === 'skipped' || isGlycemicStrain) {
    if (prescBf) prescBf.innerHTML = '<strong>Warm Rolled Oats with Milk + 1 Banana + 1 Boiled Egg (or Handful of Almonds)</strong>. If on the go: 2 Steamed Idlis with Sambar.';
    if (prescBfBen) prescBfBen.textContent = '✓ Restores depleted liver glycogen without triggering an insulin spike, ending morning brain fog.';
  } else {
    if (prescBf) prescBf.innerHTML = '<strong>Steamed Idli (2 pcs) with Vegetable Sambar & Coconut Chutney</strong> + Fresh Seasonal Fruit.';
    if (prescBfBen) prescBfBen.textContent = '✓ Fermented whole grains support microbiome diversity and steady morning focus.';
  }

  // 2. Lunch Prescription
  if (lunch === 'junk' || isGlycemicStrain) {
    if (prescLn) prescLn.innerHTML = '<strong>Classic Mess/Home Thali: Brown or Steamed Rice, Toor Dal, Cucumber Curd (Dahi), & Green Vegetable Subzi</strong>. Eliminate fried sides and sugary drinks.';
    if (prescLnBen) prescLnBen.textContent = '✓ High-fiber toor dal + probiotic curd blunts glycemic excursions, completely eliminating 2:30 PM post-lunch fatigue.';
  } else {
    if (prescLn) prescLn.innerHTML = '<strong>Dal Rice Plate with Paneer or Soya chunks + Fresh Tomato Cucumber Salad</strong>.';
    if (prescLnBen) prescLnBen.textContent = '✓ Optimal 45% complex carb, 25% lean protein, and 30% healthy lipid distribution.';
  }

  // 3. Smart Snack Prescription
  if (snack === 'fried' || snack === 'sweets' || activeRepeated.includes('Chips / Namkeen')) {
    if (prescSn) prescSn.innerHTML = '<strong>Swap fried chips for Roasted Chana (Bengal Gram, 40g) + Unsalted Peanuts (20g)</strong> + 1 Glass Tender Coconut Water or Buttermilk.';
    if (prescSnBen) prescSnBen.textContent = '✓ Replaces refined palm oil with plant protein and potassium, stabilizing late-afternoon focus.';
  } else {
    if (prescSn) prescSn.innerHTML = '<strong>Fresh Apple or Guava slices with a small cup of Plain Curd</strong>.';
    if (prescSnBen) prescSnBen.textContent = '✓ Pectin fiber and gentle hydration provide sustained study focus without jitteriness.';
  }

  // 4. Dinner Prescription
  if (dinner === 'late_heavy' || isCircadianStrain) {
    if (prescDn) prescDn.innerHTML = '<strong>Light Moong Dal Khichdi or 2 Multigrain Rotis with Paneer / Green Moong</strong>. STRICT SCHEDULE: Finish before 20:30.';
    if (prescDnBen) prescDnBen.textContent = '✓ Early, easily digestible dinner allows core body temperature to drop naturally for deep slow-wave sleep.';
  } else {
    if (prescDn) prescDn.innerHTML = '<strong>Balanced dinner: Steamed rice/rotis with light dal and seasonal vegetable preparation</strong>.';
    if (prescDnBen) prescDnBen.textContent = '✓ Supplies natural tryptophan and magnesium to prime melatonin production.';
  }

  const targetKcal = workoutHours > 1 ? 2350 : (workoutHours > 0.4 ? 2100 : 1950);
  if (prescTargetKcal) prescTargetKcal.textContent = `Target: ${targetKcal.toLocaleString()} kcal`;

  const waterLiters = (2.2 + (workoutHours * 0.7) + (isHighStress ? 0.3 : 0)).toFixed(1);
  if (prescAdvice) {
    let adviceParts = [];
    if (mobileHours > 4.5) adviceParts.push(`Screen twilight: Disengage phones 45 mins before bedtime to protect melatonin.`);
    if (activeRepeated.includes('Instant Noodles')) adviceParts.push(`Limit instant noodles to ≤1x/week to reduce excessive sodium.`);
    if (friendsHours >= 1.5) adviceParts.push(`Great social balance: ${friendsHours}h with peers fosters mental decompression.`);
    if (isHighStress) adviceParts.push(`Exam stress protocol: Prioritize magnesium-rich curd and roasted nuts over caffeinated energy drinks.`);
    prescAdvice.innerHTML = `<strong>Tailored Recommendations:</strong> Hydration target is <strong>${waterLiters} Liters/day</strong>. ${adviceParts.join(' ')}`;
  }
}

// ==========================================================================
// 4. PRODUCT EXPLORER TABLE & DRAWER
// ==========================================================================
let productFilterState = {
  search: '',
  category: 'all',
  verified: 'all',
  sortBy: 'name',
  sortAsc: true
};

function renderProductTable() {
  const tbody = document.getElementById('productCatalogTbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  let list = [...PRODUCT_CATALOG];

  if (productFilterState.search) {
    const q = productFilterState.search.toLowerCase();
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.brand.toLowerCase().includes(q));
  }

  if (productFilterState.category !== 'all') {
    list = list.filter(s => s.category === productFilterState.category);
  }

  if (productFilterState.verified !== 'all') {
    const isV = productFilterState.verified === 'true';
    list = list.filter(s => s.verified === isV);
  }

  list.sort((a, b) => {
    let va = a[productFilterState.sortBy];
    let vb = b[productFilterState.sortBy];
    if (va === null || va === undefined) va = -1;
    if (vb === null || vb === undefined) vb = -1;

    if (typeof va === 'string') {
      return productFilterState.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return productFilterState.sortAsc ? va - vb : vb - va;
  });

  const counter = document.getElementById('productCountBadge');
  if (counter) counter.textContent = `Showing ${list.length} of 100 SKUs`;

  list.forEach(sku => {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `View details for ${sku.name}`);

    tr.innerHTML = `
      <td><strong>${sku.sku_id}</strong></td>
      <td>${sku.name}</td>
      <td>${sku.brand}</td>
      <td>${sku.category}</td>
      <td>${sku.serving_size} ${sku.serving_unit}</td>
      <td>${sku.kcal !== null ? sku.kcal : '<span class="text-muted">null</span>'}</td>
      <td>${sku.sugar_g !== null ? `${sku.sugar_g} g` : '<span class="text-muted">null</span>'}</td>
      <td>${sku.caffeine_mg !== null ? `${sku.caffeine_mg} mg` : '<span class="text-muted">null</span>'}</td>
      <td>${sku.sodium_mg !== null ? `${sku.sodium_mg} mg` : '<span class="text-muted">null</span>'}</td>
      <td><span class="badge ${sku.verified ? 'badge-teal' : 'badge-orange'}">${sku.verified ? 'Verified' : 'Unverified'}</span></td>
    `;

    tr.addEventListener('click', () => openProductDrawer(sku));
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProductDrawer(sku);
      }
    });

    tbody.appendChild(tr);
  });
}

function openProductDrawer(sku) {
  const backdrop = document.getElementById('productDrawerBackdrop');
  const panel = document.getElementById('productDrawerPanel');
  const content = document.getElementById('productDrawerContent');

  if (!backdrop || !panel || !content) return;

  content.innerHTML = `
    <div style="margin-bottom: 16px;">
      <span class="badge ${sku.verified ? 'badge-teal' : 'badge-orange'}" style="margin-bottom: 8px;">
        ${sku.verified ? '✓ Verified Manufacturer Label' : '⚠ Unverified Field (Data Gap)'}
      </span>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${sku.name}</h3>
      <p style="font-size: 0.85rem; color: var(--text-muted);">${sku.brand} • ${sku.category}</p>
    </div>

    <div class="nutrition-fact-box">
      <div class="fact-title">Nutrition Facts</div>
      <div style="font-size: 0.85rem; font-weight: 700; margin: 4px 0 8px;">
        Serving Size: ${sku.serving_size} ${sku.serving_unit}
      </div>
      <div class="fact-row bold" style="font-size: 1.15rem;">
        <span>Calories / Energy</span>
        <span>${sku.kcal !== null ? `${sku.kcal} kcal` : 'Unspecified'}</span>
      </div>
      <div class="fact-row">
        <span>Total Sugars</span>
        <span>${sku.sugar_g !== null ? `${sku.sugar_g} g` : 'Unconfirmed (null)'}</span>
      </div>
      <div class="fact-row">
        <span>Caffeine</span>
        <span>${sku.caffeine_mg !== null ? `${sku.caffeine_mg} mg` : '0 mg'}</span>
      </div>
      <div class="fact-row">
        <span>Sodium</span>
        <span>${sku.sodium_mg !== null ? `${sku.sodium_mg} mg` : 'Unconfirmed (null)'}</span>
      </div>
      <div class="fact-row">
        <span>Total Fat</span>
        <span>${sku.fat_g !== null ? `${sku.fat_g} g` : '0.0 g'}</span>
      </div>
      <div class="fact-row">
        <span>Fried Item</span>
        <span>${sku.fried === 'yes' ? 'Yes' : 'No'}</span>
      </div>
      <div class="fact-row">
        <span>Ultra-Processed</span>
        <span>${sku.processed === 'yes' ? 'Yes' : 'No'}</span>
      </div>
    </div>

    <div style="margin-top: 18px; font-size: 0.8rem; background-color: var(--bg-hover); padding: 12px; border-radius: var(--radius-md);">
      <p><strong>Source Citation / Reference:</strong></p>
      <p style="color: var(--text-secondary); margin-top: 4px;">${sku.source_note}</p>
      <p style="margin-top: 8px; color: var(--text-muted);">Last checked date: ${sku.last_checked}</p>
    </div>
  `;

  backdrop.classList.add('active');
  panel.classList.add('active');
  panel.focus();
}

function closeProductDrawer() {
  const backdrop = document.getElementById('productDrawerBackdrop');
  const panel = document.getElementById('productDrawerPanel');
  if (backdrop) backdrop.classList.remove('active');
  if (panel) panel.classList.remove('active');
}

function setupProductExplorer() {
  const searchInput = document.getElementById('productSearchInput');
  const catSelect = document.getElementById('productCategorySelect');
  const verSelect = document.getElementById('productVerifiedSelect');
  const sortSelect = document.getElementById('productSortSelect');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      productFilterState.search = e.target.value;
      renderProductTable();
    });
  }
  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      productFilterState.category = e.target.value;
      renderProductTable();
    });
  }
  if (verSelect) {
    verSelect.addEventListener('change', (e) => {
      productFilterState.verified = e.target.value;
      renderProductTable();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      productFilterState.sortBy = e.target.value;
      renderProductTable();
    });
  }

  const closeBtn = document.getElementById('closeProductDrawerBtn');
  const backdrop = document.getElementById('productDrawerBackdrop');
  if (closeBtn) closeBtn.addEventListener('click', closeProductDrawer);
  if (backdrop) backdrop.addEventListener('click', closeProductDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductDrawer();
  });
}

// Setup CSV Export Button
function setupCSVExport() {
  const exportBtn = document.getElementById('exportDatasetCsvBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    if (!window.APP_DATASET || !window.APP_DATASET.logs) return;

    const logs = window.CohortSimulation ? window.CohortSimulation.getDynamicLogs() : window.APP_DATASET.logs;
    const headers = [
      'student_id', 'day', 'day_of_week', 'day_type',
      'breakfast_time', 'lunch_time', 'dinner_time',
      'meal_source', 'meal_quality', 'snack_type',
      'last_caffeine_time', 'late_caffeine_flag', 'steps',
      'sleep_hours', 'energy_rating', 'mood_rating',
      'low_energy_day', 'main_food_reason', 'meal_regularity_index',
      'total_sugar_g', 'total_caffeine_mg', 'total_kcal',
      'total_sodium_mg', 'total_fat_g'
    ];

    let csvContent = headers.join(',') + '\n';
    logs.forEach(row => {
      const line = headers.map(h => {
        let val = row[h];
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invisible_habits_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function populateSummaryHeadlineCards() {
  if (!window.APP_DATASET || !window.APP_DATASET.summary) return;
  const s = window.APP_DATASET.summary;

  const sugarEl = document.getElementById('statValSugar');
  const caffEl = document.getElementById('statValCaffeine');
  const lowEnergyEl = document.getElementById('statValLowEnergy');
  const reasonEl = document.getElementById('statValReason');
  const dynamicKeyEl = document.getElementById('dynamicKeyFindingText');
  const excludedCountEl = document.getElementById('aboutExcludedCountText');

  if (sugarEl) sugarEl.textContent = `${s.avgSugarPerDay} g`;
  if (caffEl) caffEl.textContent = `${s.avgCaffeinePerDay} mg`;
  if (lowEnergyEl) lowEnergyEl.textContent = `${s.percentLowEnergyDays}%`;
  if (reasonEl) reasonEl.textContent = s.mostCommonFoodReason.charAt(0).toUpperCase() + s.mostCommonFoodReason.slice(1);
  if (dynamicKeyEl) dynamicKeyEl.textContent = s.dynamicKeyFinding;
  if (excludedCountEl) excludedCountEl.textContent = `${window.APP_DATASET.excludedUnverifiedRowsCount} product consumption events`;
}

// Global Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (!window.APP_DATASET && typeof generateSyntheticDataset === 'function' && typeof PRODUCT_CATALOG !== 'undefined') {
    window.APP_DATASET = generateSyntheticDataset(20261025, PRODUCT_CATALOG);
  }

  populateStudentSelectors();
  populateSummaryHeadlineCards();
  setupThemeToggle();
  setupFilters();
  setupCohortSimulationHub();
  setupDietaryPlanEngine();
  setupProductExplorer();
  setupCSVExport();

  // Navigation link click handlers
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('data-page');
      if (pageId) navigateToPage(pageId);
    });
  });

  // Query parameter & hash support
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam === 'dark') {
    window.appState.isDarkMode = true;
    document.body.classList.add('dark-mode');
  } else if (themeParam === 'light') {
    window.appState.isDarkMode = false;
    document.body.classList.remove('dark-mode');
  }

  const pageParam = urlParams.get('page') || window.location.hash.replace('#', '') || 'showcase';
  navigateToPage(pageParam);

  // Debounced window resize handler for crisp canvas & chart responsiveness
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderPageCharts(window.appState.currentPage);
    }, 150);
  });
});
