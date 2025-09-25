// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let currentUser = null;
let currentDepartmentId = null;
let availableReports = [];
let departmentEmployees = [];
let selectedReport = null;
let selectedEmployee = null;

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 تهيئة صفحة توزيع بلاغات الزائر السري على الموظفين');
  
  // التحقق من تسجيل الدخول
  if (!(await guardDeptAdmin())) {
    return;
  }

  // تحميل بيانات المستخدم
  await loadUserData();
  
  // تطبيق اللغة
  const lang = localStorage.getItem('lang') || 'ar';
  applyLanguage(lang);
  
  // تحميل البيانات
  await loadAvailableReports();
  await loadDepartmentEmployees();
  
  // ربط الأحداث
  bindEvents();
  
  // التحديث التلقائي كل 30 ثانية
  setInterval(async () => {
    console.log('🔄 Auto-refresh triggered');
    await loadAvailableReports();
    await loadDepartmentEmployees();
  }, 30000);
  
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

// تحميل البلاغات المتاحة للتوزيع (الموزعة لهذا القسم فقط)
async function loadAvailableReports() {
  try {
    console.log('📋 تحميل البلاغات الموزعة للقسم:', currentDepartmentId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }

    // تحميل البلاغات الموزعة لهذا القسم فقط (بنفس طريقة dept-secret-visitor-inbox)
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
    console.log('📊 استجابة API للبلاغات الموزعة للقسم:', result);

    if (result.success) {
      availableReports = result.data || [];
      console.log('📋 البلاغات الموزعة للقسم:', availableReports.length);
      
      renderReportsTable();
    } else {
      throw new Error(result.message || 'فشل في تحميل البلاغات');
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل البلاغات:', error);
    showToast('خطأ في تحميل البلاغات: ' + error.message, 'error');
  }
}

// تحميل موظفي القسم
async function loadDepartmentEmployees() {
  try {
    console.log('👥 تحميل موظفي القسم:', currentDepartmentId);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }

    const response = await fetch(`${API_BASE_URL}/dept-admin/department-employees/${currentDepartmentId}/assignable`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📊 استجابة API لموظفي القسم:', result);

    if (result.success) {
      departmentEmployees = result.data || [];
      console.log('👥 موظفو القسم:', departmentEmployees.length);
    } else {
      throw new Error(result.message || 'فشل في تحميل موظفي القسم');
    }
  } catch (error) {
    console.error('❌ خطأ في تحميل موظفي القسم:', error);
    showToast('خطأ في تحميل موظفي القسم: ' + error.message, 'error');
  }
}

// عرض جدول البلاغات (بنفس تنسيق توزيع الشكاوى)
function renderReportsTable() {
  const tbody = document.getElementById('reportsTableBody');
  const noDataMessage = document.getElementById('noDataMessage');
  
  if (!tbody) return;

  // تصفية البلاغات حسب الحالة المختارة
  const statusFilter = document.getElementById('statusFilter').value;
  let filteredReports = availableReports;
  
  if (statusFilter !== 'all') {
    filteredReports = availableReports.filter(report => report.status === statusFilter);
  }

  console.log('🔍 البلاغات المفلترة:', filteredReports.length, 'من أصل', availableReports.length);
  if (filteredReports.length > 0) {
    console.log('🔍 Sample report with employee info:', {
      id: filteredReports[0].note.id,
      assigned_to_employee_id: filteredReports[0].assigned_to_employee_id,
      assigned_employee_name: filteredReports[0].assigned_employee_name
    });
  }

  if (filteredReports.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text" data-ar="لا توجد بلاغات موزعة لهذا القسم" data-en="No reports assigned to this department">لا توجد بلاغات موزعة لهذا القسم</div>
          <div class="empty-state-subtext" data-ar="يجب أن يتم توزيع البلاغات على القسم أولاً من قبل المدير العام" data-en="Reports must be assigned to this department first by the general manager">يجب أن يتم توزيع البلاغات على القسم أولاً من قبل المدير العام</div>
        </td>
      </tr>
    `;
    return;
  }

  if (noDataMessage) {
    noDataMessage.classList.add('hidden');
  }

  tbody.innerHTML = filteredReports.map(report => {
    // زر توزيع وزر عرض التفاصيل (مثل الصورة)
    const actionButtons = `<button class="btn-small btn-assign" onclick="showEmployeeDistribution(${report.note.id})" data-ar="توزيع" data-en="Distribute">توزيع</button>
                           <button class="btn-small btn-view" onclick="viewReportDetails(${report.note.id})" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</button>`;
    
    return `
      <tr>
        <td>
          #${report.note.id}
        </td>
        <td>
          ${getCurrentLanguage() === 'ar' ? report.note.department_name_ar : report.note.department_name_en}
        </td>
        <td>
          <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${report.note.note_text}">
            ${report.note.note_text}
          </div>
        </td>
        <td>
          ${report.note.location || '-'}
        </td>
        <td>
          ${formatDate(report.note.created_at)}
        </td>
        <td>
          <span class="status-badge status-${report.status || 'routed_to_department'}">
            ${getStatusText(report.status || 'routed_to_department')}
          </span>
        </td>
        <td>
          ${report.assigned_employee_name || (getCurrentLanguage() === 'ar' ? 'غير مخصص' : 'Unassigned')}
        </td>
        <td class="action-buttons">${actionButtons}</td>
      </tr>
    `;
  }).join('');
}

// عرض قائمة الموظفين (لم تعد مطلوبة - تم استبدالها بـ Modal)
function renderEmployeesList() {
  // هذه الدالة لم تعد مطلوبة - تم استبدالها بـ Modal
  console.log('👥 تم تحميل موظفي القسم:', departmentEmployees.length);
}

// عرض قائمة الموظفين للتوزيع
function showEmployeeDistribution(reportId) {
  selectedReport = availableReports.find(r => r.note.id === reportId);
  selectedEmployee = null;
  
  console.log('📋 تم اختيار البلاغ للتوزيع:', selectedReport);
  
  if (!selectedReport) {
    showToast('البلاغ غير موجود', 'error');
    return;
  }
  
  // إضافة تأثير بصري للبلاغ المختار
  document.querySelectorAll('tr').forEach(row => {
    row.classList.remove('bg-blue-50');
  });
  
  const selectedRow = document.querySelector(`button[onclick="showEmployeeDistribution(${reportId})"]`).closest('tr');
  if (selectedRow) {
    selectedRow.classList.add('bg-blue-50');
  }
  
  // عرض معلومات البلاغ في Modal
  const reportInfo = document.getElementById('selectedReportInfo');
  if (reportInfo) {
    reportInfo.innerHTML = `
      <h4 class="font-medium text-gray-900 mb-2" data-ar="تفاصيل البلاغ" data-en="Report Details">تفاصيل البلاغ</h4>
      <div class="space-y-2 text-sm">
        <p><strong data-ar="رقم البلاغ" data-en="Report ID">رقم البلاغ:</strong> #${selectedReport.note.id}</p>
        <p><strong data-ar="القسم" data-en="Department">القسم:</strong> ${getCurrentLanguage() === 'ar' ? selectedReport.note.department_name_ar : selectedReport.note.department_name_en}</p>
        <p><strong data-ar="النص" data-en="Text">النص:</strong> ${selectedReport.note.note_text}</p>
        <p><strong data-ar="الموقع" data-en="Location">الموقع:</strong> ${selectedReport.note.location || '-'}</p>
      </div>
    `;
  }
  
  // ملء قائمة الموظفين في الـ select
  populateEmployeeSelect();
  
  // إظهار Modal
  const modal = document.getElementById('distributionModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// ملء قائمة الموظفين في الـ select
function populateEmployeeSelect() {
  const employeeSelect = document.getElementById('employeeSelect');
  if (!employeeSelect) return;
  
  // مسح الخيارات الموجودة
  employeeSelect.innerHTML = '<option value="" data-ar="اختر موظف..." data-en="Select an employee...">اختر موظف...</option>';
  
  // إضافة الموظفين
  departmentEmployees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.EmployeeID;
    option.textContent = `${employee.FullName || employee.fullName} (${employee.Position || employee.position || 'موظف'})`;
    employeeSelect.appendChild(option);
  });
  
  console.log('👥 تم ملء قائمة الموظفين:', departmentEmployees.length);
}

// إغلاق Modal التوزيع
function closeDistributionModal() {
  const modal = document.getElementById('distributionModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
  
  // إعادة تعيين التحديد
  selectedReport = null;
  selectedEmployee = null;
  
  // إزالة التأثيرات البصرية
  document.querySelectorAll('tr').forEach(row => {
    row.classList.remove('bg-blue-50');
  });
}

// تأكيد التوزيع
function confirmDistribution() {
  const employeeSelect = document.getElementById('employeeSelect');
  if (!employeeSelect || !employeeSelect.value) {
    showToast('يرجى اختيار موظف', 'warning');
    return;
  }
  
  if (!selectedReport) {
    showToast('البلاغ غير محدد', 'error');
    return;
  }
  
  const employeeId = parseInt(employeeSelect.value);
  selectedEmployee = departmentEmployees.find(e => e.EmployeeID === employeeId);
  
  if (!selectedEmployee) {
    showToast('الموظف غير موجود', 'error');
    return;
  }
  
  console.log('🔄 تأكيد التوزيع:', {
    reportId: selectedReport.note.id,
    employeeId: selectedEmployee.EmployeeID
  });
  
  // عرض modal التأكيد النهائي
  showFinalConfirmationModal();
}

// عرض modal التأكيد النهائي
function showFinalConfirmationModal() {
  if (!selectedReport || !selectedEmployee) return;
  
  const confirmMessage = `
    هل أنت متأكد من توزيع البلاغ #${selectedReport.note.id} على الموظف ${selectedEmployee.FullName || selectedEmployee.fullName}؟
  `;
  
  if (confirm(confirmMessage)) {
    // تنفيذ التوزيع
    executeDistribution();
  }
}

// تنفيذ التوزيع
async function executeDistribution() {
  if (!selectedReport || !selectedEmployee) return;
  
  try {
    console.log('🔄 تنفيذ توزيع البلاغ:', {
      reportId: selectedReport.note.id,
      employeeId: selectedEmployee.EmployeeID,
      currentDepartmentId: currentDepartmentId,
      selectedEmployeeDepartmentId: selectedEmployee.DepartmentID,
      finalDepartmentId: selectedEmployee.DepartmentID || currentDepartmentId
    });
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token غير موجود');
    }

    // التحقق من البيانات المطلوبة قبل الإرسال
    if (!selectedReport?.note?.id) {
      showToast('رقم البلاغ مفقود', 'error');
      return;
    }
    if (!selectedEmployee?.EmployeeID) {
      showToast('اختر موظفًا', 'warning');
      return;
    }

    // تحديد معرف القسم
    const deptId = selectedEmployee?.DepartmentID || currentDepartmentId;
    if (!deptId) {
      showToast('قسم غير معروف', 'error');
      return;
    }

    // إعداد جسم الطلب مع البيانات الصحيحة
    const requestBody = {
      note_id: selectedReport.note.id,                             // من البلاغ
      assigned_department_id: deptId,
      assigned_department_name_ar: selectedReport.note.department_name_ar, // من البلاغ
      assigned_department_name_en: selectedReport.note.department_name_en, // من البلاغ
      assigned_to_employee_id: selectedEmployee.EmployeeID,        // أهم حقل للموظف
      assigned_by: (currentUser.EmployeeID || currentUser.employeeId),
      status: 'assigned'
    };

    console.log('📤 بيانات الطلب المرسلة:', requestBody);

    const response = await fetch(`${API_BASE_URL}/secret-visitor/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('📊 استجابة توزيع البلاغ:', result);

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        if (result?.message) {
          errorMsg = result.message;
        }
      } catch (e) {
        console.error('خطأ في قراءة رسالة الخطأ:', e);
      }
      
      // رسائل خطأ أكثر وضوحاً
      if (response.status === 403) {
        errorMsg = 'ليس لديك صلاحية لتوزيع البلاغات. يرجى التواصل مع المدير العام.';
      } else if (response.status === 401) {
        errorMsg = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
      }
      
      throw new Error(errorMsg);
    }

    if (result.success) {
      showToast('تم توزيع البلاغ على الموظف بنجاح', 'success');
      
      // إغلاق Modal
      closeDistributionModal();
      
      // إعادة تحميل البيانات
      await loadAvailableReports();
    } else {
      throw new Error(result.message || 'فشل في توزيع البلاغ');
    }
  } catch (error) {
    console.error('❌ خطأ في توزيع البلاغ:', error);
    showToast('خطأ في توزيع البلاغ: ' + error.message, 'error');
  }
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('ar-SA', options);
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return dateString;
  }
}

