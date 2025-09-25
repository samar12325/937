let currentLang = localStorage.getItem('lang') || 'ar';
let misconductChart;
let dateFromPicker;
let dateToPicker;

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let misconductData = {
    labels: { ar: [], en: [] },
    datasets: []
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب بيانات بلاغات سوء التعامل من الباك إند
async function loadMisconductData() {
    console.log('🔄 بدء جلب بيانات بلاغات سوء التعامل...');
    
    try {
        // جلب البيانات مباشرة من API
        const response = await fetch(`${API_BASE_URL}/misconduct/stats`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        if (result.success) {
            console.log('✅ نجح جلب البيانات، معالجة البيانات...');
            processMisconductData(result.data);
            
            // إعادة إنشاء الرسم البياني
            if (misconductChart) {
                misconductChart.destroy();
            }
            
            // إنشاء الرسم البياني
            createChartDynamically();
            
        } else {
            throw new Error('فشل في معالجة البيانات من الخادم');
        }
        
    } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        showNoDataMessage();
    }
}

// إنشاء canvas ديناميكياً وإنشاء الرسم البياني
function createChartDynamically() {
    const chartContainer = document.querySelector('.relative.w-full');
    console.log('🔍 البحث عن chart container:', chartContainer);
    
    if (chartContainer) {
        // إنشاء canvas جديد
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'misconductChart';
        newCanvas.style.width = '100%';
        newCanvas.style.height = '100%';
        
        // مسح المحتوى وإضافة canvas
        chartContainer.innerHTML = '';
        chartContainer.appendChild(newCanvas);
        
        console.log('✅ تم إنشاء canvas جديد:', newCanvas);
        
        try {
            misconductChart = createMisconductBarChart(newCanvas, misconductData);
            console.log('✅ تم إنشاء الرسم البياني بنجاح');
        } catch (error) {
            console.error('❌ خطأ في إنشاء الرسم البياني:', error);
            showNoDataMessage();
        }
    } else {
        console.error('❌ لم يتم العثور على chart container');
    }
}

// عرض رسالة عدم وجود بيانات
function showNoDataMessage() {
    const chartContainer = document.querySelector('.relative.w-full');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="text-gray-500 text-6xl mb-4">📊</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">لا توجد بلاغات سوء تعامل</h3>
                    <p class="text-gray-500 mb-4">لم يتم العثور على أي بلاغات سوء تعامل في قاعدة البيانات</p>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-blue-800 text-sm">
                            💡 <strong>نصيحة:</strong> تأكد من وجود شكاوى بنوع "الكوادر الصحية وسلوكهم" في قاعدة البيانات
                        </p>
                    </div>
                    <button onclick="loadMisconductData()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        `;
    }
}

// معالجة البيانات من الباك إند
function processMisconductData(data) {
    console.log('🔧 معالجة البيانات المستلمة:', data);
    
    const departments = data.byDepartment || [];
    console.log('📋 البيانات الخام حسب القسم:', departments);
    
    // إذا لم توجد بيانات، عرض رسالة
    if (departments.length === 0) {
        showNoDataMessage();
        return;
    }
    
    console.log('📋 عدد الأقسام التي لديها بلاغات:', departments.length);
    
    // تحويل البيانات إلى التنسيق المطلوب للرسم البياني
    misconductData.labels.ar = departments.map(dept => dept.DepartmentName);
    misconductData.labels.en = departments.map(dept => getEnglishDepartmentName(dept.DepartmentName));
    
    misconductData.datasets = [{
        label: { ar: 'عدد البلاغات', en: 'Number of Reports' },
        data: departments.map(dept => dept.reportCount),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
        borderRadius: 5,
    }];
    
    console.log('📈 البيانات النهائية للرسم البياني:', misconductData);
}

