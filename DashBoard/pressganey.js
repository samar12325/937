// ===== Language (kept from localStorage) =====
let currentLang = localStorage.getItem('lang') || 'ar';

// ===== Chart instances =====
let homeMedicineChart, radiologyChart, outpatientChart, dentistryChart, emergencyChart, inpatientChart, mortalityChart, bloodBankChart, overallSatisfactionChart;

// ===== Cards model (recomputed & persisted) =====
const cardData = { totalDepartmentsSurvey: 0, averageSatisfactionScore: '0.0' };

// ===== Department donut charts model (will be UPDATED from Excel files) =====
const departmentChartData = {
  homeMedicine: { ar: 'الطب المنزلي', en: 'Home Medicine', satisfied: 0, notSatisfied: 0 },
  radiology:    { ar: 'الأشعة',       en: 'Radiology',      satisfied: 0, notSatisfied: 0 },
  outpatient:   { ar: 'العيادات الخارجية', en: 'Outpatient Clinics', satisfied: 0, notSatisfied: 0 },
  dentistry:    { ar: 'الأسنان',       en: 'Dentistry',      satisfied: 0, notSatisfied: 0 },
  emergency:    { ar: 'الطوارئ',       en: 'Emergency',      satisfied: 0, notSatisfied: 0 },
  inpatient:    { ar: 'أقسام التنويم', en: 'Inpatient Departments', satisfied: 0, notSatisfied: 0 },
  mortality:    { ar: 'الوفيات',       en: 'Mortality',      satisfied: 0, notSatisfied: 0 },
  bloodBank:    { ar: 'بنك الدم',      en: 'Blood Bank',     satisfied: 0, notSatisfied: 0 }
};

// ===== Overall donut model =====
const overallSatisfactionData = { satisfied: 0, notSatisfied: 0 };

// ===== Labels / colors =====
const satisfactionLabels = { ar: ['راضي', 'غير راضي'], en: ['Satisfied', 'Not Satisfied'] };
const satisfactionColors = ['#22C55E', '#EF4444'];

// ====== API INTEGRATION ======
const API_BASE_URL = 'http://localhost:3001/api';

// قراءة الربع والسنة من عناصر الصفحة إن وُجدت؛ وإلا استخدم قيمًا افتراضية.
function getSelectedYearQuarter() {
  const quarter = (document.getElementById('quarterFilter')?.value || localStorage.getItem('pressganey:selectedQuarter') || '').trim();
  const year = (document.getElementById('yearFilter')?.value || localStorage.getItem('pressganey:selectedYear') || String(new Date().getFullYear())).trim();
  if (!quarter) throw new Error('يجب اختيار الربع قبل التصدير');
  return { quarter, year: Number(year) || new Date().getFullYear() };
}

