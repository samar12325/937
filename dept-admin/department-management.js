// Department Management JavaScript
const API_BASE_URL = 'http://localhost:3001/api';


let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;
let employeesData = [];
let departmentData = null;
let currentDeleteEmployee = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Check impersonation state
  checkImpersonationState();
  
  // Check access permissions
  if (!checkDepartmentManagementAccess()) {
    return;
  }
  
  // Apply language
  applyLanguage(currentLang);
  
  // Load department data
  await loadDepartmentInfo();
  
  // Load employees
  await loadEmployees();
  
  // Setup event listeners
  setupEventListeners();
});

// Check if user has access to department management
function checkDepartmentManagementAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    alert('ليس لديك صلاحية للوصول لهذه الصفحة.');
    window.location.replace('/login/login.html');
    return false;
  }
  
  // Check if user has department management permissions
  const permissions = getEffectiveUserPermissions();
  const hasDepartmentAccess = permissions.includes('dept_management') || 
                             permissions.includes('manage_departments') ||
                             permissions.includes('dept_admin') ||
                             Number(user.RoleID) === 1 || // Super admin always has access
                             Number(user.RoleID) === 2 || // Employee has access
                             Number(user.RoleID) === 3 || // Department admin has access
                             Number(user.RoleID) === 4;   // System manager has access
  
  if (!hasDepartmentAccess) {
    alert('ليس لديك صلاحية للوصول لهذه الصفحة.');
    window.location.replace('/login/login.html');
    return false;
  }
  
  currentUser = user;
  userDepartmentId = user.DepartmentID;
  
  // For non-super admins and non-system managers, validate department ID
  if (Number(user.RoleID) !== 1 && Number(user.RoleID) !== 4 && !userDepartmentId) {
    alert('لم يتم تحديد القسم الخاص بك. يرجى التواصل مع المدير.');
    return false;
  }
  
  return true;
}

// Check impersonation state
function checkImpersonationState() {
  try {
    const rootToken = localStorage.getItem('rootToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (rootToken && user?.RoleID !== 1) {
      showImpersonationBanner(user);
    }
  } catch (err) {
    console.error('Error checking impersonation state:', err);
  }
}

// Show impersonation banner
function showImpersonationBanner(user) {
  const banner = document.getElementById('impersonationBanner');
  const text = document.getElementById('impersonationText');
  
  if (banner && text) {
    text.textContent = `تم التبديل إلى حساب: ${user.FullName || user.Username || 'غير محدد'}`;
    banner.style.display = 'block';
  }
}

// End impersonation
async function endImpersonation() {
  try {
    const rootToken = localStorage.getItem('rootToken');
    if (!rootToken) return;

    // Restore super admin session
    localStorage.setItem('token', rootToken);
    localStorage.removeItem('rootToken');
    
    // Get super admin data
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${rootToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Redirect to super admin dashboard
    window.location.href = '/superadmin/superadmin-home.html';
  } catch (error) {
    console.error('Error ending impersonation:', error);
    window.location.href = '/login/login.html';
  }
}

// Load department information
async function loadDepartmentInfo() {
  try {
    // For super admins, system managers, or users without specific department, show general info
    if (Number(currentUser.RoleID) === 1 || Number(currentUser.RoleID) === 4 || !userDepartmentId) {
      departmentData = {
        DepartmentName: 'جميع الأقسام',
        totalEmployees: 0,
        newEmployees: 0
      };
      updateDepartmentDisplay();
      return;
    }
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/departments/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      departmentData = data.data;
      updateDepartmentDisplay();
    }
  } catch (error) {
    console.error('Error loading department info:', error);
  }
}

// Update department display
function updateDepartmentDisplay() {
  if (departmentData) {
    document.getElementById('departmentName').textContent = departmentData.DepartmentName || 'القسم';
    
    // Update department statistics
    document.getElementById('totalEmployees').textContent = departmentData.totalEmployees || 0;
    document.getElementById('newEmployees').textContent = departmentData.newEmployees || 0;
  }
}

