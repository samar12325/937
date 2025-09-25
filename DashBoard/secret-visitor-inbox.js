let currentLang = localStorage.getItem('lang') || 'ar';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let departments = [];
let assignedReports = [];
let allReports = []; // جميع البلاغات المعينة
let unassignedReports = []; // البلاغات غير المعينة
let currentView = 'all'; // 'all', 'assigned', 'unassigned'

// ====== إدارة اللغة ======
function applyLanguage() {
    const elements = document.querySelectorAll('[data-ar], [data-en]');
    elements.forEach(element => {
        const text = currentLang === 'ar' ? element.getAttribute('data-ar') : element.getAttribute('data-en');
        if (text) {
            element.textContent = text;
        }
    });
    
    // تحديث اتجاه النص
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
}

// تبديل اللغة
function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
    filterReports(); // إعادة تطبيق التصفية باللغة الجديدة
}

// ====== إدارة Custom Select ======
function initCustomSelects() {
    // Custom Select للقسم
    const departmentSelect = document.getElementById('departmentSelect');
    const departmentOptions = document.getElementById('departmentOptions');
    const selectedDepartment = document.getElementById('selectedDepartment');
    
    departmentSelect.addEventListener('click', () => {
        departmentOptions.classList.toggle('show');
    });
    
    departmentOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = e.target.textContent;
            
            selectedDepartment.textContent = text;
            selectedDepartment.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            departmentOptions.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            departmentOptions.classList.remove('show');
        }
    });
    
    // Custom Select للحالة
    const statusSelect = document.getElementById('statusSelect');
    const statusOptions = document.getElementById('statusOptions');
    const selectedStatus = document.getElementById('selectedStatus');
    
    statusSelect.addEventListener('click', () => {
        statusOptions.classList.toggle('show');
    });
    
    statusOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = currentLang === 'ar' ? e.target.getAttribute('data-ar') : e.target.getAttribute('data-en');
            
            selectedStatus.textContent = text;
            selectedStatus.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            statusOptions.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            statusOptions.classList.remove('show');
        }
    });
    
    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-select-options').forEach(options => {
                options.classList.remove('show');
            });
        }
    });
}

// ====== تحميل الأقسام ======
async function loadDepartments() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/departments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الأقسام');
        }
        
        const result = await response.json();
        departments = result.data || [];
        
        // تحديث قائمة الأقسام
        const departmentOptions = document.getElementById('departmentOptions');
        departmentOptions.innerHTML = '';
        
        departments.forEach(dept => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.setAttribute('data-value', dept.DepartmentID);
            option.textContent = currentLang === 'ar' ? dept.DepartmentName : (dept.DepartmentNameEn || dept.DepartmentName);
            departmentOptions.appendChild(option);
        });
        
        console.log('📋 Loaded', departments.length, 'departments from database');
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showToast('فشل في تحميل الأقسام', 'error');
    }
}

// ====== تحميل البلاغات غير المعينة ======
async function loadUnassignedReports() {
    try {
        const token = localStorage.getItem('token');
        const url = `${API_BASE_URL}/secret-visitor/unassigned`;
        console.log('📡 Fetching unassigned reports from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error('فشل في تحميل البلاغات غير المعينة');
        }
        
        const result = await response.json();
        console.log('📊 Received unassigned reports:', result);
        
        unassignedReports = result.data || [];
        console.log('📋 Processed unassigned reports:', unassignedReports.length);
        
        // تطبيق التصفية بعد تحميل البلاغات غير المعينة
        filterReports();
        
    } catch (error) {
        console.error('Error loading unassigned reports:', error);
        showToast('فشل في تحميل البلاغات غير المعينة', 'error');
    }
}

// ====== تحميل جميع البلاغات المعينة ======
async function loadAllAssignedReports() {
    try {
        const token = localStorage.getItem('token');
        const url = `${API_BASE_URL}/secret-visitor/assigned/all`;
        console.log('📡 Fetching all reports from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error('فشل في تحميل البلاغات');
        }
        
        const result = await response.json();
        console.log('📊 Received all reports:', result);
        
        allReports = result.data || [];
        console.log('📋 Processed all reports:', allReports.length);
        
        // عرض جميع البلاغات في البداية (معينة + غير معينة)
        assignedReports = [...allReports, ...unassignedReports];
        renderReportsTable();
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading all assigned reports:', error);
        showToast('فشل في تحميل البلاغات', 'error');
    }
}

