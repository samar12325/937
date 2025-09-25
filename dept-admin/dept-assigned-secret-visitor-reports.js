// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let assignedReports = [];
let currentReportId = null;
let currentLanguage = 'ar';

// تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    // التحقق من الصلاحيات أولاً
    if (!(await guardAccess())) {
        return;
    }
    
    initializePage();
    loadAssignedReports();
    setupEventListeners();
});

// التحقق من تسجيل الدخول فقط - متاح للجميع
async function guardAccess() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        // فقط التحقق من وجود المستخدم والـ token
        if (!user || !token) {
            window.location.href = '../login/login.html';
            return false;
        }
        
        // السماح لجميع المستخدمين المسجلين بالوصول
        console.log('✅ تم السماح بالوصول لجميع المستخدمين المسجلين');
        return true;
    } catch (error) {
        console.error('خطأ في التحقق من تسجيل الدخول:', error);
        window.location.href = '../login/login.html';
        return false;
    }
}

// تهيئة الصفحة
function initializePage() {
    // تحميل اللغة المحفوظة
    currentLanguage = localStorage.getItem('lang') || 'ar';
    updateLanguage();
    
    // إخفاء رسالة التحميل
    document.getElementById('loadingMessage').style.display = 'none';
}

// تحميل البلاغات المسندة
async function loadAssignedReports() {
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/employee`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            assignedReports = data.data || [];
            console.log('📋 البلاغات المحملة:', assignedReports);
            console.log('📋 عدد البلاغات:', assignedReports.length);
            if (assignedReports.length > 0) {
                console.log('📋 أول بلاغ:', assignedReports[0]);
            }
            renderReportsTable();
        } else {
            throw new Error(data.message || 'فشل في تحميل البلاغات');
        }
    } catch (error) {
        console.error('Error loading assigned reports:', error);
        showError('حدث خطأ في تحميل البلاغات: ' + error.message);
    } finally {
        hideLoading();
    }
}

// عرض الجدول
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    if (assignedReports.length === 0) {
        tbody.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = assignedReports.map(report => {
        console.log('📊 عرض البلاغ:', {
            note_id: report.note_id,
            assignment_id: report.assignment_id,
            status: report.status,
            note_created_at: report.note_created_at,
            all_keys: Object.keys(report)
        });
        
        // استخدام assignment_id أو id كبديل
        const assignmentId = report.assignment_id || report.id;
        console.log('🔑 assignmentId المستخدم:', assignmentId);
        
        // التحقق من التاريخ
        const formattedDate = report.note_created_at ? formatDate(report.note_created_at) : 'لا يوجد تاريخ';
        console.log('📅 التاريخ المنسق:', formattedDate);
        
        return `
        <tr>
            <td class="font-medium">#${report.note_id}</td>
            <td>${formattedDate}</td>
            <td class="max-w-xs truncate">${report.note_text || 'لا يوجد وصف'}</td>
            <td>
                <span class="status-badge status-${report.status}">
                    ${getStatusText(report.status)}
                </span>
            </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                        <button onclick="viewReportDetails(${assignmentId})" class="action-btn btn-view" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'">
                            <i class="fas fa-eye"></i> <span data-ar="عرض" data-en="View">عرض</span>
                        </button>
                        <button onclick="openReplyModal(${assignmentId})" class="action-btn btn-reply" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.3)'">
                            <i class="fas fa-reply"></i> <span data-ar="رد" data-en="Reply">رد</span>
                        </button>
                        <button onclick="openStatusModal(${assignmentId})" class="action-btn btn-status" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.3)'">
                            <i class="fas fa-edit"></i> <span data-ar="حالة" data-en="Status">حالة</span>
                        </button>
                    </div>
                </td>
        </tr>
        `;
    }).join('');
}

// عرض تفاصيل البلاغ
function viewReportDetails(assignmentId) {
    const report = assignedReports.find(r => (r.assignment_id || r.id) === assignmentId);
    if (!report) return;
    
    const modal = document.getElementById('reportDetailsModal');
    const content = document.getElementById('reportDetailsContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="رقم البلاغ" data-en="Report ID">رقم البلاغ</label>
                <p class="text-lg font-semibold">#${report.note_id}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="التاريخ" data-en="Date">التاريخ</label>
                <p>${formatDate(report.note_created_at)}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="الحالة" data-en="Status">الحالة</label>
                <span class="status-badge status-${report.status}">
                    ${getStatusText(report.status)}
                </span>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="الوصف" data-en="Description">الوصف</label>
                <p class="bg-gray-50 p-3 rounded-lg">${report.note_text || 'لا يوجد وصف'}</p>
            </div>
            ${report.assigned_department_name_ar ? `
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="القسم المعين" data-en="Assigned Department">القسم المعين</label>
                <p>${report.assigned_department_name_ar}</p>
            </div>
            ` : ''}
            ${report.assigned_at ? `
            <div>
                <label class="block text-sm font-medium text-gray-700" data-ar="تاريخ الإسناد" data-en="Assignment Date">تاريخ الإسناد</label>
                <p>${formatDate(report.assigned_at)}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