// جلب لقطة بيانات Press Ganey من الـDB للربع/السنة المحددين
async function fetchPressGaneyFromDB(params) {
  const { quarter, year } = params;
  const token = localStorage.getItem('token') || '';
  const url = `${API_BASE_URL}/pressganey/data?year=${encodeURIComponent(year)}&quarter=${encodeURIComponent(quarter)}`;
  const res = await fetch(url, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const out = await res.json();
  if (!out.success || !out.data) throw new Error('لم يتم العثور على بيانات في قاعدة البيانات');
  return out.data; // { year, quarter, overall: {...}, departments: {...} }
}

// إنشاء ملف Excel
function buildPressGaneyWorkbook(dbData) {
  // dbData = { overall: {satisfied, notSatisfied, totalDepartmentsSurvey, averageSatisfactionScore}, departments: {key:{ar,en,satisfied,notSatisfied}}, year, quarter }

  const wb = XLSX.utils.book_new();
  
  // إذا كانت البيانات من قاعدة البيانات فارغة، استخدم البيانات المحلية
  let dataToUse = dbData;
  if (!dbData || !dbData.departments || Object.keys(dbData.departments).length === 0) {
    console.log('📊 Using local data for Excel export (DB data is empty)');
    dataToUse = {
      overall: {
        satisfied: overallSatisfactionData.satisfied,
        notSatisfied: overallSatisfactionData.notSatisfied,
        totalDepartmentsSurvey: cardData.totalDepartmentsSurvey,
        averageSatisfactionScore: cardData.averageSatisfactionScore
      },
      departments: Object.fromEntries(
        Object.entries(departmentChartData).map(([key, d]) => [
          key, 
          { ar: d.ar, en: d.en, satisfied: d.satisfied, notSatisfied: d.notSatisfied }
        ])
      ),
      year: new Date().getFullYear(),
      quarter: 'Q1'
    };
  }

  // ورقة Overall
  const overallRows = [
    ['Metric (EN)', 'العنصر (AR)', 'Satisfied (%)', 'Unsatisfied (%)'],
    ['Overall Hospital Satisfaction', 'نسبة الرضا العام للمستشفى',
      Number(dataToUse?.overall?.satisfied) || 0,
      Number(dataToUse?.overall?.notSatisfied) || 0
    ],
    ['', ''],
    ['Total Departments Survey', 'إجمالي الأقسام المشمولة', Number(dataToUse?.overall?.totalDepartmentsSurvey) || 0, ''],
    ['Average Satisfaction Score', 'متوسط درجة الرضا', String(dataToUse?.overall?.averageSatisfactionScore || '0.0'), '']
  ];
  const overallWS = XLSX.utils.aoa_to_sheet(overallRows);
  XLSX.utils.book_append_sheet(wb, overallWS, 'Overall');

  // ورقة Services
  const header = ['Service (EN)', 'الخدمة (AR)', 'Satisfied (%)', 'Unsatisfied (%)'];
  const servicesRows = [header];

  const dep = dataToUse?.departments || {};
  for (const key of Object.keys(dep)) {
    const d = dep[key] || {};
    servicesRows.push([
      d.en || key, d.ar || key,
      Number(d.satisfied) || 0,
      Number(d.notSatisfied) || 0
    ]);
  }
  const servicesWS = XLSX.utils.aoa_to_sheet(servicesRows);
  XLSX.utils.book_append_sheet(wb, servicesWS, 'Services');

  // (اختياري) ورقة Raw
  const rawRows = [
    ['Key','Name AR','Name EN','Satisfied','Not Satisfied','Quarter','Year'],
    ...Object.keys(dep).map(k => {
      const d = dep[k] || {};
      return [k, d.ar || '', d.en || '', Number(d.satisfied)||0, Number(d.notSatisfied)||0, dataToUse.quarter, dataToUse.year];
    })
  ];
  const rawWS = XLSX.utils.aoa_to_sheet(rawRows);
  XLSX.utils.book_append_sheet(wb, rawWS, 'Raw');

  return wb;
}

// دالة الحفظ في قاعدة البيانات
async function saveToDatabase() {
  const quarter = document.getElementById('quarterFilter')?.value?.trim();
  const year    = document.getElementById('yearFilter')?.value?.trim();
  if (!quarter || !year) { alert('اختر الربع والسنة'); return; }

  // حوّل الأقسام إلى صفوف مطابقة لأعمدة الجدول
  const rows = Object.entries(departmentChartData).map(([key, d]) => ({
    department_key: key,
    department_name_ar: d.ar,
    department_name_en: d.en,
    satisfied_count: Number(d.satisfied) || 0,
    not_satisfied_count: Number(d.notSatisfied) || 0,
    total_departments_survey: Number(cardData.totalDepartmentsSurvey) || 0,
    average_satisfaction_score: String(cardData.averageSatisfactionScore || '0.0'),
    overall_satisfied: Number(overallSatisfactionData.satisfied) || 0,
    overall_not_satisfied: Number(overallSatisfactionData.notSatisfied) || 0
  }));

  const res = await fetch('http://localhost:3001/api/pressganey/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // نفس نمط صفحاتك الأخرى التي ترسل التوكن في الهيدر:
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ quarter, year, rows })
  });

  if (!res.ok) throw new Error(await res.text());
  alert('تم الحفظ في قاعدة البيانات');
}

