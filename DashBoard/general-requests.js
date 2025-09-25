
let currentLang = localStorage.getItem('lang') || 'ar';
let generalRequestsChart;
let activeFilter = null;

// البيانات الحقيقية من الباك إند
let chartData = {
    fulfilled: [],
    unfulfilled: []
};

// سيتم ملؤها ديناميكياً من قاعدة البيانات
let labelsByLang = {
    ar: [],
    en: []
};

const filterLabels = {
    fulfilled: { ar: 'منفذ', en: 'Fulfilled', color: 'green' },
    unfulfilled: { ar: 'غير منفذ', en: 'Unfulfilled', color: 'red' }
};

function getFont() {
    return currentLang === 'ar' ? 'Tajawal' : 'Merriweather';
}

// جلب أنواع الطلبات المتاحة من قاعدة البيانات
async function loadAvailableRequestTypes() {
    try {
        console.log('🔄 جلب أنواع الطلبات المتاحة من قاعدة البيانات...');
        
        const response = await fetch('http://localhost:3001/api/general-requests/request-types');
        const result = await response.json();

        if (result.success) {
            console.log('✅ تم جلب أنواع الطلبات بنجاح:', result.data);
            
            if (result.data.length === 0) {
                // لا توجد طلبات في قاعدة البيانات
                console.log('📝 لا توجد طلبات في قاعدة البيانات');
                showNotification('لا توجد طلبات في قاعدة البيانات. يرجى إضافة طلبات جديدة.', 'info');
                
                // عرض رسالة في الصفحة
                const chartContainer = document.querySelector('.relative.w-full');
                if (chartContainer) {
                    chartContainer.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <div class="text-gray-500 text-6xl mb-4">📋</div>
                                <h3 class="text-xl font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
                                <p class="text-gray-500 mb-4">لم يتم العثور على أي طلبات في قاعدة البيانات</p>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p class="text-blue-800 text-sm">
                                        💡 <strong>نصيحة:</strong> قم بإضافة طلبات جديدة من خلال زر "إضافة طلب جديد"
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                }
                return;
            }
            
            // تحديث labelsByLang بالبيانات من قاعدة البيانات
            console.log('🔍 البيانات المستلمة من الباك إند:', result.data);
            labelsByLang.ar = result.data.map(type => type.name);
            labelsByLang.en = result.data.map(type => getEnglishRequestTypeName(type.name));
            
            console.log('📊 أنواع الطلبات العربية:', labelsByLang.ar);
            console.log('📊 أنواع الطلبات الإنجليزية:', labelsByLang.en);
            
            // إعادة تعيين chartData
            chartData.fulfilled = new Array(result.data.length).fill(0);
            chartData.unfulfilled = new Array(result.data.length).fill(0);
            
            console.log('📊 تم تحديث أنواع الطلبات:', labelsByLang);
            
            // جلب البيانات الإحصائية بعد تحديث أنواع الطلبات
            await loadGeneralRequestData();
        } else {
            console.error('❌ خطأ في جلب أنواع الطلبات:', result.message);
            showNotification('خطأ في جلب أنواع الطلبات: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('💥 خطأ في الاتصال بالخادم:', error);
        showNotification('خطأ في الاتصال بالخادم: ' + error.message, 'error');
        
        // عرض رسالة خطأ في الصفحة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center text-red-600">
                        <div class="text-4xl mb-4">⚠️</div>
                        <h3 class="text-xl font-semibold mb-2">خطأ في الاتصال</h3>
                        <p>تأكد من تشغيل الباك إند</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
}

// دالة لترجمة أنواع الطلبات إلى الإنجليزية
function getEnglishRequestTypeName(arabicName) {
    const translations = {
        'قسم الطوارئ': 'Emergency Department',
        'قسم العيادات الخارجية': 'Outpatient Clinics',
        'قسم الصيدلية': 'Pharmacy Department',
        'قسم المختبرات الطبية': 'Medical Laboratories',
        'قسم الأشعة': 'Radiology Department',
        'قسم التغذية': 'Nutrition Department',
        'قسم التمريض': 'Nursing Department',
        'قسم الإدارة': 'Administration Department',
        'قسم الصيانة': 'Maintenance Department',
        'قسم الأمن': 'Security Department',
        'قسم النظافة': 'Housekeeping Department',
        'قسم الموارد البشرية': 'Human Resources Department',
        'قسم الشؤون المالية': 'Finance Department',
        'قسم تكنولوجيا المعلومات': 'IT Department',
        'قسم الجودة': 'Quality Department',
        'قسم التدريب': 'Training Department',
        'قسم العلاقات العامة': 'Public Relations Department',
        'قسم الشؤون القانونية': 'Legal Affairs Department',
        'قسم المشتريات': 'Procurement Department',
        'قسم المخازن': 'Warehouse Department'
    };
    
    return translations[arabicName] || arabicName;
}

// جلب البيانات من الباك إند
async function loadGeneralRequestData() {
    try {
        console.log('🔄 بدء جلب بيانات الطلبات العامة من الباك إند...');
        
        // إظهار مؤشر التحميل في الصفحة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p class="mt-4 text-gray-600">جاري تحميل البيانات...</p></div></div>';
        }
        
        // جلب جميع البيانات بدون فلترة تاريخ افتراضية
        console.log('🌐 إرسال طلب إلى:', 'http://localhost:3001/api/general-requests/stats');

        const response = await fetch('http://localhost:3001/api/general-requests/stats');
        const result = await response.json();

        console.log('📊 استجابة الباك إند:', result);

        if (result.success) {
            console.log('✅ تم جلب البيانات بنجاح!');
            console.log('📈 البيانات المستلمة:', result.data);
            
            // إظهار رسالة نجاح في الصفحة
            if (chartContainer) {
                chartContainer.innerHTML = '<canvas id="generalRequestsChart"></canvas>';
                console.log('🔄 إعادة إنشاء الرسم البياني...');
                // إعادة إنشاء الرسم البياني
                const ctx = document.getElementById('generalRequestsChart');
                if (ctx) {
                    generalRequestsChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labelsByLang[currentLang],
                            datasets: []
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            aspectRatio: 2.5,
                            layout: {
                                padding: {
                                    top: 15,
                                    right: 15,
                                    bottom: 15,
                                    left: 15
                                }
                            },
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
                                y: {
                                    beginAtZero: true,
                                    max: Math.max(...chartData.fulfilled, ...chartData.unfulfilled, 5),
                                    ticks: {
                                        stepSize: 1,
                                        font: { family: getFont() }
                                    },
                                    grid: {
                                        drawBorder: false,
                                        color: 'rgba(0, 0, 0, 0.08)'
                                    },
                                    position: currentLang === 'ar' ? 'right' : 'left'
                                },
                                x: {
                                    ticks: {
                                        font: { family: getFont() }
                                    },
                                    grid: { display: false },
                                    barPercentage: 0.8,
                                    categoryPercentage: 0.8
                                }
                            }
                        }
                    });
                }
            }
            
            updateChartDataFromBackend(result.data);
            
            // إظهار إشعار نجاح
            showNotification('تم جلب بيانات الطلبات العامة بنجاح!', 'success');
            
        } else {
            console.error('❌ خطأ في جلب البيانات:', result.message);
            showNotification('خطأ في جلب البيانات: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('💥 خطأ في الاتصال بالخادم:', error);
        showNotification('خطأ في الاتصال بالخادم: ' + error.message, 'error');
        
        // إظهار رسالة خطأ في الصفحة
        const chartContainer = document.querySelector('.relative.w-full');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center text-red-600"><div class="text-4xl mb-4">⚠️</div><p>خطأ في الاتصال بالخادم</p><p class="text-sm mt-2">تأكد من تشغيل الباك إند</p></div></div>';
        }
    }
}