// Load employees
async function loadEmployees() {
  try {
    showLoading();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    // Apply filters
    const search = document.getElementById('searchInput')?.value;
    const role = document.getElementById('roleFilter')?.value;
    
    if (search) params.set('search', search);
    if (role) params.set('roleId', role);
    
    // Add pagination parameters for /api/users endpoint
    params.set('page', '1');
    params.set('limit', '1000'); // Get all employees
    
    let apiUrl;
    
    // For super admins and system managers, load all employees; for others, load department-specific employees
    if (Number(currentUser.RoleID) === 1 || Number(currentUser.RoleID) === 4) {
      apiUrl = `${API_BASE_URL}/users?${params}`;
    } else if (userDepartmentId) {
      apiUrl = `${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}?${params}`;
    } else {
      throw new Error('لا يمكن تحميل بيانات الموظفين بدون تحديد القسم');
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      employeesData = data.data || [];
      
      displayEmployees();
      updateStats();
    } else {
      throw new Error('فشل في تحميل بيانات الموظفين');
    }
  } catch (error) {
    console.error('Error loading employees:', error);
    showError('فشل في تحميل بيانات الموظفين');
  }
}

// Display employees in table
// Display employees in table
function displayEmployees() {
  const tbody = document.getElementById('employeesTableBody');
  
  if (!employeesData || employeesData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-data">
          لا توجد بيانات موظفين متاحة
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = employeesData
  // Filter out users where RoleID == 4
  .filter(employee => employee.RoleID !== 4)
  // Map the remaining users to table rows
  .map(employee => `
    <tr>
      <td class="employee-info">
        <div class="employee-name">${escapeHtml(employee.FullName || '-')}</div>
        <div class="employee-details">
          @${escapeHtml(employee.Username || '-')}
          ${employee.Specialty ? `• ${escapeHtml(employee.Specialty)}` : ''}
        </div>
      </td>
      <td>${escapeHtml(employee.EmployeeID || '-')}</td>
      <td>${escapeHtml(employee.Email || '-')}</td>
      <td>
        <span class="role-badge role-${getRoleClass(employee.RoleID)}">
          ${escapeHtml(employee.RoleName || getRoleName(employee.RoleID))}
        </span>
      </td>
      <td>${formatDate(employee.JoinDate)}</td>
      <td>
        <div class="actions-cell">
          ${generateActionButtons(employee)}
        </div>
      </td>
    </tr>
  `)
  .join('');

  // Apply permission gating to buttons
  applyPermissionGating();
}



// Edit permissions
function editPermissions(employeeId) {
  // Navigate to permissions page with employee ID
  window.location.href = `/superadmin/permissions.html?employee=${employeeId}`;
}
// Generate action buttons for employee

function generateActionButtons(employee) {
  let buttons = '';
  
  // Can't delete self
  if (Number(employee.EmployeeID) === Number(currentUser.EmployeeID)) {
    buttons += `
      <span class="btn btn-sm btn-secondary" style="opacity: 0.5;">
        <i class="fas fa-user-shield"></i>
        أنت
      </span>
    `;
  } else {
    console.log('aaaa',employee.isActive);
    const isActive = Number(employee.isActive ?? employee.isActive ?? 1) === 1;

    const btnClass = isActive ? 'success' : 'danger';
    const btnLabel = isActive ? 'مفعل' : 'معطل';
    const icon = isActive ? 'fa-toggle-on' : 'fa-toggle-off';
    buttons += `
      <button class="btn btn-sm table-btn ${btnClass} permission-gated" data-permission="activate_employee" title="${isActive ? 'تعطيل المستخدم' : 'تفعيل المستخدم'}"
              onclick="deptToggleUserActive(${Number(employee.EmployeeID)}, ${isActive ? 1 : 0})">
        <i class="fa-solid ${icon}"></i>
        ${btnLabel}
      </button>
    `;
  }
  
  if (Number(employee.EmployeeID) === Number(currentUser.EmployeeID)) {
    buttons += `
      <span class="btn btn-sm btn-secondary" style="opacity: 0.5;">
        <i class="fas fa-key"></i>
        أنت
      </span>
    `;
  } else {
  
  // Edit permissions button
  if (typeof userCanManagePermissions === 'function' ? userCanManagePermissions() : true) {
    buttons += `
      <button class="btn btn-sm btn-primary" onclick="editPermissions(${Number(employee.EmployeeID)})">
        <i class="fas fa-key"></i>
        الصلاحيات
      </button>
    `;
  }
  }
  
  return buttons;
}


function showError(msg) { alert((currentLang==='ar' ? 'خطأ: ' : 'Error: ') + (msg || '')); }
function showSuccess(msg) { alert(msg); }

// Apply permission gating to UI elements
async function applyPermissionGating() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = Number(user?.RoleID || 0);
    
    // Super admin sees everything
    if (roleId === 1) {
      document.querySelectorAll('.permission-gated').forEach(el => {
        el.style.display = '';
      });
      return;
    }
    
    // Get user permissions
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/me/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch permissions');
      return;
    }
    
    const data = await response.json();
    
    // استنتاج مرن للصلاحيات - يدعم أشكال مختلفة من استجابة API
    let permissions = [];
    if (Array.isArray(data.permissions)) {
      permissions = data.permissions;
    } else if (Array.isArray(data.enabled)) {
      permissions = data.enabled;
    } else if (Array.isArray(data.data?.permissions)) {
      permissions = data.data.permissions;
    } else if (Array.isArray(data.data?.enabled)) {
      permissions = data.data.enabled;
    } else if (data.data?.permissions && typeof data.data.permissions === 'object') {
      // كائن أعلام مثل { activate_employee: true, ... }
      permissions = Object.entries(data.data.permissions)
        .filter(([,v]) => !!v).map(([k]) => k);
    } else if (data.permissions && typeof data.permissions === 'object') {
      permissions = Object.entries(data.permissions)
        .filter(([,v]) => !!v).map(([k]) => k);
    }
    
    console.log('🔑 Permissions loaded:', permissions);
    
    // Apply gating to all permission-gated elements
    document.querySelectorAll('.permission-gated').forEach(el => {
      const permission = el.getAttribute('data-permission');
      const hasPermission = permissions.includes(permission);
      el.style.display = hasPermission ? '' : 'none';
      
      if (permission === 'activate_employee') {
        console.log(`🔍 Checking ${permission}: hasPermission=${hasPermission}, element=`, el);
      }
    });
    
  } catch (error) {
    console.error('Error applying permission gating:', error);
  }
}