// دالة تحميل البيانات من قاعدة البيانات
async function tryLoadFromDB() {
  const yearSel = document.getElementById('yearFilter')?.value || '';
  const quarterSel = document.getElementById('quarterFilter')?.value || '';
  if (!yearSel || !quarterSel) return false; // لا يوجد اختيار بعد

  const token = localStorage.getItem('token') || '';
  const url = `${API_BASE_URL}/pressganey/data?year=${yearSel}&quarter=${encodeURIComponent(quarterSel)}`;
  const res = await fetch(url, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
  if (!res.ok) return false;
  const out = await res.json();
  if (!out.success) return false;

  // عبّي النماذج من رد الخادم:
  const d = out.data || {};
  const dep = d.departments || {};

  // الأقسام
  for (const key in departmentChartData) {
    const rec = dep[key] || { satisfied: 0, notSatisfied: 0, ar: departmentChartData[key].ar, en: departmentChartData[key].en };
    departmentChartData[key].satisfied = Number(rec.satisfied) || 0;
    departmentChartData[key].notSatisfied = Number(rec.notSatisfied) || 0;
    if (rec.ar) departmentChartData[key].ar = rec.ar;
    if (rec.en) departmentChartData[key].en = rec.en;
  }

  // الإجمالي والكروت
  if (d.overall) {
    overallSatisfactionData.satisfied = Number(d.overall.satisfied) || 0;
    overallSatisfactionData.notSatisfied = Number(d.overall.notSatisfied) || 0;
    cardData.totalDepartmentsSurvey = Number(d.overall.totalDepartmentsSurvey) || 0;
    cardData.averageSatisfactionScore = String(d.overall.averageSatisfactionScore || '0.0');
  }

  return true;
}

// ====== PERSISTENCE (LocalStorage) ======
const STORAGE_KEY = 'pressganey:departments:v1';
// Store per-quarter data separately
const STORAGE_QUARTERS_KEY = 'pressganey:quarters:v1';
let savedQuarters = {}; // { Q1: { departments: { key: {satisfied, notSatisfied} } }, ... }
let selectedQuarter = localStorage.getItem('pressganey:selectedQuarter') || '';

/** Save plain numbers to localStorage (no Chart instances) */
function saveToLocal() {
  try {
    const payload = {
      departments: Object.fromEntries(
        Object.entries(departmentChartData).map(([k, v]) => [k, {
          satisfied: Number(v.satisfied) || 0,
          notSatisfied: Number(v.notSatisfied) || 0
        }])
      ),
      overall: {
        satisfied: Number(overallSatisfactionData.satisfied) || 0,
        notSatisfied: Number(overallSatisfactionData.notSatisfied) || 0
      },
      cards: {
        totalDepartmentsSurvey: Number(cardData.totalDepartmentsSurvey) || 0,
        averageSatisfactionScore: String(cardData.averageSatisfactionScore || '0.0')
      },
      lang: currentLang,
      ts: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.log('✅ Saved to localStorage.');
  } catch (err) {
    console.error('❌ Failed to save:', err);
  }
}

/** Load (if exists) into in-memory models ONLY (no chart updates here) */
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    // Restore departments
    if (data && data.departments) {
      for (const key of Object.keys(departmentChartData)) {
        if (data.departments[key]) {
          departmentChartData[key].satisfied   = Number(data.departments[key].satisfied) || 0;
          departmentChartData[key].notSatisfied = Number(data.departments[key].notSatisfied) || 0;
        }
      }
    }
    // Restore overall & cards (we will recompute anyway, but good to fill)
    if (data.overall) {
      overallSatisfactionData.satisfied   = Number(data.overall.satisfied) || 0;
      overallSatisfactionData.notSatisfied = Number(data.overall.notSatisfied) || 0;
    }
    if (data.cards) {
      cardData.totalDepartmentsSurvey   = Number(data.cards.totalDepartmentsSurvey) || 0;
      cardData.averageSatisfactionScore = String(data.cards.averageSatisfactionScore || '0.0');
    }
    if (data.lang) {
      currentLang = data.lang;
      localStorage.setItem('lang', currentLang);
    }
    console.log('ℹ️ Loaded from localStorage.');
    return true;
  } catch (err) {
    console.warn('⚠️ Could not load saved data:', err);
    return false;
  }
}

// ===== Quarters persistence =====
function loadQuarters() {
  try {
    const raw = localStorage.getItem(STORAGE_QUARTERS_KEY);
    savedQuarters = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('⚠️ Failed to parse quarters store:', e);
    savedQuarters = {};
  }
}

function saveQuarters() {
  try {
    localStorage.setItem(STORAGE_QUARTERS_KEY, JSON.stringify(savedQuarters));
  } catch (e) {
    console.warn('⚠️ Failed to save quarters store:', e);
  }
}

function ensureQuarterBucket(q) {
  if (!q) return null;
  if (!savedQuarters[q]) savedQuarters[q] = { departments: {} };
  if (!savedQuarters[q].departments) savedQuarters[q].departments = {};
  return savedQuarters[q];
}

// ====== UI helpers ======
function getFont() { return currentLang === 'ar' ? 'Tajawal' : 'Inter'; }

function updateCardData() {
  document.getElementById('totalDepartmentsSurvey').textContent = cardData.totalDepartmentsSurvey;
  document.getElementById('averageSatisfactionScore').textContent = cardData.averageSatisfactionScore;
}
// يحسب المجموع بأمان
function _total(chart) {
  const ds = chart.data.datasets[0];
  return (ds?.data || []).reduce((a, b) => a + b, 0) || 1;
}