// تحديث بيانات الرسم البياني من الباك إند
function updateChartDataFromBackend(data) {
    console.log('🔄 تحديث بيانات الرسم البياني من الباك إند...');
    
    // إعادة تعيين البيانات
    chartData.fulfilled = new Array(labelsByLang.ar.length).fill(0);
    chartData.unfulfilled = new Array(labelsByLang.ar.length).fill(0);

    console.log('📊 البيانات المستلمة من الباك إند:', data);

    // إضافة تصحيح إضافي للتأكد من البيانات
    if (data.byType && data.byType.length > 0) {
        console.log('🔍 تفاصيل أنواع الشكاوى المستلمة من الباك إند:');
        data.byType.forEach((type, index) => {
            console.log(`${index + 1}. ${type.RequestType}: ${type.requestCount} بلاغ  (منفذ: ${type.fulfilledCount}, غير منفذ: ${type.unfulfilledCount})`);
        });
    } else {
        console.log('⚠️ لا توجد أنواع شكاوى في البيانات المستلمة من الباك إند!');
    }

    // ملء البيانات من الباك إند حسب نوع البلاغ 
    if (data.byType && data.byType.length > 0) {
        console.log('📈 معالجة البيانات حسب نوع البلاغ :', data.byType);
        
        // تحديث labelsByLang بالبيانات الفعلية من الباك إند
        console.log('🔍 تحديث أنواع الشكاوى من بيانات الباك إند:', data.byType);
        labelsByLang.ar = data.byType.map(type => type.RequestType);
        labelsByLang.en = data.byType.map(type => getEnglishRequestTypeName(type.RequestType));
        
        console.log('📊 أنواع الشكاوى المحدثة من الباك إند:', labelsByLang.ar);
        
        console.log('🔄 تم تحديث أنواع الشكاوى:', labelsByLang.ar);
        
        // إعادة تعيين chartData بالحجم الصحيح
        chartData.fulfilled = new Array(data.byType.length).fill(0);
        chartData.unfulfilled = new Array(data.byType.length).fill(0);
        
        data.byType.forEach((type, index) => {
            chartData.fulfilled[index] = type.fulfilledCount || 0;
            chartData.unfulfilled[index] = type.unfulfilledCount || 0;
            console.log(`📊 ${type.RequestType}: منفذ=${type.fulfilledCount}, غير منفذ=${type.unfulfilledCount}`);
            
            // التحقق من أن نوع البلاغ  لا يظهر إذا كان عدد الشكاوى صفر
            if (type.requestCount === 0) {
                console.log(`⚠️ تحذير: نوع بلاغ  ${type.RequestType} لديه 0 شكاوى ولكن يظهر في البيانات!`);
            }
            
            // التحقق من أن البيانات صحيحة
            if (type.fulfilledCount > 0) {
                console.log(`✅ نوع بلاغ  ${type.RequestType} لديه ${type.fulfilledCount} بلاغ  منفذة`);
            }
            if (type.unfulfilledCount > 0) {
                console.log(`✅ نوع بلاغ  ${type.RequestType} لديه ${type.unfulfilledCount} بلاغ  غير منفذة`);
            }
        });
        
        console.log('🔄 تم تحديث البيانات:', {
            fulfilled: chartData.fulfilled,
            unfulfilled: chartData.unfulfilled
        });
        
        // التحقق من وجود شكاوى منفذة
        const totalFulfilled = chartData.fulfilled.reduce((sum, count) => sum + count, 0);
        const totalUnfulfilled = chartData.unfulfilled.reduce((sum, count) => sum + count, 0);
        console.log(`📊 إجمالي الشكاوى المنفذة: ${totalFulfilled}`);
        console.log(`📊 إجمالي الشكاوى غير المنفذة: ${totalUnfulfilled}`);
        
        if (totalFulfilled === 0) {
            console.log('⚠️ تحذير: لا توجد شكاوى منفذة في البيانات!');
        }
    } else {
        console.log('📝 لا توجد بيانات حسب نوع البلاغ ');
        // إعادة تعيين البيانات الفارغة
        labelsByLang.ar = [];
        labelsByLang.en = [];
        chartData.fulfilled = [];
        chartData.unfulfilled = [];
        
        console.log('⚠️ تم إعادة تعيين البيانات إلى فارغة');
    }

    console.log('✅ البيانات النهائية للرسم البياني:', chartData);
    console.log('📊 أنواع الشكاوى النهائية للعرض:', labelsByLang.ar);
    updateChartData();
}

