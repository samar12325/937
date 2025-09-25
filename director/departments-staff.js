/* ====== إدارة الأقسام والموظفين ====== */

const API_BASE_URL = 'http://localhost:3001/api';

// Back navigation function
function goBack() {
  window.history.back();
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

let currentLanguage = 'ar';
let allDepartments = [];
let selectedDepartmentId = null;
let selectedDepartmentEmployees = [];

/* ====== أدوات DOM ====== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Departments & Staff Page Loading ===');

  const departmentsList = $('#departments-list');
  const loadingDepartments = $('#loading-departments');
  const noDepartments = $('#no-departments');
  const departmentSearch = $('#department-search');
  const clearDeptSearch = $('#clear-dept-search');

  const employeesList = $('#employees-list');
  const loadingEmployees = $('#loading-employees');
  const noEmployees = $('#no-employees');
  const selectDepartmentHint = $('#select-department-hint');
  const selectedDepartmentInfo = $('#selected-department-info');
  const selectedDepartmentName = $('#selected-department-name');
  const employeesCount = $('#employees-count');

  const addEmployeeBtn = $('#add-employee-btn');
  const addEmployeeModal = $('#add-employee-modal');
  const closeModal = $('#close-modal');
  const cancelAdd = $('#cancel-add');
  const addEmployeeForm = $('#add-employee-form');
  const employeeDepartment = $('#employee-department');
  const toast = $('#toast');
  const toastMessage = $('#toast-message');

  const langToggle = $('#langToggle');
  const mainDepartmentSelector = $('#main-department-selector');
  const departmentCounters = $('#departmentCounters');
  const mainEmployeesCount = $('#main-employees-count');

  // ====== تحميل الأقسام (من الباك الحقيقي) ======
  async function loadDepartments() {
    try {
      loadingDepartments.hidden = false;
      noDepartments.hidden = true;
      departmentsList.innerHTML = '';

      const res = await fetch(`${API_BASE_URL}/director/get_departments`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`Failed to fetch departments. HTTP ${res.status}: ${errTxt.substring(0,120)}`);
      }

      const payload = await res.json();
      allDepartments = Array.isArray(payload?.data) ? payload.data : [];

      loadingDepartments.hidden = true;
      renderDepartments(allDepartments);
      populateDepartmentDropdown();
      populateMainDepartmentSelector();

      // تلميح أولي
      selectDepartmentHint.hidden = false;
      selectedDepartmentInfo.hidden = true;
      employeesList.hidden = true;
      addEmployeeBtn.disabled = true;
      departmentCounters.hidden = true;

    } catch (error) {
      console.error('[Director] loadDepartments error:', error);
      loadingDepartments.hidden = true;
      noDepartments.hidden = true;
      showError('فشل في تحميل الأقسام - تحقق من تشغيل الخادم والصلاحيات');
    }
  }

  function renderDepartments(departments) {
    departmentsList.innerHTML = '';

    if (!departments.length) {
      noDepartments.hidden = false;
      return;
    }
    noDepartments.hidden = true;

    departments.forEach(dept => {
      const deptRow = document.createElement('div');
      deptRow.className = 'department-row';
      deptRow.setAttribute('data-department-id', dept.DepartmentID);
      deptRow.setAttribute('role', 'button');
      deptRow.setAttribute('tabindex', '0');

      deptRow.innerHTML = `
        <div class="department-info">
          <div class="department-name">${dept.DepartmentName}</div>
          <div class="department-meta">
            <span>${dept.Description || ''}</span>
          </div>
        </div>
        <div class="department-stats">
          <span class="stat-badge employees">
            ${Number(dept.employeeCount || 0)} ${currentLanguage === 'ar' ? 'موظف' : 'employees'}
          </span>
        </div>
      `;

      const onPick = () => selectDepartment(dept);
      deptRow.addEventListener('click', onPick);
      deptRow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      });

      departmentsList.appendChild(deptRow);
    });
  }

  // اختيار قسم
  async function selectDepartment(department) {
    selectedDepartmentId = department.DepartmentID;

    mainDepartmentSelector.value = department.DepartmentID;

    $$('.department-row.selected').forEach(el => el.classList.remove('selected'));
    const selectedRow = $(`[data-department-id="${department.DepartmentID}"]`);
    if (selectedRow) selectedRow.classList.add('selected');

    selectDepartmentHint.hidden = true;
    selectedDepartmentInfo.hidden = false;
    selectedDepartmentName.textContent = department.DepartmentName;
    employeesCount.textContent = Number(department.employeeCount || 0);

    departmentCounters.hidden = false;
    mainEmployeesCount.textContent = Number(department.employeeCount || 0);

    addEmployeeBtn.disabled = false;

    await loadDepartmentEmployees(department.DepartmentID);
  }

  // تحميل موظفي القسم (من الباك الحقيقي)
  async function loadDepartmentEmployees(departmentId) {
    try {
      loadingEmployees.hidden = false;
      noEmployees.hidden = true;
      employeesList.hidden = true;

      const res = await fetch(`${API_BASE_URL}/director/departments/${departmentId}/employees`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`Failed to fetch employees for dept ${departmentId}. HTTP ${res.status}: ${errTxt.substring(0,120)}`);
      }

      const payload = await res.json();
      let employees = Array.isArray(payload?.data) ? payload.data : [];

      // استبعاد السوبر أدمن احتياطاً لو كان موجود بالإستعلام
      employees = employees.filter(emp => Number(emp.RoleID) !== 1);

      selectedDepartmentEmployees = employees;
      loadingEmployees.hidden = true;
      renderEmployees(selectedDepartmentEmployees);

    } catch (error) {
      console.error('[Director] loadDepartmentEmployees error:', error);
      loadingEmployees.hidden = true;
      noEmployees.hidden = false;
      employeesList.hidden = true;
      showError('فشل في تحميل موظفي القسم');
    }
  }

  // اجعل الدوال عالمية ليستطيع onclick الوصول لها
  window.getEffectiveUserPermissions = function getEffectiveUserPermissions() {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const empId = Number(u?.EmployeeID || 0);
      const scopedKey = empId ? `userPermissions:${empId}` : null;

      if (scopedKey) {
        const scoped = JSON.parse(localStorage.getItem(scopedKey) || '[]');
        if (Array.isArray(scoped) && scoped.length) return scoped;
      }
      const fallback = JSON.parse(localStorage.getItem('permissionsList') || '[]');
      if (Array.isArray(fallback)) return fallback;
    } catch {}
    return [];
  };

  window.userCanManagePermissions = function userCanManagePermissions() {
    const perms = window.getEffectiveUserPermissions();
    const keys = ['manage_permissions', 'rbac.manage'];
    return keys.some(k => perms.includes(k));
  };

  window.editPermissions = function editPermissions(employeeId) {
    const id = Number(employeeId);
    if (!id) { console.warn('[Director] Invalid employeeId for permissions:', employeeId); return; }
    window.location.href = `/superadmin/permissions.html?employee=${id}`;
  };

  function renderEmployees(employees) {
    const employeesList = $('#employees-list');
    const noEmployees = $('#no-employees');

    employeesList.innerHTML = '';

    if (!Array.isArray(employees) || employees.length === 0) {
      noEmployees.hidden = false;
      employeesList.hidden = true;
      return;
    }

    noEmployees.hidden = true;
    employeesList.hidden = false;

    employees.forEach(employee => {
      const empRow = document.createElement('div');
      empRow.className = 'employee-row';

      const employeeName = employee.FullName || employee.Username || `موظف ${employee.EmployeeID || ''}`;
      const employeeEmail = employee.Email || 'لا يوجد بريد إلكتروني';
      const employeeJobTitle = employee.Specialty || employee.jobTitle || 'موظف عام';
      const employeeRole = getRoleLabel(employee.RoleID) || 'موظف';

      if (!employeeName || employeeName === 'undefined') return;

      const actionsHtml = `
        <button class="btn-icon btn-edit" onclick="editEmployee(${Number(employee.EmployeeID)})" 
                title="${currentLanguage === 'ar' ? 'تحرير' : 'Edit'}">✏️</button>
        ${userCanManagePermissions() ? `
          <button class="btn-icon btn-key" onclick="editPermissions(${Number(employee.EmployeeID)})"
                  title="${currentLanguage === 'ar' ? 'الصلاحيات' : 'Permissions'}">🔑</button>
        ` : ``}
      `;

      empRow.innerHTML = `
        <div class="employee-avatar">${initials(employeeName)}</div>
        <div class="employee-info">
          <div class="employee-name">${employeeName}</div>
          <div class="employee-details">
            <span class="employee-role">${employeeRole}</span>
            <span>${employeeJobTitle}</span>
            <span>${employeeEmail}</span>
          </div>
        </div>
        <div class="employee-actions">
          ${actionsHtml}
        </div>
      `;

      employeesList.appendChild(empRow);
    });
  }

  function initials(name) {
    return (name || '').split(' ').map(s => s[0] || '').slice(0, 2).join('').toUpperCase();
  }

  // تسمية الأدوار
  function getRoleLabel(roleId) {
    switch (Number(roleId)) {
      case 1: return currentLanguage === 'ar' ? 'سوبر أدمن' : 'Super Admin';
      case 2: return currentLanguage === 'ar' ? 'موظف' : 'Employee';
      case 3: return currentLanguage === 'ar' ? 'مدير قسم' : 'Department Manager';
      case 4: return currentLanguage === 'ar' ? 'مدير عام' : 'Director';
      default: return `Role ${roleId}`;
    }
  }

  // البحث في الأقسام
  departmentSearch.addEventListener('input', debounce(() => {
    const searchTerm = (departmentSearch.value || '').toLowerCase().trim();
    const filtered = allDepartments.filter(dept =>
      (dept.DepartmentName || '').toLowerCase().includes(searchTerm)
    );
    renderDepartments(filtered);
  }, 300));

  clearDeptSearch.addEventListener('click', () => {
    departmentSearch.value = '';
    departmentSearch.focus();
    renderDepartments(allDepartments);
  });

  // نموذج إضافة موظف
  addEmployeeBtn.addEventListener('click', openAddEmployeeModal);
  closeModal.addEventListener('click', closeAddEmployeeModal);
  cancelAdd.addEventListener('click', closeAddEmployeeModal);

  addEmployeeModal.addEventListener('click', (e) => {
    if (e.target === addEmployeeModal) closeAddEmployeeModal();
  });

  // ملء قائمة الأقسام في نموذج إضافة الموظف
  function populateDepartmentDropdown() {
    employeeDepartment.innerHTML = '<option value="" data-ar="اختر قسماً..." data-en="Choose department...">اختر قسماً...</option>';
    allDepartments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.DepartmentID;
      option.textContent = dept.DepartmentName;
      option.setAttribute('data-ar', dept.DepartmentName);
      option.setAttribute('data-en', dept.DepartmentName);
      employeeDepartment.appendChild(option);
    });
  }

  // ملء محدد القسم الرئيسي
  function populateMainDepartmentSelector() {
    mainDepartmentSelector.innerHTML = '<option value="" data-ar="اختر قسماً..." data-en="Choose department...">اختر قسماً...</option>';
    allDepartments.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.DepartmentID;
      option.textContent = dept.DepartmentName;
      mainDepartmentSelector.appendChild(option);
    });
  }

  // معالج تغيير محدد القسم الرئيسي
  mainDepartmentSelector.addEventListener('change', () => {
    const selectedIdNum = parseInt(mainDepartmentSelector.value);
    if (selectedIdNum) {
      const department = allDepartments.find(d => Number(d.DepartmentID) === selectedIdNum);
      if (department) {
        selectDepartment(department);
        departmentCounters.hidden = false;
        mainEmployeesCount.textContent = Number(department.employeeCount || 0);
      }
    } else {
      selectedDepartmentId = null;
      selectDepartmentHint.hidden = false;
      selectedDepartmentInfo.hidden = true;
      employeesList.hidden = true;
      addEmployeeBtn.disabled = true;
      departmentCounters.hidden = true;
      $$('.department-row.selected').forEach(el => el.classList.remove('selected'));
    }
  });

  function openAddEmployeeModal() {
    if (selectedDepartmentId) employeeDepartment.value = selectedDepartmentId;
    addEmployeeModal.hidden = false;
    $('#employee-fullname').focus();
  }

  function closeAddEmployeeModal() {
    addEmployeeModal.hidden = true;
    addEmployeeForm.reset();
  }

  // إرسال نموذج إضافة الموظف (يبقى يستخدم /auth/register كما كان)
  addEmployeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = $('#employee-fullname').value.trim();
    const email = $('#employee-email').value.trim();
    const username = $('#employee-username').value.trim();
    const password = $('#employee-password').value;
    const departmentId = parseInt($('#employee-department').value);

    if (!fullName || !email || !username || !password || !departmentId) {
      showToast('جميع الحقول المطلوبة يجب ملؤها', 'error');
      return;
    }

    const formData = {
      fullName,
      email,
      phoneNumber: $('#employee-phone').value.trim() || null,
      employeeNumber: $('#employee-number').value.trim() || null,
      jobTitle: $('#employee-jobtitle').value.trim() || 'موظف عام',
      roleId: parseInt($('#employee-role').value) || 2,
      username,
      password,
      departmentId
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = currentLanguage === 'ar' ? 'جارٍ الحفظ...' : 'Saving...';

    try {
      const registerData = {
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        specialty: formData.jobTitle,
        departmentID: formData.departmentId,
        nationalID: formData.employeeNumber || `EMP${Date.now()}`
      };

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      if (!res.ok) {
        const txt = await res.text();
        let err = {};
        try { err = JSON.parse(txt); } catch {}
        throw new Error(err.message || `HTTP ${res.status}: ${txt.substring(0,100)}`);
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'فشل في إضافة الموظف');

      const employeeName = formData.fullName;
      const addedToDepartmentId = formData.departmentId;

      const targetDept = allDepartments.find(d => Number(d.DepartmentID) === addedToDepartmentId);
      if (targetDept) targetDept.employeeCount = Number(targetDept.employeeCount || 0) + 1;

      if (addedToDepartmentId === selectedDepartmentId) {
        await loadDepartmentEmployees(selectedDepartmentId);
      }

      closeAddEmployeeModal();
      showToast(`تم حفظ الموظف "${employeeName}" في قاعدة البيانات بنجاح`);
      await loadDepartments();
      return;
    } catch (error) {
      console.error('Error adding employee:', error);
      let errorMessage = 'فشل في إضافة الموظف';
      if (error.message.includes('fetch')) errorMessage = 'خطأ في الاتصال بالخادم - تحقق من تشغيل الخادم';
      else if (error.message.includes('موجود')) errorMessage = 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً';
      else if (error.message) errorMessage = error.message;
      showToast(errorMessage, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // إدارة اللغة
  langToggle.addEventListener('click', toggleLanguage);

  function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute('lang', currentLanguage);
    document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.body.className = `lang-${currentLanguage}`;

    updateLanguageTexts();

    renderDepartments(allDepartments);
    if (selectedDepartmentEmployees.length > 0) {
      renderEmployees(selectedDepartmentEmployees);
    }
  }

  function updateLanguageTexts() {
    $$('[data-ar][data-en]').forEach(el => {
      el.textContent = el.getAttribute(`data-${currentLanguage}`);
    });
  }

  function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.hidden = false;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.hidden = true;
      }, 300);
    }, 3000);
  }

  function showError(message) {
    console.error(message);
    showToast(message, 'error');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // بدء التطبيق
  loadDepartments();
});

// وظائف عامة
function editEmployee(employeeId) {
  console.log('Edit employee:', employeeId);
  alert(currentLanguage === 'ar' ? 'سيتم إضافة وظيفة التحرير قريباً' : 'Edit functionality coming soon');
}

// وظيفة المتابعة للشكاوى
function followupComplaint(complaintId) {
  console.log('Following up complaint:', complaintId);
  window.location.href = `/Complaints-followup/followup.html?complaint=${complaintId}`;
}
