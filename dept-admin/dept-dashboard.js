// const { log } = require("console");

// Department Dashboard JavaScript
const API_BASE_URL = 'http://localhost:3001/api';

let currentLang = localStorage.getItem('lang') || 'ar';
let currentUser = null;
let userDepartmentId = null;



// Check if user is authenticated and has department_panel permission
async function checkDepartmentAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    alert('Access denied. Please login first.');
    window.location.replace('../login/login.html');
    return false;
  }
  
  const roleId = Number(user.RoleID || user.role || user.roleId);
  
  // Allow Super Admin (1), Department Admin (3), and Director (4) immediately
  if ([1, 3, 4].includes(roleId)) {
    currentUser = user;
    userDepartmentId = user.DepartmentID;
    return true;
  }
  
  // For employees (2), check if they have department_panel permission
  if (roleId === 2) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/permissions/bootstrap/${user.EmployeeID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const permissions = data.data?.enabled || [];
        const hasPermission = permissions.includes('department_panel');
        
        if (hasPermission) {
          console.log('✅ Employee has department_panel permission - access granted');
          currentUser = user;
          userDepartmentId = user.DepartmentID;
          return true;
        } else {
          console.log('❌ Employee does not have department_panel permission');
          alert('You do not have permission to access the department panel.');
          window.location.replace('../employee/employee-home.html');
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking employee department_panel permission:', error);
      alert('Error checking permissions.');
      window.location.replace('../employee/employee-home.html');
      return false;
    }
  }
  
  // If none of the above, deny access
  alert('Access denied. You do not have permission for this page.');
  window.location.replace('../login/login.html');
  return false;
}

// Language management
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

function goBack() {
  // يرجع إلى الصفحة السابقة في سجل المتصفح
  window.history.back();
}



// KPI Functions
async function loadKPIs() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/kpis/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateKPIDisplay(data);
    } else {
      console.error('Failed to load KPIs:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading KPIs:', error);
  }
}

function updateKPIDisplay(kpiData) {
  const kpis = kpiData.data || kpiData || {};
  
  document.getElementById('kpiTodayNew').textContent = kpis.today_new || '0';
  document.getElementById('kpiOpen').textContent = kpis.open || '0';
  document.getElementById('kpiProgress').textContent = kpis.in_progress || '0';
  document.getElementById('kpiOverdue').textContent = kpis.overdue || '0';

  // Update change indicators
  updateChangeIndicator('kpiTodayNewChange', kpis.today_new_change || 0);
  updateChangeIndicator('kpiOpenChange', kpis.open_change || 0);
  updateChangeIndicator('kpiProgressChange', kpis.progress_change || 0);
  updateChangeIndicator('kpiOverdueChange', kpis.overdue_change || 0);
}

function updateChangeIndicator(elementId, change) {
  const element = document.getElementById(elementId);
  if (element) {
    const isPositive = change >= 0;
    element.textContent = `${isPositive ? '+' : ''}${change}%`;
    element.className = `kpi-change ${isPositive ? '' : 'negative'}`;
  }
}



// Worklist Functions
async function loadWorklist() {
  try {
    const filters = getWorklistFilters();
    const queryParams = new URLSearchParams(filters).toString();
    const fullUrl = queryParams 
      ? `${API_BASE_URL}/dept-admin/dashboard/worklist/${userDepartmentId}?${queryParams}`
      : `${API_BASE_URL}/dept-admin/dashboard/worklist/${userDepartmentId}`;
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderWorklist(data.data || data || []);
    } else {
      console.error('Failed to load worklist:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading worklist:', error);
  }
}

function getWorklistFilters() {
  return {
    dateRange: document.getElementById('dateRange')?.value || '',
    status: document.getElementById('statusFilter')?.value || '',
    priority: document.getElementById('priorityFilter')?.value || '',
    assignment: document.getElementById('assignmentFilter')?.value || '',
    search: document.getElementById('searchInput')?.value || ''
  };
}

function renderWorklist(complaints) {
  const tbody = document.getElementById('worklistTableBody');
  if (!tbody) {
    console.log('Worklist table body not found - skipping render');
    return;
  }
  tbody.innerHTML = '';

  if (!Array.isArray(complaints) || complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-text">${currentLang === 'ar' ? 'لا توجد بلاغات' : 'No complaints found'}</div>
          <div class="empty-state-subtext">${currentLang === 'ar' ? 'جرّب تعديل الفلاتر أو نطاق التاريخ' : 'Try adjusting filters or date range'}</div>
        </td>
      </tr>
    `;
    return;
  }

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${complaint.ComplaintID}</td>
      <td>${complaint.PatientName || complaint.RequesterName || '-'}</td>
      <td>${complaint.ComplaintTypeName || complaint.TypeName || '-'}</td>
      <td>${formatDate(complaint.CreatedAt || complaint.ComplaintDate)}</td>
      <td><span class="status-badge status-${getStatusClass(complaint.CurrentStatus)}">${complaint.CurrentStatus}</span></td>
      <td><span class="priority-badge priority-${getPriorityClass(complaint.Priority)}">${complaint.Priority}</span></td>
      <td>${complaint.AssignedEmployeeName || 'غير مخصص'}</td>
    `;
    tbody.appendChild(row);
  });
}

function getStatusClass(status) {
  const statusMap = {
    'جديدة': 'new',
    'مفتوحة/جديدة': 'new',
    'قيد المعالجة': 'progress',
    'تم الحل': 'resolved',
    'مغلقة': 'closed'
  };
  return statusMap[status] || 'new';
}