function updateChartData() {
    const labels = labelsByLang[currentLang];
    const font = getFont();
    const datasets = [];

    console.log('🔄 تحديث الرسم البياني...');
    console.log('📊 أنواع الطلبات للعرض:', labels);
    console.log('📈 البيانات المنفذة:', chartData.fulfilled);
    console.log('📈 البيانات غير المنفذة:', chartData.unfulfilled);

    // التحقق من وجود بيانات
    if (labels.length === 0) {
        console.log('📝 لا توجد بيانات للعرض');
        return;
    }

    // Add 'Unfulfilled' (Red) dataset first - غير منفذ
    datasets.push({
        label: filterLabels.unfulfilled[currentLang],
        data: chartData.unfulfilled,
        backgroundColor: '#F44336', // Red for unfulfilled requests
        borderColor: '#cc3636',
        borderWidth: 1,
        borderRadius: 5,
        categoryPercentage: 0.5,
        barPercentage: 0.8,
    });

    // Add 'Fulfilled' (Green) dataset - منفذ
    datasets.push({
        label: filterLabels.fulfilled[currentLang],
        data: chartData.fulfilled,
        backgroundColor: '#4CAF50', // Green for fulfilled requests
        borderColor: '#388e3c',
        borderWidth: 1,
        borderRadius: 5,
        categoryPercentage: 0.5,
        barPercentage: 0.8,
    });

    generalRequestsChart.data.labels = labels;
    generalRequestsChart.data.datasets = datasets;
    
    console.log('🔄 تم تحديث بيانات الرسم البياني:', {
        labels: generalRequestsChart.data.labels,
        datasets: generalRequestsChart.data.datasets.map(ds => ({
            label: ds.label,
            data: ds.data
        }))
    });

    // تحديث الحد الأقصى للرسم البياني بناءً على البيانات
    const maxValue = Math.max(...chartData.fulfilled, ...chartData.unfulfilled);
    const yAxisMax = Math.max(maxValue + 1, 5); // على الأقل 5، أو أكبر قيمة + 1

    // Update options for RTL and fonts
    generalRequestsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    generalRequestsChart.options.plugins.tooltip.bodyFont.family = font;
    generalRequestsChart.options.plugins.tooltip.titleFont.family = font;

    // Update font for axis labels
    generalRequestsChart.options.scales.x.ticks.font.family = font;
    generalRequestsChart.options.scales.y.ticks.font.family = font;

    // تحديث الحد الأقصى للمحور Y
    generalRequestsChart.options.scales.y.max = yAxisMax;

    // Ensure Y-axis labels are on the right for RTL
    generalRequestsChart.options.scales.y.position = currentLang === 'ar' ? 'right' : 'left';

    // Ensure grid lines are visible and correctly styled
    generalRequestsChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.08)';
    generalRequestsChart.options.scales.y.grid.drawBorder = false;

    generalRequestsChart.update();
    console.log('✅ تم تحديث الرسم البياني بنجاح');
    console.log('📊 أنواع الطلبات النهائية في الرسم البياني:', generalRequestsChart.data.labels);
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

    updateChartData(); // Update chart data and redraw with new language settings
}

