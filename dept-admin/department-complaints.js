// === إعدادات عامة ===
const API_BASE_URL = 'http://localhost:3001/api'; // نفس مشروعك
let currentLang = localStorage.getItem('lang') || 'ar';

// Back navigation function
function goBack() {
  window.history.back();
}

// === لغة واتجاه ===
function applyLanguage(lang){
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تبديل النصوص
  document.querySelectorAll('[data-ar]').forEach(el=>{
    el.textContent = el.getAttribute(`data-${lang}`);
  });
  // تبديل placeholder
  document.querySelectorAll('[data-ar-placeholder]').forEach(el=>{
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });
  // زر اللغة
  const langText = document.getElementById('langText');
  if (langText) langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  // الخط
  document.body.classList.remove('lang-ar','lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');
}

// === حارس أذونات ===
function guard(){
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if(!token || !user){
    window.location.replace('/login/login.html');
    return;
  }
  const role = Number(user.RoleID || user.role || user.roleId);
  
  // Allow Super Admin (1), Department Admin (3), and Director (4)
  if ([1,3,4].includes(role)) {
    if (role === 1) {
      const tools = document.getElementById('superadminTools');
      if (tools) tools.style.display = 'flex';
    }
    return;
  }
  
  // For employees (role 2), check if they have department_complaints permission
  if (role === 2) {
    checkEmployeeDepartmentComplaintsPermission();
    return;
  }
  
  // If none of the above, deny access
  alert(currentLang === 'ar' ? 'ليست لديك صلاحية لهذه الصفحة' : 'You are not authorized for this page');
  window.location.replace('/login/login.html');
}

