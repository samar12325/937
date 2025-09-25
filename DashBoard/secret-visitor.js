

let currentLang = localStorage.getItem('lang') || 'ar';
let horizontalBarChart;
let donutChart;

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// ====== PERSISTENCE (LocalStorage) ======
const STORAGE_KEY = 'secret-visitor:data:v1';
let uploadedExcelData = []; // لتخزين البيانات المرفوعة من Excel



// ====== SAVE/LOAD FUNCTIONS ======
function saveToLocal() {
    try {
        const payload = {
            excelData: uploadedExcelData,
            cardData: cardData,
            horizontalChartRawData: horizontalChartRawData,
            donutChartRawData: donutChartRawData,
            lang: currentLang,
            reportDate: reportDate, // إضافة تاريخ التقرير
            ts: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

        // إحصائيات سريعة للتحقق من البيانات المحفوظة
        if (uploadedExcelData && uploadedExcelData.length > 0) {
            const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
            const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
            console.log(`✅ Saved to localStorage: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);
        } else {
            console.log('✅ Saved to localStorage (no Excel data)');
        }
    } catch (err) {
        console.error('❌ Failed to save:', err);
    }
}

function loadFromLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);

        if (data.excelData) {
            uploadedExcelData = data.excelData;

            // إحصائيات سريعة للتحقق من البيانات المحملة
            if (uploadedExcelData && uploadedExcelData.length > 0) {
                const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
                const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
                console.log(`ℹ️ Loaded Excel data: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);
            }
        }
        if (data.cardData) {
            Object.assign(cardData, data.cardData);
        }
        if (data.horizontalChartRawData) {
            Object.assign(horizontalChartRawData, data.horizontalChartRawData);
        }
        if (data.donutChartRawData) {
            Object.assign(donutChartRawData, data.donutChartRawData);
        }
        if (data.lang) {
            currentLang = data.lang;
            localStorage.setItem('lang', currentLang);
        }
        if (data.reportDate) {
            reportDate = data.reportDate;
        }
        console.log('ℹ️ Loaded from localStorage.');
        return true;
    } catch (err) {
        console.warn('⚠️ Could not load saved data:', err);
        return false;
    }
}

// متغير لتخزين تاريخ التقرير
let reportDate = ''; // سيتم ملؤه من ملف الإكسل

// دالة استخراج التاريخ من أول سطر في ملف الإكسل
function extractDateFromFirstRow(rawData) {
    if (!rawData || rawData.length === 0) {
        return ''; // لا توجد قيمة افتراضية
    }

    const firstRow = rawData[0];
    if (!firstRow || !Array.isArray(firstRow)) {
        return '';
    }

    // البحث عن التاريخ في أول سطر
    for (let i = 0; i < firstRow.length; i++) {
        const cell = String(firstRow[i] || '').trim();
        
        // البحث عن أنماط التاريخ العربية
        const arabicDatePatterns = [
            /لسنة\s*(\d{4})\s*شهر\s*(\w+)/i,
            /سنة\s*(\d{4})\s*شهر\s*(\w+)/i,
            /(\d{4})\s*شهر\s*(\w+)/i,
            /شهر\s*(\w+)\s*سنة\s*(\d{4})/i,
            /شهر\s*(\w+)\s*(\d{4})/i
        ];

        // البحث عن أنماط التاريخ الإنجليزية
        const englishDatePatterns = [
            /for\s*(\w+)\s*(\d{4})/i,
            /(\w+)\s*(\d{4})/i,
            /year\s*(\d{4})\s*month\s*(\w+)/i,
            /month\s*(\w+)\s*year\s*(\d{4})/i
        ];

        // فحص الأنماط العربية
        for (const pattern of arabicDatePatterns) {
            const match = cell.match(pattern);
            if (match) {
                const year = match[1] || match[2];
                const month = match[2] || match[1];
                console.log(`Found Arabic date pattern: year=${year}, month=${month}`);
                return `لسنة ${year} شهر ${month}`;
            }
        }

        // فحص الأنماط الإنجليزية
        for (const pattern of englishDatePatterns) {
            const match = cell.match(pattern);
            if (match) {
                const year = match[1] || match[2];
                const month = match[2] || match[1];
                
                // تحويل أسماء الأشهر الإنجليزية إلى العربية
                const monthMap = {
                    'january': 'يناير', 'jan': 'يناير',
                    'february': 'فبراير', 'feb': 'فبراير',
                    'march': 'مارس', 'mar': 'مارس',
                    'april': 'أبريل', 'apr': 'أبريل',
                    'may': 'مايو',
                    'june': 'يونيو', 'jun': 'يونيو',
                    'july': 'يوليو', 'jul': 'يوليو',
                    'august': 'أغسطس', 'aug': 'أغسطس',
                    'september': 'سبتمبر', 'sep': 'سبتمبر',
                    'october': 'أكتوبر', 'oct': 'أكتوبر',
                    'november': 'نوفمبر', 'nov': 'نوفمبر',
                    'december': 'ديسمبر', 'dec': 'ديسمبر'
                };
                
                const arabicMonth = monthMap[month.toLowerCase()] || month;
                console.log(`Found English date pattern: year=${year}, month=${month} -> ${arabicMonth}`);
                return `لسنة ${year} شهر ${arabicMonth}`;
            }
        }

        // البحث عن أي نص يحتوي على سنة وأشهر
        if (cell.includes('2024') || cell.includes('2023') || cell.includes('2025')) {
            const yearMatch = cell.match(/(\d{4})/);
            const monthMatch = cell.match(/(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/);
            
            if (yearMatch && monthMatch) {
                console.log(`Found date in cell: year=${yearMatch[1]}, month=${monthMatch[1]}`);
                return `لسنة ${yearMatch[1]} شهر ${monthMatch[1]}`;
            }
        }
    }

    console.log('No date pattern found in first row');
    return ''; // لا توجد قيمة افتراضية
}

// Data based on the provided audit table
let cardData = {
    totalObservationLocations: 5, // مركز الاسنان، الطوارئ، الممرات، العيادات الخارجية، التنويم
    totalResponsibleDepartments: 13, // عدد الإدارات المسؤولة المختلفة
    totalSecretVisitorNotes: 52 // إجمالي عدد الملاحظات في الجدول
};

// Data for Horizontal Bar Chart based on the audit table
let horizontalChartRawData = {
    'مركز الاسنان': { executed: 12, notExecuted: 3 },
    'الطوارئ': { executed: 8, notExecuted: 10 },
    'الممرات': { executed: 1, notExecuted: 0 },
    'العيادات الخارجية': { executed: 3, notExecuted: 8 },
    'التنويم': { executed: 1, notExecuted: 1 }
};

// إضافة بيانات تجريبية لاختبار عرض البيانات غير المنفذة
console.log('Initial chart data:', horizontalChartRawData);

const horizontalChartLabelsByLang = {
    ar: Object.keys(horizontalChartRawData),
    en: ['Dental Center', 'Emergency', 'Corridors', 'Outpatient Clinics', 'Inpatient']
};

// Data for Donut Chart based on the audit table observation locations
let donutChartRawData = {
    'مركز الاسنان': 15,
    'الطوارئ': 18,
    'الممرات': 1,
    'العيادات الخارجية': 11,
    'التنويم': 2
};

const donutChartLabelsByLang = {
    ar: Object.keys(donutChartRawData),
    en: ['Dental Center', 'Emergency', 'Corridors', 'Outpatient Clinics', 'Inpatient']
};

const filterLabels = {
    executed: { ar: 'منفذ', en: 'Executed' },
    notExecuted: { ar: 'غير منفذ', en: 'Not Executed' }
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'serif';
}

// ====== UPDATE FUNCTIONS ======
function updateCardData() {
    document.getElementById('totalObservationLocations').textContent = cardData.totalObservationLocations;
    document.getElementById('totalResponsibleDepartments').textContent = cardData.totalResponsibleDepartments;
    document.getElementById('totalSecretVisitorNotes').textContent = cardData.totalSecretVisitorNotes;
}

function updateHorizontalBarChart() {
    if (!horizontalBarChart) return;

    // استخدام البيانات الفعلية من Excel بدلاً من البيانات الثابتة
    const labels = Object.keys(horizontalChartRawData);
    const executedData = labels.map(label => horizontalChartRawData[label]?.executed || 0);
    const notExecutedData = labels.map(label => horizontalChartRawData[label]?.notExecuted || 0);

    // التحقق من وجود بيانات غير منفذة
    const hasNotExecuted = notExecutedData.some(value => value > 0);
    const totalExecuted = executedData.reduce((sum, val) => sum + val, 0);
    const totalNotExecuted = notExecutedData.reduce((sum, val) => sum + val, 0);

    console.log('Chart data check:', {
        labels,
        executedData,
        notExecutedData,
        hasNotExecuted,
        totalExecuted,
        totalNotExecuted,
        rawData: horizontalChartRawData
    });

    // التحقق من أن البيانات تحتوي على قيم صحيحة
    if (totalExecuted === 0 && totalNotExecuted === 0) {
        console.warn('⚠️ No data found for chart - both executed and not executed are 0');
    }

    if (!hasNotExecuted) {
        console.warn('⚠️ No "not executed" data found in chart');
    } else {
        console.log(`✅ Chart contains ${totalNotExecuted} "not executed" records`);
    }

    horizontalBarChart.data.labels = labels;
    horizontalBarChart.data.datasets = [
        {
            label: filterLabels.executed[currentLang],
            data: executedData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            borderRadius: 5,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        },
        {
            label: filterLabels.notExecuted[currentLang],
            data: notExecutedData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            borderRadius: 5,
            categoryPercentage: 0.8,
            barPercentage: 0.9
        }
    ];

    // تحديث الحد الأقصى للمحور X بناءً على البيانات
    const maxValue = Math.max(...executedData, ...notExecutedData);
    horizontalBarChart.options.scales.x.max = Math.max(maxValue + 1, 10);

    horizontalBarChart.update();

    console.log('Horizontal chart updated with:', {
        labels,
        executedData,
        notExecutedData,
        maxValue,
        datasets: horizontalBarChart.data.datasets.map(ds => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: ds.backgroundColor
        }))
    });
}

function updateDonutChart() {
    if (!donutChart) return;

    // استخدام البيانات الفعلية من Excel بدلاً من البيانات الثابتة
    const labels = Object.keys(donutChartRawData);
    const data = Object.values(donutChartRawData);

    donutChart.data.labels = labels;
    donutChart.data.datasets = [{
        data: data,
        backgroundColor: [
            'rgba(37, 99, 235, 0.8)',   // blue - مركز الاسنان
            'rgba(239, 68, 68, 0.8)',   // red - الطوارئ
            'rgba(107, 114, 128, 0.8)', // gray - الممرات
            'rgba(34, 197, 94, 0.8)',   // green - العيادات الخارجية
            'rgba(139, 92, 246, 0.8)',  // purple - التنويم
            'rgba(245, 158, 11, 0.8)',  // yellow
            'rgba(6, 182, 212, 0.8)',   // cyan
            'rgba(251, 113, 133, 0.8)'  // rose
        ],
        borderColor: [
            'rgba(37, 99, 235, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(107, 114, 128, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(251, 113, 133, 1)'
        ],
        borderWidth: 2
    }];

    donutChart.update();

    // Update the legend with values
    updateDonutChartLegend(labels, data);

    console.log('Donut chart updated with:', {
        labels,
        data,
        dataset: {
            data: donutChart.data.datasets[0].data,
            backgroundColor: donutChart.data.datasets[0].backgroundColor
        }
    });
}