// فتح نافذة الرد
function openReplyModal(assignmentId) {
    console.log('🔍 فتح نافذة الرد للتعيين:', assignmentId);
    currentReportId = assignmentId;
    console.log('📝 currentReportId محدد إلى:', currentReportId);
    const modal = document.getElementById('replyModal');
    document.getElementById('replyText').value = '';
    modal.style.display = 'block';
}

// إغلاق نافذة الرد
function closeReplyModal() {
    const modal = document.getElementById('replyModal');
    modal.style.display = 'none';
    currentReportId = null;
}

// فتح نافذة تغيير الحالة
function openStatusModal(assignmentId) {
    currentReportId = assignmentId;
    const modal = document.getElementById('statusModal');
    const report = assignedReports.find(r => (r.assignment_id || r.id) === assignmentId);
    
    if (report) {
        document.getElementById('newStatus').value = report.status;
    }
    
    document.getElementById('statusComment').value = '';
    modal.style.display = 'block';
}

// إغلاق نافذة تغيير الحالة
function closeStatusModal() {
    const modal = document.getElementById('statusModal');
    modal.style.display = 'none';
    currentReportId = null;
}

// إرسال الرد
async function submitReply(event) {
    event.preventDefault();
    
    console.log('🔄 محاولة إرسال رد، currentReportId:', currentReportId);
    
    const replyText = document.getElementById('replyText').value.trim();
    if (!replyText) {
        showError('يرجى كتابة نص الرد');
        return;
    }
    
    if (!currentReportId) {
        showError('معرف التقرير غير محدد');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        console.log('📤 إرسال طلب إلى:', `${API_BASE_URL}/secret-visitor/assigned/${currentReportId}/reply`);
        const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${currentReportId}/reply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reply_text: replyText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            showSuccess('تم تسجيل ردك بنجاح! شكراً لك على المتابعة');
            closeReplyModal();
            loadAssignedReports(); // إعادة تحميل البلاغات
        } else {
            throw new Error(data.message || 'فشل في إرسال الرد');
        }
    } catch (error) {
        console.error('Error submitting reply:', error);
        showError('حدث خطأ في إرسال الرد: ' + error.message);
    }
}

