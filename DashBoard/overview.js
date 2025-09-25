/* ===========================
   Overview Page – Full Script
   =========================== */

let currentLang = localStorage.getItem('lang') || 'ar';
let topComplaintsChart;

// API
const API_BASE_URL = 'http://localhost:3001/api';

// Global state
let overviewData = {
  mainStats: {
    transparencyRate: '0%',
    underReview: 0,
    newComplaint: 0,
    repeatedComplaints: 0,
    totalComplaints: 0
  },
  topComplaints: {
    labels: { ar: [], en: [] },
    values: []
  }
};

// Fonts
function getFont() {
  return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

/* -----------------------------
   UI helpers
------------------------------*/
function asPercent(v) {
  if (v == null) return '0%';
  if (typeof v === 'string' && v.trim().endsWith('%')) return v.trim();
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n)}%` : '0%';
}

function toggleNoDataUI(showNoData) {
  const msg = document.getElementById('noDataMsg');
  const canvas = document.getElementById('topComplaintsChart');
  if (msg) msg.classList.toggle('hidden', !showNoData);
  if (canvas) canvas.classList.toggle('hidden', showNoData);
}

/* -----------------------------
   Backend health (optional)
------------------------------*/
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      await response.json();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* -----------------------------
   Canvas creation
------------------------------*/
function createChartDynamically() {
  const chartContainer = document.querySelector('.relative.w-full');
  if (!chartContainer) {
    console.error('❌ Chart container not found');
    return null;
  }
  const existingCanvas = chartContainer.querySelector('canvas');
  if (existingCanvas) existingCanvas.remove();
  const canvas = document.createElement('canvas');
  canvas.id = 'topComplaintsChart';
  chartContainer.appendChild(canvas);
  return canvas;
}

/* -----------------------------
   Data loading (initial)
------------------------------*/
async function loadOverviewData() {
  try {
    const response = await fetch(`${API_BASE_URL}/overview/stats`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (result.success && result.data) {
      processOverviewData(result.data);
      renderTopComplaintsChart();
    } else {
      throw new Error('فشل في معالجة البيانات من الخادم');
    }
  } catch (error) {
    console.error('❌ loadOverviewData error:', error);

    // Fallback test data
    const testData = {
      transparencyRate: '50%',
      underReview: 0,
      newComplaint: 2,
      repeatedComplaints: 1,
      totalComplaints: 5,
      topComplaints: [
        { complaintType: 'خدمات التأهيل والعلاج الطبيعي', count: 2 },
        { complaintType: 'الكوادز الصحية وسلوكهم', count: 1 },
        { complaintType: 'خدمات المرضى العامة', count: 1 },
        { complaintType: 'بيئة المستشفى والبنية التحتية', count: 1 }
      ],
      repeatedComplaintsDetails: [] // فاضية لإجبار الـfallback
    };
    processOverviewData(testData);
    renderTopComplaintsChart();
  }
}

/* -----------------------------
   Processing API data
------------------------------*/
function processOverviewData(data) {
  // Main stats
  overviewData.mainStats = {
    transparencyRate: data.transparencyRate ?? '0%',
    underReview: data.underReview ?? 0,
    newComplaint: data.newComplaint ?? 0,
    repeatedComplaints: data.repeatedComplaints ?? 0,
    totalComplaints: data.totalComplaints ?? 0
  };

  // Top complaints (support two naming styles)
  const top = Array.isArray(data.topComplaints) ? data.topComplaints : [];
  const arLabels = top.map(item => item.complaintType || item.ComplaintType || 'بلاغ  عامة');
  const enLabels = arLabels.map(getEnglishComplaintType);
  const values = top.map(item => Number(item.count || item.Count || 0));

  overviewData.topComplaints.labels.ar = arLabels;
  overviewData.topComplaints.labels.en = enLabels;
  overviewData.topComplaints.values = values;

  // Repeated details
  const repeatedDetails = data.repeatedComplaintsDetails || [];

  // Update cards + alert details
  updateMainStatsCards();
  updateRepeatedComplaintsAlert(repeatedDetails);
}

/* -----------------------------
   Transparency helper (unused but kept)
------------------------------*/
function calculateTransparencyRate(general) {
  if (!general.totalComplaints) return 0;
  const resolved = general.closedComplaints || 0;
  const rate = Math.round((resolved / general.totalComplaints) * 100);
  return Math.min(rate, 100);
}

/* -----------------------------
   Localized complaint types EN
------------------------------*/
function getEnglishComplaintType(arabicType) {
  const map = {
    'تأخير في دخول العيادة': 'Delay in Clinic Entry',
    'تعامل غير لائق من موظف': 'Improper Staff Conduct',
    'نقص علاج / أدوية': 'Lack of Treatment / Medication',
    'نظافة غرف المرضى': 'Patient Room Cleanliness',
    'سوء التنسيق في المواعيد': 'Poor Appointment Coordination',
    'خدمات التأهيل والعلاج الطبيعي': 'Rehabilitation & Physiotherapy',
    'الكوادز الصحية وسلوكهم': 'Healthcare Staff & Conduct',
    'خدمات المرضى العامة': 'General Patient Services',
    'بيئة المستشفى والبنية التحتية': 'Hospital Environment & Infrastructure',
    'بلاغ  عامة': 'General Complaint'
  };
  return map[arabicType] || arabicType || 'General Complaint';
}

/* -----------------------------
   Toasts
------------------------------*/
function showError(message) {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #ef4444; color: #fff;
    padding: 15px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,.2);
    z-index: 9999; font-family: 'Tajawal',sans-serif; font-size: 14px; max-width: 300px;
    animation: slideIn .3s ease-out;
  `;
  n.innerHTML = `<div style="display:flex;align-items:center;"><span style="margin-left:10px;">❌</span><span>${message}</span></div>`;
  if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      @keyframes slideIn {from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes slideOut {from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
    `;
    document.head.appendChild(style);
  }
  document.body.appendChild(n);
  setTimeout(() => { n.style.animation = 'slideOut .3s ease-in'; setTimeout(() => n.remove(), 300); }, 4000);
}

function showSuccess(message) {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #22c55e; color: #fff;
    padding: 15px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,.2);
    z-index: 9999; font-family: 'Tajawal',sans-serif; font-size: 14px; max-width: 300px;
    animation: slideIn .3s ease-out;
  `;
  n.innerHTML = `<div style="display:flex;align-items:center;"><span style="margin-left:10px;">✅</span><span>${message}</span></div>`;
  document.body.appendChild(n);
  setTimeout(() => { n.style.animation = 'slideOut .3s ease-in'; setTimeout(() => n.remove(), 300); }, 4000);
}

/* -----------------------------
   Export report
------------------------------*/
async function exportOverviewReport() {
  const btn = document.getElementById('exportReportBtn');
  const original = btn ? btn.innerHTML : '';
  try {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>'; }
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = new URLSearchParams({ fromDate, toDate });
    const response = await fetch(`${API_BASE_URL}/overview/export-data?${params}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `overview-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    showSuccess('تم تصدير التقرير بنجاح');
  } catch (e) {
    console.error(e);
    showError('فشل في تصدير التقرير: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

/* -----------------------------
   Update cards
------------------------------*/
function updateMainStatsCards() {
  const els = {
    transparencyRate: document.getElementById('transparencyRate'),
    underReview: document.getElementById('underReview'),
    newComplaint: document.getElementById('newComplaint'),
    repeatedComplaints: document.getElementById('repeatedComplaints'),
    totalComplaints: document.getElementById('totalComplaints')
  };

  if (els.transparencyRate) els.transparencyRate.textContent = asPercent(overviewData.mainStats.transparencyRate);
  if (els.underReview) els.underReview.textContent = overviewData.mainStats.underReview ?? 0;
  if (els.newComplaint) els.newComplaint.textContent = overviewData.mainStats.newComplaint ?? 0;
  if (els.repeatedComplaints) els.repeatedComplaints.textContent = overviewData.mainStats.repeatedComplaints ?? 0;
  if (els.totalComplaints) els.totalComplaints.textContent = overviewData.mainStats.totalComplaints ?? 0;
}

/* -----------------------------
   Build repeated-types list (API or fallback)
------------------------------*/
function getTopRepeatedTypes(repeatedDetails) {
  // لو فيه تفاصيل من الـAPI استخدمها (نختار فقط ما عدده > 1 لتُعتبر "متكررة")
  let items = [];
  if (Array.isArray(repeatedDetails) && repeatedDetails.length > 0) {
    items = repeatedDetails.map(d => ({
      type: d.ComplaintType || d.complaintType || '—',
      dept: d.DepartmentName || d.department || '—',
      count: Number(d.ComplaintCount || d.count || 0)
    })).filter(x => x.count > 1);
  }

  // Fallback: من الرسم البياني (أعلى القيم وبشرط >= 2)
  if (items.length === 0) {
    const values = overviewData.topComplaints.values || [];
    const labels = overviewData.topComplaints.labels[currentLang] || [];
    const max = values.reduce((m, v) => Math.max(m, Number(v || 0)), 0);

    if (max >= 2) {
      items = values
        .map((v, i) => ({ type: labels[i] || '—', dept: '—', count: Number(v || 0) }))
        .filter(x => x.count === max) // أعلى الأنواع تكراراً
        .sort((a, b) => b.count - a.count);
    }
  }
  return items;
}

/* -----------------------------
   Alert: repeated complaints
------------------------------*/
function updateRepeatedComplaintsAlert(repeatedDetails) {
  // العداد
  const repeatedCountElement = document.getElementById('repeatedComplaintsCount');
  if (repeatedCountElement) {
    repeatedCountElement.textContent = overviewData.mainStats.repeatedComplaints ?? 0;
  }

  const alertSection = document.querySelector('.bg-yellow-50');
  if (!alertSection) return;

  // امسحي أي تفاصيل سابقة
  const existing = alertSection.querySelector('.mt-4.space-y-2');
  if (existing) existing.remove();

  // حددي الأنواع المتكررة (تفاصيل API أو fallback)
  const topRepeated = getTopRepeatedTypes(repeatedDetails);

  // لو ما فيه أنواع متكررة فعلاً، لا نعرض قائمة
  if (!topRepeated || topRepeated.length === 0) return;

  // ابنِ قائمة الأنواع المتكررة
  let html = '<div class="mt-4 space-y-2">';
  topRepeated.forEach(item => {
    html += `
      <div class="bg-yellow-100 p-3 rounded-lg">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-yellow-800">
              ${currentLang === 'ar' ? 'نوع البلاغ :' : 'Complaint Type:'}
              <span class="font-bold">${item.type}</span>
            </p>
            ${item.dept && item.dept !== '—' ? `
              <p class="text-sm text-yellow-700">
                ${currentLang === 'ar' ? 'القسم:' : 'Department:'} ${item.dept}
              </p>` : ''}
          </div>
          <span class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
            ${item.count} ${currentLang === 'ar' ? 'مرات' : 'times'}
          </span>
        </div>
      </div>`;
  });
  html += '</div>';

  const container = alertSection.querySelector('.mr-3');
  if (container) container.insertAdjacentHTML('beforeend', html);
}

/* -----------------------------
   Render bar chart (with %)
------------------------------*/
function renderTopComplaintsChart() {
  // Prepare canvas
  let canvas = document.getElementById('topComplaintsChart');
  if (!canvas) canvas = createChartDynamically();
  if (!canvas) return;

  const values = overviewData.topComplaints.values || [];
  const labels = (overviewData.topComplaints.labels[currentLang] || []);
  const total = values.reduce((a, b) => a + Number(b || 0), 0);
  const hasData = total > 0;

  // Toggle empty UI and destroy old chart
  toggleNoDataUI(!hasData);
  if (topComplaintsChart) { topComplaintsChart.destroy(); topComplaintsChart = null; }
  if (!hasData) return;

  // Register datalabels plugin if available
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  const colors = [
    '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
    '#06B6D4','#84CC16','#F97316','#EC4899','#6366F1'
  ];

  topComplaintsChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: currentLang === 'ar' ? 'أكثر الشكاوى' : 'Most Frequent Complaints',
        data: values,
        backgroundColor: values.map((_, i) => colors[i % colors.length]),
        borderColor: values.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: getFont(), size: 12 }, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          rtl: currentLang === 'ar',
          backgroundColor: 'rgba(0,0,0,0.8)',
          cornerRadius: 6,
          titleFont: { family: getFont(), size: 14, weight: 'bold' },
          bodyFont: { family: getFont(), size: 13 },
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.parsed.y || 0);
              const pct = total ? Math.round((v / total) * 100) : 0;
              return `${v} ${currentLang==='ar'?'بلاغ ':'complaints'} (${pct}%)`;
            }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          clamp: true,
          formatter: (v) => {
            const pct = total ? Math.round((Number(v) / total) * 100) : 0;
            return `${v} (${pct}%)`;
          },
          font: { family: getFont(), weight: '600' }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: getFont(), size: 12 } }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { family: getFont(), size: 12 } },
          grid: { drawBorder: false, color: 'rgba(0,0,0,0.1)' }
        }
      },
      onHover: (evt, active) => {
        evt.native.target.style.cursor = active.length > 0 ? 'pointer' : 'default';
      },
      onClick: (evt, active) => {
        if (!active.length) return;
        const i = active[0].index;
        const lbl = labels[i];
        const v = values[i];
        showSuccess(`${lbl}: ${v} ${currentLang==='ar'?'بلاغ ':'complaints'}`);
      }
    }
  });
}