// Function to update the legend with values
function updateDonutChartLegend(labels, data) {
    // Map of department keys to legend element IDs
    const legendMap = {
        'مركز الاسنان': 'dental-center-legend',
        'الطوارئ': 'emergency-legend',
        'الممرات': 'corridors-legend',
        'العيادات الخارجية': 'outpatient-legend',
        'التنويم': 'inpatient-legend'
    };

    labels.forEach((label, index) => {
        const value = data[index] || 0;
        const legendElementId = legendMap[label];
        
        if (legendElementId) {
            const legendElement = document.getElementById(legendElementId);
            if (legendElement) {
                // Get the original text from data attributes
                const originalAr = legendElement.getAttribute('data-ar');
                const originalEn = legendElement.getAttribute('data-en');
                
                // Update the text with the value
                if (currentLang === 'ar') {
                    legendElement.textContent = `${originalAr}: ${value}`;
                } else {
                    legendElement.textContent = `${originalEn}: ${value}`;
                }
            }
        }
    });
}

// دالة تصفية البيانات حسب الإدارة المختارة
function filterDataByDepartment(selectedDepartment) {
    if (!uploadedExcelData || uploadedExcelData.length === 0) {
        console.log('لا توجد بيانات Excel لتصفيتها');
        return;
    }

    let filteredData;
    const tableContainer = document.getElementById('excelDataTableContainer');

    if (selectedDepartment === 'all') {
        // إخفاء الجدول عند اختيار "الكل"
        tableContainer.classList.add('hidden');
        console.log('إخفاء الجدول - تم اختيار "الكل"');

        // تحديث الرسوم البيانية بجميع البيانات
        updateChartsFromFilteredData(uploadedExcelData);
        return;
    } else {
        // تصفية البيانات حسب الإدارة المختارة
        filteredData = uploadedExcelData.filter(row => {
            const respDept = row.responsibleDepartment.toLowerCase();
            const loc = (row.observationLocation || row.location || '').toLowerCase();
            const selected = selectedDepartment.toLowerCase();

            // مطابقة الإدارة المختارة مع البيانات
            if (selected === 'dental-center') return respDept.includes('مركز الاسنان') || respDept.includes('اسنان') || respDept.includes('dental') || loc.includes('مركز الاسنان') || loc.includes('اسنان');
            if (selected === 'outpatient') return respDept.includes('عيادات خارجية') || respDept.includes('خارجية') || respDept.includes('outpatient') || loc.includes('عيادات خارجية') || loc.includes('خارجية');
            if (selected === 'emergency') return respDept.includes('طوارئ') || respDept.includes('emergency') || loc.includes('طوارئ');
            if (selected === 'inpatient') return respDept.includes('تنويم') || respDept.includes('inpatient') || loc.includes('تنويم');
            if (selected === 'corridors') return respDept.includes('ممرات') || respDept.includes('corridors') || loc.includes('ممرات');

            return false;
        });

        console.log(`تم تصفية البيانات للإدارة: ${selectedDepartment}`, filteredData);
    }

    // تحديث الجدول بالبيانات المصفاة
    updateExcelDataTable(filteredData);

    // تحديث الرسوم البيانية بالبيانات المصفاة
    updateChartsFromFilteredData(filteredData);
}

// دالة تحديث الرسوم البيانية بالبيانات المصفاة
function updateChartsFromFilteredData(filteredData) {
    if (!filteredData || filteredData.length === 0) {
        // إظهار رسالة "لا توجد بيانات" في الرسوم البيانية
        updateChartsWithNoData();
        return;
    }

    console.log('Processing filtered data for charts:', filteredData);

    // إحصائيات سريعة للتحقق من البيانات المصفاة
    const executedCount = filteredData.filter(row => row.status === 'منفذ').length;
    const notExecutedCount = filteredData.filter(row => row.status === 'غير منفذ').length;
    console.log(`Filtered data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${filteredData.length})`);

    // تجميع البيانات المصفاة حسب القسم والحالة
    const departmentStats = {};
    const locationStats = {};

    filteredData.forEach((row, index) => {
        const loc = row.observationLocation || row.location;
        const respDept = row.responsibleDepartment;
        const isExecuted = row.status === 'منفذ';

        console.log(`Filtered Row ${index + 1}: ObservationLocation="${loc}", ResponsibleDept="${respDept}", Status="${row.status}", IsExecuted=${isExecuted}`);

        // إحصائيات الإدارة المسؤولة
        if (!departmentStats[respDept]) {
            departmentStats[respDept] = { executed: 0, notExecuted: 0 };
        }
        if (isExecuted) {
            departmentStats[respDept].executed++;
        } else {
            departmentStats[respDept].notExecuted++;
        }

        // إحصائيات الموقع
        if (!locationStats[loc]) {
            locationStats[loc] = 0;
        }
        locationStats[loc]++;
    });

    // تحديث البيانات للرسوم البيانية
    horizontalChartRawData = { ...departmentStats };
    donutChartRawData = { ...locationStats };

    // التحقق من أن البيانات تحتوي على حالات غير منفذة
    const hasNotExecuted = Object.values(departmentStats).some(dept => dept.notExecuted > 0);
    console.log('Filtered data check - Has not executed cases:', hasNotExecuted);
    console.log('Filtered department stats:', departmentStats);

    // تحديث البطاقات العلوية
    cardData.totalResponsibleDepartments = Object.keys(departmentStats).length;
    cardData.totalObservationLocations = Object.keys(locationStats).length;
    cardData.totalSecretVisitorNotes = filteredData.length;

    // تحديث الرسوم البيانية
    updateCardData();
    updateHorizontalBarChart();
    updateDonutChart();

    console.log('Updated filtered charts with data:', {
        departmentStats,
        locationStats,
        horizontalChartRawData,
        donutChartRawData
    });
}