async function deptToggleUserActive(employeeId, isActive) {
  try {
    const token = localStorage.getItem('token');
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    const target = Number(isActive) === 1 ? 0 : 1;

    if (Number(me?.EmployeeID) === Number(employeeId) && target === 0) {
      showError('لا يمكنك تعطيل حسابك الشخصي.');
      return;
    }

    const res = await fetch(`${API_BASE_URL}/dept-admin/employees/${employeeId}/active`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ active: target === 1 })
    });

    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error(data?.message || 'فشل تحديث حالة المستخدم');

    const idx = Array.isArray(employeesData)
      ? employeesData.findIndex(u => Number(u.EmployeeID) === Number(employeeId))
      : -1;

    if (idx > -1) {
      employeesData[idx].isActive = target;
      displayEmployees();
    } else if (typeof loadEmployees === 'function') {
      await loadEmployees();
    }

    if (target === 1) {
      showSuccess('تم التفعيل بنجاح');
    } else {
      showSuccess('تم التعطيل بنجاح');
    }
  } catch (err) {
    console.error('deptToggleUserActive error:', err);
    showError('حدث خطأ أثناء تحديث الحالة: ' + (err.message || ''));
  }
}

function getEffectiveUserPermissions() {
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
}

function userCanManagePermissions() {
  const perms = getEffectiveUserPermissions();
  const keys = ['manage_permissions', 'rbac.manage'];
  return keys.some(k => perms.includes(k));
}

// Get role class for styling
function getRoleClass(roleId) {
  switch (Number(roleId)) {
    case 1: return 'super';
    case 2: return 'employee';
    case 3: return 'admin';
    case 4: return 'system';
    default: return 'employee';
  }
}

// Get role name
function getRoleName(roleId) {
  switch (Number(roleId)) {
    case 1: return 'سوبر أدمن';
    case 2: return 'موظف';
    case 3: return 'مدير قسم';
    case 4: return 'مدير النظام';
    default: return 'غير محدد';
  }
}