// يُنشئ عناصر الليجند مع النِّسبة بجانب النص
function legendWithPercentGenerator(chart) {
  const base = Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart);
  const ds = chart.data.datasets[0];
  const total = _total(chart);

  return base.map((item) => {
    const value = ds.data[item.index] || 0;
    const pct = ((value / total) * 100).toFixed(1);
    // نص الليجند النهائي: "راضي  75.0%"
    item.text = `${chart.data.labels[item.index]}  ${pct}%`;
    return item;
  });
}

function createDonutChart(ctx, data, labels, colors, { withLegend = false } = {}) {
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#ffffff', borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // الليجند: مفعّل فقط عند withLegend = true
       legend: { display: false },


        tooltip: {
          rtl: currentLang === 'ar',
          bodyFont: { family: getFont() },
          titleFont: { family: getFont() },
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },

        datalabels: {
          color: '#fff',
          font: { weight: 'bold', size: 14, family: getFont() },
          formatter: (value, ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (value * 100 / total).toFixed(0) : 0;
            return percentage > 0 ? percentage + '%' : '';
          }
        }
      },
      cutout: '65%'
    }
  });
}
// ===== تحديث نسب "راضي / غير راضي" بجانب كل دائرة =====
function setText(id, value){ const el = document.getElementById(id); if (el) el.textContent = value; }
function toPct(val, total){ return total > 0 ? ((val/total)*100).toFixed(1) + '%' : '0%'; }

function updateSidePercents(){
  // الأقسام
  for (const key in departmentChartData){
    const d = departmentChartData[key];
    const s = Number(d.satisfied) || 0;
    const n = Number(d.notSatisfied) || 0;
    const tot = s + n;
    setText(`${key}-satisfied`,     toPct(s, tot));
    setText(`${key}-notSatisfied`,  toPct(n, tot));
  }

  // الإجمالي
  const os = Number(overallSatisfactionData.satisfied) || 0;
  const on = Number(overallSatisfactionData.notSatisfied) || 0;
  const ot = os + on;
  setText('overall-satisfied',    toPct(os, ot));
  setText('overall-notSatisfied', toPct(on, ot));
}



function updateAllCharts() {
  const font = getFont();
  const currentSatisfactionLabels = satisfactionLabels[currentLang];

  // Departments
  for (const key in departmentChartData) {
    const dept = departmentChartData[key];
    const ctx = document.getElementById(`${key}Chart`);
    if (!ctx) continue;
    const data = [dept.satisfied, dept.notSatisfied];

    if (window[`${key}Chart`]) {
      const chart = window[`${key}Chart`];
      chart.data.labels = currentSatisfactionLabels;
      chart.data.datasets[0].data = data;
      chart.options.plugins.tooltip.rtl = currentLang === 'ar';
      chart.options.plugins.tooltip.bodyFont.family = font;
      chart.options.plugins.tooltip.titleFont.family = font;
      chart.options.plugins.datalabels.font.family = font;
      chart.update();
    }
  }

  // Overall
  const overallCtx = document.getElementById('overallSatisfactionChart');
  if (overallCtx && overallSatisfactionChart) {
    const data = [overallSatisfactionData.satisfied, overallSatisfactionData.notSatisfied];
    overallSatisfactionChart.data.labels = currentSatisfactionLabels;
    overallSatisfactionChart.data.datasets[0].data = data;
    overallSatisfactionChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    overallSatisfactionChart.options.plugins.tooltip.bodyFont.family = font;
    overallSatisfactionChart.options.plugins.tooltip.titleFont.family = font;
    overallSatisfactionChart.options.plugins.datalabels.font.family = font;
    overallSatisfactionChart.update();
  }
    updateSidePercents();
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
    const textContent = el.getAttribute(`data-${lang}`);
    if (textContent) el.textContent = textContent;
  });

  updateAllCharts();
}

// ====== Excel import support ======

// Map department names (from "Report for:" OR filename) to our keys
const deptNameToKey = new Map([
  // Home Medicine / Home Health Care
  ['Home Medicine', 'homeMedicine'],
  ['Home Health Care', 'homeMedicine'],
  ['الطب المنزلي', 'homeMedicine'],

  // Radiology
  ['Radiology', 'radiology'],
  ['الأشعة', 'radiology'],

  // Outpatient
  ['Outpatient', 'outpatient'],
  ['Outpatient Clinics', 'outpatient'],
  ['Hospitals-Outpatient', 'outpatient'],
  ['العيادات الخارجية', 'outpatient'],

  // Dentistry / Dental
  ['Dentistry', 'dentistry'],
  ['Dental', 'dentistry'],
  ['الأسنان', 'dentistry'],

  // Emergency
  ['Emergency', 'emergency'],
  ['Hospitals-Emergency', 'emergency'],
  ['الطوارئ', 'emergency'],

  // Inpatient
  ['Inpatient', 'inpatient'],
  ['Inpatient Departments', 'inpatient'],
  ['Hospitals-Inpatient', 'inpatient'],
  ['أقسام التنويم', 'inpatient'],

  // Mortality (optional)
  ['Mortality', 'mortality'],
  ['الوفيات', 'mortality'],

  // Blood Bank
  ['Blood Bank', 'bloodBank'],
  ['بنك الدم', 'bloodBank'],
]);