// Check if employee has department_complaints permission
async function checkEmployeeDepartmentComplaintsPermission() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    console.log('🔍 Checking employee department complaints permission for user:', user);
    
    if (!user || !token) {
      console.error('❌ Missing user data or token');
      alert(currentLang === 'ar' ? 'خطأ في بيانات المستخدم' : 'User data error');
      window.location.replace('/login/login.html');
      return;
    }
    
    // Fetch user permissions
    console.log('🔍 Fetching permissions for employee:', user.EmployeeID);
    const response = await fetch(`${API_BASE_URL}/permissions/bootstrap/${user.EmployeeID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }
    
    const data = await response.json();
    console.log('🔍 Permission response:', data);
    
    if (!data.success) {
      throw new Error('Permission check failed');
    }
    
    const permissions = data.data?.enabled || [];
    const hasPermission = permissions.includes('department_complaints');
    
    console.log('🔍 Employee permissions:', permissions);
    console.log('🔍 Has department_complaints permission:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ Employee does not have department_complaints permission');
      alert(currentLang === 'ar' ? 'ليست لديك صلاحية لعرض شكاوى القسم' : 'You do not have permission to view department complaints');
      window.location.replace('/employee/employee-home.html');
      return;
    }
    
    console.log('✅ Employee has department_complaints permission - access granted');
    
  } catch (error) {
    console.error('❌ Error checking employee permissions:', error);
    alert(currentLang === 'ar' ? 'خطأ في التحقق من الصلاحيات' : 'Error checking permissions');
    window.location.replace('/employee/employee-home.html');
  }
}

// === وقت نسبي مثل general ===
function getRelativeTime(dateString){
  if(!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date)/1000);
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `قبل ${Math.floor(diff/60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff/3600)} ساعة`;
  if (diff < 604800) return `قبل ${Math.floor(diff/86400)} يوم`;
  if (diff < 2419200) return `قبل ${Math.floor(diff/604800)} أسبوع`;
  return `قبل ${Math.floor(diff/2419200)} شهر`;
}

// === بيانات محملة ===
let complaintsData = [];
let departments = []; // لاستخدام نافذة التحويل
let currentComplaintIdForTransfer = null;

// === تحميل أقسام للتحويل (اختياري) ===
async function loadDepartmentsForTransfer(){
  try{
    const res = await fetch(`${API_BASE_URL}/complaints/departments`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      departments = data.data;
      const select = document.getElementById('transferDepartmentSelect');
      if (select){
        select.innerHTML = '<option value="" data-ar="اختر القسم" data-en="Select Department">اختر القسم</option>';
        departments.forEach(d=>{
          const opt = document.createElement('option');
          opt.value = d.DepartmentID;
          opt.textContent = d.DepartmentName;
          select.appendChild(opt);
        });
      }
    }
  } catch(e){ console.error('loadDepartmentsForTransfer error', e); }
}

// === بناء كلاس الحالة ===
function getStatusClass(status){
  switch(status){
    case 'جديدة': return 'blue';
    case 'قيد المراجعة':
    case 'قيد المعالجة': return 'yellow';
    case 'تم الحل':
    case 'مغلقة': return 'green';
    default: return 'blue';
  }
}

// === بناء بطاقة بلاغ  (نفس شكل general قدر الإمكان من بيانات القسم) ===
function buildComplaintHTML(c){
  const num = (c.ComplaintNumber ?? c.ComplaintID ?? '-').toString().padStart(6,'0');
  const status = c.Status ?? c.CurrentStatus ?? 'جديدة';
  const statusClass = getStatusClass(status);

  const when = c.SubmissionDate || c.CreatedAt || c.UpdatedAt || null;
  const rel = getRelativeTime(when);
  let formattedDate = '';
  if (when){
    const d = new Date(when);
    formattedDate = d.toLocaleDateString('ar-SA', { year:'numeric', month:'2-digit', day:'2-digit' });
  }

  const deptName = c.DepartmentName || (c.DepartmentID ? `قسم #${c.DepartmentID}` : 'غير محدد');
  const title = c.Title || `بلاغ  #${num}`;
  const details = c.Description || c.ComplaintDetails || 'لا توجد تفاصيل';
  const shortDetails = details.length > 120 ? details.slice(0,120)+'…' : details;

  // قد لا تتوفر بيانات المريض في Endpoint القسم، لذا نعرضها فقط إذا وُجدت
  const patientName = c.PatientName || '';
  const idNum = c.NationalID_Iqama || '';
  const phone = c.ContactNumber || '';

  return `
    <div class="complaint">
      <div class="complaint-header">
        <span data-ar="بلاغ  #${num}" data-en="Complaint #${num}">بلاغ  #${num}</span>
        <span class="badge ${statusClass}" data-ar="${status}" data-en="${status}">${status}</span>
        <div class="date-info">
          ${when ? `<span class="relative-time" data-original-date="${when}">${rel}</span>
          <span class="full-date" style="font-size:.8em;color:#666;display:block;">${formattedDate}</span>` : ''}
        </div>
      </div>

      <div class="complaint-body">
        <div class="details">
          <h3 data-ar="${title}" data-en="${title}">${title}</h3>
          <p data-ar="القسم: ${deptName}" data-en="Department: ${deptName}">القسم: ${deptName}</p>
          <p data-ar="${shortDetails}" data-en="${shortDetails}">${shortDetails}</p>
        </div>

        ${(patientName || idNum || phone) ? `
        <div class="info">
          <h3 data-ar="معلومات المريض" data-en="Patient Info">معلومات المريض</h3>
          ${patientName ? `<p data-ar="اسم المريض: ${patientName}" data-en="Patient Name: ${patientName}">اسم المريض: ${patientName}</p>`:''}
          ${idNum ? `<p data-ar="رقم الهوية: ${idNum}" data-en="ID: ${idNum}">رقم الهوية: ${idNum}</p>`:''}
          ${phone ? `<p data-ar="رقم الجوال: ${phone}" data-en="Phone: ${phone}">رقم الجوال: ${phone}</p>`:''}
        </div>` : ''}
      </div>

      <div class="actions">
        <a href="#" class="btn blue" data-ar="عرض التفاصيل" data-en="View Details"
           onclick="viewComplaintDetails('${c.ComplaintID ?? c.ComplaintNumber}')">عرض التفاصيل</a>
        <a href="#" class="btn green permission-gated" data-permission="reply_department_complaint" data-ar="الرد على البلاغ " data-en="Reply" style="display:none;"
           onclick="replyToComplaint('${c.ComplaintID ?? c.ComplaintNumber}')">الرد على البلاغ </a>
        <a href="#" class="btn track" data-ar="تتبع البلاغ " data-en="Track"
           onclick="trackComplaint('${c.ComplaintID ?? c.ComplaintNumber}')">تتبع البلاغ </a>
        <a href="#" class="btn orange permission-gated" data-permission="transfer_department_complaint" data-ar="تحويل بلاغ " data-en="Transfer" style="display:none;"
           onclick="showTransferModal('${c.ComplaintID ?? c.ComplaintNumber}')">تحويل بلاغ </a>
      </div>
    </div>
  `;
}

