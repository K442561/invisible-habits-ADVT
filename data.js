/**
 * Invisible Habits, Visible Energy - Synthetic Dataset Generator and Analytics (data.js)
 * Generates 60 anonymous students over 30 days (1,800 logs) using a seeded PRNG.
 * Fully deterministic: identical seed yields identical logs across runs.
 */

// PRNG: Mulberry32 algorithm for deterministic random numbers
function createPRNG(seed) {
  let s = (seed >>> 0) || 20261025;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Helper to pick randomly from an array
function pickOne(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// Helper to generate a number in a range
function randRange(min, max, rng) {
  return min + rng() * (max - min);
}

// Time helpers
function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStrToMinutes(str) {
  if (!str || str === 'Skipped' || str === 'None') return null;
  const parts = str.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Generate synthetic dataset and compute cohort statistics
 */
function generateSyntheticDataset(customSeed = 20261025, catalog = null) {
  const catalogList = catalog || (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG : []);
  const catalogMap = new Map();
  catalogList.forEach(sku => catalogMap.set(sku.sku_id, sku));

  const rng = createPRNG(customSeed);

  // Group SKUs by category for realistic meal and beverage sampling
  const skusByCategory = {
    carbonated: catalogList.filter(s => s.category === 'Carbonated soft drinks'),
    energy: catalogList.filter(s => s.category === 'Energy drinks'),
    juices: catalogList.filter(s => s.category === 'Packaged juices and fruit drinks'),
    teaCoffee: catalogList.filter(s => s.category === 'Ready-to-drink tea and coffee'),
    chips: catalogList.filter(s => s.category === 'Chips and namkeen'),
    biscuits: catalogList.filter(s => s.category === 'Biscuits and cookies'),
    noodles: catalogList.filter(s => s.category === 'Instant noodles and ready meals'),
    chocolates: catalogList.filter(s => s.category === 'Chocolates and sweets'),
    fastFood: catalogList.filter(s => s.category === 'Fast food items'),
    fresh: catalogList.filter(s => s.category === 'Fresh and minimally processed foods')
  };

  const dayOfWeekNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const students = [];
  for (let i = 1; i <= 60; i++) {
    students.push(`S-${String(i).padStart(3, '0')}`);
  }

  // Pre-generate individual traits for the 60 students
  const studentTraits = new Map();
  students.forEach(sId => {
    studentTraits.set(sId, {
      sleepBase: randRange(6.2, 7.8, rng),
      stepsBase: Math.round(randRange(4500, 9500, rng)),
      caffeineTendency: randRange(0.4, 1.4, rng),
      regularityBase: randRange(15, 45, rng),
      preferredSource: pickOne(['mess', 'canteen', 'home', 'delivery'], rng)
    });
  });

  const logs = [];
  let excludedUnverifiedRowsCount = 0;

  // 30 days loop
  for (let day = 1; day <= 30; day++) {
    const dayOfWeek = dayOfWeekNames[(day - 1) % 7];
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    // Days 15 to 20 are Exam days; all other days are Regular days
    const isExamDay = day >= 15 && day <= 20;
    const dayType = isExamDay ? 'Exam days' : 'Regular days';

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const studentId = students[sIdx];
      const trait = studentTraits.get(studentId);

      // Meal source and reason
      let mealSource;
      let mainFoodReason;
      if (isExamDay) {
        mealSource = pickOne(['canteen', 'delivery', 'canteen', 'delivery', 'mess', 'skipped'], rng);
        mainFoodReason = pickOne(['convenience', 'convenience', 'stress', 'taste', 'hunger'], rng);
        if (mainFoodReason === 'stress') mainFoodReason = 'convenience'; // map to 5 valid reasons
      } else if (isWeekend) {
        mealSource = pickOne(['home', 'canteen', 'delivery', 'mess', 'skipped'], rng);
        mainFoodReason = pickOne(['taste', 'hunger', 'peers', 'convenience'], rng);
      } else {
        mealSource = pickOne(['mess', 'mess', 'canteen', 'home', 'cost' === 'cost' ? 'canteen' : 'delivery'], rng);
        mainFoodReason = pickOne(['hunger', 'cost', 'convenience', 'taste', 'peers'], rng);
      }

      // Meal Quality
      let mealQuality;
      if (mealSource === 'delivery') {
        mealQuality = pickOne(['mainly refined or fried', 'mainly refined or fried', 'mixed'], rng);
      } else if (mealSource === 'home') {
        mealQuality = pickOne(['balanced', 'balanced', 'mixed'], rng);
      } else if (isExamDay) {
        mealQuality = pickOne(['mainly refined or fried', 'mixed', 'mixed'], rng);
      } else {
        mealQuality = pickOne(['balanced', 'mixed', 'mainly refined or fried'], rng);
      }

      // Snack Type
      let snackType = 'none';
      const snackRoll = rng();
      if (isExamDay) {
        snackType = snackRoll > 0.25 ? 'fried' : (snackRoll > 0.1 ? 'baked' : 'none');
      } else {
        snackType = snackRoll > 0.5 ? 'none' : (snackRoll > 0.2 ? 'fried' : 'baked');
      }

      // Meal timings
      // Nominal targets: Breakfast 08:30 (510m), Lunch 13:00 (780m), Dinner 20:30 (1230m)
      let bTime = 'Skipped';
      let lTime = '13:00';
      let dTime = '20:30';

      const skipBreakfastProb = isExamDay ? 0.35 : (isWeekend ? 0.40 : 0.15);
      if (rng() > skipBreakfastProb) {
        const bMins = isWeekend ? Math.round(randRange(570, 660, rng)) : Math.round(randRange(465, 570, rng));
        bTime = minutesToTimeStr(bMins);
      }

      const lMins = Math.round(randRange(735, isExamDay ? 885 : 840, rng));
      lTime = minutesToTimeStr(lMins);

      const dMins = Math.round(randRange(isExamDay ? 1230 : 1170, isExamDay ? 1410 : 1320, rng));
      dTime = minutesToTimeStr(dMins);

      // Meal regularity index calculation:
      // Standard deviation of meal timing offsets in minutes from nominal windows:
      // Breakfast nominal = 510, Lunch nominal = 780, Dinner nominal = 1230.
      // If skipped, penalty offset = 120 minutes.
      const devB = bTime === 'Skipped' ? 120 : Math.abs(timeStrToMinutes(bTime) - 510);
      const devL = Math.abs(timeStrToMinutes(lTime) - 780);
      const devD = Math.abs(timeStrToMinutes(dTime) - 1230);
      const meanDev = (devB + devL + devD) / 3;
      const varianceDev = ((devB - meanDev) ** 2 + (devL - meanDev) ** 2 + (devD - meanDev) ** 2) / 3;
      // Formula: Standard deviation of meal timing in minutes per student per day
      const mealRegularityIndex = Math.round(Math.sqrt(varianceDev));

      // SKUs consumed on this student-day
      const consumedSkus = [];
      const hasCaffeine = rng() < (isExamDay ? 0.88 : (isWeekend ? 0.45 : 0.55));
      let lastCaffeineTime = 'None';

      // 1. Fresh/Main meal staple
      if (mealQuality === 'balanced' || mealSource === 'home') {
        consumedSkus.push({ sku_id: pickOne(skusByCategory.fresh, rng).sku_id, servings: 1 });
        if (rng() > 0.4) {
          consumedSkus.push({ sku_id: pickOne(skusByCategory.fresh, rng).sku_id, servings: 1 });
        }
      } else if (mealQuality === 'mainly refined or fried') {
        if (rng() > 0.5) {
          consumedSkus.push({ sku_id: pickOne(skusByCategory.fastFood, rng).sku_id, servings: 1 });
        } else {
          consumedSkus.push({ sku_id: pickOne(skusByCategory.noodles, rng).sku_id, servings: 1 });
        }
      } else {
        consumedSkus.push({ sku_id: pickOne(skusByCategory.fresh, rng).sku_id, servings: 1 });
        if (rng() > 0.6) {
          consumedSkus.push({ sku_id: pickOne(skusByCategory.noodles, rng).sku_id, servings: 1 });
        }
      }

      // 2. Snack SKU
      if (snackType === 'fried') {
        consumedSkus.push({ sku_id: pickOne(skusByCategory.chips, rng).sku_id, servings: 1 });
      } else if (snackType === 'baked') {
        consumedSkus.push({ sku_id: pickOne(skusByCategory.biscuits, rng).sku_id, servings: 1 });
      } else if (rng() > 0.65) {
        consumedSkus.push({ sku_id: pickOne(skusByCategory.chocolates, rng).sku_id, servings: 1 });
      }

      // 3. Beverage & Caffeine
      if (hasCaffeine) {
        let caffeineItem;
        let caffMins;
        if (isExamDay) {
          caffeineItem = pickOne([...skusByCategory.energy, ...skusByCategory.carbonated, ...skusByCategory.teaCoffee], rng);
          // Late night caffeine during exam days
          caffMins = Math.round(randRange(930, 1410, rng)); // 15:30 to 23:30
        } else {
          caffeineItem = pickOne([...skusByCategory.teaCoffee, ...skusByCategory.carbonated], rng);
          caffMins = Math.round(randRange(540, 1080, rng)); // 09:00 to 18:00
        }
        consumedSkus.push({ sku_id: caffeineItem.sku_id, servings: 1 });
        lastCaffeineTime = minutesToTimeStr(caffMins);
      } else if (rng() > 0.4) {
        // Non-caffeinated juice or drink
        consumedSkus.push({ sku_id: pickOne(skusByCategory.juices, rng).sku_id, servings: 1 });
      }

      // Late caffeine flag: any caffeinated drink logged after 15:00 (900 minutes)
      const lastCaffMins = timeStrToMinutes(lastCaffeineTime);
      const lateCaffeineFlag = lastCaffMins !== null && lastCaffMins > 900;

      // Nutrition sums (skipping unverified SKUs)
      let totalSugar = 0;
      let totalCaffeine = 0;
      let totalKcal = 0;
      let totalSodium = 0;
      let totalFat = 0;

      consumedSkus.forEach(item => {
        const sku = catalogMap.get(item.sku_id);
        if (sku) {
          if (sku.verified === false) {
            excludedUnverifiedRowsCount++;
          } else {
            totalSugar += (sku.sugar_g || 0) * item.servings;
            totalCaffeine += (sku.caffeine_mg || 0) * item.servings;
            totalKcal += (sku.kcal || 0) * item.servings;
            totalSodium += (sku.sodium_mg || 0) * item.servings;
            totalFat += (sku.fat_g || 0) * item.servings;
          }
        }
      });

      // Sleep calculation (emerges from exam pressure, late caffeine, baseline)
      let sleep = trait.sleepBase + randRange(-0.8, 0.8, rng);
      if (isExamDay) sleep -= randRange(1.4, 2.3, rng);
      if (lateCaffeineFlag) sleep -= randRange(0.6, 1.2, rng);
      if (isWeekend && !isExamDay) sleep += randRange(0.8, 1.5, rng);
      sleep = Math.max(3.5, Math.min(10.5, Math.round(sleep * 10) / 10));

      // Steps calculation
      let steps = trait.stepsBase + Math.round(randRange(-1500, 1500, rng));
      if (isExamDay) steps = Math.max(2000, Math.round(steps * 0.65));
      if (isWeekend) steps = Math.round(steps * (rng() > 0.5 ? 1.25 : 0.7));
      steps = Math.max(1500, Math.min(16000, steps));

      // Energy rating (1 to 5) emerging from habits
      let energyScore = 3.5;
      if (sleep < 5.0) energyScore -= 1.6;
      else if (sleep < 6.0) energyScore -= 0.9;
      else if (sleep >= 7.5) energyScore += 0.7;

      if (lateCaffeineFlag) energyScore -= 0.7;
      if (mealRegularityIndex > 50) energyScore -= 0.6;
      if (mealQuality === 'mainly refined or fried') energyScore -= 0.5;
      if (mealQuality === 'balanced') energyScore += 0.4;
      if (steps > 9000) energyScore += 0.4;
      else if (steps < 3500) energyScore -= 0.4;

      energyScore += randRange(-0.4, 0.4, rng);
      const energyRating = Math.max(1, Math.min(5, Math.round(energyScore)));

      // Mood rating (1 to 5) correlating with energy and sleep
      let moodScore = energyRating * 0.7 + (sleep >= 6.5 ? 1.2 : 0.3) + randRange(-0.6, 0.6, rng);
      const moodRating = Math.max(1, Math.min(5, Math.round(moodScore)));

      // Low energy day: energy rating <= 2
      const lowEnergyDay = energyRating <= 2;

      logs.push({
        student_id: studentId,
        day: day,
        day_of_week: dayOfWeek,
        day_type: dayType,
        breakfast_time: bTime,
        lunch_time: lTime,
        dinner_time: dTime,
        meal_source: mealSource,
        meal_quality: mealQuality,
        snack_type: snackType,
        skus_consumed: consumedSkus,
        last_caffeine_time: lastCaffeineTime,
        late_caffeine_flag: lateCaffeineFlag,
        steps: steps,
        sleep_hours: sleep,
        energy_rating: energyRating,
        mood_rating: moodRating,
        low_energy_day: lowEnergyDay,
        main_food_reason: mainFoodReason,
        meal_regularity_index: mealRegularityIndex,
        total_sugar_g: Math.round(totalSugar * 10) / 10,
        total_caffeine_mg: Math.round(totalCaffeine),
        total_kcal: Math.round(totalKcal),
        total_sodium_mg: Math.round(totalSodium),
        total_fat_g: Math.round(totalFat * 10) / 10
      });
    }
  }

  // Precompute Summary & Cohort Analytics
  const totalLogs = logs.length;
  const avgSugar = Math.round((logs.reduce((acc, l) => acc + l.total_sugar_g, 0) / totalLogs) * 10) / 10;
  const avgCaffeine = Math.round(logs.reduce((acc, l) => acc + l.total_caffeine_mg, 0) / totalLogs);
  const lowEnergyDaysCount = logs.filter(l => l.low_energy_day).length;
  const percentLowEnergyDays = Math.round((lowEnergyDaysCount / totalLogs) * 1000) / 10;

  // Food reason counts
  const reasonCounts = {};
  logs.forEach(l => {
    reasonCounts[l.main_food_reason] = (reasonCounts[l.main_food_reason] || 0) + 1;
  });
  let mostCommonFoodReason = 'convenience';
  let maxReasonCount = 0;
  for (const [r, count] of Object.entries(reasonCounts)) {
    if (count > maxReasonCount) {
      maxReasonCount = count;
      mostCommonFoodReason = r;
    }
  }

  // Plain language key finding dynamically computed
  const lateCaffLogs = logs.filter(l => l.late_caffeine_flag);
  const earlyCaffLogs = logs.filter(l => !l.late_caffeine_flag);
  const lateLowRate = (lateCaffLogs.filter(l => l.low_energy_day).length / (lateCaffLogs.length || 1)) * 100;
  const earlyLowRate = (earlyCaffLogs.filter(l => l.low_energy_day).length / (earlyCaffLogs.length || 1)) * 100;
  const lateRatio = Math.round((lateLowRate / (earlyLowRate || 1)) * 10) / 10;
  const dynamicKeyFinding = `Students consuming caffeinated beverages after 15:00 experienced ${lateRatio}× more low-energy days (energy ≤ 2) compared to those consuming caffeine earlier or not at all (${Math.round(lateLowRate)}% vs ${Math.round(earlyLowRate)}%).`;

  // Student monthly totals (normalized to 30 days)
  const studentSummaries = {};
  students.forEach(sId => {
    const sLogs = logs.filter(l => l.student_id === sId);
    const sSugar = Math.round(sLogs.reduce((acc, l) => acc + l.total_sugar_g, 0));
    const sCaffeine = Math.round(sLogs.reduce((acc, l) => acc + l.total_caffeine_mg, 0));
    const sKcal = Math.round(sLogs.reduce((acc, l) => acc + l.total_kcal, 0));
    const sAvgSleep = Math.round((sLogs.reduce((acc, l) => acc + l.sleep_hours, 0) / sLogs.length) * 10) / 10;
    const sAvgSteps = Math.round(sLogs.reduce((acc, l) => acc + l.steps, 0) / sLogs.length);
    const sAvgRegularity = Math.round(sLogs.reduce((acc, l) => acc + l.meal_regularity_index, 0) / sLogs.length);
    const sLowEnergyCount = sLogs.filter(l => l.low_energy_day).length;
    const sAvgEnergy = Math.round((sLogs.reduce((acc, l) => acc + l.energy_rating, 0) / sLogs.length) * 10) / 10;

    studentSummaries[sId] = {
      student_id: sId,
      monthly_sugar_g: sSugar,
      monthly_caffeine_mg: sCaffeine,
      monthly_kcal: sKcal,
      daily_avg_sugar_g: Math.round((sSugar / 30) * 10) / 10,
      daily_avg_caffeine_mg: Math.round(sCaffeine / 30),
      daily_avg_kcal: Math.round(sKcal / 30),
      avg_sleep_hours: sAvgSleep,
      avg_steps: sAvgSteps,
      avg_regularity_index: sAvgRegularity,
      low_energy_days_count: sLowEnergyCount,
      percent_low_energy_days: Math.round((sLowEnergyCount / 30) * 100),
      avg_energy: sAvgEnergy
    };
  });

  // Calculate cohort medians for My Summary bullet charts
  const median = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const studentArr = Object.values(studentSummaries);
  const cohortMedians = {
    monthly_sugar_g: Math.round(median(studentArr.map(s => s.monthly_sugar_g))),
    monthly_caffeine_mg: Math.round(median(studentArr.map(s => s.monthly_caffeine_mg))),
    monthly_kcal: Math.round(median(studentArr.map(s => s.monthly_kcal))),
    daily_sugar_g: Math.round(median(studentArr.map(s => s.daily_avg_sugar_g))),
    daily_caffeine_mg: Math.round(median(studentArr.map(s => s.daily_avg_caffeine_mg))),
    daily_kcal: Math.round(median(studentArr.map(s => s.daily_avg_kcal))),
    sleep_hours: Math.round(median(studentArr.map(s => s.avg_sleep_hours)) * 10) / 10,
    steps: Math.round(median(studentArr.map(s => s.avg_steps))),
    regularity_index: Math.round(median(studentArr.map(s => s.avg_regularity_index)))
  };

  // Pearson correlation matrix for the 7 continuous variables
  function calcPearson(arrX, arrY) {
    const n = arrX.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const x = arrX[i];
      const y = arrY[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100) / 100;
  }

  const varKeys = ['caffeine', 'sugar', 'steps', 'sleep', 'regularity', 'energy', 'mood'];
  const varNames = ['Caffeine (mg)', 'Sugar (g)', 'Steps', 'Sleep (h)', 'Regularity (min)', 'Energy (1-5)', 'Mood (1-5)'];
  const varExtractors = {
    caffeine: logs.map(l => l.total_caffeine_mg),
    sugar: logs.map(l => l.total_sugar_g),
    steps: logs.map(l => l.steps),
    sleep: logs.map(l => l.sleep_hours),
    regularity: logs.map(l => l.meal_regularity_index),
    energy: logs.map(l => l.energy_rating),
    mood: logs.map(l => l.mood_rating)
  };

  const correlationMatrix = [];
  for (let i = 0; i < varKeys.length; i++) {
    const row = [];
    for (let j = 0; j < varKeys.length; j++) {
      if (i === j) {
        row.push(1.0);
      } else {
        row.push(calcPearson(varExtractors[varKeys[i]], varExtractors[varKeys[j]]));
      }
    }
    correlationMatrix.push(row);
  }

  // Top 5 habit combinations linked to low energy
  // Combinations evaluated:
  // 1. Late caffeine + Short sleep (<6h)
  // 2. High sugar (>40g) + Skipped breakfast
  // 3. Late caffeine + Irregular meals (Reg > 50) + Mainly refined food
  // 4. Low steps (<4500) + Short sleep (<6h)
  // 5. Skipped breakfast + Fried snack
  const combo1 = logs.filter(l => l.late_caffeine_flag && l.sleep_hours < 6.0);
  const combo2 = logs.filter(l => l.total_sugar_g > 40 && l.breakfast_time === 'Skipped');
  const combo3 = logs.filter(l => l.late_caffeine_flag && l.meal_regularity_index > 50 && l.meal_quality === 'mainly refined or fried');
  const combo4 = logs.filter(l => l.steps < 4500 && l.sleep_hours < 6.0);
  const combo5 = logs.filter(l => l.breakfast_time === 'Skipped' && l.snack_type === 'fried');

  const calcLowEnergyRate = (arr) => arr.length ? Math.round((arr.filter(l => l.low_energy_day).length / arr.length) * 100) : 0;

  const topHabitCombinations = [
    { name: 'Late caffeine + Sleep < 6h + Refined meals', count: combo3.length, lowEnergyRate: calcLowEnergyRate(combo3) },
    { name: 'Late caffeine + Sleep < 6h', count: combo1.length, lowEnergyRate: calcLowEnergyRate(combo1) },
    { name: 'Skipped breakfast + Fried snack', count: combo5.length, lowEnergyRate: calcLowEnergyRate(combo5) },
    { name: 'Low steps (<4500) + Sleep < 6h', count: combo4.length, lowEnergyRate: calcLowEnergyRate(combo4) },
    { name: 'High sugar (>40g) + Skipped breakfast', count: combo2.length, lowEnergyRate: calcLowEnergyRate(combo2) }
  ].sort((a, b) => b.lowEnergyRate - a.lowEnergyRate);

  return {
    seed: customSeed,
    logs: logs,
    students: students,
    excludedUnverifiedRowsCount: excludedUnverifiedRowsCount,
    summary: {
      avgSugarPerDay: avgSugar,
      avgCaffeinePerDay: avgCaffeine,
      percentLowEnergyDays: percentLowEnergyDays,
      mostCommonFoodReason: mostCommonFoodReason,
      dynamicKeyFinding: dynamicKeyFinding
    },
    studentSummaries: studentSummaries,
    cohortMedians: cohortMedians,
    correlationMatrix: {
      keys: varKeys,
      names: varNames,
      matrix: correlationMatrix
    },
    topHabitCombinations: topHabitCombinations
  };
}

// Global dataset instance for browser usage
let APP_DATASET = null;
if (typeof PRODUCT_CATALOG !== 'undefined') {
  APP_DATASET = generateSyntheticDataset(20261025, PRODUCT_CATALOG);
}

// Global export for browser and test environments
if (typeof window !== 'undefined') {
  window.createPRNG = createPRNG;
  window.generateSyntheticDataset = generateSyntheticDataset;
}
if (typeof globalThis !== 'undefined') {
  globalThis.createPRNG = createPRNG;
  globalThis.generateSyntheticDataset = generateSyntheticDataset;
}