// تصدير التقرير
async function exportGeneralRequestReport() {
    try {
        console.log('�� بدء تصدير تقرير الشكاوى...');
        
        // جلب جميع البيانات للتصدير
        const params = new URLSearchParams({
            includeEmployeeData: 'true'
        });

        console.log('🌐 إرسال طلب تصدير إلى:', `http://localhost:3001/api/general-requests/export-data?${params}`);

        const response = await fetch(`http://localhost:3001/api/general-requests/export-data?${params}`);
        const result = await response.json();

        console.log('📊 استجابة تصدير البيانات:', result);

        if (result.success && result.data && result.data.requests && result.data.requests.length > 0) {
            console.log('✅ تم جلب بيانات التصدير بنجاح');
            console.log('📈 عدد السجلات:', result.data.requests.length);
            console.log('📋 البيانات المستلمة:', result.data.requests);
            
            // إنشاء ملف Excel
            const fileName = `تقرير_الشكاوى_${new Date().toLocaleDateString('ar-EG')}`;
            
            // استخدام SheetJS لإنشاء ملف Excel
            if (typeof XLSX !== 'undefined') {
                const wb = XLSX.utils.book_new();
                
                // ورقة الشكاوى
                const requestsData = result.data.requests.map(request => ({
                    'رقم البلاغ ': request.RequestID,
                    'نوع البلاغ ': request.RequestType || 'غير محدد',
                    'تاريخ البلاغ ': request.RequestDate ? new Date(request.RequestDate).toLocaleDateString('ar-EG') : 'غير محدد',
                    'تفاصيل البلاغ ': request.RequestDetails || 'غير محدد',
                    'الحالة': request.Status || 'غير محدد',
                    'تاريخ الحل': request.FulfillmentDate ? new Date(request.FulfillmentDate).toLocaleDateString('ar-EG') : 'غير محدد',
                    'الموظف المسؤول': request.EmployeeName || 'غير محدد'
                }));
                
                console.log('📊 البيانات المحضرة للتصدير:', requestsData);
                
                const ws = XLSX.utils.json_to_sheet(requestsData);
                XLSX.utils.book_append_sheet(wb, ws, 'الشكاوى');
                XLSX.writeFile(wb, `${fileName}.xlsx`);
                
                showNotification('تم تصدير التقرير بنجاح!', 'success');
            } else {
                // إذا لم يكن SheetJS متوفر
                showNotification('SheetJS غير متوفر للتصدير', 'error');
            }
        } else {
            console.error('❌ لا توجد بيانات للتصدير أو خطأ في البيانات');
            showNotification('لا توجد بيانات للتصدير في الفترة المحددة', 'error');
        }

    } catch (error) {
        console.error('💥 خطأ في تصدير التقرير:', error);
        showNotification('خطأ في تصدير التقرير: ' + error.message, 'error');
    }
}