/* -----------------------------
   Refresh all content on lang
------------------------------*/
function updateAllContent() {
  updateMainStatsCards();
  updateRepeatedComplaintsAlert(); // يعيد بناء القائمة إن وجدت
  renderTopComplaintsChart();      // يعيد الرسم حسب اللغة
}

/* -----------------------------
   Dropdowns
------------------------------*/
function setupDropdown(selectId, optionsId) {
  const selectElement = document.getElementById(selectId);
  const optionsElement = document.getElementById(optionsId);
  if (!selectElement || !optionsElement) return;

  selectElement.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.custom-select-options').forEach(opt => {
      if (opt !== optionsElement) opt.style.display = 'none';
    });
    const isVisible = optionsElement.style.display === 'block';
    optionsElement.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', () => { optionsElement.style.display = 'none'; });

  optionsElement.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.classList.contains('custom-select-option')) {
      const value = e.target.getAttribute('data-value');
      const text = e.target.getAttribute(`data-${currentLang}`);
      const span = selectElement.querySelector('span');
      if (span) { span.textContent = text; span.setAttribute('data-value', value); }
      optionsElement.style.display = 'none';
      applyDateFilter(selectId, value);
    }
  });
}

/* -----------------------------
   Date filtering
------------------------------*/
function applyDateFilter(selectId, value) {
  let fromDate, toDate;
  const now = new Date();
  switch (value) {
    case 'today':
      fromDate = toDate = now.toISOString().split('T')[0]; break;
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      fromDate = toDate = y.toISOString().split('T')[0]; break;
    }
    case 'last7': {
      toDate = now.toISOString().split('T')[0];
      const d = new Date(now); d.setDate(d.getDate() - 7);
      fromDate = d.toISOString().split('T')[0]; break;
    }
    case 'last30': {
      toDate = now.toISOString().split('T')[0];
      const d = new Date(now); d.setDate(d.getDate() - 30);
      fromDate = d.toISOString().split('T')[0]; break;
    }
    case 'jan': case 'feb': case 'mar': case 'apr': case 'may': case 'jun':
    case 'jul': case 'aug': case 'sep': case 'oct': case 'nov': case 'dec': {
      const monthMap = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
      const m = monthMap[value]; const y = now.getFullYear();
      fromDate = new Date(y, m, 1).toISOString().split('T')[0];
      toDate = new Date(y, m + 1, 0).toISOString().split('T')[0]; break;
    }
    case 'q1':
      fromDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      toDate   = new Date(now.getFullYear(), 2, 31).toISOString().split('T')[0]; break;
    case 'q2':
      fromDate = new Date(now.getFullYear(), 3, 1).toISOString().split('T')[0];
      toDate   = new Date(now.getFullYear(), 5, 30).toISOString().split('T')[0]; break;
    case 'q3':
      fromDate = new Date(now.getFullYear(), 6, 1).toISOString().split('T')[0];
      toDate   = new Date(now.getFullYear(), 8, 30).toISOString().split('T')[0]; break;
    case 'q4':
      fromDate = new Date(now.getFullYear(), 9, 1).toISOString().split('T')[0];
      toDate   = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]; break;
    default: return;
  }
  if (fromDate && toDate) loadOverviewDataWithFilter(fromDate, toDate);
}