/** Extract dept from a "Report for:" line */
function extractDeptFromReportFor(text) {
  if (!text) return '';
  const lower = String(text).toLowerCase();
  const idx = lower.indexOf('report for:');
  if (idx === -1) return '';
  const after = text.substring(idx + 'report for:'.length).trim();
  const firstPiece = after.split('/')[0].trim(); // e.g., "Dental"
  return firstPiece;
}

/** Fallback: infer department from filename */
function inferDeptFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
  if (deptNameToKey.has(base)) return base;

  const lowered = base.toLowerCase();
  if (lowered.includes('inpatient')) return 'Hospitals-Inpatient';
  if (lowered.includes('outpatient')) return 'Hospitals-Outpatient';
  if (lowered.includes('emergency')) return 'Hospitals-Emergency';
  if (lowered.includes('home') && lowered.includes('care')) return 'Home Health Care';
  if (lowered.includes('dental')) return 'Dental';
  if (lowered.includes('blood') && lowered.includes('bank')) return 'Blood Bank';
  if (lowered.includes('radiology')) return 'Radiology';
  if (lowered.includes('mortality')) return 'Mortality';
  return '';
}

/** Extract Quarter label (Q1..Q4) from AOA text such as "Period: Quarter 2, 2025" */
function extractQuarterFromAOA(aoa) {
  try {
    for (let r = 0; r < aoa.length; r++) {
      for (let c = 0; c < (aoa[r] || []).length; c++) {
        const cell = aoa[r][c];
        if (typeof cell === 'string') {
          const lower = cell.toLowerCase();
          if (lower.includes('quarter')) {
            const m = lower.match(/quarter\s*([1-4])/);
            if (m) return `Q${m[1]}`;
          }
          if (lower.includes('period')) {
            const m = lower.match(/quarter\s*([1-4])/);
            if (m) return `Q${m[1]}`;
          }
        }
      }
    }
  } catch (_) {}
  return '';
}

/** Find Meanscore (0..100) near its label in a sheet (using AOA) */
function findMeanScoreFromAOA(aoa) {
  let rFound = -1, cFound = -1;
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < (aoa[r] || []).length; c++) {
      const v = aoa[r][c];
      if (typeof v === 'string' && v.toLowerCase().includes('meanscore')) { rFound = r; cFound = c; break; }
    }
    if (rFound !== -1) break;
  }
  if (rFound === -1) return null;

  const candidates = [];
  if (aoa[rFound] && typeof aoa[rFound][cFound + 1] !== 'undefined') candidates.push(aoa[rFound][cFound + 1]);
  if (aoa[rFound + 1] && typeof aoa[rFound + 1][cFound] !== 'undefined') candidates.push(aoa[rFound + 1][cFound]);
  if (aoa[rFound + 1] && typeof aoa[rFound + 1][cFound + 1] !== 'undefined') candidates.push(aoa[rFound + 1][cFound + 1]);

  for (const v of candidates) {
    const num = Number(String(v).toString().replace(/[^\d.]/g, ''));
    if (!isNaN(num) && num >= 0 && num <= 100) return num;
  }

  for (let rr = rFound; rr < Math.min(aoa.length, rFound + 10); rr++) {
    for (let cc = 0; cc < (aoa[rr] || []).length; cc++) {
      const num = Number(String(aoa[rr][cc]).toString().replace(/[^\d.]/g, ''));
      if (!isNaN(num) && num >= 0 && num <= 100) return num;
    }
  }
  return null;
}

