const API_BASE_URL = 'http://127.0.0.1:3001/api/auth';

function redirectByRole(user){
  const roleId = Number(user?.RoleID || user?.roleId || 0);
  const roleHome = {
    1: "/superadmin/superadmin-home.html",
    2: "/employee/employee-home.html",
    3: "/dept-admin/dept-admin.html",
    4: "/director/director-dashboard.html"
  };
  const target = roleHome[roleId] || "/login/login.html";
  window.location.replace(target);
}

function showError(message) { alert(message); }
function showSuccess(message) { alert(message); }

function validateEmail(email){ const re=/^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email); }
function validatePhone(phone){ const re=/^[0-9]{10,15}$/; return re.test(phone); }
function validateNationalID(nationalID){ const re=/^[0-9]{10}$/; return re.test(nationalID); }

async function loadDepartments() {
  const select = document.getElementById('regDepartment');
  if (!select) return;
  select.disabled = true;
  select.innerHTML = `<option value="" disabled selected>${currentLang === 'ar' ? '...جاري تحميل الأقسام' : 'Loading departments...'}</option>`;
  try {
    const res = await fetch(`${API_BASE_URL}/departments`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    select.innerHTML = `<option value="" disabled selected>${currentLang === 'ar' ? 'اختر القسم' : 'Select Department'}</option>`;
    (data.data || []).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.DepartmentID;
      opt.textContent = d.DepartmentName;
      opt.setAttribute('data-ar', d.DepartmentName);
      opt.setAttribute('data-en', d.DepartmentName);
      select.appendChild(opt);
    });
  } catch (err) {
    select.innerHTML = `<option value="" disabled selected>${currentLang === 'ar' ? 'تعذّر تحميل الأقسام' : 'Failed to load departments'}</option>`;
  } finally {
    select.disabled = false;
    applyLanguage(currentLang);
  }
}

function showTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    loadDepartments();
  }
}

const PERM_API_BASE = 'http://127.0.0.1:3001/api';

function clearPermissionCachesForAllUsers() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(k => { if (k.startsWith('userPermissions:')) localStorage.removeItem(k); });
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('permissionsFlags');
    localStorage.removeItem('permissionsList');
    localStorage.removeItem('userPermissions:meta');
  } catch {}
}

function storeScopedPermissions(employee, list, flags) {
  const empId = Number(employee?.EmployeeID || employee?.UserID || 0);
  const cacheKey = empId ? `userPermissions:${empId}` : `userPermissions:UNKNOWN`;
  const metaKey  = `userPermissions:meta`;
  localStorage.setItem(cacheKey, JSON.stringify(Array.isArray(list) ? list : []));
  localStorage.setItem(metaKey, JSON.stringify({ empId }));
  localStorage.setItem('permissionsList', JSON.stringify(Array.isArray(list) ? list : []));
  localStorage.setItem('permissionsFlags', JSON.stringify(flags || {}));
}