async function loadOverviewDataWithFilter(fromDate, toDate) {
  try {
    const params = new URLSearchParams({ fromDate, toDate });
    const url = `${API_BASE_URL}/overview/stats?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success) {
      processOverviewData(result.data);
      renderTopComplaintsChart();
    }
  } catch (error) {
    console.error('❌ filter error:', error);
    showError('فشل في تطبيق الفلتر: ' + error.message);
    overviewData.mainStats = {
      transparencyRate: 'خطأ',
      underReview: 'خطأ',
      newComplaint: 'خطأ',
      repeatedComplaints: 'خطأ',
      totalComplaints: 'خطأ'
    };
    updateMainStatsCards();
    toggleNoDataUI(true);
    if (topComplaintsChart) { topComplaintsChart.destroy(); topComplaintsChart = null; }
  }
}

/* -----------------------------
   Language
------------------------------*/
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.remove('lang-ar', 'lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

  document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
    const txt = el.getAttribute(`data-${lang}`);
    if (txt) el.textContent = txt;
  });

  const langTextSpan = document.getElementById('langText');
  if (langTextSpan) langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';

  const dropdowns = ['day', 'month', 'quarter', 'customDate'];
  dropdowns.forEach(id => {
    const span = document.getElementById(`selected${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (span) {
      const selectedValue = span.dataset.value;
      const opt = document.querySelector(`#${id}Options .custom-select-option[data-value="${selectedValue}"]`);
      if (opt) span.textContent = opt.getAttribute(`data-${lang}`);
      else {
        if (id === 'day') span.textContent = lang === 'ar' ? 'اختر اليوم' : 'Choose Day';
        else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
        else if (id === 'quarter') span.textContent = lang === 'ar' ? 'ربع سنوي' : 'Quarterly';
        else if (id === 'customDate') span.textContent = lang === 'ar' ? 'تخصيص التاريخ' : 'Custom Date';
      }
    }
  });

  updateAllContent();
}