// === عرض الشكاوى في الصفحة ===
function renderComplaints(list){
  const container = document.getElementById('cards');
  const empty = document.getElementById('empty');
  const errorBox = document.getElementById('errorBox');

  if (errorBox) { errorBox.style.display = 'none'; }
  if (!list || list.length === 0){
    if (container) container.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  const html = list.map(buildComplaintHTML).join('');
  container.innerHTML = html;
}

// === فلترة محلية بسيطة (بحث/حالة/تاريخ) ===
function applyLocalFilters(){
  const q = (document.getElementById('searchBox')?.value || '').trim().toLowerCase();
  const status = document.getElementById('statusFilter')?.value || '';
  const dateRange = document.getElementById('dateFilter')?.value || 'all';

  let filtered = [...complaintsData];

  if (q){
    filtered = filtered.filter(c=>{
      const num = (c.ComplaintNumber ?? c.ComplaintID ?? '').toString().toLowerCase();
      const title = (c.Title || '').toLowerCase();
      return num.includes(q) || title.includes(q);
    });
  }
  if (status){
    filtered = filtered.filter(c => (c.Status ?? c.CurrentStatus ?? '') === status);
  }
  if (dateRange !== 'all'){
    const days = Number(dateRange);
    const cutoff = Date.now() - days*24*60*60*1000;
    filtered = filtered.filter(c=>{
      const d = new Date(c.SubmissionDate || c.CreatedAt || c.UpdatedAt || 0).getTime();
      return d >= cutoff;
    });
  }

  renderComplaints(filtered);
  
  // Apply permission gates after rendering
  initPermissionGates();
}

// === تحميل البيانات من الـ API الخاص بصفحة القسم ===
async function loadDepartmentComplaints(departmentIdOverride){
  const token = localStorage.getItem('token');

  const url = new URL(`${API_BASE_URL}/department-complaints/by-department`);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = Number(user.RoleID || user.role || user.roleId);
  const isSuper = role === 1;
  if (isSuper && departmentIdOverride) url.searchParams.set('departmentId', String(departmentIdOverride));

  try{
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if(!res.ok){
      const errorBox = document.getElementById('errorBox');
      const errorText = document.getElementById('errorText');
      if (errorText) errorText.textContent = `HTTP ${res.status}`;
      if (errorBox) errorBox.style.display = 'block';
      renderComplaints([]);
      return;
    }
    const payload = await res.json();
    if (!payload.success){
      const errorBox = document.getElementById('errorBox');
      const errorText = document.getElementById('errorText');
      if (errorText) errorText.textContent = 'فشل في تحميل البيانات';
      if (errorBox) errorBox.style.display = 'block';
      renderComplaints([]);
      return;
    }

    const rows = payload.data || [];
    complaintsData = rows;
    applyLocalFilters(); // عرض مع الفلاتر الحالية

  } catch(e){
    console.error('loadDepartmentComplaints error', e);
    const errorBox = document.getElementById('errorBox');
    const errorText = document.getElementById('errorText');
    if (errorText) errorText.textContent = 'خطأ في الاتصال بالخادم';
    if (errorBox) errorBox.style.display = 'block';
    renderComplaints([]);
  }
}

// === إجراءات الأزرار (نفس فكرة general) ===
function viewComplaintDetails(id){
  const c = complaintsData.find(x => (x.ComplaintID ?? x.ComplaintNumber) == id);
  if (c){
    localStorage.setItem('selectedComplaint', JSON.stringify(c));
    // غيّري المسار لصفحة التفاصيل عندك
    window.location.href = "/general complaints/details.html";
  }
}
function replyToComplaint(id){
  const c = complaintsData.find(x => (x.ComplaintID ?? x.ComplaintNumber) == id);
  if (c){
    localStorage.setItem('selectedComplaint', JSON.stringify(c));
    window.location.href = "/general complaints/reply.html";
  }
}
function trackComplaint(id){
  const c = complaintsData.find(x => (x.ComplaintID ?? x.ComplaintNumber) == id);
  if (c){
    localStorage.setItem('selectedComplaint', JSON.stringify({ ...c, _dataSource:'department-complaints', _timestamp:Date.now() }));
    window.location.href = `/general complaints/track.html?complaint=${id}`;
  }
}

// === نافذة التحويل ===
function showTransferModal(id){
  currentComplaintIdForTransfer = id;
  const modal = document.getElementById('transferModal');
  if (modal) modal.style.display = 'flex';
}
function closeTransferModal(){
  const modal = document.getElementById('transferModal');
  if (modal) modal.style.display = 'none';
  currentComplaintIdForTransfer = null;
}
async function doTransfer(){
  const select = document.getElementById('transferDepartmentSelect');
  const targetDept = select?.value;
  if (!targetDept){ alert('يرجى اختيار قسم'); return; }
  if (!currentComplaintIdForTransfer){ alert('لم يتم تحديد البلاغ '); return; }

  try{
    const res = await fetch(`${API_BASE_URL}/complaints/transfer/${currentComplaintIdForTransfer}`, {
      method:'PUT',
      headers:{
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ newDepartmentId: targetDept })
    });
    const data = await res.json();
    if (data.success){
      alert('تم تحويل البلاغ  بنجاح');
      closeTransferModal();
      loadDepartmentComplaints(document.getElementById('deptInput')?.value || undefined);
    } else {
      alert('خطأ في تحويل البلاغ : ' + (data.message || 'غير متوقع'));
    }
  } catch(e){
    console.error('doTransfer error', e);
    alert('خطأ في الاتصال بالخادم');
  }
}