// دالة لفحص البيانات الموجودة
async function checkExistingData() {
    try {
        console.log('🔍 فحص البيانات الموجودة في قاعدة البيانات...');
        
        const response = await fetch('http://localhost:3001/api/general-requests/check-data');
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ تم فحص البيانات بنجاح:', result.data);
            
            const { summary, requestTypes, recentRequests, totalCount } = result.data;
            
            // إنشاء رسالة تفصيلية
            let message = `📊 البيانات الموجودة:\n\n`;
            message += `• إجمالي الشكاوى: ${summary.totalRequests}\n`;
            message += `• الشكاوى المنفذة: ${summary.fulfilledRequests}\n`;
            message += `• الشكاوى غير المنفذة: ${summary.unfulfilledRequests}\n`;
            message += `• أنواع الشكاوى: ${requestTypes.length}\n\n`;
            
            if (requestTypes.length > 0) {
                message += `📋 أنواع الشكاوى:\n`;
                requestTypes.forEach((type, index) => {
                    message += `${index + 1}. ${type.RequestType}: ${type.count} بلاغ \n`;
                });
            }
            
            if (recentRequests.length > 0) {
                message += `\n📝 آخر الشكاوى:\n`;
                recentRequests.slice(0, 3).forEach((request, index) => {
                    const status = request.IsFulfilled ? 'منفذ' : 'غير منفذ';
                    const date = new Date(request.RequestDate).toLocaleDateString('ar-EG');
                    message += `${index + 1}. ${request.RequestType} - ${status} (${date})\n`;
                });
            }
            
            // عرض النتائج في نافذة منبثقة
            showDataModal(message, result.data);
            
        } else {
            console.error('❌ خطأ في فحص البيانات:', result.message);
            showNotification('خطأ في فحص البيانات: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('💥 خطأ في الاتصال:', error);
        showNotification('خطأ في الاتصال: ' + error.message, 'error');
    }
}

// دالة لعرض نتائج فحص البيانات
function showDataModal(message, data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-semibold text-gray-800">نتائج فحص البيانات</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-800 mb-4 text-lg">📊 ملخص البيانات</h4>
                    <div class="grid grid-cols-3 gap-6 text-base">
                        <div class="text-center">
                            <div class="text-3xl font-bold text-blue-600">${data.summary.totalRequests}</div>
                            <div class="text-blue-700 text-lg">إجمالي الشكاوى</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600">${data.summary.fulfilledRequests}</div>
                            <div class="text-green-700 text-lg">منفذ</div>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-red-600">${data.summary.unfulfilledRequests}</div>
                            <div class="text-red-700 text-lg">غير منفذ</div>
                        </div>
                    </div>
                </div>
                
                ${data.requestTypes.length > 0 ? `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-800 mb-4 text-lg">📋 أنواع الشكاوى</h4>
                    <div class="space-y-3">
                        ${data.requestTypes.map(type => `
                            <div class="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <span class="text-gray-700 text-lg">${type.RequestType}</span>
                                <span class="bg-blue-100 text-blue-800 px-3 py-2 rounded text-base font-semibold">${type.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${data.recentRequests.length > 0 ? `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-800 mb-4 text-lg">📝 آخر الشكاوى</h4>
                    <div class="space-y-3">
                        ${data.recentRequests.slice(0, 5).map(request => `
                            <div class="flex justify-between items-center text-base p-3 bg-white rounded-lg border">
                                <div>
                                    <span class="font-medium text-lg">${request.RequestType}</span>
                                    <span class="text-gray-500 text-sm"> - ${new Date(request.RequestDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <span class="${request.IsFulfilled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-3 py-2 rounded text-base font-semibold">
                                    ${request.IsFulfilled ? 'منفذ' : 'غير منفذ'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="flex justify-end mt-8">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-lg font-semibold">
                    إغلاق
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// دالة لعرض الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // تحديد لون الإشعار حسب النوع
    if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // إخفاء الإشعار بعد 5 ثواني
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('generalRequestsChart');
    const langToggleBtn = document.getElementById('langToggle');
    const exportReportBtn = document.getElementById('exportReportBtn');

    // إنشاء الرسم البياني مع بيانات فارغة أولاً
    generalRequestsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2.5,
            layout: {
                padding: {
                    top: 15,
                    right: 15,
                    bottom: 15,
                    left: 15
                }
            },
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
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: { family: getFont() }
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.08)'
                    },
                    position: currentLang === 'ar' ? 'right' : 'left'
                },
                x: {
                    ticks: {
                        font: { family: getFont() }
                    },
                    grid: { display: false },
                    barPercentage: 0.8,
                    categoryPercentage: 0.8
                }
            }
        }
    });

    // جلب أنواع الطلبات والبيانات الإحصائية
    loadAvailableRequestTypes();

    // Initial language setting and chart update
    applyLanguage(currentLang);

    // Language toggle functionality
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            applyLanguage(newLang);
        });
    }

    // Functionality for Export Report button
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            exportGeneralRequestReport();
        });
    }

    // Functionality for Check Data button
    const checkDataBtn = document.getElementById('checkDataBtn');
    if (checkDataBtn) {
        checkDataBtn.addEventListener('click', () => {
            checkExistingData();
        });
    }

    // Functionality for Add Request button
    const addRequestBtn = document.getElementById('addRequestBtn');
    if (addRequestBtn) {
        addRequestBtn.addEventListener('click', () => {
            showAddRequestModal();
        });
    }



    // Set active sidebar link
    const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-link');
    sidebarLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === 'general-requests.html') {
            link.parentElement.classList.add('active');
        }
    });
});



// دالة لعرض نافذة إضافة طلب جديد
function showAddRequestModal() {
    // إنشاء نافذة منبثقة لإضافة بلاغ  جديدة
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 w-full max-w-2xl mx-4">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-semibold text-gray-800">إضافة بلاغ  جديدة</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-xl">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="addRequestForm">
                <div class="mb-6">
                    <label class="block text-gray-700 text-lg font-bold mb-3">نوع البلاغ </label>
                    <select id="requestType" required class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg">
                        <option value="">اختر نوع البلاغ </option>
                        <option value="الخدمات الطبية والعلاجية">الخدمات الطبية والعلاجية</option>
                        <option value="المواعيد والتحويلات">المواعيد والتحويلات</option>
                        <option value="الصيدلية والدواء">الصيدلية والدواء</option>
                        <option value="الكوادر الصحية وسلوكهم">الكوادر الصحية وسلوكهم</option>
                        <option value="الإجراءات الإدارية">الإجراءات الإدارية</option>
                        <option value="خدمات المرضى العامة">خدمات المرضى العامة</option>
                        <option value="الاستقبال وخدمة العملاء">الاستقبال وخدمة العملاء</option>
                        <option value="الخدمات الإلكترونية والتطبيقات">الخدمات الإلكترونية والتطبيقات</option>
                    </select>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-lg font-bold mb-3">تفاصيل البلاغ </label>
                    <textarea id="requestDetails" required rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" placeholder="اكتب تفاصيل البلاغ  هنا..."></textarea>
                </div>
                <div class="flex justify-end space-x-4 space-x-reverse">
                    <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-lg font-semibold">
                        إلغاء
                    </button>
                    <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-semibold">
                        إضافة البلاغ 
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إضافة معالج النموذج
    document.getElementById('addRequestForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const requestType = document.getElementById('requestType').value;
        const requestDetails = document.getElementById('requestDetails').value;
        
        try {
            const response = await fetch('http://localhost:3001/api/general-requests/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    RequestType: requestType,
                    RequestDetails: requestDetails
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('تم إضافة البلاغ  بنجاح!', 'success');
                modal.remove();
                // إعادة تحميل البيانات
                await loadAvailableRequestTypes();
            } else {
                showNotification('خطأ في إضافة البلاغ : ' + result.message, 'error');
            }
        } catch (error) {
            showNotification('خطأ في الاتصال: ' + error.message, 'error');
        }
    });
}