/** Handle ONE Excel file -> update ONE department */
function handleExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];

      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });

      // Department: from "Report for:" or filename
      let deptName = '';
      for (const row of aoa) {
        for (const cell of row) {
          if (typeof cell === 'string' && cell.toLowerCase().includes('report for:')) {
            deptName = extractDeptFromReportFor(cell);
            break;
          }
        }
        if (deptName) break;
      }
      if (!deptName) deptName = inferDeptFromFilename(file.name);

      // Quarter (Period)
      let quarter = extractQuarterFromAOA(aoa);
      if (!quarter) quarter = selectedQuarter || 'Q1';

      // Meanscore
      let meanScore = findMeanScoreFromAOA(aoa);
      if (meanScore == null) {
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        for (const row of json) {
          for (const key of Object.keys(row)) {
            if (String(key).toLowerCase().includes('meanscore')) {
              const v = Number(String(row[key]).replace(/[^\d.]/g, ''));
              if (!isNaN(v) && v >= 0 && v <= 100) { meanScore = v; break; }
            }
          }
          if (meanScore != null) break;
        }
      }

      const mapKey = deptNameToKey.get(deptName) || null;
      if (mapKey && typeof meanScore === 'number') {
        const sat = Math.max(0, Math.min(100, Number(meanScore)));
        const notSat = Math.max(0, Math.min(100, 100 - sat));
        // Save into quarters store
        const bucket = ensureQuarterBucket(quarter);
        if (bucket) {
          bucket.departments[mapKey] = { satisfied: sat, notSatisfied: notSat };
        }
        // If this quarter is currently selected, reflect immediately
        if (!selectedQuarter) selectedQuarter = quarter;
        if (selectedQuarter === quarter) {
          departmentChartData[mapKey].satisfied = sat;
          departmentChartData[mapKey].notSatisfied = notSat;
        }
      }
      resolve();
    };
    reader.readAsArrayBuffer(file);
  });
}

/** Recompute overall & cards, then refresh charts (and persist) */
function recomputeFromDepartments({ persist = true } = {}) {
  let sumS = 0, sumN = 0, counted = 0;
  Object.values(departmentChartData).forEach(d => {
    const total = Number(d.satisfied) + Number(d.notSatisfied);
    if (total > 0) {
      sumS += Number(d.satisfied);
      sumN += Number(d.notSatisfied);
      counted++;
    }
  });

  overallSatisfactionData.satisfied = sumS;
  overallSatisfactionData.notSatisfied = sumN;

  const all = sumS + sumN;
  cardData.totalDepartmentsSurvey = counted;
  cardData.averageSatisfactionScore = all ? ((sumS / all) * 100).toFixed(1) : '0.0';

  updateCardData();
  updateAllCharts();
updateSidePercents(); 
  if (persist) saveToLocal();
}

