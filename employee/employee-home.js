const API_BASE_URL = 'http://localhost:3001/api';
const EMP_BASE = `${API_BASE_URL}/employee`;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}

function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

function showError(msg) {
  const modal = document.getElementById('errorModal');
  const text = document.getElementById('errorMessage');
  if (text) text.textContent = msg || 'حدث خطأ ما';
  if (modal) modal.style.display = 'block';
}

function applyLanguage(lang){
  console.log('[EMP] applyLanguage →', lang);
  const root = document.body;
  root.classList.remove('lang-ar','lang-en');
  root.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');
  
  // تطبيق الترجمة على جميع العناصر
  const elements = document.querySelectorAll('[data-ar]');
  console.log(`[EMP] Found ${elements.length} elements with translation attributes`);
  
  elements.forEach((el, index)=>{
    const t = el.getAttribute(`data-${lang}`);
    if (t) {
      el.textContent = t;
      console.log(`[EMP] Translated element ${index}: "${t}"`);
    } else {
      console.log(`[EMP] No translation found for element ${index}`);
    }
  });
  
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  localStorage.setItem('lang', lang);
}

function guardEmployee(){
  const userRaw = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  console.log('[EMP] guardEmployee token?', !!token, 'userRaw?', !!userRaw);
  if (!token || !userRaw) {
    window.location.href = '../login/login.html';
    return false;
  }
  const user = JSON.parse(userRaw);
  console.log('[EMP] guardEmployee user:', user);
  if (Number(user.RoleID) !== 2 && user.Username?.toLowerCase() !== 'employee'){
    window.location.href = '../login/home.html';
    return false;
  }
  return true;
}