// دالة إظهار رسالة "لا توجد بيانات" في الرسوم البيانية
function updateChartsWithNoData() {
    // إعادة تعيين البيانات
    horizontalChartRawData = {};
    donutChartRawData = {};

    // تحديث البطاقات
    cardData.totalResponsibleDepartments = 0;
    cardData.totalObservationLocations = 0;
    cardData.totalSecretVisitorNotes = 0;

    // تحديث الرسوم البيانية
    updateCardData();
    updateHorizontalBarChart();
    updateDonutChart();

    console.log('Charts updated with no data message');
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

    // Update dropdown selected text
    const selectedDepartmentSpan = document.getElementById('selectedDepartment');
    const selectedValue = selectedDepartmentSpan.dataset.value || 'all';
    const allOption = document.querySelector(`.custom-select-option[data-value="${selectedValue}"]`);
    if (allOption) {
        selectedDepartmentSpan.textContent = allOption.getAttribute(`data-${lang}`);
    }

    updateHorizontalBarChart();
    updateDonutChart();
    
    // Update legend text when language changes
    if (donutChart && donutChart.data && donutChart.data.labels && donutChart.data.datasets[0]) {
        updateDonutChartLegend(donutChart.data.labels, donutChart.data.datasets[0].data);
    }

    // Update table headers when language changes
    const tableHeaders = [
        { id: 'mainDeptHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainNoteHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainRespDeptHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainStatusHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' },
        { id: 'mainActionsHeader', baseClass: 'px-6 py-3 border-b border-gray-200 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider' }
    ];

    tableHeaders.forEach(header => {
        const element = document.getElementById(header.id);
        if (element) {
            element.textContent = lang === 'ar' ? element.getAttribute('data-ar') : element.getAttribute('data-en');
            element.className = header.baseClass + (lang === 'ar' ? ' text-right' : ' text-left');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Secret Visitor Dashboard loaded with all fixes applied!');
    console.log('✅ Excel data processing improved');
    console.log('✅ Chart data filtering fixed');
    console.log('✅ Both executed and not executed data will be displayed');

    const horizontalCtx = document.getElementById('horizontalBarChart');
    const donutCtx = document.getElementById('donutChart');
    const langToggleBtn = document.getElementById('langToggle');
    const aiInsightsBtn = document.getElementById('aiInsightsBtn');
    const aiInsightsModal = document.getElementById('aiInsightsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const exportReportBtn = document.getElementById('exportReportBtn');
    const aiInsightsContent = document.getElementById('aiInsightsContent');
    const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');
    const departmentSelect = document.getElementById('departmentSelect');
    const departmentOptions = document.getElementById('departmentOptions');
    
    // Debug: Check if dropdown elements are found
    console.log('Dropdown elements found:', {
        departmentSelect: !!departmentSelect,
        departmentOptions: !!departmentOptions
    });

    // تحميل البيانات المحفوظة
    const hasLoadedData = loadFromLocal();
    if (hasLoadedData && uploadedExcelData.length > 0) {
        console.log('Loaded saved data:', uploadedExcelData);

        // إحصائيات سريعة للتحقق من البيانات المحملة
        const executedCount = uploadedExcelData.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = uploadedExcelData.filter(row => row.status === 'غير منفذ').length;
        console.log(`Loaded data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${uploadedExcelData.length})`);

        updateExcelDataTable(uploadedExcelData);
        updateChartsFromExcelData(uploadedExcelData);
    }

    // Initialize Cards
    updateCardData();

    // Initialize Horizontal Bar Chart
    horizontalBarChart = new Chart(horizontalCtx, {
        type: 'bar',
        data: {
            labels: horizontalChartLabelsByLang[currentLang],
            datasets: []
        },
        options: {
            indexAxis: 'y', // Make it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Use custom HTML legend
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end', // Align labels at the end of the bar
                    color: '#4a5568',
                    font: {
                        weight: 'bold',
                        size: 12,
                        family: getFont()
                    },
                    formatter: value => (value > 0 ? value : '')
                }
            },
            scales: {
                x: { // This is the value axis for horizontal bar chart
                    beginAtZero: true,
                    max: 10, // Max value based on dummy data
                    ticks: {
                        stepSize: 1,
                        font: { family: getFont() }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.1)', // Visible grid lines
                    },
                    position: currentLang === 'ar' ? 'top' : 'bottom' // Position X-axis based on RTL/LTR
                },
                y: { // This is the category axis for horizontal bar chart
                    ticks: {
                        font: { family: getFont() }
                    },
                    grid: { display: false }, // No vertical grid lines
                    reverse: currentLang === 'ar' // Reverse for RTL to keep categories in order
                }
            }
        },
        plugins: []
    });

    // Initialize Donut Chart
    donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: donutChartLabelsByLang[currentLang],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Use custom HTML legend
                },
                tooltip: {
                    rtl: currentLang === 'ar',
                    bodyFont: { family: getFont() },
                    titleFont: { family: getFont() }
                },
                datalabels: {
                    color: '#fff', // White color for labels on segments
                    font: {
                        weight: 'bold',
                        size: 12,
                        family: getFont()
                    },
                    formatter: (value, ctx) => {
                        // Show the actual value instead of percentage
                        return value > 0 ? value : ''; // Only show if > 0
                    }
                }
            }
        },
        plugins: []
    });

    // Initial language setting and chart updates
    applyLanguage(currentLang);

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }

    // Dropdown functionality
    if (departmentSelect) {
        console.log('Adding click listener to departmentSelect');
        departmentSelect.addEventListener('click', () => {
            console.log('Department select clicked');
            departmentOptions.classList.toggle('open');
            const icon = departmentSelect.querySelector('.fas');
            if (departmentOptions.classList.contains('open')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
    } else {
        console.error('departmentSelect element not found!');
    }
    // الانتقال إلى صفحة التفاصيل عند اختيار قسم محدد
    if (departmentOptions) {
        departmentOptions.addEventListener('click', (event) => {
            const optionEl = event.target.closest('.custom-select-option');
            if (!optionEl) return;

            const selectedValue = optionEl.dataset.value || 'all';
            const selectedText  = optionEl.getAttribute(`data-${currentLang}`) || optionEl.textContent.trim();

            const sel = document.getElementById('selectedDepartment');
            if (sel) {
                sel.textContent = selectedText;
                sel.dataset.value = selectedValue;
            }

            departmentOptions.classList.remove('open');
            const icon = departmentSelect.querySelector('.fas');
            if (icon) { icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); }

            if (selectedValue === 'all') { filterDataByDepartment('all'); return; }

            if (!uploadedExcelData || uploadedExcelData.length === 0) {
                alert(currentLang === 'ar' ? 'فضلاً استورد ملف Excel أولاً قبل عرض التفاصيل.' : 'Please import the Excel file first before viewing details.');
                return;
            }

            try {
                localStorage.setItem('secretVisitor:rows:v1', JSON.stringify(uploadedExcelData));
                localStorage.setItem('secretVisitor:selectedDepartment', selectedText);
            } catch {}

            window.location.href = `secret-visitor-details.html?department=${encodeURIComponent(selectedText)}`;
        });
    }

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (departmentSelect && !departmentSelect.contains(event.target) && departmentOptions && !departmentOptions.contains(event.target)) {
            departmentOptions.classList.remove('open');
            departmentSelect.querySelector('.fas').classList.remove('fa-chevron-up');
            departmentSelect.querySelector('.fas').classList.add('fa-chevron-down');
        }
    });

    // Search functionality for departments
    const departmentSearch = document.getElementById('departmentSearch');
    if (departmentSearch) {
        console.log('Adding search functionality to department search input');
        departmentSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            console.log('Searching for:', searchTerm);
            
            // Get all department options (excluding "All" and "Add Section")
            const allOptions = departmentOptions.querySelectorAll('.custom-select-option:not([data-value="all"]):not([data-value="add-section"])');
            
            allOptions.forEach(option => {
                const optionText = option.textContent.toLowerCase();
                const optionTextAr = option.getAttribute('data-ar')?.toLowerCase() || '';
                const optionTextEn = option.getAttribute('data-en')?.toLowerCase() || '';
                
                // Show option if it matches search term
                if (optionText.includes(searchTerm) || optionTextAr.includes(searchTerm) || optionTextEn.includes(searchTerm)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
            
            // Always show "All" and "Add Section" options
            const allOption = departmentOptions.querySelector('[data-value="all"]');
            const addSectionOption = departmentOptions.querySelector('[data-value="add-section"]');
            if (allOption) allOption.style.display = 'block';
            if (addSectionOption) addSectionOption.style.display = 'block';
        });
        
        // Clear search when dropdown is closed
        departmentSelect.addEventListener('click', () => {
            if (!departmentOptions.classList.contains('open')) {
                departmentSearch.value = '';
                // Show all options again
                const allOptions = departmentOptions.querySelectorAll('.custom-select-option');
                allOptions.forEach(option => {
                    option.style.display = 'block';
                });
            }
        });
    } else {
        console.error('departmentSearch element not found!');
    }

    // Function to collect chart data for AI insights (from horizontal bar chart)
    function getChartDataForAI() {
        const data = [];
        const labels = horizontalBarChart.data.labels;
        const executedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.executed[currentLang])?.data || [];
        const notExecutedData = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.notExecuted[currentLang])?.data || [];

        labels.forEach((label, index) => {
            data.push({
                nameAr: horizontalChartLabelsByLang.ar[index],
                nameEn: horizontalChartLabelsByLang.en[index],
                uncompleted: notExecutedData[index] !== undefined ? notExecutedData[index] : 0,
                completed: executedData[index] !== undefined ? executedData[index] : 0
            });
        });
        return data;
    }

    // Function to call Gemini API and generate insights
    async function generateInsights(data) {
        aiInsightsContent.innerHTML = ''; // Clear previous content
        aiLoadingSpinner.classList.remove('hidden'); // Show spinner

        let prompt = "Based on the following data for 'Secret Visitor Notes by Department and Execution Status', provide a concise analysis and key insights. The categories are:\n";
        data.forEach(cat => {
            prompt += `- ${cat.nameAr} (${cat.nameEn}): غير منفذ (Not Executed) ${cat.uncompleted}, منفذ (Executed) ${cat.completed}\n`;
        });
        prompt += "\nFocus on identifying departments with high 'Not Executed' counts and overall performance. The response should be in Arabic.";

        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                aiInsightsContent.innerHTML = text.replace(/\n/g, '<br>');
            } else {
                aiInsightsContent.textContent = "لم يتمكن الذكاء الاصطناعي من توليد رؤى. هيكل الاستجابة غير متوقع.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            aiInsightsContent.textContent = `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message}. يرجى التحقق من اتصالك بالإنترنت أو المحاولة لاحقًا.`;
        } finally {
            aiLoadingSpinner.classList.add('hidden');
        }
    }

    // Event listener for AI Insights button
    if (aiInsightsBtn) {
        aiInsightsBtn.addEventListener('click', () => {
            if (aiInsightsModal) {
                aiInsightsModal.classList.remove('hidden');
                const chartData = getChartDataForAI();
                generateInsights(chartData);
            }
        });
    }

    // Event listener for closing the modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            aiInsightsModal.classList.add('hidden');
        });
    }

    // Optional: Close modal if clicking outside the content
    if (aiInsightsModal) {
        aiInsightsModal.addEventListener('click', (event) => {
            if (event.target === aiInsightsModal) {
                aiInsightsModal.classList.add('hidden');
            }
        });
    }


    // ===== Export as PDF =====
    exportReportBtn?.addEventListener('click', async () => {
        try {
            // انتظري تحميل مكتبة jsPDF
            const ok = await ensureJsPDF();
            if (!ok) { 
                toast(currentLang === 'ar' ? 'تعذّر تحميل مكتبة PDF — سنستخدم الطباعة.' : 'Failed to load PDF library — using print.', true); 
                window.print(); 
                return; 
            }

            // إنشاء مستند PDF جديد
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
            
            // اسم الملف
            const d = new Date(); 
            const pad = n => String(n).padStart(2, '0');
            const fileName = `secret-visitor-report_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.pdf`;
            
            // تحويل الرسوم البيانية إلى صور
            const horizontalBarCanvas = document.getElementById('horizontalBarChart');
            const donutCanvas = document.getElementById('donutChart');
            
            // الرسم البياني الأول - أكبر وأوضح
            if (horizontalBarCanvas) {
                const chart1Img = await chartToImage(horizontalBarCanvas);
                doc.addImage(chart1Img, 'PNG', 5, 5, 200, 120);
            }
            
            // صفحة جديدة للرسم البياني الثاني
            doc.addPage();
            
            // الرسم البياني الثاني - أكبر وأوضح
            if (donutCanvas) {
                const chart2Img = await chartToImage(donutCanvas);
                doc.addImage(chart2Img, 'PNG', 5, 5, 200, 120);
            }
            
            // ✅ افتح في تبويب جديد بدل التنزيل
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            
            toast(currentLang === 'ar' ? 'تم فتح التقرير PDF في تبويب جديد' : 'PDF report opened in new tab');
            
        } catch (e) {
            console.error('Error creating PDF:', e);
            toast(currentLang === 'ar' ? 'فشل إنشاء PDF — سنستخدم الطباعة.' : 'Failed to create PDF — using print.', true);
            window.print();
        }
    });

    // ===== Export as Excel =====
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }


    // ===== وظائف رفع ملفات Excel =====

    // دالة قراءة ملف Excel (خليها كما هي)
    function readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = function (error) {
                reject(error);
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // دوال المساعدة لتعريف الأعمدة (normalizeHeader و KEYS و findHeaderRow)
    function normalizeHeader(s) {
        if (s == null) return '';
        s = String(s).trim().toLowerCase();
        s = s.replace(/[\u064B-\u065F]/g, '');
        s = s.replace(/\u0640/g, '');
        s = s.replace(/[إأآٱ]/g, 'ا');
        s = s.replace(/ى/g, 'ي');
        s = s.replace(/ة/g, 'ه');
        s = s.replace(/[^\p{L}\p{N}\s\/_-]/gu, '');
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }
// === مفاتيح البحث للأعمدة بناءً على ملف Excel الحقيقي ===
const KEYS = {
  notes: [
    'الملاحظة','الملاحظه','ملاحظه','ملاحظة','الملاحظات','ملاحظات',
    'notes','note','comment','comments','description','تفاصيل','وصف',
    'e','e:','column e','عمود e','العمود e'
  ],
  observationLocation: [
    'مواقع الملاحظة','موقع الملاحظة','موقع الملاحظه','الموقع','موقع','مكان الملاحظه','مكان الملاحظة',
    'observation location','location','site','مكان'
  ],
  responsibleDepartment: [
    'الإدارة المسؤولة','الاداره المسؤوله','الادارة المسؤولة','الاداره المسئولة','الادارة المسئولة',
    'responsible department','responsible dept','department','dept','إدارة'
  ],
  executionStatus: [
    'حالة التنفيذ','حاله التنفيذ','الحالة','الحاله','status',
    'execution status','تنفيذ','منفذ','غير منفذ'
  ]
};


    function findHeaderRow(rows, maxScan = 10) {
        for (let r = 0; r < Math.min(rows.length, maxScan); r++) {
            const row = rows[r] || [];
            const normRow = row.map(normalizeHeader);

            const isLocationHeaderCell = (cell) => {
                return typeof cell === 'string' && (cell.includes('موقع') || cell.includes('location'));
            };

            const findIdx = (keys, excludeIndex = -1, excludeLocationLike = false) =>
                normRow.findIndex((cell, i) => {
                    if (excludeIndex !== -1 && i === excludeIndex) return false;
                    if (excludeLocationLike && isLocationHeaderCell(cell)) return false;
                    return keys.some(k => {
                        const nk = normalizeHeader(k);
                        return nk && typeof cell === 'string' && cell.includes(nk);
                    });
                });

            const mapping = {};
            // أولاً حدّد موقع الملاحظة بدقة
            const obsLocationIdx = findIdx(KEYS.observationLocation);
            // ثم ابحث عن عمود الملاحظة مع استثناء الأعمدة المشابهة لـ "موقع"
            let noteIdx = findIdx(KEYS.notes, obsLocationIdx, true);
            const respDeptIdx = findIdx(KEYS.responsibleDepartment);
            const execStatusIdx = findIdx(KEYS.executionStatus);

            if (noteIdx !== -1) mapping.notes = noteIdx;
            if (obsLocationIdx !== -1) mapping.observationLocation = obsLocationIdx;
            if (respDeptIdx !== -1) mapping.responsibleDepartment = respDeptIdx;
            if (execStatusIdx !== -1) mapping.executionStatus = execStatusIdx;

            // Fallback: if notes column not found, try to find it by searching for "ملاحظة"
            if (mapping.notes === undefined) {
                console.log('Notes column not found by header, searching for notes column...');
                // Search for any column containing "ملاحظة" or "notes"
                for (let i = 0; i < normRow.length; i++) {
                    const cell = normRow[i];
                    const originalCell = row[i];
                    if (i !== obsLocationIdx && cell && (cell.includes('ملاحظة') || cell.includes('ملاحظه') || cell.includes('notes') || 
                                cell.includes('note') || cell.includes('comment'))) {
                        mapping.notes = i;
                        console.log(`Found notes column at index ${i}: "${originalCell}"`);
                        break;
                    }
                }
                // If still not found, try to find by looking at the actual header text
                if (mapping.notes === undefined) {
                    for (let i = 0; i < row.length; i++) {
                        const originalCell = row[i];
                        if (i !== obsLocationIdx && originalCell && typeof originalCell === 'string' && 
                            (originalCell.includes('ملاحظة') || originalCell.includes('ملاحظه') || 
                             originalCell.includes('Notes') || originalCell.includes('Note'))) {
                            mapping.notes = i;
                            console.log(`Found notes column at index ${i} by original text: "${originalCell}"`);
                            break;
                        }
                    }
                }
                // If still not found, use column E (index 4) as fallback
                if (mapping.notes === undefined) {
                    mapping.notes = 4; // Column E
                    console.log('Notes column not found, using column E (index 4) as fallback');
                }
            } else {
                // إذا كان عمود الملاحظة مساوياً لعمود موقع الملاحظة، حاول إيجاد بديل
                if (mapping.observationLocation !== undefined && mapping.notes === mapping.observationLocation) {
                    const altIdx = findIdx(KEYS.notes, mapping.observationLocation, true);
                    if (altIdx !== -1) {
                        mapping.notes = altIdx;
                        console.log(`Adjusted notes column to index ${altIdx} to avoid location column`);
                    }
                }
                console.log(`Notes column found at index ${mapping.notes}: "${row[mapping.notes]}"`);
            }

            if (mapping.notes !== undefined && mapping.observationLocation !== undefined && mapping.responsibleDepartment !== undefined) {
                console.log(`Found header row at index ${r}:`, {
                    notes: mapping.notes,
                    observationLocation: mapping.observationLocation,
                    responsibleDepartment: mapping.responsibleDepartment,
                    executionStatus: mapping.executionStatus
                });
                return { rowIndex: r, map: mapping };
            }
        }
        throw new Error('تعذّر العثور على صف العناوين (مواقع الملاحظة/الإجابة/الملاحظة) ضمن أول 10 صفوف.');
    }


    // دالة معالجة بيانات Excel (استبدل دالتك القديمة بها)
    function processExcelData(rawData) {
        if (!rawData || rawData.length < 2) {
            throw new Error('الملف لا يحتوي على بيانات كافية');
        }

        const { rowIndex, map } = findHeaderRow(rawData);
        const dataRows = rawData.slice(rowIndex + 1);

        const out = [];
        for (const row of dataRows) {
            // Ensure we're reading from the correct column for notes
            let notes = '';
            
            // First, try to read from the mapped notes column
            if (map.notes !== undefined && row[map.notes] !== undefined) {
                notes = (row[map.notes] ?? '').toString().trim();
                console.log(`Reading notes from mapped column ${map.notes}: "${notes}"`);
            }
            
            // If notes is still empty, try to find the notes column by searching
            if (!notes || notes === '') {
                console.log('Notes is empty, searching for notes column in current row...');
                // Search for any column that might contain notes (longer text)
                for (let i = 0; i < row.length; i++) {
                    const cellValue = (row[i] ?? '').toString().trim();
                    // Check if this looks like notes (longer text, contains Arabic or English words)
                    if (cellValue && cellValue.length > 20 && 
                        (cellValue.includes(' ') || cellValue.includes('ا') || cellValue.includes('the'))) {
                        notes = cellValue;
                        console.log(`Found potential notes in column ${i}: "${notes.substring(0, 50)}..."`);
                        break;
                    }
                }
            }
            
            // If still empty, try column E (index 4) as final fallback
            if (!notes || notes === '') {
                notes = (row[4] ?? '').toString().trim();
                console.log(`Using column E (index 4) as final fallback for notes: "${notes}"`);
            }
            
            const observationLocation = (row[map.observationLocation] ?? '').toString().trim();
            const responsibleDepartment = (row[map.responsibleDepartment] ?? '').toString().trim();
            const executionStatusRaw = (row[map.executionStatus] ?? '').toString().trim();

            // Debug: Log the raw data being read
            console.log('Processing row:', {
                rawRow: row,
                notesIndex: map.notes,
                notesValue: notes,
                locationIndex: map.observationLocation,
                locationValue: observationLocation,
                deptIndex: map.responsibleDepartment,
                deptValue: responsibleDepartment,
                statusIndex: map.executionStatus,
                statusValue: executionStatusRaw
            });

            // معالجة الحالة - نستخدم القيمة مباشرة من عمود حالة التنفيذ
            let status = executionStatusRaw || 'غير محدد';





            // إضافة الصف فقط إذا كان يحتوي على بيانات صحيحة
            if (notes !== '' || observationLocation !== '') {
                const rowData = {
                    notes: notes || 'غير محدد',
                    observationLocation: observationLocation || 'غير محدد',
                    responsibleDepartment: responsibleDepartment || 'غير محدد',
                    executionStatus: status,
                    // للتوافق مع الكود القديم
                    status: status,
                    location: observationLocation || 'غير محدد'
                };
                out.push(rowData);
                console.log(`Added row ${out.length}: Notes="${rowData.notes}", Location="${rowData.observationLocation}", Department="${rowData.responsibleDepartment}", Status="${rowData.status}"`);
                
                // Additional validation for notes column
                if (!rowData.notes || rowData.notes === 'غير محدد') {
                    console.warn(`⚠️ Row ${out.length} has empty or default notes value: "${rowData.notes}"`);
                } else {
                    console.log(`✅ Row ${out.length} has valid notes from column E: "${rowData.notes}"`);
                }
            }
        }

        console.log('Processed Excel data:', out);

        // إحصائيات سريعة للتحقق
        const executedCount = out.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = out.filter(row => row.status === 'غير منفذ').length;
        console.log(`Status summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount})`);

        // التحقق من أن البيانات تحتوي على حالات غير منفذة
        if (notExecutedCount === 0) {
            console.warn('⚠️ No "not executed" data found in processed Excel data');
        } else {
            console.log(`✅ Found ${notExecutedCount} "not executed" records`);
        }

        return out;
    }


    // دالة لتحديث الجدول
    function updateExcelDataTable(data) {
        const tableBody = document.getElementById('excelDataTableBody');
        const tableContainer = document.getElementById('excelDataTableContainer');

        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500" data-ar="لا توجد بيانات" data-en="No data">لا توجد بيانات</td>
                        </tr>
                    `;
            return;
        }

        // إحصائيات سريعة للتحقق من البيانات
        const executedCount = data.filter(row => row.status === 'منفذ').length;
        const notExecutedCount = data.filter(row => row.status === 'غير منفذ').length;
        console.log(`Table data summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${data.length})`);

        if (notExecutedCount === 0) {
            console.warn('⚠️ No "not executed" data found in table');
        } else {
            console.log(`✅ Table contains ${notExecutedCount} "not executed" records`);
        }

        // إظهار الجدول عند وجود بيانات
        tableContainer.classList.remove('hidden');

        const textAlign = currentLang === 'ar' ? 'text-right' : 'text-left';
        tableBody.innerHTML = data.map((row, index) => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${textAlign}">${row.observationLocation || row.location || 'غير محدد'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900 ${textAlign}">${row.notes || 'غير محدد'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${textAlign}">${row.responsibleDepartment || 'غير محدد'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${textAlign}">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'منفذ'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }">
                                ${row.status || 'غير محدد'}
                            </span>
                        </td>
                    </tr>
                `).join('');

        console.log(`Updated table with ${data.length} rows`);
        if (data.length > 0) {
            console.log(`First row status: "${data[0]?.status}", Last row status: "${data[data.length - 1]?.status}"`);
        }
    }

    // دالة لتحديث الرسوم البيانية بناءً على البيانات المرفوعة
    function updateChartsFromExcelData(data) {
        if (!data || data.length === 0) return;

        // إخفاء الجدول عند التحميل الأولي
        const tableContainer = document.getElementById('excelDataTableContainer');
        tableContainer.classList.add('hidden');

        // تجميع البيانات حسب القسم والحالة
        const departmentStats = {};
        const locationStats = {};

        console.log('Processing Excel data for charts:', data);

        data.forEach((row, index) => {
            const loc = row.observationLocation || row.location;
            const respDept = row.responsibleDepartment;
            const isExecuted = row.status === 'منفذ';

            console.log(`Row ${index + 1}: ObservationLocation="${loc}", ResponsibleDept="${respDept}", Status="${row.status}", IsExecuted=${isExecuted}`);

            // إحصائيات الإدارة المسؤولة
            if (!departmentStats[respDept]) {
                departmentStats[respDept] = { executed: 0, notExecuted: 0 };
            }
            if (isExecuted) {
                departmentStats[respDept].executed++;
            } else {
                departmentStats[respDept].notExecuted++;
            }

            // إحصائيات الموقع
            if (!locationStats[loc]) {
                locationStats[loc] = 0;
            }
            locationStats[loc]++;
        });

        // تحديث البيانات للرسوم البيانية
        horizontalChartRawData = { ...departmentStats };
        donutChartRawData = { ...locationStats };

        // التحقق من أن البيانات تحتوي على حالات غير منفذة
        const hasNotExecuted = Object.values(departmentStats).some(dept => dept.notExecuted > 0);
        const totalExecuted = Object.values(departmentStats).reduce((sum, dept) => sum + dept.executed, 0);
        const totalNotExecuted = Object.values(departmentStats).reduce((sum, dept) => sum + dept.notExecuted, 0);

        console.log('Data check - Has not executed cases:', hasNotExecuted);
        console.log('Department stats:', departmentStats);
        console.log('Chart data summary:', {
            totalExecuted,
            totalNotExecuted,
            departmentStats,
            locationStats
        });

        if (!hasNotExecuted) {
            console.warn('⚠️ No "not executed" data found in filtered chart data');
        } else {
            console.log(`✅ Filtered chart contains ${totalNotExecuted} "not executed" records`);
        }

        // تحديث البطاقات العلوية
        cardData.totalResponsibleDepartments = Object.keys(departmentStats).length;
        cardData.totalObservationLocations = Object.keys(locationStats).length;
        cardData.totalSecretVisitorNotes = data.length;

        // تحديث الرسوم البيانية
        updateCardData();
        updateHorizontalBarChart();
        updateDonutChart();

        console.log('Updated charts with data:', {
            departmentStats,
            locationStats,
            horizontalChartRawData,
            donutChartRawData
        });

        console.log(`Total status counts: منفذ (${totalExecuted}), غير منفذ (${totalNotExecuted})`);

        if (totalNotExecuted === 0) {
            console.warn('⚠️ No "not executed" data found in updated charts');
        } else {
            console.log(`✅ Updated charts contain ${totalNotExecuted} "not executed" records`);
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح
        console.log('Final chart data check:', {
            horizontalChartRawData,
            donutChartRawData,
            cardData
        });

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        console.log('Chart datasets check:', {
            horizontalChartLabels: horizontalBarChart?.data?.labels,
            horizontalChartDatasets: horizontalBarChart?.data?.datasets?.map(ds => ({
                label: ds.label,
                data: ds.data
            })),
            donutChartLabels: donutChart?.data?.labels,
            donutChartData: donutChart?.data?.datasets?.[0]?.data
        });

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            const notExecutedDataset = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.notExecuted[currentLang]);
            if (notExecutedDataset) {
                const notExecutedSum = notExecutedDataset.data.reduce((sum, val) => sum + val, 0);
                console.log(`✅ Horizontal chart "not executed" dataset sum: ${notExecutedSum}`);

                if (notExecutedSum === 0) {
                    console.warn('⚠️ Horizontal chart "not executed" dataset sum is 0');
                } else {
                    console.log(`✅ Horizontal chart "not executed" dataset contains data: ${notExecutedDataset.data.join(', ')}`);
                }
            } else {
                console.warn('⚠️ "Not executed" dataset not found in horizontal chart');
            }
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            const executedDataset = horizontalBarChart.data.datasets.find(ds => ds.label === filterLabels.executed[currentLang]);
            if (executedDataset) {
                const executedSum = executedDataset.data.reduce((sum, val) => sum + val, 0);
                console.log(`✅ Horizontal chart "executed" dataset sum: ${executedSum}`);

                if (executedSum === 0) {
                    console.warn('⚠️ Horizontal chart "executed" dataset sum is 0');
                } else {
                    console.log(`✅ Horizontal chart "executed" dataset contains data: ${executedDataset.data.join(', ')}`);
                }
            } else {
                console.warn('⚠️ "Executed" dataset not found in horizontal chart');
            }
        }

        // التحقق من أن البيانات تم تحديثها بشكل صحيح في الرسوم البيانية
        if (horizontalBarChart?.data?.datasets) {
            console.log('All horizontal chart datasets:', horizontalBarChart.data.datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: ds.backgroundColor
            })));
        }
    }

    // ===== EVENT LISTENERS =====
    const importExcelBtn = document.getElementById('importExcelBtn');
    const saveToServerBtn = document.getElementById('saveToServerBtn');
    const excelInput = document.getElementById('excelInput');

    // زر استيراد ملفات Excel
    if (importExcelBtn) {
        importExcelBtn.addEventListener('click', () => {
            excelInput.click();
        });
    }



    // معالجة اختيار الملفات
    if (excelInput) {
        excelInput.addEventListener('change', async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            try {
                let allData = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    console.log(`Processing file: ${file.name}`);

                    const rawData = await readExcelFile(file);
                    
                    // استخراج التاريخ من أول سطر في أول ملف
                    if (i === 0) {
                        const extractedDate = extractDateFromFirstRow(rawData);
                        reportDate = extractedDate;
                        console.log(`Extracted report date: ${reportDate}`);
                    }
                    
                    const processedData = processExcelData(rawData);
                    allData = allData.concat(processedData);
                }

                uploadedExcelData = allData;

                // إحصائيات سريعة للتحقق
                const executedCount = allData.filter(row => row.status === 'منفذ').length;
                const notExecutedCount = allData.filter(row => row.status === 'غير منفذ').length;
                console.log(`Excel import summary: منفذ (${executedCount}), غير منفذ (${notExecutedCount}), Total (${allData.length})`);

                updateExcelDataTable(allData);
                updateChartsFromExcelData(allData);

                // حفظ البيانات محلياً
                saveToLocal();

                // رسالة نجاح مع تفاصيل
                alert(`تم استيراد ${files.length} ملف بنجاح!\n\nإحصائيات البيانات:\n- إجمالي الصفوف: ${allData.length}\n- منفذ: ${executedCount}\n- غير منفذ: ${notExecutedCount}`);

            } catch (error) {
                console.error('خطأ في معالجة الملفات:', error);
                alert(`خطأ في معالجة الملفات: ${error.message}`);
            } finally {
                // إعادة تعيين input
                excelInput.value = '';
            }
        });
    }

    // زر حفظ البيانات
    if (saveToServerBtn) {
        saveToServerBtn.addEventListener('click', () => {
            saveToLocal();
            alert('تم حفظ البيانات محلياً بنجاح!');
        });
    }

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
      if (exportBtn) {
        exportBtn.style.display = '';
        console.log('[SECRET-VISITOR] Super Admin - showing export button');
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
        console.warn('[SECRET-VISITOR] Failed to parse cached permissions:', e);
      }
    }

    // Check permission flags
    const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
    
    const hasPermission = perms.includes('reports_export') || flags.reports_export === true;
    
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
      if (hasPermission) {
        exportBtn.style.display = '';
        console.log('[SECRET-VISITOR] Permission granted - showing export button');
      } else {
        exportBtn.style.display = 'none';
        console.log('[SECRET-VISITOR] Permission denied - hiding export button');
      }
    }
  } catch (error) {
    console.error('[SECRET-VISITOR] Error checking export permission:', error);
  }
}
const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
sidebarLinks.forEach(link => {
    link.parentElement.classList.remove('active'); // Remove active from all
    if (link.getAttribute('href') === 'secret-visitor.html') { // Check for the specific page
        link.parentElement.classList.add('active'); // Add active to the correct one
    }
});