// === طباعة/تصدير ===
function printPage(){ window.print(); }

// === DOM Ready ===
document.addEventListener('DOMContentLoaded', async ()=>{
  guard();
  applyLanguage(currentLang);

  // تبديل اللغة
  document.getElementById('langToggle')?.addEventListener('click', ()=>{
    applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
  });

  // رجوع
  document.getElementById('backBtn')?.addEventListener('click', (e)=>{
    e.preventDefault();
  window.history.back();

  });

  // أدوات السوبر
  document.getElementById('applyDept')?.addEventListener('click', ()=>{
    const v = document.getElementById('deptInput').value.trim();
    loadDepartmentComplaints(v || undefined);
  });

  // فلاتر
  ['dateFilter','searchBox','statusFilter'].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    const ev = (id==='searchBox') ? 'input' : 'change';
    el.addEventListener(ev, applyLocalFilters);
  });

  document.getElementById('exportBtn')?.addEventListener('click', ()=>{
    window.location.href = "/dashboard/export.html";
  });
  document.getElementById('printBtn')?.addEventListener('click', printPage);

  // نافذة التحويل
  document.getElementById('closeTransferModal')?.addEventListener('click', closeTransferModal);
  document.getElementById('cancelTransferBtn')?.addEventListener('click', closeTransferModal);
  document.getElementById('doTransferBtn')?.addEventListener('click', doTransfer);

  await loadDepartmentsForTransfer();
  await loadDepartmentComplaints();
  
  // Initialize permission gates
  initPermissionGates();
});

// Permission checking functions
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
    } else {
      const fallback = localStorage.getItem(fallbackKey);
      if (fallback) {
        perms = JSON.parse(fallback);
      }
    }
  } catch (e) {
    console.warn('[RBAC] parse cache error:', e);
    perms = [];
  }
  if (!Array.isArray(perms)) perms = [];
  return perms;
}

function initPermissionGates() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = Number(user?.RoleID || 0);
  
  // Super admin sees everything
  if (roleId === 1) {
    const replyButtons = document.querySelectorAll('[data-permission="reply_department_complaint"]');
    replyButtons.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    const transferButtons = document.querySelectorAll('[data-permission="transfer_department_complaint"]');
    transferButtons.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    return;
  }
  
  const perms = getCachedPermsForCurrentUser();
  
  // Check reply_department_complaint permission
  const hasReplyPermission = perms.includes('reply_department_complaint');
  const replyButtons = document.querySelectorAll('[data-permission="reply_department_complaint"]');
  replyButtons.forEach(btn => {
    btn.style.display = hasReplyPermission ? 'inline-block' : 'none';
  });
  
  // Check transfer_department_complaint permission
  const hasTransferPermission = perms.includes('transfer_department_complaint');
  const transferButtons = document.querySelectorAll('[data-permission="transfer_department_complaint"]');
  transferButtons.forEach(btn => {
    btn.style.display = hasTransferPermission ? 'inline-block' : 'none';
  });
}