// دالة لإخفاء الإشعار فوراً
window.markNotificationAsRead = async function(notificationId, buttonElement) {
  console.log('[EMP] ===== markNotificationAsRead called =====');
  console.log('[EMP] Notification ID:', notificationId);
  console.log('[EMP] Button element:', buttonElement);
  
  // إضافة تأثير بصري للزر
  buttonElement.classList.add('clicked');
  
  // إخفاء الإشعار فوراً من الواجهة
  const notificationItem = buttonElement.closest('.notif-item');
  if (notificationItem) {
    // إضافة تأثير إخفاء تدريجي
    notificationItem.classList.add('hiding');
    
    // إزالة الإشعار من DOM بعد التأثير
    setTimeout(() => {
      notificationItem.remove();
      
      // تحديث عداد الإشعارات
      updateNotificationCount();
      
      // إعادة تحميل الإشعارات في الخلفية (بدون إظهار أخطاء)
      loadNotificationsSilently();
    }, 300);
  }
  
  // محاولة حذف الإشعار من الخادم
  const deleteSuccess = await deleteNotificationFromServer(notificationId);
  
  if (!deleteSuccess) {
    // إذا فشل الحذف، جرب التحديث
    try {
      console.log('[EMP] Delete failed, trying to mark as read...');
      const response = await fetch(`${EMP_BASE}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isRead: 1 })
      });
      
      if (response.ok) {
        console.log('[EMP] Notification marked as read successfully');
      } else {
        console.error('[EMP] Both delete and update failed');
        showError('فشل في تحديث الخادم. يرجى التأكد من تشغيل الخادم.');
      }
    } catch (error) {
      console.error('[EMP] Server connection failed:', error);
      showError('فشل في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم.');
    }
  }
}

// دالة لإعادة تحميل الإشعارات بصمت
async function loadNotificationsSilently() {
  try {
    const url = `${EMP_BASE}/notifications?page=1&limit=10`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) {
      const json = await res.json();
      const countEl = document.getElementById('notifCount');
      if (countEl) {
        const unread = json?.data?.unreadCount ?? 0;
        console.log('[EMP] Silent reload - updating count to:', unread);
        countEl.textContent = unread;
        countEl.style.display = unread > 0 ? 'inline-block' : 'none';
      }
    } else {
      console.log('[EMP] Silent reload failed with status:', res.status);
    }
  } catch (error) {
    console.log('[EMP] Silent reload failed:', error);
  }
}

// دالة لتحديث عداد الإشعارات
function updateNotificationCount() {
  const notifCount = document.getElementById('notifCount');
  if (notifCount) {
    // عد الإشعارات غير المقروءة في القائمة
    const unreadNotifications = document.querySelectorAll('.notif-item:not(.hiding) .notif-remove-btn');
    const count = unreadNotifications.length;
    
    console.log('[EMP] Manual count update - found', count, 'unread notifications');
    notifCount.textContent = count;
    notifCount.style.display = count > 0 ? 'inline-block' : 'none';
    
    // إضافة تأثير بصري
    notifCount.style.transform = 'scale(1.2)';
    setTimeout(() => {
      notifCount.style.transform = 'scale(1)';
    }, 200);
  }
}

// دالة اختبار إخفاء الإشعار
window.testHideNotification = function() {
  console.log('[EMP] Testing hide notification function');
  
  // إنشاء إشعار تجريبي
  const testNotification = document.createElement('div');
  testNotification.className = 'notif-item';
  testNotification.innerHTML = `
    <div class="meta">${new Date().toLocaleString('ar-SA')}</div>
    <div><strong>إشعار تجريبي</strong> — هذا إشعار للاختبار</div>
    <div class="notif-actions">
      <button class="notif-remove-btn" onclick="markNotificationAsRead('test123', this)">✓</button>
    </div>
  `;
  
  // إضافة الإشعار إلى القائمة
  const list = document.getElementById('notifList');
  if (list) {
    list.innerHTML = '';
    list.appendChild(testNotification);
  }
  
  // تحديث العداد
  updateNotificationCount();
  
  alert('تم إنشاء إشعار تجريبي. اضغط على علامة الصح لاختبار الإخفاء!');
};

// دالة لاختبار الاتصال مع الخادم
window.testServerConnection = async function() {
  try {
    console.log('[EMP] Testing server connection...');
    const response = await fetch(`${EMP_BASE}/profile`, {
      headers: authHeaders()
    });
    console.log('[EMP] Server response status:', response.status);
    
    if (response.ok) {
      alert('الاتصال مع الخادم يعمل بشكل صحيح!');
    } else {
      alert(`خطأ في الاتصال: ${response.status}`);
    }
  } catch (error) {
    console.error('[EMP] Server connection error:', error);
    alert('فشل في الاتصال مع الخادم. تأكد من تشغيل الخادم.');
  }
};

// دالة لحذف الإشعار من قاعدة البيانات
async function deleteNotificationFromServer(notificationId) {
  try {
    console.log('[EMP] Deleting notification from server:', notificationId);
    const response = await fetch(`${EMP_BASE}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    
    console.log('[EMP] Delete response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('[EMP] Notification deleted successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('[EMP] Delete failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('[EMP] Delete connection failed:', error);
    return false;
  }
}

async function loadNotifications(){
  try{
    const url = `${EMP_BASE}/notifications?page=1&limit=10`;
    console.log('[EMP] loadNotifications →', url);
    const res = await fetch(url, { headers: authHeaders() });
    console.log('[EMP] loadNotifications status:', res.status);
    if(!res.ok) throw new Error('فشل جلب الإشعارات');
    const json = await res.json();
    console.log('[EMP] loadNotifications payload:', json);
    const list = document.getElementById('notifList');
    const countEl = document.getElementById('notifCount');
    if (countEl){
      const unread = json?.data?.unreadCount ?? 0;
      countEl.textContent = unread;
      countEl.style.display = unread > 0 ? 'inline-block' : 'none';
    }
    if (list){
      list.innerHTML = '';
      
      // إضافة رسالة إذا لم توجد إشعارات
      if (!json?.data?.notifications || json.data.notifications.length === 0) {
        list.innerHTML = `
          <div class="notif-item" style="text-align: center; color: #6b7280;">
            لا توجد إشعارات جديدة
            <br><br>
            <button class="notif-remove-btn" onclick="testHideNotification()" style="margin: 10px auto; display: block;">اختبار إخفاء الإشعار ✓</button>
            <button class="notif-detail-btn" onclick="testServerConnection()" style="margin: 10px auto; display: block;">اختبار الاتصال مع الخادم</button>
          </div>`;
        return;
      }
      
      (json?.data?.notifications || []).forEach(n=>{
        const row = document.createElement('div');
        row.className = 'notif-item';
        
        // التأكد من وجود ComplaintID
        const complaintId = n.ComplaintID || n.ComplaintId || '';
        const notificationId = n.NotificationID || n.NotificationId || n.ID || '';
        
        console.log('[EMP] Creating notification item:', { 
          complaintId, 
          notificationId, 
          isRead: n.IsRead,
          title: n.Title,
          message: n.Message 
        });
        
        row.innerHTML = `
          <div class="meta">${n.CreatedAt ? new Date(n.CreatedAt).toLocaleString('ar-SA') : ''}</div>
          <div><strong>${n.Title || 'إشعار'}</strong> — ${n.Body || n.Message || ''}</div>
          <div class="notif-actions">
            ${n.IsRead ? '' : `<button class="notif-remove-btn" title="وضع كمقروء" data-read="${notificationId}" onclick="markNotificationAsRead('${notificationId}', this)">✓</button>`}
          </div>`;
        list.appendChild(row);
      });

      // إزالة event listener السابق إذا كان موجوداً
      const existingListener = list.getAttribute('data-listener-attached');
      if (existingListener) {
        list.removeEventListener('click', list._clickHandler);
      }
      
      // إضافة event listener جديد - النقر على الإشعار يجعله يختفي
      list._clickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target.closest('button');
        const notificationItem = e.target.closest('.notif-item');
        
        // إذا تم النقر على زر وضع كمقروء
        if (btn && btn.classList.contains('notif-remove-btn') && btn.dataset.read) {
          console.log('[EMP] Marking notification as read via event listener:', btn.dataset.read);
          await markNotificationAsRead(btn.dataset.read, btn);
        }
        // إذا تم النقر على الإشعار نفسه (وليس على زر)
        else if (notificationItem && !btn) {
          const notificationId = notificationItem.querySelector('[data-read]')?.dataset.read;
          if (notificationId) {
            console.log('[EMP] Clicking on notification to mark as read:', notificationId);
            await markNotificationAsRead(notificationId, notificationItem);
          }
        }
      };
      
      list.addEventListener('click', list._clickHandler);
      list.setAttribute('data-listener-attached', 'true');
      
      // تحديث العداد بعد تحميل الإشعارات
      setTimeout(() => {
        updateNotificationCount();
      }, 100);
    }
  }catch(err){
    console.error(err);
  }
}

function computeKpis(complaints){
  const total = complaints.length;
  const countExact = (v) => complaints.filter(c => (c.Status||'') === v).length;
  const completed = complaints.filter(c => ['تم الحل','مغلقة'].includes(c.Status||'')).length;
  const highPriority = complaints.filter(c => (c.Priority||'') === 'عالية').length;
  console.log('[EMP] KPIs → total:', total, 'open:', countExact('جديدة'), 'pending:', countExact('قيد المراجعة'), 'done:', completed, 'high:', highPriority);
  setText('kpiTotal', total);
  setText('kpiOpen', countExact('جديدة'));
  setText('kpiResponded', countExact('قيد المراجعة'));
  setText('kpiDueSoon', completed);
  setText('kpiLate', highPriority);
}

function statusBadgeClass(status){
  if(!status) return 'status-new';
  if (status.includes('تم الحل'))      return 'status-completed';
  if (status.includes('مغلقة'))        return 'status-completed';
  if (status.includes('قيد المراجعة')) return 'status-pending';
  if (status.includes('جديدة'))        return 'status-new';
  return 'status-pending';
}

function addDays(date, days){
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d){
  try {
    return d ? new Date(d).toLocaleDateString('ar-SA') : '—';
  } catch { return '—'; }
}

function formatRemaining(deadline){
  if (!deadline) return '—';
  const now = new Date();
  const ms = new Date(deadline) - now;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / (1000*60*60*24));
  const h = Math.floor((abs % (1000*60*60*24)) / (1000*60*60));
  const label = `${d}ي ${h}س`;
  return ms >= 0 ? label : `متأخرة ${label}`;
}

function fillTable(complaints){
  const tbody = document.getElementById('compBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  if(!complaints.length){
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#666;">—</td></tr>`;
    return;
  }
  complaints.slice(0,10).forEach(c=>{
    const created = c.CreatedAt ? new Date(c.CreatedAt) : null;
    const deadline = created ? addDays(created, 3) : null;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.ComplaintID}</td>
      <td>${c.DepartmentName || '—'}</td>
      <td><span class="complaint-status ${statusBadgeClass(c.Status)}">${c.Status || '—'}</span></td>
      <td>${c.Category || '—'}</td>
      <td>${formatDate(c.CreatedAt)}</td>
      <td>${deadline ? deadline.toLocaleDateString('ar-SA') : '—'}</td>
      <td>${formatRemaining(deadline)}</td>`;
    tr.style.cursor='pointer';
    tr.addEventListener('click', ()=> {
      window.location.href = `employee-complaints.html?open=${c.ComplaintID}`;
    });
    tbody.appendChild(tr);
  });
}

async function loadOverviewData(){
  try{
    showLoading();
    const url = `${EMP_BASE}/complaints?page=1&limit=200`;
    console.log('[EMP] loadOverviewData GET:', url);
    const res = await fetch(url, { headers: authHeaders() });
    console.log('[EMP] loadOverviewData status:', res.status);
    if(!res.ok) throw new Error('HTTP error');
    const json = await res.json();
    console.log('[EMP] loadOverviewData payload:', json);
    const complaints = json?.data?.complaints || [];
    computeKpis(complaints);
    fillTable(complaints);
  }catch(err){
    console.error('[EMP] loadOverviewData error:', err);
    showError('فشل في معالجة البيانات من الخادم');
  }finally{
    hideLoading();
  }
}

function normHref(href) {
  try {
    return decodeURI(href || '').toLowerCase().replace(/^[.\/]+/, '').replace(/\s+/g, ' ');
  } catch {
    return (href || '').toLowerCase();
  }
}

function getCachedPermsForCurrentUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empId = user?.EmployeeID || user?.employeeId || user?.id;
  const cacheKey = empId ? `userPermissions:${empId}` : `userPermissions:UNKNOWN`;
  const fallbackKey = 'permissionsList';
  let perms = [];
  try {
    const scoped = localStorage.getItem(cacheKey);
    if (scoped) {
      perms = JSON.parse(scoped);
      console.log('[RBAC] cached scoped perms:', cacheKey, perms);
    } else {
      const fallback = localStorage.getItem(fallbackKey);
      if (fallback) {
        perms = JSON.parse(fallback);
        console.log('[RBAC] fallback perms from permissionsList:', perms);
      }
    }
  } catch (e) {
    console.warn('[RBAC] parse cache error:', e);
    perms = [];
  }
  if (!Array.isArray(perms)) perms = [];
  return perms;
}

// خريطة تحويل أسماء data-permission إلى أسماء API
const DATA_PERMISSION_TO_API = {
  'report.create': 'submit_complaint',
  'follow_own_complaint': 'follow_own_complaint',
  'assigned_complaints': 'assigned_complaints',
  'view_public_reports': 'view_public_complaints',
  'department_employees': 'department_employees',
  'report_distribution': 'complaint_distribution',
  'employee_distribution': 'employee_distribution',
  'secret_visitor_distribution': 'secret_visitor_distribution',
  'department_reports': 'department_complaints',
  'department_panel': 'department_panel',
  'secret_visitor_employee_distribution': 'secret_visitor_employee_distribution',
  'secret_visitor_assigned_reports': 'secret_visitor_assigned_reports',
  'dashboard': 'access_dashboard',
  'manage_permissions': 'manage_permissions',
  'deleted_reports': 'deleted_complaints',
  'records': 'records',
  'user_management': 'user_management',
  'reports_export': 'reports_export'
};

// Function to refresh permissions from the server
async function refreshUserPermissions() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const empId = user?.EmployeeID || user?.employeeId || user?.id;
    
    if (!empId || !token) {
      console.warn('[RBAC] Cannot refresh permissions: missing empId or token');
      return false;
    }

    console.log('[RBAC] Refreshing permissions for employee:', empId);
    
    const res = await fetch(`${API_BASE_URL}/permissions/bootstrap/${empId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      console.error('[RBAC] Failed to refresh permissions:', res.status);
      return false;
    }
    
    const payload = await res.json();
    const cacheKey = `userPermissions:${empId}`;
    const oldEnabled = JSON.parse(localStorage.getItem(cacheKey) || '[]');

    if (!payload?.success) {
      console.error('[RBAC] refresh failed, keep old cache');
      initEmployeePermissionGates();
      return false;
    }

    const enabled = Array.isArray(payload.data?.enabled) ? payload.data.enabled : [];
    const flags = payload.data?.flags || {};

    // 🛡️ إن رجعت فاضية بشكل مريب، لا نكسر الواجهة
    if (!enabled.length && !Object.keys(flags).length) {
      console.warn('[RBAC] Empty permissions from server; keeping previous cache.');
      if (oldEnabled.length) {
        localStorage.setItem(cacheKey, JSON.stringify(oldEnabled));
      }
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(enabled));
      localStorage.setItem('permissionsFlags', JSON.stringify(flags));
    }
    
    console.log('[RBAC] Permissions refreshed successfully:', enabled);
    console.log('[RBAC] Department panel permission included:', enabled.includes('department_panel'));
    console.log('[RBAC] Secret visitor employee distribution permission included:', enabled.includes('secret_visitor_employee_distribution'));
    console.log('[RBAC] Secret visitor assigned reports permission included:', enabled.includes('secret_visitor_assigned_reports'));
    
    // Re-apply permission gates with fresh data
    initEmployeePermissionGates();
    
    return true;
  } catch (error) {
    console.error('[RBAC] Error refreshing permissions:', error);
    return false;
  }
}

// Check for permission updates every 30 seconds (optional - can be disabled)
let permissionCheckInterval = null;
function startPermissionMonitoring() {
  if (permissionCheckInterval) clearInterval(permissionCheckInterval);
  
  // Check every 30 seconds if permissions have been updated
  permissionCheckInterval = setInterval(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const empId = user?.EmployeeID || user?.employeeId || user?.id;
    const cacheKey = `userPermissions:${empId}`;
    
    // If cache is missing, it might have been cleared by admin - refresh
    if (empId && !localStorage.getItem(cacheKey)) {
      console.log('[RBAC] Permission cache missing - refreshing...');
      await refreshUserPermissions();
    } else {
      // Proactively refresh permissions to check for changes
      console.log('[RBAC] Proactively checking for permission updates...');
      await refreshUserPermissions();
    }
  }, 10000); // 10 seconds for better responsiveness
}