// ===== Department Management Functions =====

// متغيرات عامة
let departments = [];
let selectedDepartment = 'all';

// جلب الأقسام من قاعدة البيانات
async function loadDepartments() {
    try {
        const response = await fetch('http://localhost:3001/api/departments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب الأقسام');
        }

        const result = await response.json();
        if (result.success) {
            departments = result.data;
            await populateDepartmentDropdown();
            updateDepartmentLegends();
        } else {
            console.error('خطأ في جلب الأقسام:', result.message);
        }
    } catch (error) {
        console.error('خطأ في جلب الأقسام:', error);
        // استخدام الأقسام الافتراضية في حالة فشل الاتصال
        departments = [
            { id: 1, department_key: 'dental-center', department_name_ar: 'مركز الاسنان', department_name_en: 'Dental Center' },
            { id: 2, department_key: 'emergency', department_name_ar: 'الطوارئ', department_name_en: 'Emergency' },
            { id: 3, department_key: 'corridors', department_name_ar: 'الممرات', department_name_en: 'Corridors' },
            { id: 4, department_key: 'outpatient', department_name_ar: 'العيادات الخارجية', department_name_en: 'Outpatient Clinics' },
            { id: 5, department_key: 'inpatient', department_name_ar: 'التنويم', department_name_en: 'Inpatient' }
        ];
        updateDepartmentDropdown();
        updateDepartmentLegends();
    }
}