// الحصول على اسم القسم بالإنجليزية
function getEnglishDepartmentName(arabicName) {
    const departmentMap = {
        'قسم الطوارئ': 'Emergency Department',
        'قسم الجراحة العامة': 'General Surgery Department',
        'قسم الصيدلية': 'Pharmacy Department',
        'قسم العناية المركزة': 'Intensive Care Unit',
        'قسم الجراحة نساء': 'Women\'s Surgery Department',
        'قسم الباطنية': 'Internal Medicine Department',
        'قسم الأطفال': 'Pediatrics Department',
        'قسم العظام': 'Orthopedics Department',
        'قسم القلب': 'Cardiology Department',
        'قسم المخ والأعصاب': 'Neurology Department',
        'قسم الأشعة': 'Radiology Department',
        'قسم المختبر': 'Laboratory Department',
        'قسم التمريض': 'Nursing Department',
        'قسم الإدارة': 'Administration Department'
    };
    
    return departmentMap[arabicName] || arabicName;
}

// الحصول على لون التخصص
function getSpecialtyColor(specialty) {
    const colors = {
        'طبيب': '#3B82F6',
        'ممارس صحي': '#60A5FA',
        'ممرضة': '#93C5FD',
        'تمريض': '#93C5FD',
        'غير محدد': '#CBD5E1'
    };
    return colors[specialty] || '#3B82F6';
}

// الحصول على لون حدود التخصص
function getSpecialtyBorderColor(specialty) {
    const colors = {
        'طبيب': '#2563EB',
        'ممارس صحي': '#3B82F6',
        'ممرضة': '#60A5FA',
        'تمريض': '#60A5FA',
        'غير محدد': '#94A3B8'
    };
    return colors[specialty] || '#2563EB';
}

// إظهار رسالة خطأ
function showError(message) {
    console.error('❌ خطأ:', message);
}

// تصدير التقرير
async function exportMisconductReport() {
    try {
        console.log('📤 بدء تصدير تقرير بلاغات سوء التعامل...');
        
        const fromDate = dateFromPicker && dateFromPicker.selectedDates[0] ? dateFromPicker.selectedDates[0].toISOString().split('T')[0] : '';
        const toDate = dateToPicker && dateToPicker.selectedDates[0] ? dateToPicker.selectedDates[0].toISOString().split('T')[0] : '';
        
        const params = new URLSearchParams();
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
        
        console.log('🌐 إرسال طلب تصدير إلى:', `${API_BASE_URL}/misconduct/export-data?${params}`);
        
        const response = await fetch(`${API_BASE_URL}/misconduct/export-data?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // إنشاء رابط تحميل
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `misconduct-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تصدير التقرير:', error);
        showError('فشل في تصدير التقرير: ' + error.message);
    }
}

function createMisconductBarChart(ctx, chartData) {
    console.log('🎨 إنشاء الرسم البياني مع البيانات:', chartData);
    
    if (!ctx) {
        console.error('❌ Canvas context غير صالح');
        return null;
    }
    
    console.log('🎨 Canvas موجود، بدء إنشاء الرسم البياني...');
    console.log('🎨 Canvas element:', ctx);
    console.log('🎨 Canvas width:', ctx.width);
    console.log('🎨 Canvas height:', ctx.height);
    
    const datasets = chartData.datasets.map(dataset => ({
        label: dataset.label[currentLang],
        data: dataset.data,
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth,
        borderRadius: dataset.borderRadius,
    }));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels[currentLang],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: { display: false },
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: getFont(),
                            size: 12,
                            color: '#333'
                        }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)',
                    },
                }
            }
        }
    });
}