/* ===== Helpers for PDF ===== */
function gr_font(){ return (currentLang === 'ar') ? 'Tajawal, Arial' : 'Inter, Arial'; }

// إعداد الخطوط للـ PDF
function setupPDFFonts() {
  if (typeof window.jspdf !== 'undefined') {
    // استخدام الخطوط الافتراضية التي تدعم العربية
    console.log('✅ تم إعداد الخطوط للـ PDF');
  }
}

// دالة اختبار بسيطة
function testPDFExport() {
  console.log('🧪 اختبار تصدير PDF...');
  console.log('المتغيرات المطلوبة:');
  console.log('- currentLang:', currentLang);
  console.log('- generalRequestsChart:', generalRequestsChart ? 'موجود' : 'غير موجود');
  console.log('- labelsByLang:', labelsByLang);
  console.log('- jsPDF:', typeof window.jspdf !== 'undefined' ? 'موجود' : 'غير موجود');
  console.log('- html2canvas:', typeof html2canvas !== 'undefined' ? 'موجود' : 'غير موجود');
}

// ينشئ iframe مخفي للعمل داخله ثم يُعيد إزالته
async function withSandbox(cb){
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position:'fixed', left:'-10000px', top:'0', width:'0', height:'0', visibility:'hidden'
  });
  document.body.appendChild(iframe);
  try {
    // وثيقة نظيفة داخل iframe
    const doc = iframe.contentDocument;
    doc.open(); doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'); doc.close();
    return await cb(doc, iframe.contentWindow);
  } finally {
    iframe.remove();
  }
}

// يحوّل HTML إلى صورة داخل iframe (لا يلمس DOM الصفحة)
async function htmlToImageInSandbox({width, html, scale=2}){
  return await withSandbox(async (doc, win) => {
    const host = doc.createElement('div');
    host.setAttribute('dir', (window.currentLang==='ar'?'rtl':'ltr'));
    host.style.width = width + 'px';
    host.style.fontFamily = gr_font();
    host.innerHTML = html;
    doc.body.appendChild(host);

    const canvas = await html2canvas(host, { scale, backgroundColor:null, windowWidth:width, useCORS:true });
    return { dataURL: canvas.toDataURL('image/png', 1.0), w: canvas.width/scale, h: canvas.height/scale };
  });
}

// يرسم العنوان على Canvas بدون html2canvas (أسرع وثابت)
function makeTitleImage(title, widthPx){
  const scale=2, fs=22, pad=12, lh=1.35, font='800 '+fs+'px '+gr_font();
  const probe=document.createElement('canvas').getContext('2d'); probe.font=font;
  const maxW=widthPx - pad*2;
  const words=String(title).split(' '); let line='', lines=[];
  for(const w of words){
    const test=(line?line+' ':'')+w;
    if(probe.measureText(test).width>maxW && line){ lines.push(line); line=w; } else line=test;
  }
  if(line) lines.push(line); lines=lines.slice(0,3);
  const textH=Math.ceil(lines.length*fs*lh), w=Math.min(widthPx, maxW+pad*2), h=textH+pad*2;

  const cvs=document.createElement('canvas'); cvs.width=w*scale; cvs.height=h*scale;
  const ctx=cvs.getContext('2d'); ctx.scale(scale,scale);
  ctx.font=font; ctx.fillStyle='#000'; ctx.textAlign='center'; ctx.textBaseline='middle';
  if (currentLang==='ar') ctx.direction='rtl';
  const startY=(h-textH)/2 + fs/2;
  lines.forEach((ln,i)=>ctx.fillText(ln, w/2, startY + i*fs*lh));
  return { dataURL:cvs.toDataURL('image/png',1.0), w, h };
}

// يرسم توضيح الألوان (الأحمر=غير منفذة، الأخضر=منفذة)
function drawLegend(doc, x, y){
  const box=12, gap=8, step=120;
  
  // مربع أحمر - غير منفذة
  doc.setFillColor(220,53,69);   // أحمر
  doc.rect(x, y, box, box, 'F');
  
  // مربع أخضر - منفذة
  doc.setFillColor(40,167,69);   // أخضر
  doc.rect(x + step, y, box, box, 'F');

  // إضافة النصوص كصور لضمان ظهورها صحيحة
  const unfulfilledText = currentLang === 'ar' ? 'غير منفذة' : 'Unfulfilled';
  const fulfilledText = currentLang === 'ar' ? 'منفذة' : 'Fulfilled';
  
  const text1 = createTextImage(unfulfilledText, 12);
  const text2 = createTextImage(fulfilledText, 12);
  
  doc.addImage(text1.dataURL, 'PNG', x + box + gap, y - 2, text1.w, text1.h);
  doc.addImage(text2.dataURL, 'PNG', x + step + box + gap, y - 2, text2.w, text2.h);
}