// ====== DOM Ready ======
document.addEventListener('DOMContentLoaded', async () => {
  const langToggleBtn = document.getElementById('langToggle');
  const exportReportBtn = document.getElementById('exportReportBtn');
  const importExcelBtn = document.getElementById('importExcelBtn');
  const excelInput = document.getElementById('excelInput');
  const saveBtn = document.getElementById('saveToServerBtn');
  const quarterFilter = document.getElementById('quarterFilter');

  // 1) Load saved data into models BEFORE chart creation
  loadFromLocal();
  loadQuarters();

  // pick default selected quarter
  if (!selectedQuarter) {
    if (savedQuarters['Q1']) selectedQuarter = 'Q1';
    else if (savedQuarters['Q2']) selectedQuarter = 'Q2';
    else if (savedQuarters['Q3']) selectedQuarter = 'Q3';
    else if (savedQuarters['Q4']) selectedQuarter = 'Q4';
  }
  if (quarterFilter && selectedQuarter) quarterFilter.value = selectedQuarter;

  // 2) Init cards (will be updated again after recompute)
  updateCardData();

  // 3) Init charts with whatever model currently has
  const currentSatisfactionLabels = satisfactionLabels[currentLang];
  for (const key in departmentChartData) {
    const dept = departmentChartData[key];
    const el = document.getElementById(`${key}Chart`);
    if (!el) continue;
    const data = [dept.satisfied, dept.notSatisfied];
    window[`${key}Chart`] = createDonutChart(el, data, currentSatisfactionLabels, satisfactionColors);
  }
  const overallCtx = document.getElementById('overallSatisfactionChart');
  if (overallCtx) {
    const data = [overallSatisfactionData.satisfied, overallSatisfactionData.notSatisfied];
    overallSatisfactionChart = createDonutChart(overallCtx, data, currentSatisfactionLabels, satisfactionColors ,{ withLegend: true }  );
  }

  // 4) Apply language + recompute (also persists)
  applyLanguage(currentLang);
  // If a quarter is selected and exists in store, load it into current model
  if (selectedQuarter && savedQuarters[selectedQuarter]) {
    const src = savedQuarters[selectedQuarter].departments || {};
    for (const key in departmentChartData) {
      const rec = src[key] || { satisfied: 0, notSatisfied: 0 };
      departmentChartData[key].satisfied = Number(rec.satisfied) || 0;
      departmentChartData[key].notSatisfied = Number(rec.notSatisfied) || 0;
    }
  }
  recomputeFromDepartments({ persist: false }); // recompute once (we'll save explicitly below)

  // Try to load from database after initial setup
  await (async () => {
    // بعد اختيار الربع/السنة من الواجهة، جرّب تحميل DB:
    const ok = await tryLoadFromDB();
    if (ok) {
      // ثم أعِد توليد الرسوم والبطاقات
      recomputeFromDepartments({ persist: false });
    }
  })();

  // 5) Manual save button (Local)
document.getElementById('saveToServerBtn')?.addEventListener('click', async () => {
  recomputeFromDepartments({ persist: true }); // يحسب ويحدّث النِسب محليًا
  await saveToDatabase();                      // ثم يرسلها للباك-إند
});

  // ===== 6) Export as Excel (from Database) =====
  exportReportBtn?.addEventListener('click', async () => {
    try {
      let dbSnapshot = null;
      
      try {
        // 1) حدّد الربع/السنة بدون تعديل الواجهة
        const params = getSelectedYearQuarter();

        // 2) اجلب أحدث بيانات من الـDB
        dbSnapshot = await fetchPressGaneyFromDB(params);
        console.log('📊 Data loaded from database:', dbSnapshot);
      } catch (dbError) {
        console.log('📊 Database fetch failed, using local data:', dbError.message);
        dbSnapshot = null; // سيستخدم buildPressGaneyWorkbook البيانات المحلية
      }

      // 3) ابنِ المصنف (سيستخدم البيانات المحلية إذا كانت قاعدة البيانات فارغة)
      const wb = buildPressGaneyWorkbook(dbSnapshot);

      // 4) اسم الملف
      const pad = n => String(n).padStart(2, '0');
      const d = new Date();
      const quarter = document.getElementById('quarterFilter')?.value || 'Q1';
      const year = document.getElementById('yearFilter')?.value || new Date().getFullYear();
      const fileName = `PressGaney-Report_${year}_${quarter}_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.xlsx`;

      // 5) تنزيل الملف
      XLSX.writeFile(wb, fileName);

      console.log('✅ Excel exported successfully.');
      alert('تم تصدير ملف Excel بنجاح!');
    } catch (e) {
      console.error('❌ Failed to export Excel:', e);
      alert('تعذّر إنشاء ملف Excel: ' + e.message);
    }
  });


  // 7) Import Excel (MULTI-FILE UPDATE + Auto-save)
  importExcelBtn?.addEventListener('click', () => excelInput?.click());
  excelInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const f of files) {
      await handleExcelFile(f);
    }
    // Persist quarters + reflect selection
    saveQuarters();
    if (quarterFilter && selectedQuarter) quarterFilter.value = selectedQuarter;
    localStorage.setItem('pressganey:selectedQuarter', selectedQuarter || '');
    // Recompute -> updates cards/charts, then persist
    recomputeFromDepartments({ persist: true });

    // allow reselect same files later
    e.target.value = '';
  });

  // 8) Quarter filter selection
  quarterFilter?.addEventListener('change', () => {
    const q = quarterFilter.value;
    selectedQuarter = q;
    localStorage.setItem('pressganey:selectedQuarter', selectedQuarter || '');
    const src = (savedQuarters[q] && savedQuarters[q].departments) || {};
    for (const key in departmentChartData) {
      const rec = src[key] || { satisfied: 0, notSatisfied: 0 };
      departmentChartData[key].satisfied = Number(rec.satisfied) || 0;
      departmentChartData[key].notSatisfied = Number(rec.notSatisfied) || 0;
    }
    recomputeFromDepartments({ persist: false });
  });

  // 8) Language toggle
  langToggleBtn?.addEventListener('click', () => {
    applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    saveToLocal(); // persist chosen language too
  });
});

// ===== Department Management Functions =====

// فتح modal إضافة قسم جديد
function openAddDepartmentModal() {
  const modal = document.getElementById('addDepartmentModal');
  if (modal) {
    modal.style.display = 'flex';
    // إعادة تعيين النموذج
    document.getElementById('addDepartmentForm').reset();
    // التركيز على أول حقل
    document.getElementById('departmentNameAr').focus();
  }
}