function getPriorityClass(priority) {
  const priorityMap = {
    'عالية': 'high',
    'متوسطة': 'medium',
    'منخفضة': 'low'
  };
  return priorityMap[priority] || 'medium';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
}

// Filter functions
function filterByStatus(status) {
  document.getElementById('statusFilter').value = status;
  loadWorklist();
}

function filterBySLA(slaType) {
  // Apply specific SLA filters
  const filters = {
    unanswered: { status: 'new', days: 3 },
    'due-today': { dueDate: new Date().toISOString().split('T')[0] },
    reminders: { reminder: true }
  };
  
  // Apply the filter and reload worklist
  loadWorklist();
}

function searchComplaints() {
  loadWorklist();
}

// Team Functions
async function loadTeam() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/team/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderTeam(data.data || data || []);
    } else {
      console.error('Failed to load team:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading team:', error);
  }
}

function renderTeam(employees) {
  const tbody = document.getElementById('teamTableBody');
  if (!tbody) {
    console.log('Team table body not found - skipping render');
    return;
  }
  tbody.innerHTML = '';

  if (employees.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-text">لا يوجد فريق</div>
          <div class="empty-state-subtext">لا يوجد موظفين في هذا القسم</div>
        </td>
      </tr>
    `;
    return;
  }

  employees.forEach(employee => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${employee.FullName}</td>
      <td>${employee.Email || '-'}</td>
      <td>${employee.RoleName}</td>
      <td><span class="workload-badge workload-${getWorkloadClass(employee.Workload)}">${employee.Workload || 0}</span></td>
    `;
    tbody.appendChild(row);
  });
}

function getWorkloadClass(workload) {
  if (workload <= 3) return 'low';
  if (workload <= 7) return 'medium';
  return 'high';
}

function searchTeam() {
  const searchTerm = document.getElementById('teamSearch')?.value || '';
  // Implement team search functionality
  loadTeam();
}

// SLA Functions
async function loadSLAAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/sla/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      updateSLAAlerts(data.data || data || {});
    } else {
      console.error('Failed to load SLA alerts:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading SLA alerts:', error);
  }
}

function updateSLAAlerts(slaData) {
  document.getElementById('slaUnanswered').textContent = slaData.unanswered || 0;
  document.getElementById('slaDueToday').textContent = slaData.due_today || 0;
  document.getElementById('slaReminders').textContent = slaData.reminders || 0;
}

// Activity Functions
async function loadRecentActivity() {
  try {
    const response = await fetch(`${API_BASE_URL}/dept-admin/dashboard/activity/${userDepartmentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      renderRecentActivity(data.data || data || []);
    } else {
      console.error('Failed to load recent activity:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

function renderRecentActivity(activities) {
  const list = document.getElementById('activityList');
  list.innerHTML = '';

  if (activities.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">لا يوجد نشاط حديث</div>
      </li>
    `;
    return;
  }

  activities.forEach(activity => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    li.innerHTML = `
      <div class="activity-content">
        <span class="activity-user">${activity.Username}</span>
        <span class="activity-action">${activity.Description}</span>
      </div>
      <div class="activity-time">${formatDateTime(activity.CreatedAt)}</div>
    `;
    list.appendChild(li);
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
}



// Utility Functions
function showSuccessMessage(message) {
  // Implement success message display
  console.log('Success:', message);
}

function showErrorMessage(message) {
  // Implement error message display
  console.error('Error:', message);
}

// Initialize date picker
function initializeDatePicker() {
  const dateRangeElement = document.getElementById('dateRange');
  if (dateRangeElement && typeof flatpickr !== 'undefined') {
    flatpickr("#dateRange", {
      mode: "range",
      dateFormat: "Y-m-d",
      locale: currentLang === 'ar' ? flatpickr.l10ns.ar : flatpickr.l10ns.en,
      onChange: function(selectedDates, dateStr, instance) {
        loadWorklist();
      }
    });
  } else {
    console.log('Date range element not found or flatpickr not loaded - skipping date picker initialization');
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  if (!(await checkDepartmentAdminAccess())) return;
  
  applyLanguage(currentLang);

  // Language toggle
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // Initialize date picker
  initializeDatePicker();

  // Load all dashboard data
  loadKPIs();
  loadWorklist();
  loadTeam();
  loadSLAAlerts();
  loadRecentActivity();

  // Add event listeners for filters (only if elements exist)
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const assignmentFilter = document.getElementById('assignmentFilter');
  const searchInput = document.getElementById('searchInput');
  const teamSearch = document.getElementById('teamSearch');

  if (statusFilter) statusFilter.addEventListener('change', loadWorklist);
  if (priorityFilter) priorityFilter.addEventListener('change', loadWorklist);
  if (assignmentFilter) assignmentFilter.addEventListener('change', loadWorklist);

  // Add search event listeners
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchComplaints();
      }
    });
  }

  if (teamSearch) {
    teamSearch.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchTeam();
      }
    });
  }

  // Notification button functionality
  const notifBtn = document.getElementById('notifBtn');
  const notifCount = document.getElementById('notifCount');
  if (notifBtn && notifCount) {
    notifBtn.addEventListener('click', () => {
      let count = parseInt(notifCount.textContent || '0', 10);
      if (count > 0) {
        count--;
        notifCount.textContent = count;
        if (count === 0) {
          notifCount.style.display = 'none';
        }
      }
    });
  }
});
