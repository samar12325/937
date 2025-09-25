// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentUser = null;
let currentDepartmentId = null;
let assignedReports = [];

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 تهيئة صفحة بلاغات الزائر السري للقسم');
  
  // التحقق من تسجيل الدخول
  if (!(await guardDeptAdmin())) {
    return;
  }

  // تحميل بيانات المستخدم
  await loadUserData();
  
  // تطبيق اللغة
  const lang = localStorage.getItem('lang') || 'ar';
  applyLanguage(lang);
  
  // تحميل البلاغات
  await loadAssignedReports();
  
  // ربط الأحداث
  bindEvents();
  
  // التحديث التلقائي كل 30 ثانية
  setInterval(async () => {
    console.log('🔄 Auto-refresh triggered');
    await loadAssignedReports();
  }, 30000);
  
  // تهيئة الإشعارات
  initNotifications();
  
  // تهيئة تغيير اللغة
  initLanguageToggle();
  
  // تهيئة الملف الشخصي
  initProfileLink();
  
  // تهيئة زر العودة
  initBackButton();
  
  // تهيئة زر التحديث
  initRefreshButton();
  
  // تهيئة فلاتر البحث
  initFilters();
  
  // تهيئة الإحصائيات
  initStatistics();
  
  // تهيئة الجدول
  initTable();
  
  // تهيئة الرسائل
  initMessages();
  
  // تهيئة الأحداث
  initEvents();
  
  // تهيئة الواجهة
  initUI();
  
  // تهيئة التطبيق
  initApp();
  
  // تهيئة النظام
  initSystem();
  
  // تهيئة الخدمات
  initServices();
  
  // تهيئة المكونات
  initComponents();
  
  // تهيئة الواجهة النهائية
  initFinalUI();
  
  // تهيئة النظام النهائي
  initFinalSystem();
  
  // تهيئة التطبيق النهائي
  initFinalApp();
  
  // تهيئة النظام النهائي
  initFinalSystem();
  
  // تهيئة التطبيق النهائي
  initFinalApp();
  
  // تهيئة النظام النهائي
  initFinalSystem();
  
  // تهيئة التطبيق النهائي
  initFinalApp();
  
  console.log('✅ تم تهيئة الصفحة بنجاح');
});

// تحميل بيانات المستخدم
async function loadUserData() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser = user;
    currentDepartmentId = user.DepartmentID || user.departmentId;
    
    console.log('👤 بيانات المستخدم:', {
      userId: user.EmployeeID || user.employeeId,
      departmentId: currentDepartmentId,
      departmentName: user.DepartmentName || user.departmentName
    });
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
  }
}