// عرض تفاصيل البلاغ (بنفس طريقة عرض تفاصيل الشكاوى)
function viewReportDetails(reportId) {
  const report = availableReports.find(r => r.note.id === reportId);
  if (!report) {
    showToast('البلاغ غير موجود', 'error');
    return;
  }
  
  // ملء البيانات في النافذة المنبثقة
  document.getElementById('detailReportId').textContent = `#${report.note.id}`;
  document.getElementById('detailDepartment').textContent = getCurrentLanguage() === 'ar' ? report.note.department_name_ar : report.note.department_name_en;
  document.getElementById('detailText').textContent = report.note.note_text;
  document.getElementById('detailLocation').textContent = report.note.location || (getCurrentLanguage() === 'ar' ? 'غير محدد' : 'Not specified');
  document.getElementById('detailCreatedAt').textContent = formatDate(report.note.created_at);
  
  // عرض الحالة مع شارة ملونة
  const statusElement = document.getElementById('detailStatus');
  const statusText = getStatusText(report.status || 'routed_to_department');
  statusElement.innerHTML = `<span class="status-badge status-${report.status || 'routed_to_department'}">${statusText}</span>`;
  
  // عرض الموظف المسند إليه
  const assignedToElement = document.getElementById('detailAssignedTo');
  if (report.assigned_employee_name) {
    assignedToElement.textContent = report.assigned_employee_name;
  } else {
    assignedToElement.textContent = getCurrentLanguage() === 'ar' ? 'غير مخصص' : 'Unassigned';
  }
  
  // إظهار النافذة المنبثقة
  const detailsModal = document.getElementById('detailsModal');
  if (detailsModal) {
    detailsModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // التأكد من أن النافذة تظهر في المقدمة
    detailsModal.style.zIndex = '9999';
    
    console.log('✅ تم فتح نافذة تفاصيل البلاغ:', reportId);
  }
}