// تغيير حالة البلاغ
async function changeStatus(event) {
    event.preventDefault();
    
    const uiValue = document.getElementById('newStatus').value;
    const comment = document.getElementById('statusComment').value.trim();
    
    // تحويل القيم إلى ما يتوقعه الـ backend
    const statusMap = {
        'done': 'executed',
        'rejected': 'not_executed',
        'in_progress': 'in_progress',
        'executed': 'executed',
        'not_executed': 'not_executed',
        'assigned': 'assigned'
    };
    
    const status = statusMap[uiValue] || uiValue;
    
    console.log('🔄 تغيير الحالة:', { uiValue, status, comment });
    
    if (!status) {
        showError('قيمة حالة غير معروفة');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${currentReportId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                comment: comment || null
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            showSuccess('تم تحديث حالة البلاغ بنجاح');
            closeStatusModal();
            loadAssignedReports(); // إعادة تحميل البلاغات
        } else {
            throw new Error(data.message || 'فشل في تحديث الحالة');
        }
    } catch (error) {
        console.error('Error changing status:', error);
        showError('حدث خطأ في تحديث الحالة: ' + error.message);
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // تغيير اللغة
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    
    // الفلاتر
    document.getElementById('statusFilter').addEventListener('change', filterReports);
    
    // النماذج
    document.getElementById('replyForm').addEventListener('submit', submitReply);
    document.getElementById('statusForm').addEventListener('submit', changeStatus);
    
    // إغلاق النوافذ المنبثقة
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // إغلاق النوافذ المنبثقة عند النقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// فلترة البلاغات
function filterReports() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredReports = [...assignedReports];
    
    // فلترة حسب الحالة فقط
    if (statusFilter) {
        filteredReports = filteredReports.filter(report => report.status === statusFilter);
    }
    
    // عرض النتائج المفلترة
    const tbody = document.getElementById('reportsTableBody');
    if (filteredReports.length === 0) {
        tbody.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = filteredReports.map(report => {
        const assignmentId = report.assignment_id || report.id;
        return `
        <tr>
            <td class="font-medium">#${report.note_id}</td>
            <td>${formatDate(report.note_created_at)}</td>
            <td class="max-w-xs truncate">${report.note_text || 'لا يوجد وصف'}</td>
            <td>
                <span class="status-badge status-${report.status}">
                    ${getStatusText(report.status)}
                </span>
            </td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                        <button onclick="viewReportDetails(${assignmentId})" class="action-btn btn-view" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)'">
                            <i class="fas fa-eye"></i> <span data-ar="عرض" data-en="View">عرض</span>
                        </button>
                        <button onclick="openReplyModal(${assignmentId})" class="action-btn btn-reply" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.3)'">
                            <i class="fas fa-reply"></i> <span data-ar="رد" data-en="Reply">رد</span>
                        </button>
                        <button onclick="openStatusModal(${assignmentId})" class="action-btn btn-status" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.3)'">
                            <i class="fas fa-edit"></i> <span data-ar="حالة" data-en="Status">حالة</span>
                        </button>
                    </div>
                </td>
        </tr>
        `;
    }).join('');
}

// تبديل اللغة
function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', currentLanguage);
    updateLanguage();
}

// تحديث اللغة
function updateLanguage() {
    const elements = document.querySelectorAll('[data-ar][data-en]');
    elements.forEach(element => {
        const text = currentLanguage === 'ar' ? 
            element.getAttribute('data-ar') : 
            element.getAttribute('data-en');
        element.textContent = text;
    });
    
    // تحديث اتجاه النص
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) {
        return 'لا يوجد تاريخ';
    }
    
    try {
        const date = new Date(dateString);
        
        // التحقق من صحة التاريخ
        if (isNaN(date.getTime())) {
            return 'تاريخ غير صحيح';
        }
        
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ:', error);
        return 'خطأ في التاريخ';
    }
}

// الحصول على نص الحالة
function getStatusText(status) {
    const statusTexts = {
        'assigned': { ar: 'مسند', en: 'Assigned' },
        'in_progress': { ar: 'تحت تنفيذ', en: 'Under Implementation' },
        'done': { ar: 'منفذة', en: 'Implemented' },
        'rejected': { ar: 'غير منفذة', en: 'Not Implemented' }
    };
    
    return statusTexts[status] ? statusTexts[status][currentLanguage] : status;
}

// عرض التحميل
function showLoading() {
    document.getElementById('loadingMessage').style.display = 'block';
}

// إخفاء التحميل
function hideLoading() {
    document.getElementById('loadingMessage').style.display = 'none';
}

// عرض رسالة نجاح
function showSuccess(message) {
    showToast(message, 'success');
    console.log('✅ نجاح:', message);
}

// عرض رسالة خطأ
function showError(message) {
    showToast(message, 'error');
}

// عرض الإشعار
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // إنشاء إشعار محسن
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    const bgColor = type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)';
    
    toastMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <i class="${icon}" style="font-size: 18px;"></i>
            </div>
            <span style="font-weight: 500;">${message}</span>
        </div>
    `;
    
    // تطبيق التصميم المحسن
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 9999;
        max-width: 400px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // إظهار الإشعار مع تأثير جميل
    setTimeout(() => {
        toast.style.transform = 'translateX(0) scale(1)';
    }, 100);
    
    // إخفاء الإشعار بعد 4 ثوان مع تأثير
    setTimeout(() => {
        toast.style.transform = 'translateX(100%) scale(0.8)';
        toast.style.opacity = '0';
    }, 4000);
}