// إغلاق modal إضافة قسم جديد
function closeAddDepartmentModal() {
  const modal = document.getElementById('addDepartmentModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// حفظ قسم جديد
function saveNewDepartment() {
  const nameAr = document.getElementById('departmentNameAr').value.trim();
  const nameEn = document.getElementById('departmentNameEn').value.trim();
  const satisfied = parseInt(document.getElementById('satisfiedPercentage').value) || 0;
  const notSatisfied = parseInt(document.getElementById('notSatisfiedPercentage').value) || 0;
  
  // التحقق من صحة البيانات
  if (!nameAr || !nameEn) {
    alert(currentLang === 'ar' ? 
      'يرجى إدخال اسم القسم باللغتين العربية والإنجليزية' : 
      'Please enter department name in both Arabic and English');
    return;
  }
  
  if (satisfied + notSatisfied > 100) {
    alert(currentLang === 'ar' ? 
      'مجموع نسب الرضا وعدم الرضا لا يجب أن يتجاوز 100%' : 
      'Sum of satisfaction and dissatisfaction percentages should not exceed 100%');
    return;
  }
  
  // إنشاء مفتاح فريد للقسم الجديد
  const departmentKey = nameAr.toLowerCase().replace(/\s+/g, '_').replace(/[^\u0600-\u06FFa-z0-9_]/g, '');
  
  // التحقق من عدم وجود قسم بنفس الاسم
  if (departmentChartData[departmentKey]) {
    alert(currentLang === 'ar' ? 
      'هذا القسم موجود بالفعل' : 
      'This department already exists');
    return;
  }
  
  // إضافة القسم الجديد إلى البيانات
  departmentChartData[departmentKey] = {
    ar: nameAr,
    en: nameEn,
    satisfied: satisfied,
    notSatisfied: notSatisfied
  };
  
  // إنشاء العنصر الجديد في HTML
  createNewDepartmentCard(departmentKey, nameAr, satisfied, notSatisfied);
  
  // حفظ البيانات
  saveToLocal();
  
  // إغلاق Modal
  closeAddDepartmentModal();
  
  // إعادة حساب الإحصائيات
  updateCards();
  
  // رسالة نجاح
  alert(currentLang === 'ar' ? 
    `تم إضافة القسم "${nameAr}" بنجاح` : 
    `Department "${nameEn}" added successfully`);
}

// إنشاء كارت قسم جديد
function createNewDepartmentCard(departmentKey, nameAr, satisfied, notSatisfied) {
  const gridContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-6.mb-8');
  const addButtonCard = gridContainer.querySelector('.bg-gradient-to-br.from-blue-50.to-indigo-100');
  
  // إنشاء الكارت الجديد
  const newCard = document.createElement('div');
  newCard.className = 'bg-white rounded-lg shadow-md p-4';
  newCard.innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">${nameAr}</h3>
    <div class="chart-row">
      <div class="relative w-36 h-36 mx-auto"><canvas id="${departmentKey}Chart"></canvas></div>
      <div class="legend-side">
        <div class="legend-item">
          <span class="legend-left"><span class="legend-dot" style="background:#22C55E"></span>راضي</span>
          <span class="legend-pct" id="${departmentKey}-satisfied">${satisfied}%</span>
        </div>
        <div class="legend-item">
          <span class="legend-left"><span class="legend-dot" style="background:#EF4444"></span>غير راضي</span>
          <span class="legend-pct" id="${departmentKey}-notSatisfied">${notSatisfied}%</span>
        </div>
      </div>
    </div>
  `;
  
  // إدراج الكارت الجديد قبل زر الإضافة
  gridContainer.insertBefore(newCard, addButtonCard);
  
  // إنشاء الرسم البياني الجديد
  createDepartmentChart(departmentKey, satisfied, notSatisfied);
}

// إنشاء رسم بياني لقسم جديد
function createDepartmentChart(departmentKey, satisfied, notSatisfied) {
  const canvas = document.getElementById(`${departmentKey}Chart`);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: satisfactionLabels[currentLang],
      datasets: [{
        data: [satisfied, notSatisfied],
        backgroundColor: satisfactionColors,
        borderWidth: 0,
        cutout: '70%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: currentLang === 'ar',
          bodyFont: { family: currentLang === 'ar' ? 'Tajawal' : 'Inter' }
        }
      }
    }
  });
}

// إغلاق Modal عند النقر خارجه
document.addEventListener('click', (e) => {
  const modal = document.getElementById('addDepartmentModal');
  if (modal && e.target === modal) {
    closeAddDepartmentModal();
  }
});

// إغلاق Modal عند الضغط على Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('addDepartmentModal');
    if (modal && modal.style.display === 'flex') {
      closeAddDepartmentModal();
    }
  }
});