// إغلاق نافذة التفاصيل
function closeDetailsModal() {
  const detailsModal = document.getElementById('detailsModal');
  if (detailsModal) {
    detailsModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    
    console.log('✅ تم إغلاق نافذة تفاصيل البلاغ');
  }
}

// الحصول على نص الحالة
function getStatusText(status) {
  const statusTexts = {
    'assigned': { ar: 'معينة', en: 'Assigned' },
    'in_progress': { ar: 'تحت تنفيذ', en: 'Under Implementation' },
    'done': { ar: 'منفذة', en: 'Implemented' },
    'rejected': { ar: 'غير منفذة', en: 'Not Implemented' },
    'unassigned': { ar: 'غير معينة', en: 'Unassigned' }
  };
  
  const lang = getCurrentLanguage();
  return statusTexts[status]?.[lang] || status;
}

// ربط الأحداث
function bindEvents() {
  // تصفية حسب الحالة
  document.getElementById('statusFilter')?.addEventListener('change', renderReportsTable);
  
  // تبديل اللغة
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);
  
  // إغلاق modal التوزيع عند النقر خارجه
  document.getElementById('distributionModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'distributionModal') {
      closeDistributionModal();
    }
  });
  
  // إغلاق نافذة التفاصيل عند النقر خارجه
  document.getElementById('detailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailsModal') {
      closeDetailsModal();
    }
  });
  
  // إغلاق modal عند الضغط على Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const distributionModal = document.getElementById('distributionModal');
      const detailsModal = document.getElementById('detailsModal');
      
      if (distributionModal && !distributionModal.classList.contains('hidden')) {
        closeDistributionModal();
      } else if (detailsModal && !detailsModal.classList.contains('hidden')) {
        closeDetailsModal();
      }
    }
  });
}