function updateAllContent() {
    const font = getFont();

    // Update Misconduct Chart
    if (misconductChart) {
        misconductChart.data.labels = misconductData.labels[currentLang];
        misconductChart.data.datasets.forEach((dataset, index) => {
            dataset.label = misconductData.datasets[index].label[currentLang]; 
        });
        misconductChart.options.plugins.legend.labels.font.family = font;
        misconductChart.options.plugins.tooltip.rtl = currentLang === 'ar';
        misconductChart.options.plugins.tooltip.bodyFont.family = font;
        misconductChart.options.plugins.tooltip.titleFont.family = font;
        misconductChart.options.scales.x.ticks.font.family = font;
        misconductChart.options.scales.y.ticks.font.family = font;
        misconductChart.update();
    }

    // Update Flatpickr locale
    if (dateFromPicker) {
        dateFromPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateFromPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateFrom').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateFrom').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateFrom').setAttribute('data-en', 'Select Date');
    }
    if (dateToPicker) {
        dateToPicker.set('locale', currentLang === 'ar' ? 'ar' : 'default');
        dateToPicker.set('enableRtl', currentLang === 'ar');
        document.getElementById('dateTo').placeholder = currentLang === 'ar' ? 'اختر التاريخ' : 'Select Date';
        document.getElementById('dateTo').setAttribute('data-ar', 'اختر التاريخ');
        document.getElementById('dateTo').setAttribute('data-en', 'Select Date');
    }
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.remove('lang-ar', 'lang-en');
    document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

    document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
        const textContent = el.getAttribute(`data-${lang}`);
        if (textContent) {
            el.textContent = textContent;
        }
    });

    // Update language toggle text
    const langTextSpan = document.getElementById('langText');
    if (langTextSpan) {
        langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
    }

    updateAllContent();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 بدء تحميل صفحة بلاغات سوء التعامل...');
    
    // فحص وجود Chart.js
    console.log('🔍 فحص Chart.js:', typeof Chart);
    console.log('🔍 فحص ChartDataLabels:', typeof ChartDataLabels);
    
    // فحص وجود canvas
    const canvas = document.getElementById('misconductChart');
    console.log('🔍 فحص canvas عند التحميل:', canvas);
    
    // فحص جميع canvas الموجودة
    const allCanvas = document.querySelectorAll('canvas');
    console.log('🔍 جميع canvas الموجودة:', allCanvas);
    console.log('🔍 عدد canvas:', allCanvas.length);
    
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');

    // Initialize Flatpickr
    dateFromPicker = flatpickr("#dateFrom", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });
    dateToPicker = flatpickr("#dateTo", {
        dateFormat: "Y-m-d",
        locale: currentLang === 'ar' ? 'ar' : 'default',
        enableRtl: currentLang === 'ar',
        maxDate: 'today'
    });

    // إضافة مستمعي الأحداث للفلاتر (إذا لزم الأمر لاحقاً)

    // تحميل البيانات الأولية
    loadMisconductData();

    // Now, call applyLanguage to set initial language and update all content
    applyLanguage(currentLang);

    // Set active sidebar link based on current page
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'misconduct.html') {
            link.parentElement.classList.add('active');
        }
    });

    // Apply Filter button functionality
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            console.log('🔍 تطبيق الفلترة...');
            loadMisconductData(); // إعادة تحميل البيانات مع الفلترة الجديدة
        });
    }

    // Functionality for Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('🔄 تحديث البيانات...');
            loadMisconductData();
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportMisconductReport();
        });
    }

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }
    
    console.log('✅ تم تحميل صفحة بلاغات سوء التعامل بنجاح');
});

/* ===== Helpers: HTML→Image, offscreen Chart snapshot, paged table ===== */
async function htmlBlockToDataURL({ width = 720, html, scale = 2 }) {
  const wrap = document.createElement('div');
  wrap.style.position='fixed'; wrap.style.left='-10000px'; wrap.style.top='0';
  wrap.style.width = width+'px'; wrap.style.background='transparent';
  wrap.style.fontFamily = getFont(); wrap.dir = (currentLang==='ar'?'rtl':'ltr'); wrap.lang = currentLang;
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
  const usableW = maxWidth || (W - pageMargin*2);
  const rowH = 34, headH = 46;
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

// دالة إدراج صورة "تتكيّف مع عرض الصفحة"
function addImageFit(doc, dataURL, x, y, maxWidth) {
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      const pageW = doc.internal.pageSize.getWidth();
      const usable = Math.min(maxWidth, pageW - x * 2);
      // 🔒 لا نسمح بالتكبير: scale لا يتجاوز 1
      const scale = Math.min(1, usable / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      doc.addImage(dataURL, 'PNG', (pageW - w) / 2, y, w, h);
      resolve(h);
    };
    img.src = dataURL;
  });
}