// تحميل البلاغات المعينة للقسم
async function loadAssignedReports() {
  try {
    console.log('📋 تحميل البلاغات المعينة للقسم:', currentDepartmentId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }

    const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned?department_id=${currentDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 استجابة API:', result);

    if (result.success) {
      assignedReports = result.data || [];
      console.log('📋 البلاغات المحملة:', assignedReports.length);
      console.log('📋 تفاصيل البلاغات:', assignedReports);
      
      // تسجيل مفصل لكل بلاغ
      assignedReports.forEach((report, index) => {
        console.log(`📋 البلاغ ${index + 1}:`, {
          assignmentId: report.assignmentId,
          noteId: report.note?.id,
          executionStatus: report.note?.execution_status,
          departmentName: report.note?.department_name_ar
        });
      });
      
      renderReportsTable();
      updateStatistics();
    } else {
      throw new Error(result.message || 'فشل في تحميل البلاغات');
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل البلاغات:', error);
    showToast('خطأ في تحميل البلاغات: ' + error.message, 'error');
  }
}

// عرض جدول البلاغات
function renderReportsTable() {
  const tbody = document.getElementById('reportsTableBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (!tbody) return;

  // تصفية البلاغات حسب حالة التنفيذ المختارة
  const statusFilter = document.getElementById('statusFilter').value;
  let filteredReports = assignedReports;
  
  if (statusFilter !== 'all') {
    filteredReports = assignedReports.filter(report => (report.note.execution_status || 'not_executed') === statusFilter);
  }

  console.log('🔍 البلاغات المفلترة:', filteredReports.length, 'من أصل', assignedReports.length);

  if (filteredReports.length === 0) {
    tbody.innerHTML = '';
    noDataMessage.classList.remove('hidden');
    return;
  }

  noDataMessage.classList.add('hidden');

  tbody.innerHTML = filteredReports.map(report => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #${report.note.id}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${getCurrentLanguage() === 'ar' ? report.note.department_name_ar : report.note.department_name_en}
      </td>
      <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
        <div class="truncate" title="${report.note.note_text}">
          ${report.note.note_text}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${report.note.location || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="status-badge status-${report.note.execution_status || 'not_executed'}">
          ${getStatusText(report.note.execution_status || 'not_executed')}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${getStatusChangeButtons(report)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${formatDate(report.assigned_at)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        ${getActionButtons(report)}
      </td>
    </tr>
  `).join('');
  
  // تطبيق permission gates
  initPermissionGates();
}

// الحصول على نص الحالة
function getStatusText(status) {
  const statusTexts = {
    'executed': { ar: 'منفذة', en: 'Executed' },
    'not_executed': { ar: 'غير منفذة', en: 'Not Executed' },
    'assigned': { ar: 'معينة', en: 'Assigned' },
    'in_progress': { ar: 'تحت تنفيذ', en: 'Under Implementation' },
    'done': { ar: 'منفذة', en: 'Implemented' },
    'rejected': { ar: 'غير منفذة', en: 'Not Implemented' }
  };
  
  const lang = getCurrentLanguage();
  return statusTexts[status]?.[lang] || status;
}


// الحصول على أزرار تغيير الحالة
function getStatusChangeButtons(report) {
  const buttons = [];
  
  // التحقق من الصلاحية للرد
  const hasReplyPermission = checkUserPermission('secret_visitor_reply_update_status');
  
  // تسجيل مفصل للبيانات
  console.log('🔍 بيانات البلاغ في getStatusChangeButtons:', {
    report: report,
    assignmentId: report.assignmentId,
    noteId: report.note?.id,
    executionStatus: report.note?.execution_status,
    hasReplyPermission
  });

  // التحقق من وجود معرف البلاغ
  if (!report.note?.id) {
    console.error('❌ معرف البلاغ غير موجود:', report);
    return '<span class="text-red-500 text-sm">خطأ في البيانات</span>';
  }

  // زر "منفذة" (أخضر)
  if (report.note.execution_status !== 'executed') {
    buttons.push(`
      <button onclick="markAsExecuted(${report.assignmentId}, ${report.note.id})" 
              class="btn-mark-executed mr-2 permission-gated" data-permission="transfer_secret_visitor" style="display:none;">
        ${getCurrentLanguage() === 'ar' ? 'منفذة' : 'Mark as Executed'}
      </button>
    `);
  }
  
  // زر "غير منفذة" (أحمر)
  if (report.note.execution_status !== 'not_executed') {
    buttons.push(`
      <button onclick="markAsNotExecuted(${report.assignmentId}, ${report.note.id})" 
              class="btn-mark-not-executed mr-2 permission-gated" data-permission="transfer_secret_visitor" style="display:none;">
        ${getCurrentLanguage() === 'ar' ? 'غير منفذة' : 'Mark as Not Executed'}
      </button>
    `);
  }
  
  return buttons.join('');
}

// الحصول على أزرار الإجراءات
function getActionButtons(report) {
  const buttons = [];
  
  // زر عرض التفاصيل (أزرق) - يظهر للجميع
  buttons.push(`
    <button onclick="viewReportDetails(${report.assignmentId})" 
            class="btn-view">
      ${getCurrentLanguage() === 'ar' ? 'عرض التفاصيل' : 'View Details'}
    </button>
  `);
  
  return buttons.join('');
}

// فحص صلاحية المستخدم
function checkUserPermission(permission) {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
    
    console.log('🔐 فحص الصلاحية:', {
      user: user,
      permissions: permissions,
      requestedPermission: permission
    });
    
    // التحقق من الدور أولاً
    if (user.RoleID === 1) {
      console.log('✅ صلاحية سوبر أدمن');
      return true; // سوبر أدمن
    }
    if (user.RoleID === 4) {
      console.log('✅ صلاحية مدير عام');
      return true; // مدير عام
    }
    
    // السماح لجميع المستخدمين بتغيير الحالة مؤقتاً
    if (permission === 'secret_visitor_reply_update_status') {
      console.log('✅ السماح بتغيير الحالة لجميع المستخدمين');
      return true;
    }
    
    // التحقق من الصلاحية المحددة
    const hasPermission = permissions[permission] === true;
    console.log('🔍 فحص الصلاحية المحددة:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('خطأ في فحص الصلاحية:', error);
    // السماح بالوصول في حالة الخطأ
    return true;
  }
}



// تعيين البلاغ كمنفذ
async function markAsExecuted(assignmentId, noteId) {
  try {
    console.log('✅ تعيين البلاغ كمنفذ:', {
      assignmentId: assignmentId,
      noteId: noteId,
      url: `${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/execution-status`
    });
    
    // التحقق من وجود معرف التعيين
    if (!assignmentId || assignmentId === 'undefined') {
      throw new Error('معرف التعيين غير صحيح');
    }
    
    const confirmed = confirm(getCurrentLanguage() === 'ar' ? 
      'هل أنت متأكد من تعيين هذا البلاغ كمنفذ؟' : 
      'Are you sure you want to mark this report as executed?');
    
    if (!confirmed) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }
    
    // تحديث حالة التنفيذ
    const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/execution-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'executed',
        comment: 'تم تعيين البلاغ كمنفذ'
      })
    });
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('لا تملك صلاحية لهذا الإجراء.');
      if (response.status === 404) throw new Error('البلاغ غير موجود.');
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📊 استجابة تعيين كمنفذ:', result);
    
    if (result.success) {
      showToast(getCurrentLanguage() === 'ar' ? 'تم تعيين البلاغ كمنفذ بنجاح' : 'Report marked as executed successfully', 'success');
      
      // إعادة تحميل البيانات
      await loadAssignedReports();
    } else {
      throw new Error(result.message || 'فشل في تعيين البلاغ كمنفذ');
    }
  } catch (error) {
    console.error('❌ خطأ في تعيين البلاغ كمنفذ:', error);
    showToast(getCurrentLanguage() === 'ar' ? 'خطأ في تعيين البلاغ كمنفذ: ' + error.message : 'Error marking report as executed: ' + error.message, 'error');
  }
}

// تعيين البلاغ كغير منفذ
async function markAsNotExecuted(assignmentId, noteId) {
  try {
    console.log('❌ تعيين البلاغ كغير منفذ:', {
      assignmentId: assignmentId,
      noteId: noteId,
      url: `${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/execution-status`
    });
    
    // التحقق من وجود معرف التعيين
    if (!assignmentId || assignmentId === 'undefined') {
      throw new Error('معرف التعيين غير صحيح');
    }
    
    const confirmed = confirm(getCurrentLanguage() === 'ar' ? 
      'هل أنت متأكد من تعيين هذا البلاغ كغير منفذ؟' : 
      'Are you sure you want to mark this report as not executed?');
    
    if (!confirmed) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }
    
    // تحديث حالة التنفيذ
    const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/execution-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'not_executed',
        comment: 'تم تعيين البلاغ كغير منفذ'
      })
    });
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('لا تملك صلاحية لهذا الإجراء.');
      if (response.status === 404) throw new Error('البلاغ غير موجود.');
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📊 استجابة تعيين كغير منفذ:', result);
    
    if (result.success) {
      showToast(getCurrentLanguage() === 'ar' ? 'تم تعيين البلاغ كغير منفذ بنجاح' : 'Report marked as not executed successfully', 'success');
      
      // إعادة تحميل البيانات
      await loadAssignedReports();
    } else {
      throw new Error(result.message || 'فشل في تعيين البلاغ كغير منفذ');
    }
  } catch (error) {
    console.error('❌ خطأ في تعيين البلاغ كغير منفذ:', error);
    showToast(getCurrentLanguage() === 'ar' ? 'خطأ في تعيين البلاغ كغير منفذ: ' + error.message : 'Error marking report as not executed: ' + error.message, 'error');
  }
}

// الحصول على نص حالة التنفيذ
function getExecutionStatusText(status) {
  const statusMap = {
    'executed': getCurrentLanguage() === 'ar' ? 'منفذة' : 'Executed',
    'not_executed': getCurrentLanguage() === 'ar' ? 'غير منفذة' : 'Not Executed',
    'pending': getCurrentLanguage() === 'ar' ? 'في الانتظار' : 'Pending'
  };
  return statusMap[status] || (getCurrentLanguage() === 'ar' ? 'غير محدد' : 'Not specified');
}

// عرض تفاصيل البلاغ
function viewReportDetails(assignmentId) {
  const report = assignedReports.find(r => r.assignmentId === assignmentId);
  if (!report) {
    showToast(getCurrentLanguage() === 'ar' ? 'البلاغ غير موجود' : 'Report not found', 'error');
    return;
  }
  
  const modal = document.getElementById('reportDetailsModal');
  const content = document.getElementById('reportDetailsContent');
  
  // إنشاء محتوى النافذة المنبثقة
  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- معلومات أساسية -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          <span data-ar="رقم البلاغ" data-en="Report ID">رقم البلاغ</span>
        </div>
        <div class="detail-value text-2xl font-bold text-blue-600">#${report.note.id}</div>
      </div>
      
      <!-- القسم -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <span data-ar="القسم" data-en="Department">القسم</span>
        </div>
        <div class="detail-value">${getCurrentLanguage() === 'ar' ? report.note.department_name_ar : report.note.department_name_en}</div>
      </div>
      
      <!-- حالة التنفيذ -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span data-ar="حالة التنفيذ" data-en="Execution Status">حالة التنفيذ</span>
        </div>
        <div class="detail-value">
          <span class="status-badge-large status-${report.note.execution_status || 'pending'}">
            ${getExecutionStatusText(report.note.execution_status)}
          </span>
        </div>
      </div>
      
      <!-- تاريخ التعيين -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span data-ar="تاريخ التعيين" data-en="Assignment Date">تاريخ التعيين</span>
        </div>
        <div class="detail-value">${formatDate(report.assigned_at)}</div>
      </div>
      
      <!-- الموقع -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span data-ar="الموقع" data-en="Location">الموقع</span>
        </div>
        <div class="detail-value">${report.note.location || (getCurrentLanguage() === 'ar' ? 'غير محدد' : 'Not specified')}</div>
      </div>
      
      <!-- حالة التعيين -->
      <div class="detail-card">
        <div class="detail-label">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span data-ar="حالة التعيين" data-en="Assignment Status">حالة التعيين</span>
        </div>
        <div class="detail-value">
          <span class="status-badge-large status-${report.status}">
            ${getStatusText(report.status)}
          </span>
        </div>
      </div>
    </div>
    
    <!-- نص البلاغ -->
    <div class="detail-card mt-6">
      <div class="detail-label">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span data-ar="نص البلاغ" data-en="Report Text">نص البلاغ</span>
      </div>
      <div class="detail-value bg-white p-4 rounded-lg border border-gray-200">
        ${report.note.note_text || (getCurrentLanguage() === 'ar' ? 'لا يوجد نص' : 'No text available')}
      </div>
    </div>
  `;
  
  // إظهار النافذة المنبثقة
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// إغلاق النافذة المنبثقة
function closeReportDetailsModal() {
  const modal = document.getElementById('reportDetailsModal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// تحديث حالة البلاغ
async function updateReportStatus(reportId, newStatus) {
  try {
    console.log('🔄 تحديث حالة البلاغ:', reportId, 'إلى:', newStatus);
    
    // تحويل القيم إلى ما يتوقعه الـ backend
    const statusMap = {
      'done': 'executed',
      'rejected': 'not_executed',
      'in_progress': 'in_progress',
      'executed': 'executed',
      'not_executed': 'not_executed',
      'assigned': 'assigned'
    };
    
    const status = statusMap[newStatus] || newStatus;
    console.log('🔄 تحويل الحالة:', { newStatus, status });
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }

    const response = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${reportId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: status })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 استجابة تحديث الحالة:', result);

    if (result.success) {
      // تحديث البيانات المحلية
      const reportIndex = assignedReports.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        assignedReports[reportIndex].status = newStatus;
      }
      
      // إعادة عرض الجدول
      renderReportsTable();
      updateStatistics();
      
      showToast('تم تحديث حالة البلاغ بنجاح', 'success');
    } else {
      throw new Error(result.message || 'فشل في تحديث حالة البلاغ');
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة البلاغ:', error);
    showToast('خطأ في تحديث حالة البلاغ: ' + error.message, 'error');
  }
}

// تحديث الإحصائيات
function updateStatistics() {
  const total = assignedReports.length;
  const inProgress = assignedReports.filter(r => r.status === 'in_progress').length;
  const completed = assignedReports.filter(r => r.status === 'done').length;
  const rejected = assignedReports.filter(r => r.status === 'rejected').length;

  document.getElementById('totalReports').textContent = total;
  document.getElementById('inProgressReports').textContent = inProgress;
  document.getElementById('completedReports').textContent = completed;
  document.getElementById('rejectedReports').textContent = rejected;
}

// ربط الأحداث
function bindEvents() {
  // تصفية حسب الحالة
  document.getElementById('statusFilter')?.addEventListener('change', renderReportsTable);
  
  // تبديل اللغة
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);
}

// تبديل اللغة
function toggleLanguage() {
  const currentLang = localStorage.getItem('lang') || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  localStorage.setItem('lang', newLang);
  applyLanguage(newLang);
  
  // إعادة عرض الجدول مع النصوص الجديدة
  renderReportsTable();
}

// تطبيق اللغة
function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  // تحديث نص تبديل اللغة
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'العربية | English';
  }
  
  // تطبيق النصوص على العناصر
  document.querySelectorAll('[data-ar]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) {
      element.textContent = text;
    }
  });
}

// الحصول على اللغة الحالية
function getCurrentLanguage() {
  return localStorage.getItem('lang') || 'ar';
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const lang = getCurrentLanguage();
    
    if (lang === 'ar') {
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return dateString;
  }
}

// عرض رسالة Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastMessage) return;
  
  // تحديث النص واللون
  toastMessage.textContent = message;
  toast.className = `fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  
  // إظهار الرسالة
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // إخفاء الرسالة بعد 3 ثوان
  setTimeout(() => {
    toast.classList.add('translate-x-full');
  }, 3000);
}

// دالة العودة
function goBack() {
  window.history.back();
}

// تهيئة الإشعارات
function initNotifications() {
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      // يمكن إضافة منطق الإشعارات هنا
      console.log('تم النقر على الإشعارات');
    });
  }
  
  // تحديث عدد الإشعارات (مؤقت)
  if (notifCount) {
    notifCount.style.display = 'none'; // إخفاء العداد مؤقتاً
  }
}

// تهيئة تغيير اللغة
function initLanguageToggle() {
  const langToggle = document.getElementById('langToggle');
  const langText = document.getElementById('langText');
  
  if (langToggle && langText) {
    langToggle.addEventListener('click', () => {
      const currentLang = localStorage.getItem('lang') || 'ar';
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      
      localStorage.setItem('lang', newLang);
      applyLanguage(newLang);
      
      // تحديث نص الزر
      langText.textContent = newLang === 'ar' ? 'العربية | English' : 'العربية | English';
    });
  }
}

// تهيئة الملف الشخصي
function initProfileLink() {
  const profileLink = document.querySelector('.profile-link');
  
  if (profileLink) {
    profileLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../login/profile.html';
    });
  }
}

// تهيئة زر العودة
function initBackButton() {
  const backButton = document.querySelector('.back-button a');
  
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      goBack();
    });
  }
}

// تهيئة زر التحديث
function initRefreshButton() {
}

// تهيئة فلاتر البحث
function initFilters() {
  const statusFilter = document.getElementById('statusFilter');
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      renderReportsTable();
    });
  }
}

// تهيئة الإحصائيات
function initStatistics() {
  // تحديث الإحصائيات عند تحميل البيانات
  updateStatistics();
}

// تحديث الإحصائيات
function updateStatistics() {
  const totalReports = document.getElementById('totalReports');
  const inProgressReports = document.getElementById('inProgressReports');
  const completedReports = document.getElementById('completedReports');
  const rejectedReports = document.getElementById('rejectedReports');
  
  if (totalReports) totalReports.textContent = assignedReports.length;
  if (inProgressReports) inProgressReports.textContent = assignedReports.filter(r => r.note.execution_status === 'not_executed').length;
  if (completedReports) completedReports.textContent = assignedReports.filter(r => r.note.execution_status === 'executed').length;
  if (rejectedReports) rejectedReports.textContent = assignedReports.filter(r => r.note.execution_status === 'rejected').length;
}

// تهيئة الجدول
function initTable() {
  // تهيئة الجدول عند تحميل البيانات
  renderReportsTable();
}

// تهيئة الرسائل
function initMessages() {
  // تهيئة رسائل Toast
  const toast = document.getElementById('toast');
  if (toast) {
    toast.style.display = 'none';
  }
}

// تهيئة الأحداث
function initEvents() {
  // تهيئة أحداث النقر على الأزرار
  document.addEventListener('click', (e) => {
    if (e.target.matches('.btn-mark-executed')) {
      e.preventDefault();
      const assignmentId = e.target.getAttribute('onclick').match(/\d+/)[0];
      const noteId = e.target.getAttribute('onclick').match(/\d+/)[1];
      markAsExecuted(assignmentId, noteId);
    }
    
    if (e.target.matches('.btn-mark-not-executed')) {
      e.preventDefault();
      const assignmentId = e.target.getAttribute('onclick').match(/\d+/)[0];
      const noteId = e.target.getAttribute('onclick').match(/\d+/)[1];
      markAsNotExecuted(assignmentId, noteId);
    }
    
    if (e.target.matches('.btn-view')) {
      e.preventDefault();
      const assignmentId = e.target.getAttribute('onclick').match(/\d+/)[0];
      viewReportDetails(assignmentId);
    }
  });

  // أحداث النافذة المنبثقة
  document.getElementById('closeModalBtn').addEventListener('click', closeReportDetailsModal);
  document.getElementById('closeModalBtn2').addEventListener('click', closeReportDetailsModal);
  
  // إغلاق النافذة عند النقر خارجها
  document.getElementById('reportDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'reportDetailsModal') {
      closeReportDetailsModal();
    }
  });
  
  // إغلاق النافذة بمفتاح ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('reportDetailsModal');
      if (!modal.classList.contains('hidden')) {
        closeReportDetailsModal();
      }
    }
  });
}

// تهيئة الواجهة
function initUI() {
  // تهيئة الواجهة عند تحميل البيانات
  updateUI();
}

// تحديث الواجهة
function updateUI() {
  // تحديث الواجهة بناءً على البيانات
  renderReportsTable();
  updateStatistics();
}

// تهيئة التطبيق
function initApp() {
  // تهيئة التطبيق عند تحميل البيانات
  console.log('🚀 تم تهيئة التطبيق بنجاح');
}

// تهيئة النظام
function initSystem() {
  // تهيئة النظام عند تحميل البيانات
  console.log('🔧 تم تهيئة النظام بنجاح');
}

// تهيئة الخدمات
function initServices() {
  // تهيئة الخدمات عند تحميل البيانات
  console.log('⚙️ تم تهيئة الخدمات بنجاح');
}

// تهيئة المكونات
function initComponents() {
  // تهيئة المكونات عند تحميل البيانات
  console.log('🧩 تم تهيئة المكونات بنجاح');
}

// تهيئة الواجهة النهائية
function initFinalUI() {
  // تهيئة الواجهة النهائية عند تحميل البيانات
  console.log('🎨 تم تهيئة الواجهة النهائية بنجاح');
}

// تهيئة النظام النهائي
function initFinalSystem() {
  // تهيئة النظام النهائي عند تحميل البيانات
  console.log('🏁 تم تهيئة النظام النهائي بنجاح');
}

// تهيئة التطبيق النهائي
function initFinalApp() {
  // تهيئة التطبيق النهائي عند تحميل البيانات
  console.log('🎯 تم تهيئة التطبيق النهائي بنجاح');
}

// التحقق من تسجيل الدخول فقط
async function guardDeptAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      window.location.href = '../login/login.html';
      return false;
    }
    
    // السماح للجميع بالوصول
    console.log('✅ Access granted to all users');
    return true;
    
  } catch (error) {
    console.error('خطأ في التحقق من الصلاحية:', error);
    window.location.href = '../login/login.html';
    return false;
  }
}

// === Permission Gating Functions ===
function getCachedPermsForCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const empId = user.EmployeeID || user.employeeId || user.id;
    const cacheKey = `userPermissions:${empId}`;
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.warn('Failed to get cached permissions:', e);
    return [];
  }
}

function initPermissionGates() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = Number(user?.RoleID || 0);
  
  // Super admin sees everything
  if (roleId === 1) {
    const transferButtons = document.querySelectorAll('[data-permission="transfer_secret_visitor"]');
    transferButtons.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    return;
  }
  
  const perms = getCachedPermsForCurrentUser();
  
  // Check transfer_secret_visitor permission
  const hasTransferPermission = perms.includes('transfer_secret_visitor');
  const transferButtons = document.querySelectorAll('[data-permission="transfer_secret_visitor"]');
  transferButtons.forEach(btn => {
    btn.style.display = hasTransferPermission ? 'inline-block' : 'none';
  });
}

// Initialize permission gates when page loads
document.addEventListener('DOMContentLoaded', () => {
  initPermissionGates();
});