// دالة ملء القائمة المنسدلة للأقسام مع أزرار التعديل والحذف (مطابقة لـ report-937.js)
async function populateDepartmentDropdown() {
    const departmentOptions = document.getElementById('departmentOptions');
    if (!departmentOptions) return;

    // Clear existing options except "All" and "Add Section"
    const existingOptions = departmentOptions.querySelectorAll('.custom-select-option:not([data-value="all"]):not([data-value="add-section"])');
    existingOptions.forEach(option => option.remove());

    try {
        // Fetch departments from database
        const response = await fetch('http://localhost:3001/api/departments', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const departments = data.data || [];

            departments.forEach(dept => {
                const option = document.createElement('div');
                option.className = 'custom-select-option';
                option.setAttribute('data-value', dept.DepartmentID);
                option.setAttribute('data-ar', dept.DepartmentName);
                option.setAttribute('data-en', dept.DepartmentNameEn || dept.DepartmentName);
                
                option.innerHTML = `
                    <span class="department-name">${dept.DepartmentName}</span>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editDepartment(${dept.DepartmentID}, '${dept.DepartmentName}', '${dept.DepartmentNameEn || dept.DepartmentName}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteDepartment(${dept.DepartmentID})" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                departmentOptions.appendChild(option);
            });

            console.log('📋 Department dropdown populated with', departments.length, 'departments from database');
        } else {
            console.warn('⚠️ Failed to fetch departments from database, using static data');
            // Fallback to static data
            departments.forEach(dept => {
                const option = document.createElement('div');
                option.className = 'custom-select-option';
                option.setAttribute('data-value', dept.department_key);
                option.setAttribute('data-ar', dept.department_name_ar);
                option.setAttribute('data-en', dept.department_name_en);
                option.textContent = dept.department_name_ar;
                departmentOptions.appendChild(option);
            });
        }
    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        // Fallback to static data
        departments.forEach(dept => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.setAttribute('data-value', dept.department_key);
            option.setAttribute('data-ar', dept.department_name_ar);
            option.setAttribute('data-en', dept.department_name_en);
            option.textContent = dept.department_name_ar;
            departmentOptions.appendChild(option);
        });
    }

    // Ensure "Add Section" option exists
    ensureAddSectionOption();
}

// Function to ensure "Add Section" option exists in dropdown
function ensureAddSectionOption() {
    const departmentOptions = document.getElementById('departmentOptions');
    if (!departmentOptions) return;

    // Check if "Add Section" option already exists
    const existingAddOption = departmentOptions.querySelector('[data-value="add-section"]');
    if (existingAddOption) return;

    // Create divider
    const divider = document.createElement('div');
    divider.className = 'custom-select-divider';

    // Create "Add Section" option
    const addOption = document.createElement('div');
    addOption.className = 'custom-select-option add-section-option';
    addOption.setAttribute('data-value', 'add-section');
    addOption.setAttribute('data-ar', 'إضافة قسم جديد');
    addOption.setAttribute('data-en', 'Add New Section');
    addOption.innerHTML = `
        <i class="fas fa-plus ml-2"></i>
        <span data-ar="إضافة قسم جديد" data-en="Add New Section">إضافة قسم جديد</span>
    `;

    // Append to dropdown
    departmentOptions.appendChild(divider);
    departmentOptions.appendChild(addOption);

    console.log('✅ "Add Section" option added to dropdown');
}

// تحديث تسميات الأقسام في الرسوم البيانية
function updateDepartmentLegends() {
    departments.forEach(dept => {
        const legendElement = document.getElementById(`${dept.department_key}-legend`);
        if (legendElement) {
            legendElement.textContent = currentLang === 'ar' ? dept.department_name_ar : dept.department_name_en;
        }
    });
}

// اختيار قسم
function selectDepartment(departmentKey) {
    selectedDepartment = departmentKey;
    const selectedDepartmentSpan = document.getElementById('selectedDepartment');
    const departmentSelect = document.getElementById('departmentSelect');
    
    if (departmentKey === 'all') {
        selectedDepartmentSpan.textContent = currentLang === 'ar' ? 'الكل' : 'All';
    } else {
        const dept = departments.find(d => d.department_key === departmentKey);
        if (dept) {
            selectedDepartmentSpan.textContent = currentLang === 'ar' ? dept.department_name_ar : dept.department_name_en;
        }
    }
    
    // إغلاق القائمة
    departmentSelect.classList.remove('open');
    
    // تحديث البيانات والرسوم البيانية
    loadNotesData();
}

// جلب بيانات الملاحظات
async function loadNotesData() {
    try {
        const url = selectedDepartment === 'all' 
            ? '/api/secret-visitor/notes' 
            : `/api/secret-visitor/notes?department_key=${selectedDepartment}`;
            
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب الملاحظات');
        }

        const result = await response.json();
        if (result.success) {
            updateChartsWithData(result.data);
            updateTableWithData(result.data);
        } else {
            console.error('خطأ في جلب الملاحظات:', result.message);
        }
    } catch (error) {
        console.error('خطأ في جلب الملاحظات:', error);
        // استخدام البيانات المحلية في حالة فشل الاتصال
        updateChartsWithData(uploadedExcelData);
        updateTableWithData(uploadedExcelData);
    }
}

// تحديث الرسوم البيانية بالبيانات الجديدة
function updateChartsWithData(data) {
    // تحديث الرسم البياني الأفقي
    if (horizontalBarChart && data) {
        const departmentStats = {};
        
        data.forEach(note => {
            const dept = note.department_name_ar || note.department;
            if (!departmentStats[dept]) {
                departmentStats[dept] = { executed: 0, notExecuted: 0 };
            }
            
            if (note.execution_status === 'executed' || note.status === 'منفذ') {
                departmentStats[dept].executed++;
            } else {
                departmentStats[dept].notExecuted++;
            }
        });
        
        const labels = Object.keys(departmentStats);
        const executedData = labels.map(label => departmentStats[label].executed);
        const notExecutedData = labels.map(label => departmentStats[label].notExecuted);
        
        horizontalBarChart.data.labels = labels;
        horizontalBarChart.data.datasets[0].data = executedData;
        horizontalBarChart.data.datasets[1].data = notExecutedData;
        horizontalBarChart.update();
    }
    
    // تحديث الرسم البياني الدائري
    if (donutChart && data) {
        const departmentCounts = {};
        
        data.forEach(note => {
            const dept = note.department_name_ar || note.department;
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });
        
        const labels = Object.keys(departmentCounts);
        const counts = Object.values(departmentCounts);
        
        donutChart.data.labels = labels;
        donutChart.data.datasets[0].data = counts;
        donutChart.update();
    }
}

// تحديث الجدول بالبيانات الجديدة
function updateTableWithData(data) {
    const tableBody = document.getElementById('excelDataTableBody');
    const tableContainer = document.getElementById('excelDataTableContainer');
    
    if (!tableBody || !tableContainer) return;
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    ${currentLang === 'ar' ? 'لا توجد بيانات للعرض' : 'No data to display'}
                </td>
            </tr>
        `;
        tableContainer.classList.add('hidden');
        return;
    }
    
    tableBody.innerHTML = '';
    data.forEach(note => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${note.department_name_ar || note.department}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${note.note_text || note.note}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${note.responsible_department || note.responsible}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    (note.execution_status === 'executed' || note.status === 'منفذ') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${(note.execution_status === 'executed' || note.status === 'منفذ') 
                        ? (currentLang === 'ar' ? 'منفذ' : 'Executed')
                        : (currentLang === 'ar' ? 'غير منفذ' : 'Not Executed')
                    }
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="toggleNoteStatus(${note.id})" class="text-indigo-600 hover:text-indigo-900">
                    ${currentLang === 'ar' ? 'تغيير الحالة' : 'Toggle Status'}
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    tableContainer.classList.remove('hidden');
}

// تبديل حالة تنفيذ الملاحظة
async function toggleNoteStatus(noteId) {
    try {
        // أولاً نحتاج لجلب الملاحظة لمعرفة حالتها الحالية
        const response = await fetch(`/api/secret-visitor/notes`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('فشل في جلب الملاحظة');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        const note = result.data.find(n => n.id === noteId);
        if (!note) {
            throw new Error('الملاحظة غير موجودة');
        }

        const newStatus = note.execution_status === 'executed' ? 'not_executed' : 'executed';
        
        const updateResponse = await fetch(`/api/secret-visitor/notes/${noteId}/execution-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ execution_status: newStatus })
        });

        if (!updateResponse.ok) {
            throw new Error('فشل في تحديث حالة الملاحظة');
        }

        const updateResult = await updateResponse.json();
        if (updateResult.success) {
            // إعادة تحميل البيانات
            loadNotesData();
            alert(currentLang === 'ar' ? 'تم تحديث حالة الملاحظة بنجاح' : 'Note status updated successfully');
        } else {
            throw new Error(updateResult.message);
        }
    } catch (error) {
        console.error('خطأ في تحديث حالة الملاحظة:', error);
        alert(currentLang === 'ar' ? `خطأ في تحديث حالة الملاحظة: ${error.message}` : `Error updating note status: ${error.message}`);
    }
}

// ===== Modal Functions =====

// فتح modal إضافة قسم جديد
function openAddDepartmentModal() {
    const modal = document.getElementById('addDepartmentModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('addDepartmentForm').reset();
        document.getElementById('departmentKey').focus();
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
async function saveNewDepartment() {
    const departmentKey = document.getElementById('departmentKey').value.trim();
    const departmentNameAr = document.getElementById('departmentNameAr').value.trim();
    const departmentNameEn = document.getElementById('departmentNameEn').value.trim();
    
    // التحقق من صحة البيانات
    if (!departmentKey || !departmentNameAr || !departmentNameEn) {
        alert(currentLang === 'ar' ? 
            'جميع الحقول مطلوبة' : 
            'All fields are required');
        return;
    }
    
    // التحقق من صيغة المفتاح
    if (!/^[a-z0-9-_]+$/.test(departmentKey)) {
        alert(currentLang === 'ar' ? 
            'مفتاح القسم يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط' : 
            'Department key must contain only lowercase letters, numbers, and hyphens');
        return;
    }
    
    try {
        const response = await fetch('/api/secret-visitor/departments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                department_key: departmentKey,
                department_name_ar: departmentNameAr,
                department_name_en: departmentNameEn
            })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'فشل في إضافة القسم');
        }

        const result = await response.json();
        if (result.success) {
            // إعادة تحميل الأقسام
            await loadDepartments();
            
            // إغلاق Modal
            closeAddDepartmentModal();
            
            // رسالة نجاح
            alert(currentLang === 'ar' ? 
                `تم إضافة القسم "${departmentNameAr}" بنجاح` : 
                `Department "${departmentNameEn}" added successfully`);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('خطأ في إضافة القسم:', error);
        alert(currentLang === 'ar' ? 
            `خطأ في إضافة القسم: ${error.message}` : 
            `Error adding department: ${error.message}`);
    }
}

// فتح modal إدارة الأقسام
async function openManageDepartmentsModal() {
    const modal = document.getElementById('manageDepartmentsModal');
    if (modal) {
        modal.style.display = 'flex';
        await loadDepartmentsTable();
    }
}

// إغلاق modal إدارة الأقسام
function closeManageDepartmentsModal() {
    const modal = document.getElementById('manageDepartmentsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// تحميل جدول الأقسام
function loadDepartmentsTable() {
    const tableBody = document.getElementById('departmentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    departments.forEach(dept => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-3 border-b border-gray-200 text-sm text-gray-900">${dept.department_name_ar}</td>
            <td class="px-4 py-3 border-b border-gray-200 text-sm text-gray-900">${dept.department_name_en}</td>
            <td class="px-4 py-3 border-b border-gray-200 text-sm text-gray-500">${dept.department_key}</td>
            <td class="px-4 py-3 border-b border-gray-200 text-sm font-medium">
                <button onclick="deleteDepartment(${dept.id})" class="btn btn-danger btn-sm">
                    <i class="fas fa-trash ml-1"></i>
                    ${currentLang === 'ar' ? 'حذف' : 'Delete'}
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// حذف قسم
async function deleteDepartment(departmentId) {
    if (!confirm(currentLang === 'ar' ? 
        'هل أنت متأكد من حذف هذا القسم؟' : 
        'Are you sure you want to delete this department?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/secret-visitor/departments/${departmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'فشل في حذف القسم');
        }

        const result = await response.json();
        if (result.success) {
            // إعادة تحميل الأقسام
            await loadDepartments();
            await loadDepartmentsTable();
            
            // رسالة نجاح
            alert(currentLang === 'ar' ? 
                'تم حذف القسم بنجاح' : 
                'Department deleted successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('خطأ في حذف القسم:', error);
        alert(currentLang === 'ar' ? 
            `خطأ في حذف القسم: ${error.message}` : 
            `Error deleting department: ${error.message}`);
    }
}

// إضافة event listeners للأزرار الجديدة
document.addEventListener('DOMContentLoaded', () => {
    // تحميل الأقسام عند بدء التطبيق
    loadDepartments();
    
    // ربط زر التصدير مع API (إذا كان موجوداً)
    const exportBtn = document.querySelector('#exportReportBtn');
    exportBtn?.addEventListener('click', exportSecretVisitorExcelFromDB);
    
    // محاولة تحميل البيانات من قاعدة البيانات عند بدء التطبيق
    updateChartsFromDatabase();
    
    // إغلاق modals عند النقر خارجهما
    document.addEventListener('click', (e) => {
        const addModal = document.getElementById('addDepartmentModal');
        const manageModal = document.getElementById('manageDepartmentsModal');
        
        if (addModal && e.target === addModal) {
            closeAddDepartmentModal();
        }
        if (manageModal && e.target === manageModal) {
            closeManageDepartmentsModal();
        }
    });
    
    // إغلاق modals عند الضغط على Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const addModal = document.getElementById('addDepartmentModal');
            const manageModal = document.getElementById('manageDepartmentsModal');
            
            if (addModal && addModal.style.display === 'flex') {
                closeAddDepartmentModal();
            }
            if (manageModal && manageModal.style.display === 'flex') {
                closeManageDepartmentsModal();
            }
        }
    });
});

// ================= Offscreen Chart Snapshots =================
async function snapshotChartOffscreen(chart, {
  width = 2600,
  height = 1200,
  scale = 2.5,
  barThickness = 56
} = {}) {
  if (!chart) return null;

  const off = document.createElement('canvas');
  off.style.position = 'fixed';
  off.style.left = '-10000px';
  off.width  = Math.floor(width  * scale);
  off.height = Math.floor(height * scale);
  const ctx = off.getContext('2d');
  ctx.scale(scale, scale);
  document.body.appendChild(off);

  let temp = null;
  try {
    const cfg  = chart.config;
    const data = JSON.parse(JSON.stringify(cfg.data));
    const opt  = JSON.parse(JSON.stringify(cfg.options || {}));

    // ثبّت الإعدادات
    opt.responsive = false;
    opt.maintainAspectRatio = false;
    opt.animation = false;
    opt.locale = (window.currentLang === 'ar' ? 'ar' : 'en');

    // تكبير الأعمدة
    opt.datasets = opt.datasets || {};
    opt.datasets.bar = Object.assign({}, opt.datasets.bar, {
      barThickness,
      maxBarThickness: barThickness,
      categoryPercentage: 0.98,
      barPercentage: 0.9,
      borderSkipped: false
    });

    // محاور أكبر + إجبار إظهار أسماء الأقسام
    opt.scales = opt.scales || {};
    // محور القيم
    opt.scales.x = Object.assign({}, opt.scales.x, {
      ticks: Object.assign({}, opt.scales.x?.ticks, {
        font: { family: (window.getFont ? getFont() : 'Tajawal'), size: 18 },
        color: '#111'
      }),
      grid: Object.assign({}, opt.scales.x?.grid, { color: '#eee' })
    });
    // محور الأقسام (Y) — هنا المشكلة
    opt.scales.y = Object.assign({}, opt.scales.y, {
      position: 'left',
      ticks: Object.assign({}, opt.scales.y?.ticks, {
        autoSkip: false,          // لا تتخطَّ أي تصنيف
        mirror: false,
        align: 'start',
        crossAlign: 'near',
        padding: 6,
        font: { family: (window.getFont ? getFont() : 'Tajawal'), size: 18, weight: '600' },
        color: '#111'
      }),
      grid: Object.assign({}, opt.scales.y?.grid, { color: '#f1f1f1' })
    });

    // نوسّع الهامش الأيسر عشان النص ما ينقص
    opt.layout = Object.assign({}, opt.layout, {
      padding: Object.assign({}, opt.layout?.padding, { left: 160 })
    });

    // خفّض ازدحام اللِجند إن احتاج
    opt.plugins = Object.assign({}, opt.plugins, {
      legend: Object.assign({}, opt.plugins?.legend, { labels: { font: { size: 16 } } })
    });

    temp = new Chart(off.getContext('2d'), { type: cfg.type, data, options: opt });
    await new Promise(r => requestAnimationFrame(r));
    const url = off.toDataURL('image/png', 1.0);
    return { dataURL: url, w: width, h: height };
  } finally {
    if (temp) {
      temp.destroy();
    }
    if (off && off.parentNode) {
      off.parentNode.removeChild(off);
    }
  }
}

async function snapshotDonutOffscreen(chart, { size=800, scale=2.5 } = {}){
  if (!chart) return null;
  
  const cvs = document.createElement('canvas');
  cvs.style.position = 'fixed';
  cvs.style.left = '-10000px';
  cvs.style.top = '0';
  cvs.width = size*scale; 
  cvs.height = size*scale;
  const ctx = cvs.getContext('2d'); 
  ctx.scale(scale, scale);
  document.body.appendChild(cvs);

  let temp = null;
  try {
    const cfg = chart.config;
    const data = JSON.parse(JSON.stringify(cfg.data));
    const opts = JSON.parse(JSON.stringify(cfg.options));
    opts.responsive = false; 
    opts.maintainAspectRatio = false; 
    opts.animation = false;

    temp = new Chart(ctx, { type: cfg.type, data, options: opts });
    await new Promise(r => requestAnimationFrame(r));
    const url = cvs.toDataURL('image/png', 1.0);
    return { dataURL: url, w: size, h: size };
  } finally {
    if (temp) {
      temp.destroy();
    }
    if (cvs && cvs.parentNode) {
      cvs.parentNode.removeChild(cvs);
    }
  }
}

// ================= Export Secret Visitor PDF =================
async function exportSecretVisitorPDF(){
  try {
    console.log('🚀 بدء تصدير PDF للزائر السري...');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 28;

    // ===== عنوان التقرير كصورة (للدعم العربي) =====
    const titleHTML = `
      <div style="
        font-family: Tajawal;
        font-weight: 900;
        font-size: 28px;
        line-height: 1.6;
        text-align: center;
        color: #000;
        padding-bottom: 20px;
      ">
        ${currentLang === 'ar' ? 'تقرير ملاحظات الزائر السري' : 'Secret Visitor Notes Report'}
      </div>`;
    
    // إنشاء عنصر العنوان
    const titleElement = document.createElement('div');
    titleElement.innerHTML = titleHTML;
    titleElement.style.width = (W - M*2) + 'px';
    titleElement.style.position = 'fixed';
    titleElement.style.left = '-9999px';
    titleElement.style.top = '0';
    document.body.appendChild(titleElement);
    
    let titleImgH = 0; // تعريف متغير الارتفاع
    try {
      const titleBlock = await html2canvas(titleElement, { scale: 2 });
      const titleDataURL = titleBlock.toDataURL('image/png');
      titleImgH = (titleBlock.height * (W - M*2)) / titleBlock.width;
      doc.addImage(titleDataURL, 'PNG', M, 50, W - M*2, titleImgH);
    } finally {
      // إزالة العنصر بأمان
      if (titleElement && titleElement.parentNode) {
        document.body.removeChild(titleElement);
      }
    }

    let y = 50 + titleImgH + 20; // مسافة مناسبة تحت العنوان

    // ===== إجمالي الكروت =====
    const summary = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3'); 
    if (summary) {
      console.log('📊 تصدير كروت الإحصائيات...');
      const canvas = await html2canvas(summary, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = W - M*2;
      const imgH = (canvas.height * imgW) / canvas.width;
      doc.addImage(imgData, 'PNG', M, y, imgW, imgH);
      y += imgH + 30;
    }

    // ===== الرسم البياني الأفقي (أوف-سكرين) =====
    if (window.horizontalBarChart) {
      console.log('📈 تصدير الرسم البياني الأفقي (أوف-سكرين)...');
      const shot = await snapshotChartOffscreen(horizontalBarChart, { 
        width: 2600, 
        height: 1200, 
        scale: 2.5,
        barThickness: 56 
      });
      if (shot) {
        const imgW = W - M*2;
        const imgH = imgW * (shot.h/shot.w);
        doc.addImage(shot.dataURL, 'PNG', M, y, imgW, imgH);
        y += imgH + 40; // مسافة أكبر تحت الرسم
      }
    }

    // ===== الرسم البياني الدائري (أوف-سكرين) =====
    if (window.donutChart) {
      console.log('🥧 تصدير الرسم البياني الدائري (أوف-سكرين)...');
      const shot = await snapshotDonutOffscreen(donutChart, { 
        size: 800, 
        scale: 2.5 
      });
      if (shot) {
        const donutW = 300; // عرض ثابت أصغر
        const donutH = donutW;
        doc.addImage(shot.dataURL, 'PNG', (W-donutW)/2, y, donutW, donutH);
        y += donutH + 40; // مسافة أكبر تحت الرسم
      }
    }

    // ===== الجدول (إظهاره مؤقتاً للتصدير) =====
    const tableContainer = document.getElementById('excelDataTableContainer');
    const table = document.getElementById('excelDataTable');
    
    if (table && tableContainer) {
      console.log('📋 تصدير الجدول...');
      
      // إظهار الجدول مؤقتاً للتصدير
      const wasHidden = tableContainer.classList.contains('hidden');
      if (wasHidden) {
        tableContainer.classList.remove('hidden');
        tableContainer.style.position = 'absolute';
        tableContainer.style.left = '-9999px';
        tableContainer.style.top = '0';
        tableContainer.style.visibility = 'visible';
        tableContainer.style.opacity = '1';
      }
      
      try {
        // انتظار قصير لضمان عرض الجدول
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(table, { 
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true
        });
        const imgData = canvas.toDataURL('image/png');
        const imgW = W - M*2;
        const imgH = (canvas.height * imgW) / canvas.width;
        
        if (y + imgH > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          y = 60;
        }
        doc.addImage(imgData, 'PNG', M, y, imgW, imgH);
      } finally {
        // إخفاء الجدول مرة أخرى إذا كان مخفياً
        if (wasHidden) {
          tableContainer.classList.add('hidden');
          tableContainer.style.position = '';
          tableContainer.style.left = '';
          tableContainer.style.top = '';
          tableContainer.style.visibility = '';
          tableContainer.style.opacity = '';
        }
      }
    } else {
      console.log('⚠️ الجدول غير موجود أو مخفي');
    }

    // ✅ افتح في تبويب جديد بدل التنزيل
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    console.log('✅ تم فتح PDF في تبويب جديد!');
    
  } catch (error) {
    console.error('❌ خطأ في تصدير PDF:', error);
    throw error;
  }
}

// ================= Bind Button =================
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('exportSecretVisitorPdfBtn');
  if (btn) {
    console.log('✅ تم العثور على زر PDF للزائر السري');
    btn.addEventListener('click', async ()=>{
      console.log('🖱️ تم النقر على زر PDF للزائر السري');
      btn.disabled = true;
      const old = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>';
      
      try {
        // التحقق من وجود المكتبات المطلوبة
        if (typeof html2canvas === 'undefined') {
          throw new Error('مكتبة html2canvas غير محملة');
        }
        if (typeof window.jspdf === 'undefined') {
          throw new Error('مكتبة jsPDF غير محملة');
        }
        
        await exportSecretVisitorPDF();
        console.log('✅ تم تصدير PDF بنجاح');
      } catch(e) {
        console.error('❌ PDF export failed:', e);
        alert(`فشل تصدير PDF: ${e.message}`);
      } finally {
        btn.innerHTML = old;
        btn.disabled = false;
      }
    });
  } else {
    console.error('❌ لم يتم العثور على زر PDF للزائر السري');
  }
});

// ===== Export Helper Functions =====

// دالة لضمان تحميل مكتبة jsPDF
async function ensureJsPDF() {
    if (window.jspdf) return true;
    
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

// دالة لتحويل الرسم البياني إلى صورة
function chartToImage(canvas) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.src);
        img.src = canvas.toDataURL('image/png');
    });
}

// دالة تصدير إلى Excel
async function exportToExcel() {
    try {
        // انتظري تحميل مكتبة XLSX
        if (typeof XLSX === 'undefined') {
            toast(currentLang === 'ar' ? 'مكتبة Excel غير محمّلة' : 'Excel library not loaded', true);
            return;
        }

        // إنشاء مصنف جديد
        const wb = XLSX.utils.book_new();
        
        // اسم الملف
        const d = new Date(); 
        const pad = n => String(n).padStart(2, '0');
        const fileName = `secret-visitor-report_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.xlsx`;
        
        // جلب البيانات من قاعدة البيانات أو استخدام البيانات المحلية
        let notesData = [];
        try {
            const response = await fetch('/api/secret-visitor/notes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    notesData = result.data;
                }
            }
        } catch (error) {
            console.log('Using local data for Excel export');
            notesData = uploadedExcelData || [];
        }
        
        // ورقة الملاحظات
        const notesSheetData = [];
        notesSheetData.push([
            currentLang === 'ar' ? 'القسم' : 'Department',
            currentLang === 'ar' ? 'الملاحظة' : 'Note',
            currentLang === 'ar' ? 'الإدارة المسؤولة' : 'Responsible Department',
            currentLang === 'ar' ? 'حالة التنفيذ' : 'Execution Status',
            currentLang === 'ar' ? 'الموقع' : 'Location',
            currentLang === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'
        ]);
        
        notesData.forEach(note => {
            notesSheetData.push([
                note.department_name_ar || note.department || '',
                note.note_text || note.note || '',
                note.responsible_department || note.responsible || '',
                (note.execution_status === 'executed' || note.status === 'منفذ') 
                    ? (currentLang === 'ar' ? 'منفذ' : 'Executed')
                    : (currentLang === 'ar' ? 'غير منفذ' : 'Not Executed'),
                note.location || '',
                note.created_at ? new Date(note.created_at).toLocaleDateString() : ''
            ]);
        });
        
        const notesWS = XLSX.utils.aoa_to_sheet(notesSheetData);
        XLSX.utils.book_append_sheet(wb, notesWS, currentLang === 'ar' ? 'ملاحظات الزائر السري' : 'Secret Visitor Notes');
        
        // ورقة الإحصائيات
        const statsData = [];
        statsData.push([currentLang === 'ar' ? 'الإحصائيات' : 'Statistics']);
        statsData.push(['', '']);
        
        // إحصائيات عامة
        const totalNotes = notesData.length;
        const executedNotes = notesData.filter(note => 
            note.execution_status === 'executed' || note.status === 'منفذ'
        ).length;
        const notExecutedNotes = totalNotes - executedNotes;
        
        statsData.push([
            currentLang === 'ar' ? 'إجمالي الملاحظات' : 'Total Notes',
            totalNotes
        ]);
        statsData.push([
            currentLang === 'ar' ? 'الملاحظات المنفذة' : 'Executed Notes',
            executedNotes
        ]);
        statsData.push([
            currentLang === 'ar' ? 'الملاحظات غير المنفذة' : 'Not Executed Notes',
            notExecutedNotes
        ]);
        statsData.push([
            currentLang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate',
            totalNotes > 0 ? `${((executedNotes / totalNotes) * 100).toFixed(1)}%` : '0%'
        ]);
        
        statsData.push(['', '']);
        
        // إحصائيات حسب القسم
        statsData.push([currentLang === 'ar' ? 'الإحصائيات حسب القسم' : 'Statistics by Department']);
        statsData.push(['', '']);
        
        const departmentStats = {};
        notesData.forEach(note => {
            const dept = note.department_name_ar || note.department;
            if (!departmentStats[dept]) {
                departmentStats[dept] = { total: 0, executed: 0, notExecuted: 0 };
            }
            departmentStats[dept].total++;
            if (note.execution_status === 'executed' || note.status === 'منفذ') {
                departmentStats[dept].executed++;
            } else {
                departmentStats[dept].notExecuted++;
            }
        });
        
        statsData.push([
            currentLang === 'ar' ? 'القسم' : 'Department',
            currentLang === 'ar' ? 'إجمالي' : 'Total',
            currentLang === 'ar' ? 'منفذ' : 'Executed',
            currentLang === 'ar' ? 'غير منفذ' : 'Not Executed',
            currentLang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate'
        ]);
        
        Object.entries(departmentStats).forEach(([dept, stats]) => {
            const executionRate = stats.total > 0 ? `${((stats.executed / stats.total) * 100).toFixed(1)}%` : '0%';
            statsData.push([dept, stats.total, stats.executed, stats.notExecuted, executionRate]);
        });
        
        statsData.push(['', '']);
        statsData.push([
            currentLang === 'ar' ? 'تاريخ التقرير' : 'Report Date',
            `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
        ]);
        
        const statsWS = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, statsWS, currentLang === 'ar' ? 'الإحصائيات' : 'Statistics');
        
        // تصدير الملف
        XLSX.writeFile(wb, fileName);
        
        toast(currentLang === 'ar' ? 'تم تنزيل ملف Excel بنجاح' : 'Excel file downloaded successfully');
        
    } catch (e) {
        console.error('Error creating Excel:', e);
        toast(currentLang === 'ar' ? 'فشل إنشاء ملف Excel' : 'Failed to create Excel file', true);
    }
}

// دالة لعرض الرسائل
function toast(message, isError = false) {
    // إنشاء عنصر toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
        isError ? 'bg-red-500' : 'bg-green-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // إزالة toast بعد 3 ثوان
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ===== دوال التكامل مع API =====

// دالة تحميل البيانات من قاعدة البيانات
async function loadDataFromDatabase() {
    try {
        const token = localStorage.getItem('token') || '';
        
        // قراءة الفلاتر من عناصر الصفحة الموجودة
        const fromDate = getDateFromFilter() || getDefaultFromDate();
        const toDate = getDateToFilter() || getDefaultToDate();
        const department = getDepartmentFilter() || 'all';
        
        const response = await fetch(`${API_BASE_URL}/secret-visitor/data?from=${fromDate}&to=${toDate}&department=${department}`, {
            headers: { 
                'Authorization': token ? `Bearer ${token}` : '' 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error('لا توجد بيانات في قاعدة البيانات');
        }

        return result.data;
    } catch (error) {
        console.error('❌ Error loading data from database:', error);
        return null;
    }
}

// دالة تحديث الرسوم البيانية من بيانات قاعدة البيانات
async function updateChartsFromDatabase() {
    try {
        const data = await loadDataFromDatabase();
        if (!data) {
            console.log('📊 No database data available, using local data');
            return false;
        }

        console.log('📊 Updating charts from database data:', data);

        // تحديث البيانات المحلية
        uploadedExcelData = data.visits.map(visit => ({
            department: visit.departmentAr,
            department_en: visit.departmentEn,
            location: visit.location,
            status: mapStatusToArabic(visit.status),
            note: visit.note,
            execution_status: visit.status === 'executed' ? 'executed' : 'not_executed'
        }));

        // تحديث الرسوم البيانية
        updateHorizontalBarChart();
        updateDonutChart();
        updateCardData();

        console.log('✅ Charts updated from database');
        return true;
    } catch (error) {
        console.error('❌ Error updating charts from database:', error);
        return false;
    }
}

// دالة تصدير Excel من قاعدة البيانات
async function exportSecretVisitorExcelFromDB() {
    try {
        const token = localStorage.getItem('token') || '';
        
        // قراءة الفلاتر من عناصر الصفحة الموجودة
        const fromDate = getDateFromFilter() || getDefaultFromDate();
        const toDate = getDateToFilter() || getDefaultToDate();
        const department = getDepartmentFilter() || 'all';
        
        console.log(`📊 Exporting Excel from ${fromDate} to ${toDate}`);
        
        const response = await fetch(`${API_BASE_URL}/secret-visitor/data?from=${fromDate}&to=${toDate}&department=${department}`, {
            headers: { 
                'Authorization': token ? `Bearer ${token}` : '' 
            }
        });

        console.log(`📊 API Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('📊 API Response data:', result);

        if (!result.success) {
            throw new Error(result.message || 'لا توجد بيانات للتصدير');
        }

        const data = result.data;
        
        // التحقق من وجود البيانات
        if (!data || (!data.summary && !data.byDepartment && !data.byLocation && !data.visits)) {
            console.log('📊 No data available, using fallback');
            return exportToExcelFromLocal();
        }

        const wb = XLSX.utils.book_new();

        // Sheet Summary: إجمالي الزيارات + الفترة
        const summaryData = [
            ['Metric (EN)', 'البند (AR)', 'Value'],
            ['Total Visits', 'إجمالي الزيارات', data.summary?.totalVisits || 0],
            ['Period', 'الفترة', `${data.summary?.from || ''} → ${data.summary?.to || ''}`]
        ];
        const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

        // Sheet By Department: أعمدة [Department (EN), القسم (AR), Executed, Not Executed]
        const deptData = [
            ['Department (EN)', 'القسم (AR)', 'Executed', 'Not Executed', 'Total']
        ];
        if (data.byDepartment && Array.isArray(data.byDepartment)) {
            data.byDepartment.forEach(dept => {
                deptData.push([
                    dept.en || '',
                    dept.ar || '',
                    dept.executed || 0,
                    dept.notExecuted || 0,
                    (dept.executed || 0) + (dept.notExecuted || 0)
                ]);
            });
        }
        const deptWS = XLSX.utils.aoa_to_sheet(deptData);
        XLSX.utils.book_append_sheet(wb, deptWS, 'By Department');

        // Sheet By Location: [Location, Count]
        const locationData = [
            ['Location', 'Count']
        ];
        if (data.byLocation && Array.isArray(data.byLocation)) {
            data.byLocation.forEach(loc => {
                locationData.push([loc.location || '', loc.count || 0]);
            });
        }
        const locationWS = XLSX.utils.aoa_to_sheet(locationData);
        XLSX.utils.book_append_sheet(wb, locationWS, 'By Location');

        // Sheet Visits: [Visit ID, Date, Department (EN), القسم (AR), Responsible Dept, Location, Status, Note]
        const visitsData = [
            ['Visit ID', 'Date', 'Department (EN)', 'القسم (AR)', 'Responsible Dept', 'Location', 'Status', 'Note']
        ];
        if (data.visits && Array.isArray(data.visits)) {
            data.visits.forEach(visit => {
                visitsData.push([
                    visit.visitId || '',
                    visit.date || '',
                    visit.departmentEn || '',
                    visit.departmentAr || '',
                    visit.responsibleDept || '',
                    visit.location || '',
                    mapStatusToArabic(visit.status) || '',
                    visit.note || ''
                ]);
            });
        }
        const visitsWS = XLSX.utils.aoa_to_sheet(visitsData);
        XLSX.utils.book_append_sheet(wb, visitsWS, 'Visits');

        // تصدير الملف
        const fileName = `SecretVisitor_${fromDate}_to_${toDate}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('✅ Excel exported successfully from database');
        alert('تم تصدير ملف Excel بنجاح من قاعدة البيانات!');
        
    } catch (error) {
        console.error('❌ Error exporting Excel from database:', error);
        
        // محاولة التصدير من البيانات المحلية كـ fallback
        try {
            console.log('📊 Attempting fallback to local data export...');
            await exportToExcelFromLocal();
        } catch (fallbackError) {
            console.error('❌ Fallback export also failed:', fallbackError);
            alert('تعذّر تصدير Excel من قاعدة البيانات والبيانات المحلية: ' + error.message);
        }
    }
}

// دوال مساعدة لقراءة الفلاتر
function getDateFromFilter() {
    // البحث عن عناصر التاريخ في الصفحة
    const dateFromInput = document.querySelector('input[type="date"][name*="from"], input[id*="from"], input[placeholder*="من"]');
    return dateFromInput ? dateFromInput.value : null;
}

function getDateToFilter() {
    // البحث عن عناصر التاريخ في الصفحة
    const dateToInput = document.querySelector('input[type="date"][name*="to"], input[id*="to"], input[placeholder*="إلى"]');
    return dateToInput ? dateToInput.value : null;
}

function getDepartmentFilter() {
    // البحث عن عناصر القسم في الصفحة
    const departmentSelect = document.querySelector('select[name*="department"], select[id*="department"]');
    return departmentSelect ? departmentSelect.value : null;
}

function getDefaultFromDate() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    return thirtyDaysAgo.toISOString().split('T')[0];
}

function getDefaultToDate() {
    return new Date().toISOString().split('T')[0];
}

// دالة تحويل الحالات إلى العربية
function mapStatusToArabic(status) {
    const statusMap = {
        'executed': 'منفذ',
        'not_executed': 'غير منفذ',
        'منفذ': 'منفذ',
        'غير منفذ': 'غير منفذ'
    };
    return statusMap[status] || status;
}

// دالة تصدير Excel من البيانات المحلية (fallback)
async function exportToExcelFromLocal() {
    try {
        console.log('📊 Exporting Excel from local data...');
        
        if (!uploadedExcelData || uploadedExcelData.length === 0) {
            throw new Error('لا توجد بيانات محلية للتصدير');
        }

        const wb = XLSX.utils.book_new();
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');

        // ورقة البيانات الخام
        const rawData = [
            ['Department (AR)', 'Department (EN)', 'Location', 'Status', 'Note']
        ];
        
        uploadedExcelData.forEach(row => {
            rawData.push([
                row.department || '',
                row.department_en || '',
                row.location || '',
                row.status || '',
                row.note || ''
            ]);
        });

        const rawWS = XLSX.utils.aoa_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, rawWS, 'Raw Data');

        // تصدير الملف
        const fileName = `SecretVisitor_Local_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.xlsx`;
        XLSX.writeFile(wb, fileName);

        console.log('✅ Excel exported successfully from local data');
        alert('تم تصدير ملف Excel من البيانات المحلية!');
        
    } catch (error) {
        console.error('❌ Error exporting Excel from local data:', error);
        throw error;
    }
}

// ===== دوال إدارة الأقسام (مطابقة لـ report-937.js) =====

// دالة حذف قسم
async function deleteDepartment(departmentId) {
    if (!confirm(currentLang === 'ar' ? 
        'هل أنت متأكد من حذف هذا القسم؟' : 
        'Are you sure you want to delete this department?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/departments/${departmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            // إعادة تحميل الأقسام من قاعدة البيانات
            await loadDepartments();
            await populateDepartmentDropdown();
            
            console.log('✅ Department deleted successfully');
            alert(currentLang === 'ar' ? 'تم حذف القسم بنجاح' : 'Department deleted successfully');
        } else {
            throw new Error('Failed to delete department');
        }
    } catch (error) {
        console.error('❌ Error deleting department:', error);
        alert(currentLang === 'ar' ? 
            `خطأ في حذف القسم: ${error.message}` : 
            `Error deleting department: ${error.message}`
        );
    }
}

// دالة تعديل قسم
async function editDepartment(departmentId, currentNameAr, currentNameEn) {
    // فتح modal التعديل مع البيانات الحالية
    const modal = document.getElementById('editSectionModal');
    if (modal) {
        // ملء البيانات الحالية
        document.getElementById('editSectionId').value = departmentId;
        document.getElementById('editSectionNameAr').value = currentNameAr;
        document.getElementById('editSectionNameEn').value = currentNameEn;
        
        modal.style.display = 'flex';
    }
}

// دالة تحديث قسم
async function updateSection() {
    const sectionId = document.getElementById('editSectionId').value;
    const nameAr = document.getElementById('editSectionNameAr').value.trim();
    const nameEn = document.getElementById('editSectionNameEn').value.trim();

    if (!nameAr || !nameEn) {
        alert(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/departments/${sectionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                DepartmentName: nameAr,
                DepartmentNameEn: nameEn
            })
        });

        if (response.ok) {
            // إعادة تحميل الأقسام من قاعدة البيانات
            await loadDepartments();
            await populateDepartmentDropdown();
            
            // إغلاق modal
            closeEditSectionModal();
            
            console.log('✅ Department updated successfully');
            alert(currentLang === 'ar' ? 'تم تحديث القسم بنجاح' : 'Department updated successfully');
        } else {
            throw new Error('Failed to update department');
        }
    } catch (error) {
        console.error('❌ Error updating department:', error);
        alert(currentLang === 'ar' ? 
            `خطأ في تحديث القسم: ${error.message}` : 
            `Error updating department: ${error.message}`
        );
    }
}

// دالة إغلاق modal التعديل
function closeEditSectionModal() {
    const modal = document.getElementById('editSectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// دالة إضافة قسم جديد
async function addSection() {
    const nameAr = document.getElementById('sectionNameAr').value.trim();
    const nameEn = document.getElementById('sectionNameEn').value.trim();
    const description = document.getElementById('sectionDescription').value.trim();

    if (!nameAr || !nameEn) {
        alert(currentLang === 'ar' ? 'يرجى ملء اسم القسم بالعربية والإنجليزية' : 'Please fill department name in Arabic and English');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/departments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                DepartmentName: nameAr,
                DepartmentNameEn: nameEn,
                Description: description
            })
        });

        if (response.ok) {
            // إعادة تحميل الأقسام من قاعدة البيانات
            await loadDepartments();
            await populateDepartmentDropdown();
            
            // إغلاق modal
            closeAddSectionModal();
            
            console.log('✅ Department added successfully');
            alert(currentLang === 'ar' ? 'تم إضافة القسم بنجاح' : 'Department added successfully');
        } else {
            throw new Error('Failed to add department');
        }
    } catch (error) {
        console.error('❌ Error adding department:', error);
        alert(currentLang === 'ar' ? 
            `خطأ في إضافة القسم: ${error.message}` : 
            `Error adding department: ${error.message}`
        );
    }
}

// دالة إغلاق modal إضافة قسم
function closeAddSectionModal() {
    const modal = document.getElementById('addSectionModal');
    if (modal) {
        modal.style.display = 'none';
        // مسح النموذج
        document.getElementById('addSectionForm').reset();
    }
}