async function buildExportImageFromChart(baseChart, {
  pxWidth = 2200, pxHeight = 900, dpr = 3, barThickness = 48
} = {}) {
  if (!baseChart) return null;

  // 1) Canvas أوف-سكرين
  const off = document.createElement('canvas');
  off.style.position = 'fixed';
  off.style.left = '-10000px';
  off.style.top = '0';
  off.width  = pxWidth * dpr;
  off.height = pxHeight * dpr;
  off.style.width  = pxWidth + 'px';
  off.style.height = pxHeight + 'px';
  document.body.appendChild(off);
  const ctx = off.getContext('2d');
  ctx.scale(dpr, dpr);

  // 2) انسخ البيانات/الخيارات بدون المساس بالرسم الأصلي
  const data    = JSON.parse(JSON.stringify(baseChart.config.data));
  const options = JSON.parse(JSON.stringify(baseChart.config.options || {}));

  // إعدادات تجعل اللقطة أنظف
  options.responsive = false;
  options.maintainAspectRatio = false;
  options.animation = false;
  options.plugins = options.plugins || {};
  if (options.plugins.legend) options.plugins.legend.display = false;
  options.scales = options.scales || {};
  const ds = options.datasets = options.datasets || {};
  ds.bar = Object.assign({}, ds.bar, {
    barThickness: barThickness,
    maxBarThickness: barThickness,
    categoryPercentage: 0.95,
    barPercentage: 0.9,
    borderSkipped: false
  });

  // 3) ارسم نسخة ثانية على الأوف-سكرين
  const exportChart = new Chart(ctx, {
    type: baseChart.config.type,
    data,
    options
  });

  // انتظر فريم واحد للتحديث
  await new Promise(r => requestAnimationFrame(r));

  // 4) لقطة PNG عالية الدقّة ثم نظّف
  const dataURL = off.toDataURL('image/png', 1.0);
  exportChart.destroy();
  off.remove();
  return { dataURL, w: pxWidth, h: pxHeight };
}

async function buildImageFromVisibleChart(baseChart, dpr = 2) {
  if (!baseChart || !baseChart.canvas) return null;
  const src = baseChart.canvas;            // نفس الـcanvas الظاهر
  const off = document.createElement('canvas');
  // نضاعف البكسلات لتحسين الدقة لكن نحافظ على الأبعاد الظاهرة نفسها
  off.width  = src.width  * dpr;
  off.height = src.height * dpr;
  const ctx = off.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.drawImage(src, 0, 0);                // بدون أي تغيير لإعدادات Chart.js
  const dataURL = off.toDataURL('image/png', 1.0);
  return { dataURL, w: src.width, h: src.height }; // نرجّع الأبعاد الطبيعية (بدون تكبير)
}