// إنشاء صورة للنص مع دعم العربية
function createTextImage(text, fontSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  ctx.font = `${fontSize}px ${gr_font()}`;
  const metrics = ctx.measureText(text);
  const width = Math.ceil(metrics.width) + 10;
  const height = fontSize + 4;
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.font = `${fontSize}px ${gr_font()}`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  if (currentLang === 'ar') {
    ctx.direction = 'rtl';
  }
  
  ctx.fillText(text, 5, 2);
  
  return {
    dataURL: canvas.toDataURL('image/png', 1.0),
    w: width,
    h: height
  };
}

// آمنة: العنصر المؤقت خارج الشاشة ولا يغيّر الصفحة إطلاقاً
async function gr_htmlBlock({width, html, scale=2}) {
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    position:'fixed', left:'-99999px', top:'0',
    opacity:'0', pointerEvents:'none', zIndex:'-1',
    width: width + 'px', fontFamily: gr_font(),
    direction: (currentLang==='ar'?'rtl':'ltr')
  });
  wrap.lang = currentLang;
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  try {
    const canvas = await html2canvas(wrap, { scale, backgroundColor:null, useCORS:true });
    return { dataURL: canvas.toDataURL('image/png',1.0), w: canvas.width/scale, h: canvas.height/scale };
  } finally { wrap.remove(); } // تنظيف دائمًا
}

function gr_addImageFit(doc,dataURL,y,maxWidth){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const W=doc.internal.pageSize.getWidth();
      const usable=Math.min(maxWidth,W-56);
      const scale=usable/img.width;
      const w=usable,h=img.height*scale;
      doc.addImage(dataURL,'PNG',(W-w)/2,y,w,h);
      res(h);
    };
    img.src=dataURL;
  });
}

async function gr_snapshotBar(chart, {
  width = 3000, height = 1300, scale = 3, barThickness = 64
} = {}) {
  if (!chart) return null;

  const cvs = document.createElement('canvas');
  cvs.width = Math.floor(width * scale);
  cvs.height = Math.floor(height * scale);
  const ctx = cvs.getContext('2d'); ctx.scale(scale, scale);
  
  // ضيفيه خارج الشاشة وغير مرئي – ما يأثر على الـDOM المرئي إطلاقًا
  Object.assign(cvs.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '0',
    height: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1'
  });
  document.body.appendChild(cvs);

  const cfg  = chart.config;
  const data = JSON.parse(JSON.stringify(cfg.data));
  const opt  = JSON.parse(JSON.stringify(cfg.options || {}));

  opt.responsive = false;
  opt.maintainAspectRatio = false;
  opt.animation = false;

  // أعمدة أوضح
  opt.datasets = opt.datasets || {};
  opt.datasets.bar = {
    barThickness, maxBarThickness: barThickness,
    categoryPercentage: 0.9, barPercentage: 0.9, borderSkipped: false
  };

  const ff = (currentLang === 'ar' ? 'Tajawal' : 'Inter');

  // محور X — تكبير + سطور متعددة + منع الدوران
  opt.scales = opt.scales || {};
  opt.scales.x = Object.assign({}, opt.scales.x, {
    ticks: Object.assign({}, opt.scales.x?.ticks, {
      autoSkip: false, maxRotation: 0, minRotation: 0, padding: 10,
      font: { family: ff, size: 26, weight: '700' },   // 👈 أكبر
      color: '#111',
      callback: (val, idx) => {
        const lbl = data.labels?.[idx] || String(val);
        if (lbl.includes(' ')) {
          // قسّم على الكلمات ~12 حرف لكل سطر
          const words = lbl.split(' '), lines = [];
          let line = '';
          for (const w of words) {
            if ((line + ' ' + w).trim().length > 12) { lines.push(line.trim()); line = w; }
            else line += ' ' + w;
          }
          if (line) lines.push(line.trim());
          return lines;
        }
        return lbl.match(/.{1,12}/g) || [lbl];
      }
    }),
    grid: Object.assign({}, opt.scales.x?.grid, { color: '#eee' })
  });

  // محور Y
  opt.scales.y = Object.assign({}, opt.scales.y, {
    ticks: Object.assign({}, opt.scales.y?.ticks, {
      font: { family: ff, size: 18 }, color: '#111'
    }),
    grid: Object.assign({}, opt.scales.y?.grid, { color: '#f1f1f1' })
  });

  // مساحة سفلية كبيرة لإظهار تسميات X كاملة
  opt.layout = Object.assign({}, opt.layout, {
    padding: Object.assign({}, opt.layout?.padding, { bottom: 180 })
  });

  const tmp = new Chart(cvs.getContext('2d'), { type: cfg.type, data, options: opt });
  await new Promise(r => requestAnimationFrame(r));
  const url = cvs.toDataURL('image/png', 1.0);
  tmp.destroy(); cvs.remove();
  return { dataURL: url, w: width, h: height };
}

