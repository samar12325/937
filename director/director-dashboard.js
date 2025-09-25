/* ====== مدير جميع الأقسام - لوحة التحكم ====== */

const API_BASE_URL = 'http://localhost:3001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

let currentLanguage = 'ar';
let userDepartmentId = null;

// متغيرات الإشعارات
let notifications = [];
let notificationCount = 0;

/* ====== أدوات DOM ====== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ====== دوال الإشعارات ====== */
async function loadNotifications() {
  try {
    console.log('🔔 Loading notifications...');
    const response = await fetch(`${API_BASE_URL}/notifications?status=all&limit=50`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      notifications = data.data || [];
      notificationCount = notifications.filter(n => !n.IsRead).length;
      updateNotificationUI();
      console.log('✅ Loaded notifications:', notifications.length, 'Total unread:', notificationCount);
    } else {
      console.log('⚠️ Failed to load notifications, using mock data');
      // بيانات تجريبية للإشعارات
      notifications = [
        {
          NotificationID: 1,
          Title: 'بلاغ  جديدة',
          Body: 'تم تقديم بلاغ  جديدة في قسم الطوارئ',
          IsRead: 0,
          CreatedAt: new Date().toISOString()
        },
        {
          NotificationID: 2,
          Title: 'تحديث حالة',
          Body: 'تم تحديث حالة البلاغ  رقم 123',
          IsRead: 0,
          CreatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      notificationCount = notifications.filter(n => !n.IsRead).length;
      updateNotificationUI();
    }
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    // بيانات تجريبية في حالة الخطأ
    notifications = [
      {
        NotificationID: 1,
        Title: 'بلاغ  جديدة',
        Body: 'تم تقديم بلاغ  جديدة في قسم الطوارئ',
        IsRead: 0,
        CreatedAt: new Date().toISOString()
      }
    ];
    notificationCount = 1;
    updateNotificationUI();
  }
}

function updateNotificationUI() {
  const notifCount = $('#notifCount');
  if (notifCount) {
    if (notificationCount > 0) {
      notifCount.textContent = notificationCount;
      notifCount.style.display = 'block';
    } else {
      notifCount.style.display = 'none';
    }
  }
  
  // تحديث modal الإشعارات إذا كان مفتوحاً
  const existingModal = document.querySelector('.notification-modal');
  if (existingModal) {
    // إزالة modal القديم
    document.body.removeChild(existingModal);
    // إنشاء modal جديد بالبيانات المحدثة
    showNotifications();
  }
}

function showNotifications() {
  // إنشاء قائمة الإشعارات
  const notificationList = notifications.map(notif => `
    <div class="notification-item ${notif.IsRead ? 'read' : 'unread'}" data-id="${notif.NotificationID}">
      <div class="notification-content">
        <h4>${notif.Title}</h4>
        <p>${notif.Body}</p>
        <small>${new Date(notif.CreatedAt).toLocaleString('ar-SA')}</small>
        ${!notif.IsRead ? `<button class="mark-read-btn" onclick="markAsRead(${notif.NotificationID})">مقروءة</button>` : ''}
      </div>
    </div>
  `).join('');

  // إنشاء modal الإشعارات
  const modal = document.createElement('div');
  modal.className = 'notification-modal';
  modal.innerHTML = `
    <div class="notification-modal-content">
      <div class="notification-header">
        <h3>الإشعارات (${notificationCount} غير مقروءة)</h3>
        <div class="notification-actions">
          <button class="test-notification-btn" onclick="createTestNotification()">إشعار تجريبي</button>
          <button class="start-server-btn" onclick="startBackendServer()">بدء الخادم</button>
          <button class="refresh-notifications-btn" onclick="reloadNotifications()">تحديث</button>
          ${notificationCount > 0 ? '<button class="mark-all-read-btn" onclick="markAllAsRead()">تعيين الكل كمقروء</button>' : ''}
          <button class="close-notifications">&times;</button>
        </div>
      </div>
      <div class="server-status" id="serverStatus" style="display: none;">
        <small>⚠️ الخادم غير متاح - التحديثات محلية فقط</small>
      </div>
      <div class="notification-list">
        ${notifications.length > 0 ? notificationList : '<p>لا توجد إشعارات</p>'}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // إضافة event listeners
  modal.querySelector('.close-notifications').onclick = () => {
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
  
  // إظهار رسالة حالة الخادم إذا لم يكن متاحاً
  const serverStatus = modal.querySelector('#serverStatus');
  if (serverStatus) {
    testServerConnection().then(isAvailable => {
      if (!isAvailable) {
        serverStatus.style.display = 'block';
      }
    });
  }
}

// دالة تعيين إشعار كمقروء
async function markAsRead(notificationId) {
  try {
    console.log('🔔 Marking notification as read:', notificationId);
    console.log('🔔 API URL:', `${API_BASE_URL}/notifications/${notificationId}/read`);
    console.log('🔔 Headers:', getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    console.log('🔔 Response status:', response.status);
    console.log('🔔 Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔔 Response data:', result);
      
      // تحديث البيانات المحلية
      const notification = notifications.find(n => n.NotificationID === notificationId);
      if (notification) {
        notification.IsRead = 1;
        notificationCount = notifications.filter(n => !n.IsRead).length;
        updateNotificationUI();
        
        // إزالة زر "مقروءة" من الواجهة
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
          notificationElement.classList.remove('unread');
          notificationElement.classList.add('read');
          const markReadBtn = notificationElement.querySelector('.mark-read-btn');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        }
        
        console.log('✅ Notification marked as read');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to mark notification as read:', response.status, errorText);
      
      // حل بديل: تحديث محلي في حالة فشل الخادم
      console.log('🔄 Server unavailable, updating locally...');
      const notification = notifications.find(n => n.NotificationID === notificationId);
      if (notification) {
        notification.IsRead = 1;
        notificationCount = notifications.filter(n => !n.IsRead).length;
        updateNotificationUI();
        
        // إزالة زر "مقروءة" من الواجهة
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
          notificationElement.classList.remove('unread');
          notificationElement.classList.add('read');
          const markReadBtn = notificationElement.querySelector('.mark-read-btn');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        }
        
        console.log('✅ Notification marked as read locally');
      }
    }
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    
    // حل بديل: تحديث محلي في حالة فشل الاتصال
    console.log('🔄 Connection failed, updating locally...');
    const notification = notifications.find(n => n.NotificationID === notificationId);
    if (notification) {
      notification.IsRead = 1;
      notificationCount = notifications.filter(n => !n.IsRead).length;
      updateNotificationUI();
      
      // إزالة زر "مقروءة" من الواجهة
      const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
      if (notificationElement) {
        notificationElement.classList.remove('unread');
        notificationElement.classList.add('read');
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      }
      
      console.log('✅ Notification marked as read locally');
    }
  }
}

// دالة تعيين جميع الإشعارات كمقروءة
async function markAllAsRead() {
  try {
    console.log('🔔 Marking all notifications as read');
    console.log('🔔 API URL:', `${API_BASE_URL}/notifications/read-all`);
    console.log('🔔 Headers:', getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    console.log('🔔 Response status:', response.status);
    console.log('🔔 Response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🔔 Response data:', result);
      
      // تحديث البيانات المحلية
      notifications.forEach(notification => {
        notification.IsRead = 1;
      });
      notificationCount = 0;
      updateNotificationUI();
      
      // تحديث الواجهة
      document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        const markReadBtn = item.querySelector('.mark-read-btn');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      });
      
      // إخفاء زر "تعيين الكل كمقروء"
      const markAllBtn = document.querySelector('.mark-all-read-btn');
      if (markAllBtn) {
        markAllBtn.remove();
      }
      
      // تحديث العنوان
      const header = document.querySelector('.notification-header h3');
      if (header) {
        header.textContent = 'الإشعارات (0 غير مقروءة)';
      }
      
      console.log('✅ All notifications marked as read');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to mark all notifications as read:', response.status, errorText);
      
      // حل بديل: تحديث محلي في حالة فشل الخادم
      console.log('🔄 Server unavailable, updating locally...');
      notifications.forEach(notification => {
        notification.IsRead = 1;
      });
      notificationCount = 0;
      updateNotificationUI();
      
      // تحديث الواجهة
      document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
        const markReadBtn = item.querySelector('.mark-read-btn');
        if (markReadBtn) {
          markReadBtn.remove();
        }
      });
      
      // إخفاء زر "تعيين الكل كمقروء"
      const markAllBtn = document.querySelector('.mark-all-read-btn');
      if (markAllBtn) {
        markAllBtn.remove();
      }
      
      // تحديث العنوان
      const header = document.querySelector('.notification-header h3');
      if (header) {
        header.textContent = 'الإشعارات (0 غير مقروءة)';
      }
      
      console.log('✅ All notifications marked as read locally');
    }
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    
    // حل بديل: تحديث محلي في حالة فشل الاتصال
    console.log('🔄 Connection failed, updating locally...');
    notifications.forEach(notification => {
      notification.IsRead = 1;
    });
    notificationCount = 0;
    updateNotificationUI();
    
    // تحديث الواجهة
    document.querySelectorAll('.notification-item').forEach(item => {
      item.classList.remove('unread');
      item.classList.add('read');
      const markReadBtn = item.querySelector('.mark-read-btn');
      if (markReadBtn) {
        markReadBtn.remove();
      }
    });
    
    // إخفاء زر "تعيين الكل كمقروء"
    const markAllBtn = document.querySelector('.mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.remove();
    }
    
    // تحديث العنوان
    const header = document.querySelector('.notification-header h3');
    if (header) {
      header.textContent = 'الإشعارات (0 غير مقروءة)';
    }
    
    console.log('✅ All notifications marked as read locally');
  }
}

// دالة اختبار الاتصال بالخادم
async function testServerConnection() {
  try {
    console.log('🔍 Testing server connection...');
    const response = await fetch(`${API_BASE_URL}/notifications/count`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return true;
    } else {
      console.log('⚠️ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return false;
  }
}

// دالة بدء الخادم
function startBackendServer() {
  console.log('🚀 Starting backend server...');
  
  // محاولة فتح ملف بدء الخادم
  try {
    // في بيئة Windows
    if (navigator.platform.indexOf('Win') !== -1) {
      window.open('start-backend.bat', '_blank');
    } else {
      // في بيئات أخرى
      alert('يرجى تشغيل الخادم يدوياً من مجلد backend باستخدام: npm start');
    }
    
    // انتظار قليل ثم محاولة إعادة الاتصال
    setTimeout(async () => {
      console.log('🔄 Attempting to reconnect to server...');
      const isConnected = await testServerConnection();
      if (isConnected) {
        console.log('✅ Server is now available!');
        loadNotifications(); // إعادة تحميل الإشعارات
        alert('تم الاتصال بالخادم بنجاح!');
      } else {
        console.log('⚠️ Server still not available');
        alert('الخادم لم يبدأ بعد. يرجى المحاولة مرة أخرى.');
      }
    }, 5000); // انتظار 5 ثوان
    
  } catch (error) {
    console.error('Error opening server start file:', error);
    alert('يرجى تشغيل الخادم يدوياً من مجلد backend باستخدام: npm start');
  }
}

// دالة إعادة تحميل الإشعارات مع رسالة تحميل
async function reloadNotifications() {
  console.log('🔄 Reloading notifications...');
  
  // إظهار رسالة تحميل
  const existingModal = document.querySelector('.notification-modal');
  if (existingModal) {
    const notificationList = existingModal.querySelector('.notification-list');
    if (notificationList) {
      notificationList.innerHTML = '<p style="text-align: center; padding: 20px;">جاري التحميل...</p>';
    }
  }
  
  // إعادة تحميل الإشعارات
  await loadNotifications();
}

// دالة إنشاء إشعار تجريبي للاختبار
async function createTestNotification() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        RecipientEmployeeID: user.EmployeeID,
        Title: 'إشعار تجريبي',
        Body: `تم إنشاء إشعار تجريبي في ${new Date().toLocaleString('ar-SA')}`,
        Type: 'info'
      })
    });
    
    if (response.ok) {
      console.log('✅ Test notification created');
      await loadNotifications(); // إعادة تحميل الإشعارات
    } else {
      console.log('⚠️ Could not create test notification (API might not support POST)');
      // إضافة إشعار تجريبي محلياً
      const newNotification = {
        NotificationID: Date.now(),
        Title: 'إشعار تجريبي',
        Body: `تم إنشاء إشعار تجريبي في ${new Date().toLocaleString('ar-SA')}`,
        IsRead: 0,
        CreatedAt: new Date().toISOString()
      };
      notifications.unshift(newNotification);
      notificationCount = notifications.filter(n => !n.IsRead).length;
      updateNotificationUI();
    }
  } catch (error) {
    console.log('⚠️ Could not create test notification:', error.message);
    // إضافة إشعار تجريبي محلياً في حالة الخطأ
    const newNotification = {
      NotificationID: Date.now(),
      Title: 'إشعار تجريبي',
      Body: `تم إنشاء إشعار تجريبي في ${new Date().toLocaleString('ar-SA')}`,
      IsRead: 0,
      CreatedAt: new Date().toISOString()
    };
    notifications.unshift(newNotification);
    notificationCount = notifications.filter(n => !n.IsRead).length;
    updateNotificationUI();
  }
}

const PERM_SYNONYMS = {
  'complaint.create': ['complaint.create', 'submit_complaint'],
  'complaint.track': ['complaint.track', 'follow_own_complaint'],
  'manage_permissions': ['manage_permissions'],
  'access_dashboard': ['access_dashboard'],
  'dashboard': ['dashboard', 'dashboard.access', 'access_dashboard'],
  'view_public_complaints': ['view_public_complaints', 'complaint.public', 'public_complaints'],
  'department_employees': ['department_employees', 'department.staff'],
  'complaint_distribution': ['complaint_distribution', 'complaint.distribute'],
  'employee_distribution': ['employee_distribution'],
  'deleted_complaints': ['deleted_complaints'],
  'records': ['records'],
  'user_management': ['user_management'],
  'secret_visitor_employee_distribution': [
    'secret_visitor_employee_distribution',
    'employee_distribution', // نفس المفتاح الذي تستخدمه دالة الفتح
    // مرادفات/أسماء قديمة محتمل أن ترجع من الـ API
    'secret_visitor_distribution',
    'sv_employee_distribution',
    'secret_visitor_emp_distribution'
  ],
};

async function fetchPermissionsFromAPI() {
  try {
    const res = await fetch(`${API_BASE_URL}/permissions/current-user`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const payload = await res.json();
    const perms = payload?.data?.permissions || [];
    return perms;
  } catch {
    return [];
  }
}

async function getEffectivePermissions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empId = user?.EmployeeID || user?.UserID || user?.id;
  const cacheKey = empId ? `userPermissions:${empId}` : `userPermissions:UNKNOWN`;

  try {
    const raw = localStorage.getItem(cacheKey) || localStorage.getItem('permissionsList');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {}

  try {
    const flagsRaw = localStorage.getItem('permissionsFlags');
    if (flagsRaw) {
      const flags = JSON.parse(flagsRaw) || {};
      const enabled = Object.entries(flags).filter(([, v]) => !!v).map(([k]) => k);
      if (enabled.length) return enabled;
    }
  } catch {}

  const apiPerms = await fetchPermissionsFromAPI();
  if (Array.isArray(apiPerms) && apiPerms.length && empId) {
    localStorage.setItem(cacheKey, JSON.stringify(apiPerms));
  }
  return apiPerms;
}

function hasAny(perms, keys) {
  return keys.some(k => perms.includes(k));
}

async function refreshDirectorPermissions() {
  try {
    console.log('[DIRECTOR] Refreshing permissions...');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const empId = user?.EmployeeID || user?.UserID || user?.id;
    
    if (!empId) {
      console.warn('[DIRECTOR] No employee ID found for permission refresh');
      return false;
    }
    
    // Try to fetch fresh permissions from API
    const apiPerms = await fetchPermissionsFromAPI();
    if (Array.isArray(apiPerms) && apiPerms.length) {
      const cacheKey = `userPermissions:${empId}`;
      localStorage.setItem(cacheKey, JSON.stringify(apiPerms));
      console.log('[DIRECTOR] Fresh permissions loaded from API:', apiPerms);
    }
    
    // Also check permissions flags
    const flagsRaw = localStorage.getItem('permissionsFlags');
    if (flagsRaw) {
      const flags = JSON.parse(flagsRaw) || {};
      const enabled = Object.entries(flags).filter(([, v]) => !!v).map(([k]) => k);
      console.log('[DIRECTOR] Permission flags:', enabled);
      console.log('[DIRECTOR] Secret visitor employee distribution permission included:', enabled.includes('secret_visitor_employee_distribution'));
    }
    
    // Re-apply permission gates with fresh data
    await initDirectorPermissionGates();
    
    return true;
  } catch (error) {
    console.error('[DIRECTOR] Error refreshing permissions:', error);
    return false;
  }
}

async function initDirectorPermissionGates() {
  const me = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = Number(me?.RoleID || 0);
  console.log('[DIRECTOR] User role:', roleId, 'User:', me);
  
  if (roleId === 1) {
    console.log('[DIRECTOR] Super admin - showing all cards');
    return;
  }

  const perms = await getEffectivePermissions();
  console.log('[DIRECTOR] User permissions:', perms);
  console.log('[DIRECTOR] secret_visitor_employee_distribution permission:', perms.includes('secret_visitor_employee_distribution'));
  
  const cards = $$('.permission-gated');
  console.log('[DIRECTOR] Found permission-gated cards:', cards.length);
  
  cards.forEach((card, idx) => {
    // ✅ تخطي البطاقات الدائمة
    if (card.classList.contains('always-visible')) {
      card.style.display = ''; // تأكيد الظهور
      console.log('[DIRECTOR] Always-visible card - showing without permission check');
      return;
    }
    
    let need = card.getAttribute('data-permission') || '';
    let syn = PERM_SYNONYMS[need] || [need];
    let allowed = hasAny(perms, syn);
    
    const title = card.querySelector('h3')?.textContent || 'Unknown';
    const a = card.querySelector('a.btn');
    const button = card.querySelector('button');
    const href = a?.getAttribute('href') || '';
    
    // Special handling for secret_visitor_employee_distribution permission
    if (need === 'secret_visitor_employee_distribution') {
      console.log(`[DIRECTOR] 🎯 SECRET VISITOR EMPLOYEE DISTRIBUTION CARD: "${title}" | Allowed: ${allowed} | Display: ${card.style.display}`);
      
      // تأكيد الاسم وعدم الاعتماد على العنوان أو الرابط
      need = 'secret_visitor_employee_distribution';
      syn = ['secret_visitor_employee_distribution'];
      allowed = perms.includes('secret_visitor_employee_distribution');
      console.log('🔍 فحص صلاحية توزيع بلاغات الزائر السري على الموظفين:', {need, syn, allowed});
    }
    
    console.log(`[DIRECTOR] [${idx}] title="${title}" href="${href}" need="${need}" syn=${JSON.stringify(syn)} allowed=${allowed}`);
    
    if (allowed) {
      card.style.display = '';
      console.log(`[DIRECTOR] SHOW "${title}" need=${need}`);
    } else {
      card.style.display = 'none';
      console.log(`[DIRECTOR] HIDE "${title}" need=${need}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize user department ID
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  userDepartmentId = user?.DepartmentID;
  console.log('🔍 [DIRECTOR] User Department ID:', userDepartmentId);
  
  const langToggle = $('#langToggle');
  const notifBtn = $('#notifBtn');
  
  // عناصر بطاقات الإحصائيات الجديدة
  const totalComplaintsCard = $('#totalComplaintsCard');
  const openComplaintsCard = $('#openComplaintsCard');
  const inProgressCard = $('#inProgressCard');
  const closedComplaintsCard = $('#closedComplaintsCard');
  
  // عناصر قوائم الشكاوى
  const assignedComplaintsList = $('#assigned-complaints-list');
  const unassignedComplaintsList = $('#unassigned-complaints-list');
  const assignedCount = $('#assignedCount');
  const unassignedCount = $('#unassignedCount');
  const noAssigned = $('#no-assigned');
  const noUnassigned = $('#no-unassigned');

  let allComplaints = [];
  let assignedComplaints = [];
  let unassignedComplaints = [];

  // تحميل الإحصائيات والشكاوى
  async function loadDirectorStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/director/stats`, {
        headers: { ...getAuthHeaders() }
      });

      let stats;
      if (!res.ok) {
        console.warn('Director stats endpoint not available, using fallback data');
        stats = generateFallbackStats();
      } else {
        const payload = await res.json();
        stats = payload.data;
      }

      updateSummaryCards(stats);
      
    } catch (error) {
      console.error('Error loading director stats:', error);
      const fallbackStats = generateFallbackStats();
      updateSummaryCards(fallbackStats);
    }
  }

  function generateFallbackStats() {
    return {
      complaints: {
        totalComplaints: 27,
        newComplaints: 8,
        unassignedComplaints: 6,
        inProgressComplaints: 4,
        closedComplaints: 15
      }
    };
  }

  function updateSummaryCards(stats) {
    if (stats.complaints) {
      totalComplaintsCard.textContent = stats.complaints.totalComplaints || 0;
      openComplaintsCard.textContent = (stats.complaints.newComplaints || 0) + (stats.complaints.unassignedComplaints || 0);
      inProgressCard.textContent = stats.complaints.inProgressComplaints || 0;
      closedComplaintsCard.textContent = stats.complaints.closedComplaints || 0;
    }
  }

  // تحميل قوائم الشكاوى
  async function loadComplaintsLists() {
    try {
      // تحميل الشكاوى المعينة
      await loadAssignedComplaints();
      
      // تحميل الشكاوى غير المعينة
      await loadUnassignedComplaints();
      
    } catch (error) {
      console.error('Error loading complaints lists:', error);
      loadComplaintsFallback();
    }
  }

  async function loadAssignedComplaints() {
    try {
      const res = await fetch(`${API_BASE_URL}/director/complaints?status=assigned`, {
        headers: { ...getAuthHeaders() }
      });

      if (res.ok) {
        const payload = await res.json();
        assignedComplaints = payload?.data || [];
      } else {
        assignedComplaints = getFallbackAssignedComplaints();
      }
      
      renderAssignedComplaints();
    } catch (error) {
      assignedComplaints = getFallbackAssignedComplaints();
      renderAssignedComplaints();
    }
  }

  async function loadUnassignedComplaints() {
    try {
      const res = await fetch(`${API_BASE_URL}/director/complaints?status=unassigned`, {
        headers: { ...getAuthHeaders() }
      });

      if (res.ok) {
        const payload = await res.json();
        unassignedComplaints = payload?.data || [];
      } else {
        unassignedComplaints = getFallbackUnassignedComplaints();
      }
      
      renderUnassignedComplaints();
    } catch (error) {
      unassignedComplaints = getFallbackUnassignedComplaints();
      renderUnassignedComplaints();
    }
  }

  function getFallbackAssignedComplaints() {
    return [
      {
        ComplaintID: 9,
        title: 'بلاغ  معينة للمراجعة',
        Priority: 'متوسطة',
        currentDepartment: 'قسم البصريات',
        assignedToName: 'رنيم',
        ageInDays: 6
      },
      {
        ComplaintID: 10,
        title: 'مشكلة في العلاج',
        Priority: 'عالية',
        currentDepartment: 'قسم الباطنة – القلب',
        assignedToName: 'محمود حامد',
        ageInDays: 3
      }
    ];
  }

  function getFallbackUnassignedComplaints() {
    return [
      {
        ComplaintID: 20,
        title: 'مشكلة في الخدمة',
        Priority: 'متوسطة',
        patientName: 'سمورة',
        ageInDays: 2
      },
      {
        ComplaintID: 21,
        title: 'تأخير في الموعد',
        Priority: 'عاجل',
        patientName: 'أحمد محمد',
        ageInDays: 3
      },
      {
        ComplaintID: 22,
        title: 'مشكلة في البصريات',
        Priority: 'عالية',
        patientName: 'فاطمة علي',
        ageInDays: 4
      }
    ];
  }

  function loadComplaintsFallback() {
    assignedComplaints = getFallbackAssignedComplaints();
    unassignedComplaints = getFallbackUnassignedComplaints();
    renderAssignedComplaints();
    renderUnassignedComplaints();
  }

  // عرض الشكاوى المعينة
  function renderAssignedComplaints() {
    assignedComplaintsList.innerHTML = '';
    assignedCount.textContent = assignedComplaints.length;
    
    if (!assignedComplaints.length) {
      noAssigned.style.display = 'block';
      return;
    }
    
    noAssigned.style.display = 'none';
    
    assignedComplaints.forEach(complaint => {
      const item = document.createElement('div');
      item.className = 'complaint-item';
      item.onclick = () => viewComplaintDetails(complaint.ComplaintID);
      
      const ageText = getAgeText(complaint.ageInDays);
      
      item.innerHTML = `
        <div class="complaint-title">#${complaint.ComplaintID} - ${complaint.title}</div>
        <div class="complaint-meta">
          <span class="priority-indicator ${complaint.Priority}">${complaint.Priority}</span>
          <span class="assigned-to">→ ${complaint.assignedToName}</span>
          <span>${complaint.currentDepartment}</span>
          <span>${ageText}</span>
          <span style="color: #059669; font-weight: 600;">${currentLanguage === 'ar' ? 'انقر للمتابعة' : 'Click to follow up'}</span>
        </div>
      `;
      
      assignedComplaintsList.appendChild(item);
    });
  }

  // عرض الشكاوى غير المعينة
  function renderUnassignedComplaints() {
    unassignedComplaintsList.innerHTML = '';
    unassignedCount.textContent = unassignedComplaints.length;
    
    if (!unassignedComplaints.length) {
      noUnassigned.style.display = 'block';
      return;
    }
    
    noUnassigned.style.display = 'none';
    
    unassignedComplaints.forEach(complaint => {
      const item = document.createElement('div');
      item.className = 'complaint-item';
      item.onclick = () => assignComplaint(complaint.ComplaintID);
      
      const ageText = getAgeText(complaint.ageInDays);
      
      item.innerHTML = `
        <div class="complaint-title">#${complaint.ComplaintID} - ${complaint.title}</div>
        <div class="complaint-meta">
          <span class="priority-indicator ${complaint.Priority}">${complaint.Priority}</span>
          <span>${complaint.patientName}</span>
          <span>${ageText}</span>
          <span style="color: #d97706; font-weight: 600;">${currentLanguage === 'ar' ? 'انقر للتعيين' : 'Click to assign'}</span>
        </div>
      `;
      
      unassignedComplaintsList.appendChild(item);
    });
  }

  function getAgeText(ageInDays) {
    if (ageInDays === 0) {
      return currentLanguage === 'ar' ? 'اليوم' : 'Today';
    } else if (ageInDays === 1) {
      return currentLanguage === 'ar' ? 'أمس' : 'Yesterday';
    } else {
      return `${ageInDays} ${currentLanguage === 'ar' ? 'يوم' : 'days'}`;
    }
  }

  // وظائف التفاعل مع الشكاوى
  function viewComplaintDetails(complaintId) {
    // فتح صفحة المتابعة الموجودة مع معرف البلاغ 
    console.log('View complaint details via followup page:', complaintId);
    window.location.href = `/Complaints-followup/followup.html?complaint=${complaintId}`;
  }

  function assignComplaint(complaintId) {
    // الانتقال لصفحة التوزيع مع تحديد البلاغ 
    console.log('Assign complaint:', complaintId);
    window.location.href = `/director/complaint-distribution.html?complaint=${complaintId}`;
  }

  // إدارة اللغة
  langToggle.addEventListener('click', toggleLanguage);
  
  // إدارة الإشعارات
  if (notifBtn) {
    notifBtn.addEventListener('click', showNotifications);
  }

  function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute('lang', currentLanguage);
    document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.body.className = `lang-${currentLanguage}`;

    updateLanguageTexts();
  }

  function updateLanguageTexts() {
    $$('[data-ar][data-en]').forEach(el => {
      el.textContent = el.getAttribute(`data-${currentLanguage}`);
    });
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.textContent = message;
    statsOverview.appendChild(errorDiv);
  }

  window.loadDirectorStats = loadDirectorStats;
  window.loadComplaintsLists = loadComplaintsLists;

  initDirectorPermissionGates().then(async () => {
    console.log('Starting director dashboard...');
    loadDirectorStats();
    loadComplaintsLists();
    
    // Force refresh permissions on page load
    await refreshDirectorPermissions();
    
    // Also refresh permissions when page gains focus (user switches back to tab)
    window.addEventListener('focus', async () => {
      console.log('[DIRECTOR] Page gained focus - checking for permission updates...');
      await refreshDirectorPermissions();
    });
    
    // اختبار الاتصال بالخادم أولاً
    const serverAvailable = await testServerConnection();
    if (serverAvailable) {
      console.log('✅ Server is available, loading notifications from database');
      loadNotifications(); // تحميل الإشعارات من قاعدة البيانات
    } else {
      console.log('⚠️ Server unavailable, using mock notifications');
      // استخدام بيانات تجريبية
      notifications = [
        {
          NotificationID: 1,
          Title: 'بلاغ  جديدة',
          Body: 'تم تقديم بلاغ  جديدة في قسم الطوارئ',
          IsRead: 0,
          CreatedAt: new Date().toISOString()
        },
        {
          NotificationID: 2,
          Title: 'تحديث حالة',
          Body: 'تم تحديث حالة البلاغ  رقم 123',
          IsRead: 0,
          CreatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      notificationCount = notifications.filter(n => !n.IsRead).length;
      updateNotificationUI();
    }
    
    // تحديث الإشعارات كل 30 ثانية
    setInterval(loadNotifications, 30000);
    
    // Check for permission updates every 30 seconds
    setInterval(refreshDirectorPermissions, 30000);
  });
});

/* ====== وظائف التنقل ====== */

function refreshDashboardData() {
  console.log('Refreshing dashboard data...');
  const refreshBtn = document.getElementById('refresh-data-btn');
  
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span data-ar="جارٍ التحديث..." data-en="Refreshing...">جارٍ التحديث...</span>';
  }
  
  Promise.all([
    window.loadDirectorStats?.(),
    window.loadComplaintsLists?.()
  ]).then(() => {
    console.log('Dashboard data refreshed successfully');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        <img src="/icon/save.png" alt="Refresh" class="btn-icon">
        <span data-ar="تحديث البيانات" data-en="Refresh Data">${currentLanguage === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}</span>
      `;
    }
  }).catch(error => {
    console.error('Error refreshing dashboard:', error);
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        <img src="/icon/save.png" alt="Refresh" class="btn-icon">
        <span data-ar="تحديث البيانات" data-en="Refresh Data">${currentLanguage === 'ar' ? 'تحديث البيانات' : 'Refresh Data'}</span>
      `;
    }
  });
}

function openDepartmentsView() {
  window.location.href = '/director/departments-staff.html';
}

function openDistributionView() {
  window.location.href = '/director/complaint-distribution.html';
}

function openSubmitComplaint() {
  // التنقل للصفحة الموجودة
  window.location.href = '/New complaint/Newcomplaint.html';
}

function openTrackComplaint() {
  // التنقل للصفحة الموجودة للمتابعة
  window.location.href = '/Complaints-followup/followup.html';
}

// دالة توزيع الشكاوى للموظفين
function openEmployeeDistribution() {
  console.log('🔍 [EMPLOYEE DISTRIBUTION] Function called');
  
  // Check permission first (same logic as employee page)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = Number(user?.RoleID || 0);
  
  // Super Admin has all permissions
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
      const hasPermission = 
        perms.includes('secret_visitor_employee_distribution') ||
        flags.secret_visitor_employee_distribution === true;
      
      console.log('🔍 [EMPLOYEE DISTRIBUTION] Permission check:', {
        roleId,
        empId,
        perms,
        flags,
        hasPermission
      });
      
      if (!hasPermission) {
        console.log('❌ [EMPLOYEE DISTRIBUTION] Permission denied');
        alert('ليس لديك صلاحية لتوزيع الشكاوى للموظفين');
        return;
      }
    }
  }

  if (!userDepartmentId) {
    console.log('❌ [EMPLOYEE DISTRIBUTION] No department ID');
    alert('Your department is not set. Please contact the administrator.');
    return;
  }

  console.log('✅ [EMPLOYEE DISTRIBUTION] Opening modal...');
  const modal = document.getElementById('employeeDistributionModal');
  if (!modal) {
    console.error('❌ [EMPLOYEE DISTRIBUTION] Modal not found!');
    alert('Modal not found. Please refresh the page.');
    return;
  }
  
  console.log('🔍 [EMPLOYEE DISTRIBUTION] Modal found, setting display to block');
  modal.style.display = 'block';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';
  modal.style.zIndex = '9999';
  
  // Force modal to be visible
  console.log('🔍 [EMPLOYEE DISTRIBUTION] Modal display after setting:', modal.style.display);
  console.log('🔍 [EMPLOYEE DISTRIBUTION] Modal computed style:', window.getComputedStyle(modal).display);
  
  // Show loading state
  const tbody = document.getElementById('employeeDistributionComplaintsTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7">جاري التحميل...</td></tr>';
    console.log('🔍 [EMPLOYEE DISTRIBUTION] Loading state set in table body');
  } else {
    console.error('❌ [EMPLOYEE DISTRIBUTION] Table body not found!');
  }

  console.log('🔍 [EMPLOYEE DISTRIBUTION] About to load complaints...');
  
  // Add a small delay to ensure modal is visible before loading data
  setTimeout(() => {
    console.log('🔍 [EMPLOYEE DISTRIBUTION] Loading complaints after delay...');
    loadEmployeeDistributionComplaints();
  }, 100);
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
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Employee distribution complaints data received:', data);
      displayEmployeeDistributionComplaints(data.data || data || []);
    } else {
      console.error('Failed to load employee distribution complaints:', response.status, response.statusText);
      const tbody = document.getElementById('employeeDistributionComplaintsTableBody');
      tbody.innerHTML = '<tr><td colspan="7">فشل في تحميل البيانات</td></tr>';
    }
  } catch (error) {
    console.error('Error loading employee distribution complaints:', error);
    const tbody = document.getElementById('employeeDistributionComplaintsTableBody');
    tbody.innerHTML = '<tr><td colspan="7">خطأ في تحميل البيانات</td></tr>';
  }
}

function displayEmployeeDistributionComplaints(complaints) {
  const tbody = document.getElementById('employeeDistributionComplaintsTableBody');
  if (!tbody) {
    console.log('Employee distribution complaints table body not found');
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