/* ===== Export Misconduct -> PDF (Pro) ===== */
async function exportMisconductPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 28; const now = new Date();
  const dateStr = now.toLocaleString(currentLang==='ar'?'ar-SA':'en-GB');

  // Header/Footer بسيطين
  function addHeaderFooter(){
    doc.setDrawColor(230); doc.setFillColor(245);
    doc.rect(0,0,W,40,'F');
    doc.setFontSize(9); doc.setTextColor(70);
    doc.text('Misconduct - Professional Report', M, 25);
    doc.setDrawColor(230); doc.line(M,H-30,W-M,H-30);
    doc.setTextColor(120);
    const pn = `${doc.getCurrentPageInfo().pageNumber} / ${doc.getNumberOfPages()}`;
    doc.text(pn, W-M, H-12, { align:'right' });
    doc.setTextColor(0);
  }

  // غلاف (بدون شعار)
  const coverTitle = currentLang==='ar' ? 'تقرير بلاغات سوء التعامل' : 'Misconduct Reports';
  const coverHTML = `
    <div style="text-align:center;padding:46px 10px;">
      <div style="font-weight:800;font-size:26px;margin-bottom:10px">${coverTitle}</div>
      <div style="font-size:12px;color:#555;">${currentLang==='ar'?'تاريخ الإنشاء':'Generated on'}: ${dateStr}</div>
    </div>`;
  const cover = await htmlBlockToDataURL({ width: 680, html: coverHTML, scale: 2 });
  doc.addImage(cover.dataURL, 'PNG', (W-cover.w)/2, 120, cover.w, cover.h);

  // صفحة الرسم + الجدول
  doc.addPage(); addHeaderFooter();

  // عنوان الرسم
  const chartTitle = currentLang==='ar' ? 'عدد بلاغات سوء التعامل حسب القسم' : 'Number of Misconduct Reports by Department';
  const pageW = doc.internal.pageSize.getWidth();
  const titleBlock = await htmlBlockToDataURL({
    width: pageW - M*2, // 👈 نفس عرض الصفحة الفعلي
    html: `<div style="
              font-weight:900;
              font-size:28px;
              line-height:1.5;
              text-align:center;
              color:#000;
              padding-bottom:20px;   /* مسافة أسفل العنوان */
            ">
              ${chartTitle}
           </div>`,
    scale: 2
  });

  // أدرج الصورة في منتصف الصفحة
  doc.addImage(titleBlock.dataURL, 'PNG', M, 80, pageW - M*2, titleBlock.h);
  const titleH = titleBlock.h + 20; // نحسب ارتفاع العنوان + padding

  let chartImgH = 0;
  if (window.misconductChart) {
    // نصدر كما هو ظاهر (وبدقّة أعلى قليلاً dpr=2 بدون تغيير السُمك/التباعد)
    const shot = await buildImageFromVisibleChart(misconductChart, 2);
    if (shot) {
      const pageW = doc.internal.pageSize.getWidth();
      const imgMaxW = pageW - M * 2;   // هامشين يسار/يمين
      // ملاحظة: addImageFit الآن لا تُكبّر الصورة فوق حجمها الطبيعي
      const y = 150 + titleH;
      chartImgH = await addImageFit(doc, shot.dataURL, M, y, imgMaxW);
    }
  }

  // جدول تفصيلي (HTML→صورة، يتجزّأ تلقائيًا)
  const labels = misconductData.labels[currentLang] || [];
  const values = (misconductData.datasets[0]?.data || []);
  const rows = labels.map((name,i)=>[ String(i+1), name, String(values[i]||0) ]);

  const startYForTable = 120 + titleH + chartImgH;
  await addHtmlTablePaged(doc, {
    title: currentLang==='ar' ? 'تفاصيل البلاغات' : 'Reports Details',
    headers: [ currentLang==='ar'?'#':'#', currentLang==='ar'?'القسم':'Department', currentLang==='ar'?'العدد':'Count' ],
    rows,
    startY: startYForTable,
    pageMargin: M
  });

  // ✅ افتح في تبويب جديد بدل التنزيل
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  
  // رسالة تأكيد بسيطة
  if (typeof toast === 'function') {
    toast(currentLang === 'ar' ? 'تم فتح الملف في تبويب جديد' : 'File opened in new tab', false);
  } else {
    console.log(currentLang === 'ar' ? '✅ تم فتح الملف في تبويب جديد' : '✅ File opened in new tab');
  }
}

/* ===== Bind button ===== */
document.addEventListener('DOMContentLoaded', () => {
  const pdfBtn = document.getElementById('exportMisconductPdfBtn');
  if (!pdfBtn) return;
  pdfBtn.addEventListener('click', async () => {
    try {
      const old = pdfBtn.innerHTML;
      pdfBtn.disabled = true;
      pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>';
      await exportMisconductPDF();
      pdfBtn.innerHTML = old;
      pdfBtn.disabled = false;
    } catch (e) {
      console.error('PDF export failed:', e);
      pdfBtn.disabled = false;
      alert(currentLang==='ar'?'فشل تصدير PDF':'PDF export failed');
    }
  });
});
      