/* -----------------------------
   DOM Ready
------------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  const langToggleBtn = document.getElementById('langToggle');
  const exportReportBtn = document.getElementById('exportReportBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  setupDropdown('daySelect', 'dayOptions');
  setupDropdown('monthSelect', 'monthOptions');
  setupDropdown('quarterSelect', 'quarterOptions');
  setupDropdown('customDateSelect', 'customDateOptions');

  if (refreshBtn) refreshBtn.addEventListener('click', loadOverviewData);
  if (exportReportBtn) exportReportBtn.addEventListener('click', exportOverviewReport);
  if (langToggleBtn) langToggleBtn.addEventListener('click', () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    applyLanguage(newLang);
  });

  // Initial load
  loadOverviewData();
  applyLanguage(currentLang);

  // Mark active menu item
  const links = document.querySelectorAll('.sidebar-menu .menu-link');
  links.forEach(link => {
    link.parentElement.classList.remove('active');
    if (link.getAttribute('href') === 'overview.html') link.parentElement.classList.add('active');
  });

  // Check and show export button based on permissions
  checkExportPermission();
});

// Simple permission checking for export button
async function checkExportPermission() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = Number(user?.RoleID || 0);
    
    // Super Admin has all permissions
    if (roleId === 1) {
      const exportBtn = document.getElementById('exportReportBtn');
      const pdfBtn = document.getElementById('exportOverviewPdfBtn');
      if (exportBtn) {
        exportBtn.style.display = '';
        console.log('[OVERVIEW] Super Admin - showing export button');
      }
      if (pdfBtn) {
        pdfBtn.style.display = '';
        console.log('[OVERVIEW] Super Admin - showing PDF button');
      }
      return;
    }

    // Check for reports_export permission
    const empId = user?.EmployeeID || user?.employeeId || user?.id;
    if (!empId) return;

    // Check cached permissions
    const cacheKey = `userPermissions:${empId}`;
    const cached = localStorage.getItem(cacheKey);
    let perms = [];
    if (cached) {
      try {
        perms = JSON.parse(cached);
      } catch (e) {
        console.warn('[OVERVIEW] Failed to parse cached permissions:', e);
      }
    }

    // Check permission flags
    const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
    
    const hasPermission = perms.includes('reports_export') || flags.reports_export === true;
    
    const exportBtn = document.getElementById('exportReportBtn');
    const pdfBtn = document.getElementById('exportOverviewPdfBtn');
    if (exportBtn) {
      if (hasPermission) {
        exportBtn.style.display = '';
        console.log('[OVERVIEW] Permission granted - showing export button');
      } else {
        exportBtn.style.display = 'none';
        console.log('[OVERVIEW] Permission denied - hiding export button');
      }
    }
    if (pdfBtn) {
      if (hasPermission) {
        pdfBtn.style.display = '';
        console.log('[OVERVIEW] Permission granted - showing PDF button');
      } else {
        pdfBtn.style.display = 'none';
        console.log('[OVERVIEW] Permission denied - hiding PDF button');
      }
    }
  } catch (error) {
    console.error('[OVERVIEW] Error checking export permission:', error);
  }
}

/* ===== Helpers: HTML→Image, offscreen Chart snapshot, paged table ===== */
async function htmlBlockToDataURL({ width = 720, html, scale = 2 }) {
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed'; wrap.style.left = '-10000px'; wrap.style.top = '0';
  wrap.style.width = width + 'px'; wrap.style.background = 'transparent';
  wrap.style.fontFamily = getFont(); wrap.dir = (currentLang==='ar'?'rtl':'ltr'); wrap.lang = currentLang;
  wrap.style.boxSizing = 'border-box';
  wrap.style.margin = '0';
  wrap.style.padding = '0';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  const canvas = await html2canvas(wrap, { scale, backgroundColor: null });
  const dataURL = canvas.toDataURL('image/png', 1.0);
  document.body.removeChild(wrap);
  return { dataURL, w: canvas.width/scale, h: canvas.height/scale };
}