/* ===== Export General Requests PDF ===== */
async function exportGeneralRequestsPDF(){
  console.log('🚀 بدء تصدير PDF...');
  
  // إعداد الخطوط
  setupPDFFonts();
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4' });
  const W = doc.internal.pageSize.getWidth(), M = 28, usable = W - M*2;

  try {
    // 1) عنوان
    const title = (currentLang==='ar'
      ? 'الطلبات العامة المنفذة وغير المنفذة حسب النوع'
      : 'General Requests (Fulfilled vs Unfulfilled) by Type');

    console.log('📝 رسم العنوان:', title);
    const t = makeTitleImage(title, usable);
    doc.addImage(t.dataURL, 'PNG', M, 50, usable, t.h);
    let y = 50 + t.h + 10;

    // 2) توضيح الألوان (Legend)
    console.log('🎨 رسم التوضيح');
    drawLegend(doc, M, y);
    y += 30;

    // 3) لقطة الشارت بدقة عالية
    await new Promise(r=>requestAnimationFrame(r));
    if (generalRequestsChart){
      console.log('📊 بدء تصوير الشارت');
      const labels = (labelsByLang?.[currentLang]) || [];
      const n = Math.max(1, labels.length);
      const offW = Math.max(2600, Math.min(4200, n*320));
      const offH = Math.max(1200, 800 + n*12);

      console.log('📏 أبعاد الشارت:', { offW, offH, labelsCount: n });

      let shot=null;
      try {
        console.log('🔄 محاولة تصوير الشارت...');
        shot = await gr_snapshotBar(generalRequestsChart, {
          width:offW, height:offH, scale:3, barThickness:68
        });
        console.log('✅ تم تصوير الشارت بنجاح');
      } catch(e){
        console.warn('⚠️ فشل تصوير الشارت، استخدام البديل:', e);
        // fallback آمن داخل sandbox أيضًا
        shot = await withSandbox(async (doc2)=>{
          const holder = doc2.createElement('div');
          holder.style.width='800px'; doc2.body.appendChild(holder);
          const cv = await html2canvas(generalRequestsChart.canvas, { scale:2 });
          return { dataURL: cv.toDataURL('image/png',1.0), w: cv.width/2, h: cv.height/2 };
        });
        console.log('✅ تم تصوير الشارت بالبديل');
      }

      const imgW = usable;
      const imgH = imgW * (shot.h / shot.w);
      console.log('🖼️ إضافة الصورة للـPDF:', { imgW, imgH });
      doc.addImage(shot.dataURL, 'PNG', M, y, imgW, imgH);
      y += imgH + 16;
    } else {
      console.warn('⚠️ الرسم البياني غير متوفر');
    }

    // 4) تنزيل مباشر (بدون فتح تبويب)
    const fn = (currentLang==='ar' ? 'تقرير_الطلبات_العامة.pdf' : 'General_Requests_Report.pdf');
    console.log('💾 بدء تحميل الملف:', fn);
    doc.save(fn);
    console.log('✅ تم إنشاء PDF بنجاح');

  } catch (err){
    console.error('❌ فشل تصدير PDF:', err);
    alert(`تعذر تصدير PDF: ${err.message}`);
  }
}

/* ===== Bind Button ===== */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('exportGeneralRequestsPdfBtn');
  if (!btn) return;

  // تأكد أن الزر في HTML يحمل type="button"
  // <button id="exportGeneralRequestsPdfBtn" type="button">...</button>

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>...جاري التصدير</span>';

    try {
      // تشخيص شامل قبل البدء
      console.log('🔍 تشخيص شامل للتصدير:');
      console.log('- jsPDF:', typeof window.jspdf !== 'undefined' ? '✅ متوفر' : '❌ غير متوفر');
      console.log('- html2canvas:', typeof html2canvas !== 'undefined' ? '✅ متوفر' : '❌ غير متوفر');
      console.log('- generalRequestsChart:', generalRequestsChart ? '✅ جاهز' : '❌ غير جاهز');
      console.log('- currentLang:', currentLang);
      console.log('- labelsByLang:', labelsByLang);
      
      if (typeof window.jspdf === 'undefined') {
        throw new Error('مكتبة jsPDF غير محملة');
      }
      if (typeof html2canvas === 'undefined') {
        throw new Error('مكتبة html2canvas غير محملة');
      }
      if (!generalRequestsChart) {
        throw new Error('الرسم البياني غير جاهز');
      }

      await exportGeneralRequestsPDF();
      console.log('✅ تم تصدير PDF بنجاح');
    } catch (err) {
      console.error('❌ خطأ في تصدير PDF:', err);
      alert(`تعذر تصدير PDF: ${err.message}`);
    } finally {
      btn.innerHTML = old;
      btn.disabled = false;
    }
  });
});    