// تبديل اللغة
function toggleLanguage() {
  const currentLang = localStorage.getItem('lang') || 'ar';
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  
  localStorage.setItem('lang', newLang);
  applyLanguage(newLang);
  
  // إعادة عرض الجداول مع النصوص الجديدة
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

// عرض رسالة Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastMessage) return;
  
  // تحديث النص واللون
  toastMessage.textContent = message;
  toast.className = `fixed top-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' : 
    type === 'info' ? 'bg-blue-500' : 'bg-green-500'
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


// التحقق من تسجيل الدخول والصلاحيات
async function guardDeptAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    // التحقق من وجود المستخدم والـ token
    if (!user || !token) {
      window.location.href = '../login/login.html';
      return false;
    }
    
    // التحقق من الصلاحيات
    const roleId = user.RoleID || user.roleId;
    const permissions = user.permissions || [];
    
    console.log('🔐 فحص صلاحيات المستخدم:', { 
      roleId, 
      permissions,
      hasSecretVisitorDistribution: permissions.includes('secret_visitor_employee_distribution'),
      hasDistributeDept: permissions.includes('secret_visitor_distribute_dept')
    });
    
    // السماح للسوبر أدمن ومديري الأقسام
    if (roleId === 1 || roleId === 3) {
      console.log('✅ تم السماح بالوصول - صلاحيات إدارية');
      return true;
    }
    
    // السماح للمستخدمين الذين لديهم صلاحية التوزيع
    if (permissions.includes('secret_visitor_employee_distribution') || 
        permissions.includes('secret_visitor_distribute_dept')) {
      console.log('✅ تم السماح بالوصول - صلاحية توزيع متاحة');
      return true;
    }
    
    // إذا لم يكن لديه الصلاحيات المطلوبة
    console.log('❌ لا يملك الصلاحيات المطلوبة');
    
    // إخفاء المحتوى الرئيسي وعرض رسالة عدم وجود صلاحيات
    const mainContent = document.querySelector('.page-container');
    const noPermissionMessage = document.getElementById('noPermissionMessage');
    
    if (mainContent) {
      mainContent.style.display = 'none';
    }
    
    if (noPermissionMessage) {
      noPermissionMessage.classList.remove('hidden');
    }
    
    showToast('ليس لديك صلاحية للوصول لهذه الصفحة. يرجى التواصل مع المدير العام.', 'error');
    
    // إعادة توجيه للصفحة الرئيسية بدلاً من صفحة تسجيل الدخول
    setTimeout(() => {
      window.location.href = '../dept-admin/dept-admin.html';
    }, 10000); // زيادة الوقت لقراءة الرسالة
    
    // إضافة عداد تنازلي
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      const countdownElement = document.querySelector('.countdown-timer');
      if (countdownElement) {
        countdownElement.textContent = countdown;
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // إضافة تأثير بصري للعداد
    const countdownElement = document.querySelector('.countdown-timer');
    if (countdownElement) {
      countdownElement.style.transition = 'all 0.3s ease';
      countdownElement.style.transform = 'scale(1.1)';
      setTimeout(() => {
        countdownElement.style.transform = 'scale(1)';
      }, 300);
    }
    
    return false;
  } catch (error) {
    console.error('خطأ في التحقق من تسجيل الدخول:', error);
    window.location.href = '../login/login.html';
    return false;
  }
}