async function snapshotChartOffscreen(chart, {
  width = 2200, height = 900, scale = 2,
  barThicknessPx = 34, barPct = 0.9, catPct = 0.9, xTick = 16, yTick = 14, titleSize = 20
} = {}) {
  if (!chart) return null;
  const off = document.createElement('canvas');
  off.style.position='fixed'; off.style.left='-10000px'; off.style.top='0';
  off.style.width = width+'px'; off.style.height = height+'px';
  off.width = Math.floor(width*scale); off.height = Math.floor(height*scale);
  const ctx = off.getContext('2d'); ctx.scale(scale, scale);
  document.body.appendChild(off);

  const cfg = chart.config;
  const data = JSON.parse(JSON.stringify(cfg.data));
  const options = JSON.parse(JSON.stringify(cfg.options || {}));
  options.responsive = false; options.maintainAspectRatio = false; options.animation = false;
  options.datasets = options.datasets || {};
  options.datasets.bar = Object.assign({}, options.datasets.bar, {
    barThickness: barThicknessPx, maxBarThickness: barThicknessPx,
    categoryPercentage: catPct, barPercentage: barPct, borderSkipped: false
  });
  options.scales = options.scales || {};
  if (options.scales.x) options.scales.x.ticks = { ...(options.scales.x.ticks||{}), font: { ...(options.scales.x.ticks?.font||{}), size: xTick } };
  if (options.scales.y) options.scales.y.ticks = { ...(options.scales.y.ticks||{}), font: { ...(options.scales.y.ticks?.font||{}), size: yTick } };
  if (options.plugins?.title) options.plugins.title.font = { ...(options.plugins.title.font||{}), size: titleSize };

  const temp = new Chart(off.getContext('2d'), { type: cfg.type, data, options });
  await new Promise(r => requestAnimationFrame(r));
  const dataURL = off.toDataURL('image/png', 1.0);
  temp.destroy(); off.remove();
  return { dataURL, w: width, h: height };
}