async function fetchAndStorePermissionsForLogin(employee, token) {
  try {
    const userId = Number(employee?.EmployeeID || employee?.UserID);
    if (!userId) { storeScopedPermissions(employee, [], {}); return; }
    console.log('[LOGIN][RBAC] bootstrap → userId:', userId);
    const res = await fetch(`${PERM_API_BASE}/permissions/bootstrap/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await res.json();
    console.log('[LOGIN][RBAC] bootstrap status:', res.status, 'payload:', payload);
    if (!res.ok || !payload?.success) { storeScopedPermissions(employee, [], {}); return; }
    const flags = payload.data?.flags || {};
    const enabled = Array.isArray(payload.data?.enabled) ? payload.data.enabled : [];
    console.log('[LOGIN][RBAC] flags:', flags);
    console.log('[LOGIN][RBAC] enabled:', enabled);
    storeScopedPermissions(employee, enabled, flags);
    const empKey = `userPermissions:${employee.EmployeeID}`;
    console.log('[LOGIN][RBAC] stored cacheKey:', empKey, '→', JSON.parse(localStorage.getItem(empKey) || '[]'));
    console.log('[LOGIN][RBAC] stored permissionsList:', JSON.parse(localStorage.getItem('permissionsList') || '[]'));
    console.log('[LOGIN][RBAC] stored permissionsFlags:', JSON.parse(localStorage.getItem('permissionsFlags') || '{}'));
  } catch (e) {
    console.log('[LOGIN][RBAC] bootstrap error, storing empty:', e?.message || e);
    storeScopedPermissions(employee, [], {});
  }
}

async function login() {
  const username = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!username || !password) return showError("يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور.");
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      clearPermissionCachesForAllUsers();
      const token = data.data.token;
      const emp   = data.data.employee;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(emp));
      localStorage.setItem("userEmail", emp.Email || username);
      await fetchAndStorePermissionsForLogin(emp, token);
      console.log('[LOGIN] user stored:', emp);
      redirectByRole(emp); // مباشرة بدون رسالة ولا تأخير
    } else {
      showError(data.message || "حدث خطأ في تسجيل الدخول");
    }
  } catch {
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

async function register() {
  const fullName = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const confirmPassword = document.getElementById("regConfirmPass").value;
  const username = document.getElementById("regID").value.trim();
  const phoneNumber = document.getElementById("regPhone").value.trim();
  const departmentID = document.getElementById("regDepartment").value;
  const nationalID = document.getElementById("regNationalID").value.trim();

  if (!fullName || !username || !email || !password || !confirmPassword || !phoneNumber || !departmentID || !nationalID)
    return showError("يرجى تعبئة جميع الحقول.");
  if (!validateEmail(email)) return showError("يرجى إدخال بريد إلكتروني صحيح.");
  if (!validatePhone(phoneNumber)) return showError("يرجى إدخال رقم هاتف صحيح.");
  if (!validateNationalID(nationalID)) return showError("يرجى إدخال هوية وطنية صحيحة (10 أرقام).");
  if (password.length < 6) return showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  if (password !== confirmPassword) return showError("كلمتا المرور غير متطابقتين.");

  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        fullName, username, password, email, phoneNumber,
        specialty: '', departmentID: Number(departmentID), nationalID
      })
    });
    const data = await res.json();
    if (data.success) {
      clearPermissionCachesForAllUsers();
      const token = data.data.token;
      const emp   = data.data.employee;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(emp));
      localStorage.setItem("userEmail", emp.Email || email);
      await fetchAndStorePermissionsForLogin(emp, token);
      console.log('[REGISTER] user stored:', emp);
      showSuccess("تم التسجيل بنجاح!");
      setTimeout(()=>{ redirectByRole(emp); }, 600);
    } else {
      showError(data.message || "حدث خطأ في التسجيل");
    }
  } catch {
    showError("حدث خطأ في الاتصال بالخادم");
  }
}

function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (!token) return;
  fetch(`${API_BASE_URL}/me`, { headers:{ 'Authorization': `Bearer ${token}` } })
    .then(r=>r.json())
    .then(data=>{ if(!data.success){ localStorage.removeItem('token'); localStorage.removeItem('user'); } })
    .catch(()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); });
}

let currentLang = localStorage.getItem('lang') || 'ar';
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });
  document.querySelectorAll('[data-ar-placeholder]').forEach(el=>{
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });
  const departmentSelect = document.getElementById('regDepartment');
  if (departmentSelect) {
    departmentSelect.querySelectorAll('option').forEach(option=>{
      if (option.hasAttribute(`data-${lang}`)) option.textContent = option.getAttribute(`data-${lang}`);
    });
  }
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  checkAuthStatus();
  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', () => {
    applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
  });

  // تفعيل تسجيل الدخول عند الضغط Enter داخل الفورم
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault(); // منع الريلود الافتراضي
      login(); // استدعاء دالة تسجيل الدخول
    });
  }
});