function initEmployeePermissionGates() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = Number(user?.RoleID || 0);
  console.log('[RBAC] init gates for user:', user, 'roleId:', roleId);

  if (roleId === 1) {
    console.log('[RBAC] super admin → show all cards');
    return;
  }

  const perms = getCachedPermsForCurrentUser();
  const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
  console.log('[RBAC] effective perms:', perms);
  console.log('[RBAC] permissions flags:', flags);
  console.log('[RBAC] view_public_complaints permission:', perms.includes('view_public_complaints'));
  console.log('[RBAC] secret_visitor_employee_distribution permission:', perms.includes('secret_visitor_employee_distribution'));
  console.log('[RBAC] secret_visitor_assigned_reports permission:', perms.includes('secret_visitor_assigned_reports'));

  // 🛡️ وضع أمان: إذا ما قدرنا نجيب صلاحيات، لا تغيّر عرض البطاقات
  if (!perms || !perms.length) {
    console.warn('[RBAC] No permissions loaded for this user — leaving cards as-is.');
    return; // لا تعمل إخفاء جماعي
  }

  const cards = Array.from(document.querySelectorAll('section.dashboard .card'));
  console.log('[RBAC] found cards:', cards.length);

  cards.forEach((card, idx) => {
    const a = card.querySelector('a.btn');
    const button = card.querySelector('button.btn');
    const title = (card.querySelector('h3')?.textContent || '').trim();
    const href = normHref(a?.getAttribute('href') || '');

    let need = null;
    let syn = [];

    // دعم عام لـ data-permission attribute
    const dataPerm = card.getAttribute('data-permission');
    if (dataPerm) {
      // تحويل اسم data-permission إلى اسم API
      const apiPermission = DATA_PERMISSION_TO_API[dataPerm] || dataPerm;
      need = apiPermission;
      syn = [apiPermission];
      console.log(`🔍 فحص صلاحية data-permission:`, {dataPerm, apiPermission, need, syn, perms});
      
      // Special debugging for department_panel
      if (dataPerm === 'department_panel') {
        console.log('🔍 DEPARTMENT PANEL DEBUG:');
        console.log('  - Card title:', title);
        console.log('  - Data permission:', dataPerm);
        console.log('  - User permissions:', perms);
        console.log('  - Has department_panel:', perms.includes('department_panel'));
        console.log('  - Permission check result:', syn.some(k => perms.includes(k)));
      }
      
      // Special debugging for assigned_complaints
      if (dataPerm === 'assigned_complaints') {
        console.log('🔍 ASSIGNED COMPLAINTS DEBUG:');
        console.log('  - Card title:', title);
        console.log('  - Data permission:', dataPerm);
        console.log('  - User permissions:', perms);
        console.log('  - Has assigned_complaints:', perms.includes('assigned_complaints'));
        console.log('  - Permission check result:', syn.some(k => perms.includes(k)));
      }
      
      // Keep data-permission as primary - no fallback that resets need
      // This ensures data-permission takes priority over hardcoded logic
    }
    
    // Run hardcoded logic if no data-permission or if data-permission failed
    if (!need) {
      // Only run hardcoded logic if no data-permission attribute exists
      if (href.includes('new complaint/newcomplaint.html') || href.endsWith('newcomplaint.html') || title.includes('تقديم')) {
      need = 'complaint.create';
      syn = ['complaint.create','submit_complaint'];
    } else if (href.includes('complaints-followup/followup.html') || href.endsWith('followup.html') || title.includes('متابعة')) {
      need = 'complaint.track';
      syn = ['complaint.track','follow_own_complaint'];
    } 
      else if (href.includes('general complaints/general-complaints.html') || title.includes('العامة')) {
      need = 'complaint.public';
      syn = ['complaint.public','view_public_complaints','public_complaints'];
      console.log('🔍 فحص صلاحية الشكاوى العامة:', {need, syn, perms});
    } else if (href.includes('dept-admin/dept-dashboard.html') || title.includes('موظفي القسم')) {
      need = 'department.staff';
      syn = ['department.staff','department_employees'];
    } else if (href.includes('director/complaint-distribution.html') || (title.includes('توزيع الشكاوى') && !title.includes('للموظفين') && !title.includes('بلاغات'))) {
      need = 'complaint.distribute';
      syn = ['complaint.distribute','complaint_distribution'];
      console.log('🔍 فحص صلاحية توزيع الشكاوى (للأقسام فقط):', {need, syn, perms, title});
    } else if (href.includes('DashBoard/overview.html') || title.includes('لوحة المعلومات')) {
      need = 'dashboard.access';
      syn = ['dashboard.access','access_dashboard','dashboard'];
    } else if (href.includes('superadmin/permissions.html') || title.includes('إدارة الصلاحيات')) {
      need = 'permissions.manage';
      syn = ['permissions.manage','manage_permissions','control_panel_access'];
      console.log('🔍 فحص صلاحية إدارة الصلاحيات:', {need, syn, perms});
    } else if (href.includes('superadmin/deleted-complaints.html') || title.includes('الشكاوى المحذوفة')) {
      need = 'deleted_complaints';
      syn = ['deleted_complaints'];
      console.log('🔍 فحص صلاحية الشكاوى المحذوفة:', {need, syn, perms});
    } else if (href.includes('superadmin/logs.html') || title.includes('السجلات')) {
      need = 'records';
      syn = ['records'];
      console.log('🔍 فحص صلاحية السجلات:', {need, syn, perms});
    } else if (href.includes('superadmin/manage-users.html') || title.includes('إدارة المستخدمين')) {
      need = 'user_management';
      syn = ['user_management'];
    } else if (title.includes('توزيع الشكاوى للموظفين') || title.includes('Distribute Complaints to Employees') || 
               (button && button.getAttribute('onclick') && button.getAttribute('onclick').includes('openEmployeeDistribution'))) {
      need = 'employee_distribution';
      syn = ['employee_distribution'];
      console.log('🔍 فحص صلاحية توزيع الشكاوى للموظفين:', {need, syn, perms});
    } else if (
      href.includes('secret-visitor-distribution.html') ||
      title.includes('توزيع بلاغات الزائر السري') ||
      title.includes('Secret Visitor Distribution')
    ) {
      need = 'secret_visitor_distribution';
      syn = ['secret_visitor_distribution'];
      console.log('🔍 فحص صلاحية توزيع بلاغات الزائر السري:', {need, syn, perms});
    } else if (
      href.includes('dept-admin/department-complaints.html') ||
      title.includes('شكاوى القسم') ||
      title.includes('Department Complaints')
    ) {
      need = 'department_complaints';
      syn = ['department_complaints'];
      console.log('🔍 فحص صلاحية شكاوى القسم:', {need, syn, perms});
    } else if (
      href.includes('dept-admin/dept-dashboard.html') ||
      title.includes('لوحة القسم') ||
      title.includes('Department Panel')
    ) {
      need = 'department_panel';
      syn = ['department_panel'];
      console.log('🔍 فحص صلاحية لوحة القسم:', {need, syn, perms});
    } else if (
      href.includes('dept-admin/dept-secret-visitor-employee-distribution.html') ||
      title.includes('توزيع بلاغات الزائر السري على الموظفين') ||
      title.includes('Distribute Secret Visitor Reports to Employees')
    ) {
      need = 'secret_visitor_employee_distribution';
      syn = ['secret_visitor_employee_distribution'];
      console.log('🔍 فحص صلاحية توزيع بلاغات الزائر السري على الموظفين:', {need, syn, perms});
    } else if (
      href.includes('dept-admin/dept-assigned-secret-visitor-reports.html') ||
      title.includes('بلاغات الزائر السري المسندة لي') ||
      title.includes('Reports of the Secret Visitor Assigned to Me')
    ) {
      need = 'secret_visitor_assigned_reports';
      syn = ['secret_visitor_assigned_reports'];
      console.log('🔍 فحص صلاحية بلاغات الزائر السري المسندة لي:', {need, syn, perms});
    } else if (
      href.includes('employee-reports.html') ||
      (title.includes('المسندة لي') && !title.includes('الزائر السري'))
    ) {
      need = 'assigned_complaints';
      syn = ['assigned_complaints'];
      console.log('🔍 فحص صلاحية البلاغات المسندة لي:', {need, syn, perms});
    }
    }

    if (!need) {
      console.log(`[RBAC] [${idx}] skip (no mapping) title="${title}" href="${a?.getAttribute('href')||''}" norm="${href}"`);
      return;
    }

    // فقط لو عند البطاقة data-permission نطبّق الإخفاء/الإظهار
    let allowed = null;
    if (need && syn.length) {
      allowed = syn.some(k => perms.includes(k) || flags[k] === true);
      console.log(`[RBAC] [${idx}] title="${title}" href="${a?.getAttribute('href')||''}" norm="${href}" need="${need}" syn=${JSON.stringify(syn)} allowed=${allowed}`);
      
      if (!allowed) {
        card.style.display = 'none';
        console.log(`[RBAC] HIDE "${title}" need=${need}`);
      } else {
        card.style.display = '';
        console.log(`[RBAC] SHOW "${title}" need=${need}`);
      }
    } else {
      // لا يوجد data-permission واضح → اترك البطاقة كما هي (لا تخفيها)
      console.log(`[RBAC] Skip (no explicit mapping) → "${title}" left unchanged`);
    }
    
    // Special logging for department_panel to help debug
    if (need === 'department_panel') {
      console.log(`[RBAC] 🎯 DEPARTMENT PANEL CARD: "${title}" | Allowed: ${allowed} | Display: ${card.style.display}`);
    }
    
    
    // Special logging for secret_visitor_employee_distribution to help debug
    if (need === 'secret_visitor_employee_distribution') {
      console.log(`[RBAC] 🎯 SECRET VISITOR EMPLOYEE DISTRIBUTION CARD: "${title}" | Allowed: ${allowed} | Display: ${card.style.display}`);
    }
    
    // Special logging for secret_visitor_assigned_reports to help debug
    if (need === 'secret_visitor_assigned_reports') {
      console.log(`[RBAC] 🎯 SECRET VISITOR ASSIGNED REPORTS CARD: "${title}" | Allowed: ${allowed} | Display: ${card.style.display}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  console.log('[EMP] DOMContentLoaded start');
  if(!guardEmployee()) return;

  const lang = localStorage.getItem('lang') || 'ar';
  applyLanguage(lang);

  initEmployeePermissionGates();
  
  // Start monitoring for permission changes
  startPermissionMonitoring();
  
  // Force refresh permissions on page load
  await refreshUserPermissions();
  
  // Also refresh permissions when page gains focus (user switches back to tab)
  window.addEventListener('focus', async () => {
    console.log('[RBAC] Page gained focus - checking for permission updates...');
    await refreshUserPermissions();
  });
  
  // Make refreshUserPermissions available globally for manual testing
  window.refreshPermissions = async () => {
    console.log('[RBAC] Manual permission refresh triggered...');
    await refreshUserPermissions();
  };
  
  // Add specific function to test secret visitor employee distribution permission
  window.testSecretVisitorEmployeeDistribution = () => {
    const perms = getCachedPermsForCurrentUser();
    console.log('[RBAC] 🔍 Testing secret_visitor_employee_distribution permission:');
    console.log('[RBAC] 🔍 Current permissions:', perms);
    console.log('[RBAC] 🔍 Has secret_visitor_employee_distribution:', perms.includes('secret_visitor_employee_distribution'));
    
    const card = document.querySelector('[data-permission="secret_visitor_employee_distribution"]');
    if (card) {
      console.log('[RBAC] 🔍 Card found:', card);
      console.log('[RBAC] 🔍 Card display style:', card.style.display);
      console.log('[RBAC] 🔍 Card visibility:', getComputedStyle(card).display);
    } else {
      console.log('[RBAC] 🔍 Card not found!');
    }
  };
  
  // Add specific function to test secret visitor assigned reports permission
  window.testSecretVisitorAssignedReports = () => {
    const perms = getCachedPermsForCurrentUser();
    console.log('[RBAC] 🔍 Testing secret_visitor_assigned_reports permission:');
    console.log('[RBAC] 🔍 Current permissions:', perms);
    console.log('[RBAC] 🔍 Has secret_visitor_assigned_reports:', perms.includes('secret_visitor_assigned_reports'));
    
    const card = document.querySelector('[data-permission="secret_visitor_assigned_reports"]');
    if (card) {
      console.log('[RBAC] 🔍 Card found:', card);
      console.log('[RBAC] 🔍 Card display style:', card.style.display);
      console.log('[RBAC] 🔍 Card visibility:', getComputedStyle(card).display);
    } else {
      console.log('[RBAC] 🔍 Card not found!');
    }
  };
  
  // Add function to test all secret visitor permissions
  window.testAllSecretVisitorPermissions = () => {
    const perms = getCachedPermsForCurrentUser();
    console.log('[RBAC] 🔍 Testing all secret visitor permissions:');
    console.log('[RBAC] 🔍 Current permissions:', perms);
    console.log('[RBAC] 🔍 secret_visitor_employee_distribution:', perms.includes('secret_visitor_employee_distribution'));
    console.log('[RBAC] 🔍 secret_visitor_assigned_reports:', perms.includes('secret_visitor_assigned_reports'));
    
    // Check all secret visitor cards
    const cards = document.querySelectorAll('[data-permission*="secret_visitor"]');
    cards.forEach((card, index) => {
      const permission = card.getAttribute('data-permission');
      const title = card.querySelector('h3')?.textContent || 'Unknown';
      const display = card.style.display;
      const visibility = getComputedStyle(card).display;
      console.log(`[RBAC] 🔍 Card ${index + 1}: ${permission} - "${title}" | Display: ${display} | Visibility: ${visibility}`);
    });
  };

  document.getElementById('langToggle')?.addEventListener('click', ()=>{
    applyLanguage((localStorage.getItem('lang')||'ar') === 'ar' ? 'en' : 'ar');
  });

  document.getElementById('notifBtn')?.addEventListener('click', ()=>{
    const m = document.getElementById('notifModal');
    if (m) m.style.display = 'flex';
  });
  document.getElementById('closeNotif')?.addEventListener('click', ()=>{
    const m = document.getElementById('notifModal');
    if (m) m.style.display = 'none';
  });

  document.getElementById('closeErrorModal')?.addEventListener('click', ()=>{
    const m = document.getElementById('errorModal'); if(m) m.style.display='none';
  });
  document.getElementById('closeErrorBtn')?.addEventListener('click', ()=>{
    const m = document.getElementById('errorModal'); if(m) m.style.display='none';
  });

  await loadOverviewData();
  await loadNotifications();
  
  
  console.log('[EMP] DOMContentLoaded end');
});

// دالة توزيع الشكاوى للموظفين
function openEmployeeDistribution() {
  // تحقق من وجود القسم
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userDepartmentId = user?.DepartmentID;
  
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }

  // تحقق من الصلاحية
  const roleId = Number(user?.RoleID || 0);
  
  // Super Admin له جميع الصلاحيات
  if (roleId !== 1) {
    const empId = user?.EmployeeID || user?.employeeId || user?.id;
    if (empId) {
      const cacheKey = `userPermissions:${empId}`;
      const cached = localStorage.getItem(cacheKey);
      let perms = [];
      if (cached) {
        try {
          perms = JSON.parse(cached);
        } catch (e) {
          console.warn('Failed to parse cached permissions:', e);
        }
      }
      
      const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
      const hasPermission = perms.includes('employee_distribution') || flags.employee_distribution === true;
      
      if (!hasPermission) {
        alert('ليس لديك صلاحية لتوزيع الشكاوى للموظفين');
        return;
      }
    }
  }

  // فتح المودال
  document.getElementById('employeeDistributionModal').style.display = 'block';
  
  // إظهار حالة التحميل
  const tbody = document.getElementById('employeeDistributionReportsTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7">جاري التحميل...</td></tr>';
  }

  loadEmployeeDistributionComplaints();
}

async function loadEmployeeDistributionComplaints() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userDepartmentId = user?.DepartmentID;
    
    const statusFilter = document.getElementById('employeeDistributionStatusFilter')?.value || '';
    const assignmentFilter = document.getElementById('employeeDistributionAssignmentFilter')?.value || '';
    
    let url = `${API_BASE_URL}/dept-admin/complaints/department/${userDepartmentId}/assignment`;
    const params = new URLSearchParams();
    
    if (statusFilter) params.append('status', statusFilter);
    if (assignmentFilter) params.append('assignment', assignmentFilter);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    const response = await fetch(url, {
      headers: authHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Employee distribution complaints data received:', data);
      displayEmployeeDistributionComplaints(data.data || data || []);
    } else {
      console.error('Failed to load employee distribution complaints:', response.status, response.statusText);
      const tbody = document.getElementById('employeeDistributionReportsTableBody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7">فشل في تحميل البيانات</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error loading employee distribution complaints:', error);
    const tbody = document.getElementById('employeeDistributionReportsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7">خطأ في تحميل البيانات</td></tr>';
    }
  }
}

function displayEmployeeDistributionComplaints(complaints) {
  const tbody = document.getElementById('employeeDistributionReportsTableBody');
  if (!tbody) {
    console.log('Employee distribution reports table body not found');
    return;
  }
  tbody.innerHTML = '';

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">لا توجد شكاوى</div>
          <div class="empty-state-subtext">لا توجد شكاوى تطابق المعايير المحددة</div>
        </td>
      </tr>
    `;
    return;
  }

  complaints.forEach(complaint => {
    const row = document.createElement('tr');
    
    // For employee distribution, show assign and view buttons
    const actionButtons = `<button class="btn-small btn-assign" onclick="openAssignmentModal(${complaint.ComplaintID})" data-ar="توزيع" data-en="Assign">توزيع</button>
                           <button class="btn-small btn-view" onclick="viewComplaintDetails(${complaint.ComplaintID})" data-ar="عرض التفاصيل" data-en="View Details">عرض التفاصيل</button>`;
    
    row.innerHTML = `
      <td>${complaint.ComplaintID}</td>
      <td>${complaint.PatientName || complaint.RequesterName || '-'}</td>
      <td>${complaint.ComplaintTypeName || complaint.TypeName || '-'}</td>
      <td>${formatDate(complaint.CreatedAt || complaint.ComplaintDate)}</td>
      <td><span class="status-badge status-${getStatusClass(complaint.CurrentStatus)}">${complaint.CurrentStatus}</span></td>
      <td>${complaint.AssignedEmployeeName || 'غير مخصص'}</td>
      <td class="action-buttons">${actionButtons}</td>
    `;
    tbody.appendChild(row);
  });
}

// Helper function to get status class
function getStatusClass(status) {
  if (!status) return 'new';
  if (status.includes('جديدة')) return 'new';
  if (status.includes('قيد المعالجة')) return 'progress';
  if (status.includes('تم الحل')) return 'resolved';
  if (status.includes('مغلقة')) return 'closed';
  return 'new';
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const currentLang = localStorage.getItem('lang') || 'ar';
  return date.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-US');
}

// Open employee assignment modal
// Assignment Modal Functions (Admin Style)
let currentComplaintId = null;

async function openAssignmentModal(complaintId) {
  if (!complaintId) {
    alert('Invalid complaint ID');
    return;
  }
  
  currentComplaintId = complaintId;
  console.log('Opening assignment modal for complaint:', complaintId);
  
  // Show the individual assignment modal
  const modal = document.getElementById('individualAssignmentModal');
  modal.style.display = 'block';
  
  // Show loading state
  const loadingEl = document.getElementById('assignmentLoading');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
  }
  
  // Load department employees for assignment
  await loadEmployeesForAssignment();
  
  // Hide loading state
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

async function loadEmployeesForAssignment() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userDepartmentId = user?.DepartmentID;
  
  if (!userDepartmentId) {
    alert('Your department is not set. Please contact the administrator.');
    return;
  }
  
  try {
    console.log('Loading employees for assignment in department:', userDepartmentId);
    
    const response = await fetch(
      `${API_BASE_URL}/dept-admin/department-employees/${userDepartmentId}/assignable`,
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Employees data for assignment:', data);
      
      if (data.data && data.data.length > 0) {
        populateEmployeeSelect(data.data);
      } else {
        console.warn('No employees found in department');
        alert('No employees found in your department. Please contact the administrator.');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to load employees for assignment:', response.status, errorData);
      alert(`Failed to load employees: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading employees for assignment:', error);
    alert('Error loading employees. Please try again.');
  }
}

function populateEmployeeSelect(employees) {
  const select = document.getElementById('employeeSelect');
  if (!select) {
    console.error('Employee select element not found');
    return;
  }
  
  select.innerHTML = '<option value="">اختر موظف...</option>';
  
  console.log('Populating employee select with:', employees);
  
  employees.forEach(employee => {
    const option = document.createElement('option');
    option.value = employee.EmployeeID;
    option.textContent = `${employee.FullName} (${employee.RoleName})`;
    select.appendChild(option);
  });
  
  console.log('Employee select populated with', employees.length, 'employees');
}

function closeIndividualAssignmentModal() {
  const modal = document.getElementById('individualAssignmentModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentComplaintId = null;
}

async function confirmAssignment() {
  const employeeSelect = document.getElementById('employeeSelect');
  if (!employeeSelect) {
    console.error('Employee select element not found');
    alert('Error: Employee selection not available');
    return;
  }
  
  const employeeId = employeeSelect.value;
  
  if (!employeeId) {
    alert('يرجى اختيار موظف');
    return;
  }
  
  if (!currentComplaintId) {
    alert('خطأ في معرف البلاغ ');
    return;
  }
  
  try {
    console.log('Assigning complaint', currentComplaintId, 'to employee', employeeId);
    
    const requestBody = { employeeId: parseInt(employeeId) };
    console.log('Request body:', requestBody);
    
    const response = await fetch(`${API_BASE_URL}/dept-admin/complaints/${currentComplaintId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Assignment response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Assignment successful:', data);
      alert('تم توزيع البلاغ  بنجاح');
      
      // Close modal
      closeIndividualAssignmentModal();
      
      // Refresh the complaints table
      loadEmployeeDistributionComplaints();
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Assignment failed:', response.status, errorData);
      alert(`فشل في توزيع البلاغ : ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error assigning complaint:', error);
    alert(`حدث خطأ في توزيع البلاغ : ${error.message}`);
  }
}


function filterEmployeeDistributionComplaints() {
  loadEmployeeDistributionComplaints();
}

// View complaint details
function viewComplaintDetails(complaintId) {
  window.location.href = `../general complaints/details.html?id=${complaintId}`;
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}