async function addHtmlTablePaged(doc, { title, headers, rows, startY, pageMargin = 28, maxWidth }) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const usableW = maxWidth || (W - pageMargin * 2);
  const rowH = 34, headH = 46; // تقديرات مناسبة
  const topRoom = startY;
  const perPage = Math.max(8, Math.floor((H - topRoom - pageMargin - headH) / rowH));
  let idx = 0, y = startY;

  while (idx < rows.length) {
    const chunk = rows.slice(idx, idx + perPage);
    const html = `
      <div style="direction:${currentLang==='ar'?'rtl':'ltr'};text-align:${currentLang==='ar'?'right':'left'};font-family:${getFont()}">
        ${title && idx===0 ? `<div style="font-weight:700;font-size:16px;margin:0 0 10px">${title}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr>${headers.map(h=>`<th style="padding:8px;border:1px solid #e5e7eb;background:#2563eb;color:#fff">${h}</th>`).join('')}</tr></thead>
          <tbody>${chunk.map(r=>`<tr>${r.map(c=>`<td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb">${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>`;
    const block = await htmlBlockToDataURL({ width: Math.min(820, usableW), html, scale: 2 });
    const scale = Math.min(1, usableW / block.w), drawW = block.w * scale, drawH = block.h * scale;
    if (y + drawH > H - pageMargin) { doc.addPage(); y = pageMargin; }
    doc.addImage(block.dataURL, 'PNG', (W - drawW)/2, y, drawW, drawH);
    y += drawH + 12; idx += perPage;
    if (idx < rows.length) { doc.addPage(); y = pageMargin; }
  }
  return y;
}
async function addHtmlTableAsImage(doc, opts){ // shim للتوافق إن احتجته لاحقًا
  return addHtmlTablePaged(doc, { title: opts.title, headers: opts.headers, rows: opts.rows, startY: opts.startY, pageMargin: opts.pageMargin ?? 28, maxWidth: opts.maxWidth });
}

// يرسم نص متعدد الأسطر على Canvas ويُرجع dataURL + الأبعاد
function titleToDataURL(text, {
  maxWidth,
  fontFamily = getFont(),    // Tajawal للعربية
  fontSize = 20,             // مثل ما ضبطناه
  fontWeight = '800',
  lineHeight = 1.35,
  padding = 0,
  rtl = (currentLang === 'ar')
} = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // إعداد الخط + الاتجاه
  const font = `${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
  ctx.font = font;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // دالة التفاف كلمات
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  const innerMax = Math.max(50, Math.floor(maxWidth - padding * 2));

  function lineWidth(s){ return ctx.measureText(s).width; }

  for (let i = 0; i < words.length; i++) {
    const test = line ? (line + ' ' + words[i]) : words[i];
    if (lineWidth(test) <= innerMax) {
      line = test;
    } else {
      if (line) lines.push(line);
      // لو الكلمة وحدها أطول من السطر، نكسرها بأي مكان آمن
      if (lineWidth(words[i]) > innerMax) {
        let w = words[i];
        while (lineWidth(w) > innerMax && w.length > 1) {
          let cut = Math.floor(w.length * innerMax / lineWidth(w));
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        line = w;
      } else {
        line = words[i];
      }
    }
  }
  if (line) lines.push(line);

  // حساب أبعاد الصورة
  const pxPerLine = Math.ceil(fontSize * lineHeight);
  const contentH = lines.length * pxPerLine;
  const W = Math.ceil(maxWidth);
  const H = Math.ceil(contentH + padding * 2);

  canvas.width = W;
  canvas.height = H;

  // إعادة تعيين إعدادات الرسم بعد تغيير الحجم
  ctx.font = font;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#111';

  // الرسم
  const centerX = Math.floor(W / 2);
  let y = Math.floor(padding);
  for (const ln of lines) {
    ctx.fillText(ln, centerX, y);
    y += pxPerLine;
  }

  return { dataURL: canvas.toDataURL('image/png', 1.0), w: W, h: H };
}

/* ===== Export Overview -> PDF (Pro) ===== */
async function exportOverviewPDF(){
  const { jsPDF } = window.jspdf;

  // 1) A4 Landscape
  const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 28;
  const usableW = W - M * 2;

  const now = new Date();
  const dateStr = now.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-GB');

  // أداة مساعدة: ملاءمة الصورة وعرضها في المنتصف
  function fitAndAdd(dataURL, naturalW, naturalH, x, y, maxW) {
    // قلل العرض المستهدف نقطة بسيطة وتخلص من الكسور
    const hardMax = Math.max(0, Math.floor((maxW || naturalW) - 2));
    const natW    = Math.max(1, Math.floor(naturalW));
    const natH    = Math.max(1, Math.floor(naturalH));
    const targetW = Math.min(natW, hardMax);
    const scale   = targetW / natW;
    const drawW   = Math.floor(natW * scale);
    const drawH   = Math.floor(natH * scale);

    // لو ماعندي x، وسّط داخل الصفحة مع احترام الهوامش
    const drawX   = (typeof x === 'number') ? x : Math.floor((W - drawW) / 2);

    doc.addImage(dataURL, 'PNG', drawX, Math.floor(y), drawW, drawH);
    return { w: drawW, h: drawH, x: drawX, y: Math.floor(y) };
  }

  // رأس وتذييل بسيطين (اختياري)
  function addHeaderFooter() {
    doc.setDrawColor(230); doc.setFillColor(245);
    doc.rect(0, 0, W, 40, 'F');
    doc.setFontSize(9); doc.setTextColor(70);
    doc.text('Overview - Professional Report', M, 25, { align: 'left' });
    doc.setDrawColor(230); doc.line(M, H - 30, W - M, H - 30);
    doc.setTextColor(120);
    const pn = `${doc.getCurrentPageInfo().pageNumber} / ${doc.getNumberOfPages()}`;
    doc.text(pn, W - M, H - 12, { align: 'right' });
    doc.setTextColor(0);
  }

  // 2) صفحة الغلاف
  const ms = overviewData.mainStats || {};
  const coverTitle = currentLang === 'ar' ? 'تقرير نظرة عامة' : 'Overview Report';
  const coverSub1  = currentLang === 'ar' ? 'تاريخ الإنشاء' : 'Generated on';
  const coverBoxW  = Math.max(100, Math.floor(usableW - 40));

  const coverHTML = `
    <div style="
      box-sizing:border-box;width:100%;padding:60px 24px;
      text-align:center;line-height:1.6;
      font-family:${getFont()};
      direction:${currentLang==='ar'?'rtl':'ltr'};
    ">
      <div style="font-weight:800;font-size:36px;margin-bottom:12px">
        ${coverTitle}
      </div>
      <div style="font-size:14px;color:#555;margin-bottom:14px">
        ${coverSub1}: ${dateStr}
      </div>
      <div style="
        display:flex;gap:24px;justify-content:center;flex-wrap:wrap;
        font-size:16px
      ">
        <span>${(currentLang==='ar'?'الشفافية:':'Transparency:')} <b>${asPercent(ms.transparencyRate)}</b></span>
        <span>${(currentLang==='ar'?'الجديدة:':'New:')} <b>${ms.newComplaint||0}</b></span>
        <span>${(currentLang==='ar'?'المتكررة:':'Repeated:')} <b>${ms.repeatedComplaints||0}</b></span>
        <span>${(currentLang==='ar'?'الإجمالي:':'Total:')} <b>${ms.totalComplaints||0}</b></span>
      </div>
    </div>
  `;

  const cover = await htmlBlockToDataURL({ width: coverBoxW, html: coverHTML, scale: 2 });
  // تمركز تلقائيًا بعرض مناسب ولا يقصّ شيء
  fitAndAdd(cover.dataURL, cover.w, cover.h, null, 96, coverBoxW);

  // 3) صفحة المحتوى (العنوان + الشارت + الجدول)
  doc.addPage(); addHeaderFooter();

  const chartTitle = currentLang === 'ar' ? 'أكثر البلاغات تكراراً' : 'Most Frequent Complaints';

  // كان htmlBlockToDataURL — نستبدله بالرسم على Canvas
  const titleBoxW = Math.max(100, Math.floor(usableW - 40));
  const titleImg = titleToDataURL(chartTitle, {
    maxWidth: titleBoxW,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 1.35,
    padding: 0,
    rtl: (currentLang === 'ar')
  });

  // وسّطه أفقياً (x=null) وحده الأقصى = titleBoxW
  const titlePlaced = fitAndAdd(titleImg.dataURL, titleImg.w, titleImg.h, null, 56, titleBoxW);

  // لقطة الشارت أوف-سكرين (مع ارتفاع محسوب لكن بدون تكبير زائد)
  let chartImgH = 0;
  if (window.topComplaintsChart) {
    const items = (overviewData.topComplaints.values || []).length;
    // ارتفاع مناسب حسب عدد الأعمدة لكن سنقيده لاحقًا للملاءمة
    const wantedH = Math.max(520, items * 36 + 220);
    const shot = await snapshotChartOffscreen(topComplaintsChart, {
      width: 2200, height: wantedH, scale: 2,
      barThicknessPx: 38, barPct: 0.85, catPct: 0.9, xTick: 18, yTick: 16, titleSize: 24
    });
    if (shot) {
      const y = titlePlaced.y + titlePlaced.h + 14;
      const placed = fitAndAdd(shot.dataURL, shot.w, shot.h, M + 10, y, usableW - 40);
      chartImgH = placed.h;
    }
  }

  // 4) جدول أعلى الشكاوى (يستخدم دالتك المقسِّمة للصفحات)
  const labels = overviewData.topComplaints.labels[currentLang] || [];
  const values = overviewData.topComplaints.values || [];
  const rows = labels.map((name, i) => [ String(i + 1), name, String(values[i] || 0) ]);

  await addHtmlTablePaged(doc, {
    title: currentLang === 'ar' ? 'تفاصيل الشكاوى الأعلى' : 'Top Complaints – Details',
    headers: [
      currentLang === 'ar' ? '#' : '#',
      currentLang === 'ar' ? 'النوع' : 'Type',
      currentLang === 'ar' ? 'العدد' : 'Count'
    ],
    rows,
    startY: (titlePlaced.y + titlePlaced.h + 18) + (chartImgH || 0) + 24,
    pageMargin: M,
    maxWidth: usableW - 40
  });

  // 5) حفظ الملف
  const fileName = currentLang === 'ar'
    ? `تقرير_نظرة_عامة_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.pdf`
    : `Overview_Report_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.pdf`;
  doc.save(fileName);
  
  // رسالة تأكيد بسيطة
  if (typeof toast === 'function') {
    toast(currentLang === 'ar' ? 'تم تصدير الملف بنجاح' : 'File exported successfully', false);
  } else {
    console.log(currentLang === 'ar' ? '✅ تم تصدير الملف بنجاح' : '✅ File exported successfully');
  }
}

/* ===== Bind the new PDF button ===== */
document.addEventListener('DOMContentLoaded', () => {
  const pdfBtn = document.getElementById('exportOverviewPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      try {
        pdfBtn.disabled = true;
        const old = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>';
        await exportOverviewPDF();
        pdfBtn.innerHTML = old;
        pdfBtn.disabled = false;
      } catch (e) {
        console.error('PDF export failed:', e);
        pdfBtn.disabled = false;
      }
    });
    // يظهر/يختفي بنفس صلاحية reports_export مثل زر الاكسل
    const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if ((user?.RoleID === 1) || flags.reports_export === true) pdfBtn.style.display = '';
  }
});