// ====== تصفية البلاغات محلياً ======
function filterReports() {
    const departmentId = document.getElementById('selectedDepartment').getAttribute('data-value');
    const status = document.getElementById('selectedStatus').getAttribute('data-value') || 'all';
    
    console.log('🔍 Filtering reports for department:', departmentId, 'status:', status, 'view:', currentView);
    
    if (currentView === 'unassigned') {
        // عرض البلاغات غير المعينة
        assignedReports = unassignedReports;
    } else if (currentView === 'assigned') {
        // عرض البلاغات المعينة فقط
        if (!departmentId || departmentId === 'all') {
            assignedReports = allReports;
        } else {
            // تصفية حسب القسم
            const depId = Number(departmentId);
            assignedReports = allReports.filter(report => report.assigned_department_id === depId);
        }
        
        // تصفية حسب الحالة
        if (status !== 'all') {
            assignedReports = assignedReports.filter(report => report.status === status);
        }
    } else {
        // عرض جميع البلاغات (معينة + غير معينة)
        let filteredAssigned = allReports;
        let filteredUnassigned = unassignedReports;
        
        // تصفية البلاغات المعينة حسب القسم
        if (departmentId && departmentId !== 'all') {
            const depId = Number(departmentId);
            filteredAssigned = allReports.filter(report => report.assigned_department_id === depId);
        }
        
        // تصفية البلاغات المعينة حسب الحالة
        if (status !== 'all') {
            filteredAssigned = filteredAssigned.filter(report => report.status === status);
        }
        
        // دمج البلاغات المعينة وغير المعينة
        assignedReports = [...filteredAssigned, ...filteredUnassigned];
    }
    
    console.log('📋 Filtered reports:', assignedReports.length);
    
    renderReportsTable();
    updateStatistics();
}

// ====== تحميل البلاغات المعينة (للتوافق مع الكود القديم) ======
async function loadAssignedReports() {
    filterReports();
}