// Update statistics
function updateStats() {
  const totalEmployees = employeesData.length;
  const activeEmployees = employeesData.filter(emp => emp.RoleID && emp.RoleID !== 1 && emp.RoleID !== 4).length; // Exclude super admin and system manager
  
  // Calculate new employees this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newEmployees = employeesData.filter(emp => 
    emp.JoinDate && new Date(emp.JoinDate) >= thisMonth
  ).length;
  
  // Only update if department data hasn't already set these values
  if (!departmentData || !departmentData.totalEmployees) {
    document.getElementById('totalEmployees').textContent = totalEmployees;
  }
  document.getElementById('activeEmployees').textContent = activeEmployees;
  if (!departmentData || !departmentData.newEmployees) {
    document.getElementById('newEmployees').textContent = newEmployees;
  }
  
  // Load pending deletion requests count
  loadPendingRequests();
}

// Load pending deletion requests
async function loadPendingRequests() {
  try {
    let apiUrl;
    
    // For super admins and system managers, get all pending requests; for department admins, get department-specific requests
    if (Number(currentUser.RoleID) === 1 || Number(currentUser.RoleID) === 4) {
      // Super admins and system managers can use the dept-admin endpoint to get all requests
      // We'll modify the backend to handle this case
      apiUrl = `${API_BASE_URL}/dept-admin/deletion-requests/pending`;
    } else if (userDepartmentId) {
      apiUrl = `${API_BASE_URL}/dept-admin/deletion-requests/pending`;
    } else {
      document.getElementById('pendingRequests').textContent = 0;
      return;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      document.getElementById('pendingRequests').textContent = data.count || 0;
    }
  } catch (error) {
    console.error('Error loading pending requests:', error);
    document.getElementById('pendingRequests').textContent = 0;
  }
}

// Open delete modal
function openDeleteModal(employeeId, employeeName) {
  currentDeleteEmployee = employeeId;
  document.getElementById('deleteEmployeeName').value = employeeName;
  document.getElementById('deleteReason').value = '';
  document.getElementById('deleteModal').style.display = 'block';
}

// Submit delete request
async function submitDeleteRequest() {
  if (!currentDeleteEmployee) return;
  
  const reason = document.getElementById('deleteReason').value.trim();
  
  if (!reason) {
    showErrorMessage('يرجى كتابة سبب طلب الحذف');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/employees/${currentDeleteEmployee}/delete-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: reason
      })
    });
    
    if (response.ok) {
      showSuccessMessage('تم إرسال طلب الحذف بنجاح. سيتم مراجعته من قبل السوبر أدمن.');
      closeModal('deleteModal');
      loadEmployees();
    } else {
      const data = await response.json();
      throw new Error(data.message || 'فشل في إرسال طلب الحذف');
    }
  } catch (error) {
    console.error('Error submitting delete request:', error);
    showErrorMessage(error.message);
  }
}




// Apply filters
function applyFilters() {
  loadEmployees();
}

// Clear filters
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('roleFilter').value = '';
  loadEmployees();
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  currentDeleteEmployee = null;
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });
  
  // Role filter
  document.getElementById('roleFilter')?.addEventListener('change', applyFilters);
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
      currentDeleteEmployee = null;
    }
  });
}

// Utility functions
function showLoading() {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        جاري التحميل...
      </td>
    </tr>
  `;
}

function showError(message) {
  const tbody = document.getElementById('employeesTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="no-data">
        <i class="fas fa-exclamation-triangle"></i>
        ${message}
      </td>
    </tr>
  `;
}

function showSuccessMessage(message) {
  const successMsg = document.getElementById('successMessage');
  successMsg.textContent = message;
  successMsg.style.display = 'block';
  
  // Hide error message
  document.getElementById('errorMessage').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 5000);
}

function showErrorMessage(message) {
  const errorMsg = document.getElementById('errorMessage');
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
  
  // Hide success message
  document.getElementById('successMessage').style.display = 'none';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Language management
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  
  document.querySelectorAll('[data-ar][data-en]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) {
      element.textContent = text;
    }
  });
  
  document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach(element => {
    const placeholder = element.getAttribute(`data-${lang}-placeholder`);
    if (placeholder) {
      element.placeholder = placeholder;
    }
  });
}