// ====== عرض جدول البلاغات ======
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    
    if (assignedReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    ${currentLang === 'ar' ? 'لا توجد بلاغات' : 'No reports found'}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = assignedReports.map(report => {
        // تحديد نوع البلاغ
        const isUnassigned = report.is_assigned === false;
        
        if (isUnassigned) {
            // البلاغات غير المعينة
            return `
                <tr class="bg-yellow-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                            <div class="font-medium">${currentLang === 'ar' ? report.department_name_ar : report.department_name_en}</div>
                            <div class="text-xs text-gray-500">${currentLang === 'ar' ? 'القسم الأصلي' : 'Original Department'}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div class="truncate" title="${report.note_text}">
                            ${report.note_text}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${report.location || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                            <div>${new Date(report.created_at).toLocaleDateString('ar-SA')}</div>
                            <div class="text-xs text-red-500 font-medium">
                                ${currentLang === 'ar' ? 'غير معين' : 'Unassigned'}
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-badge status-assigned">${currentLang === 'ar' ? 'غير معين' : 'Unassigned'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span class="text-gray-400 text-xs">${currentLang === 'ar' ? 'لا توجد إجراءات' : 'No actions'}</span>
                    </td>
                </tr>
            `;
        } else {
            // البلاغات المعينة
            const statusClass = `status-${report.status.replace('_', '-')}`;
            const statusText = getStatusText(report.status);
            
            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                            <div class="font-medium">${currentLang === 'ar' ? report.note.department_name_ar : report.note.department_name_en}</div>
                            <div class="text-xs text-gray-500">${currentLang === 'ar' ? 'القسم الأصلي' : 'Original Department'}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div class="truncate" title="${report.note.note_text}">
                            ${report.note.note_text}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${report.note.location || '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                            <div>${new Date(report.assigned_at).toLocaleDateString('ar-SA')}</div>
                            <div class="text-xs text-gray-500">
                                ${currentLang === 'ar' ? 'معين لـ: ' : 'Assigned to: '}
                                ${currentLang === 'ar' ? report.assigned_department_name_ar : report.assigned_department_name_en}
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${getActionButtons(report)}
                    </td>
                </tr>
            `;
        }
    }).join('');
}

// ====== الحصول على نص الحالة ======
function getStatusText(status) {
    const statusMap = {
        'assigned': currentLang === 'ar' ? 'معين' : 'Assigned',
        'in_progress': currentLang === 'ar' ? 'قيد التنفيذ' : 'In Progress',
        'done': currentLang === 'ar' ? 'مكتمل' : 'Done',
        'rejected': currentLang === 'ar' ? 'مرفوض' : 'Rejected'
    };
    return statusMap[status] || status;
}

// ====== الحصول على أزرار الإجراءات ======
function getActionButtons(report) {
    const buttons = [];
    
    if (report.status === 'assigned') {
        buttons.push(`
            <button onclick="updateStatus(${report.assignmentId}, 'in_progress')" class="action-btn btn-in-progress">
                ${currentLang === 'ar' ? 'بدء التنفيذ' : 'Start'}
            </button>
        `);
        buttons.push(`
            <button onclick="updateStatus(${report.assignmentId}, 'rejected')" class="action-btn btn-rejected">
                ${currentLang === 'ar' ? 'رفض' : 'Reject'}
            </button>
        `);
    } else if (report.status === 'in_progress') {
        buttons.push(`
            <button onclick="updateStatus(${report.assignmentId}, 'done')" class="action-btn btn-done">
                ${currentLang === 'ar' ? 'إكمال' : 'Complete'}
            </button>
        `);
        buttons.push(`
            <button onclick="updateStatus(${report.assignmentId}, 'rejected')" class="action-btn btn-rejected">
                ${currentLang === 'ar' ? 'رفض' : 'Reject'}
            </button>
        `);
    }
    
    return buttons.join('');
}

// ====== تحديث حالة البلاغ ======
async function updateStatus(assignmentId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في تحديث الحالة');
        }
        
        const result = await response.json();
        showToast(result.message, 'success');
        
        // تحديث البيانات المحلية
        const reportIndex = allReports.findIndex(r => r.assignmentId === assignmentId);
        if (reportIndex !== -1) {
            allReports[reportIndex].status = newStatus;
        }
        
        // إعادة تطبيق التصفية
        filterReports();
        
    } catch (error) {
        console.error('Error updating status:', error);
        showToast(error.message, 'error');
    }
}

// ====== تحديث الإحصائيات ======
function updateStatistics() {
    const total = assignedReports.length;
    const inProgress = assignedReports.filter(r => r.status === 'in_progress').length;
    const completed = assignedReports.filter(r => r.status === 'executed').length;
    const rejected = assignedReports.filter(r => r.status === 'not_executed').length;
    const unassigned = assignedReports.filter(r => r.is_assigned === false).length;
    
    document.getElementById('totalReports').textContent = total;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('completedReports').textContent = completed;
    document.getElementById('rejectedReports').textContent = rejected;
    
    // تحديث خانة البلاغات غير المعينة إذا كانت موجودة
    const unassignedElement = document.getElementById('unassignedReports');
    if (unassignedElement) {
        unassignedElement.textContent = unassigned;
    }
}

// ====== إظهار Toast ======
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // إظهار Toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // إخفاء Toast بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
}

// ====== تهيئة الصفحة ======
document.addEventListener('DOMContentLoaded', function() {
    // تطبيق اللغة
    applyLanguage();
    
    // تهيئة Custom Selects
    initCustomSelects();
    
    // تحميل البيانات
    loadDepartments();
    loadUnassignedReports(); // تحميل البلاغات غير المعينة أولاً
    loadAllAssignedReports(); // تحميل جميع البلاغات المعينة عند بدء الصفحة
    
    // ربط الأحداث
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    document.getElementById('loadBtn').addEventListener('click', filterReports);
    
    // تصفية تلقائية عند تغيير القسم أو الحالة
    document.getElementById('departmentSelect').addEventListener('change', filterReports);
    document.getElementById('statusSelect').addEventListener('change', filterReports);
    
    // إضافة event listener للقائمة المنسدلة للأقسام
    const departmentOptions = document.getElementById('departmentOptions');
    if (departmentOptions) {
        departmentOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('custom-select-option')) {
                // تصفية البلاغات بعد اختيار قسم جديد
                setTimeout(() => {
                    filterReports();
                }, 100);
            }
        });
    }
    
    // إضافة event listener للقائمة المنسدلة للحالة
    const statusOptions = document.getElementById('statusOptions');
    if (statusOptions) {
        statusOptions.addEventListener('click', (e) => {
            if (e.target.classList.contains('custom-select-option')) {
                // تصفية البلاغات بعد اختيار حالة جديدة
                setTimeout(() => {
                    filterReports();
                }, 100);
            }
        });
    }
});
