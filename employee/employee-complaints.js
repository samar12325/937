const API_BASE_URL = 'http://localhost:3001/api';
const EMP_BASE = `${API_BASE_URL}/employee`;

// دالة تحديث حالة البلاغ  (مساعدة)
async function updateComplaintStatus(complaintId, newStatus, notes = '') {
  try {
    console.log('تحديث حالة البلاغ :', { newStatus, notes });
    
    const response = await fetch(`${API_BASE_URL}/responses/status/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({
        newStatus: newStatus,
        notes: notes,
        employeeId: JSON.parse(localStorage.getItem('user')).EmployeeID
      })
    });

    const data = await response.json();

    console.log('استجابة تحديث الحالة:', data);

    if (data.success) {
      console.log('تم تحديث حالة البلاغ  بنجاح');
      // تحديث حالة البلاغ  في الواجهة
      if (currentComplaint) {
        currentComplaint.CurrentStatus = newStatus;
      }
      if (document.getElementById('complaintStatus')) {
        document.getElementById('complaintStatus').textContent = newStatus;
        document.getElementById('complaintStatus').className = `badge ${getStatusClass(newStatus)}`;
      }
    } else {
      console.error('خطأ في تحديث الحالة:', data.message);
    }

  } catch (error) {
    console.error('خطأ في تحديث الحالة:', error);
  }
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  switch (status) {
    case 'جديدة': return 'status-new';
    case 'قيد المراجعة': return 'status-review';
    case 'قيد المعالجة': return 'status-processing';
    case 'تم الحل': return 'status-resolved';
    case 'مغلقة': return 'status-closed';
    default: return 'status-default';
  }
}

const state = {
  page: 1,
  limit: 10,
  sortBy: 'newest',
  filters: { status: '', priority: '', q: '' },
  totalPages: 1,
  currentList: [],
  currentComplaintToDelete: null
};

// متغير لحفظ البلاغ  الحالية
let currentComplaint = null;

const statusMapUItoAPI = {
  '': '',
  'جديدة': 'جديدة',
  'قيد المعالجة': 'قيد المراجعة',
  'قيد المراجعة': 'قيد المراجعة',
  'تم الحل': 'تم الحل',
  'مغلقة': 'مغلقة'
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function guardEmployee(){
  const userRaw = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  console.log('[GUARD] Checking user access...', { userRaw, token });
  
  if (!token || !userRaw) {
    console.log('[GUARD] No token or user data, redirecting to login');
    window.location.href = '../login/login.html';
    return false;
  }
  
  const user = JSON.parse(userRaw);
  const roleId = Number(user.RoleID);
  console.log('[GUARD] User data:', { user, roleId });
  
  // تعديل للسماح للمدير والموظف بالوصول
  if (roleId !== 2 && roleId !== 3 && user.Username?.toLowerCase() !== 'employee' && user.Username?.toLowerCase() !== 'director'){
    console.log('[GUARD] Access denied, redirecting to home');
    window.location.href = '../login/home.html';
    return false;
  }
  
  console.log('[GUARD] Access granted for role:', roleId);
  const nameEl = document.getElementById('userName');
  if (nameEl) {
    const roleName = roleId === 3 ? 'المدير' : 'الموظف';
    nameEl.textContent = user.FullName || user.Username || roleName;
  }
  return true;
}

function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}
function openModal(id){ const m = document.getElementById(id); if (m) m.style.display='flex'; }
function closeModal(id){ const m = document.getElementById(id); if (m) m.style.display='none'; }

function showError(msg){
  const text = document.getElementById('errorMessage');
  if(text) text.textContent = msg || 'حدث خطأ ما';
  openModal('errorModal');
}

function showSuccess(msg) {
  // يمكن إضافة modal للنجاح لاحقاً
  alert(msg || 'تمت العملية بنجاح');
}

function statusPillClass(status){
  if(!status) return 'status-new';
  if(status.includes('تم الحل') || status.includes('مغلقة')) return 'status-completed';
  if(status.includes('قيد المراجعة')) return 'status-pending';
  if(status.includes('مفتوحة')||status.includes('جديدة')) return 'status-new';
  return 'status-pending';
}

function getDateValue(c){
  return c.CreatedAt || c.AssignedAt || c.ComplaintDate || c.AssignedDate || null;
}

function applySort(items){
  const arr = [...items];
  if (state.sortBy === 'oldest') {
    arr.sort((a,b)=> new Date(getDateValue(a) || 0) - new Date(getDateValue(b) || 0));
  } else if (state.sortBy === 'priority') {
    const rank = { 'عالية': 0, 'متوسطة': 1, 'منخفضة': 2 };
    arr.sort((a,b)=> (rank[a.Priority] ?? 9) - (rank[b.Priority] ?? 9));
  } else if (state.sortBy === 'status') {
    arr.sort((a,b)=> String(a.Status).localeCompare(String(b.Status), 'ar'));
  } else {
    arr.sort((a,b)=> new Date(getDateValue(b) || 0) - new Date(getDateValue(a) || 0));
  }
  return arr;
}

let currentLang = localStorage.getItem('lang') || 'ar';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // الاتجاه واللغة
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';

  // تغيير النصوص بناءً على اللغة
  document.querySelectorAll('[data-ar]').forEach(el => {
    el.textContent = el.getAttribute(`data-${lang}`);
  });

  // تغيير placeholder بناءً على اللغة
  document.querySelectorAll('[data-ar-placeholder]').forEach(el => {
    el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
  });

  // زر اللغة نفسه
  const langText = document.getElementById('langText');
  if (langText) {
    langText.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';
  }

  // تغيير الخط
  document.body.style.fontFamily = lang === 'ar' ? "'Tajawal', sans-serif" : "serif";
}

function renderStats(items) {
  const total = items.length;
  const pending = items.filter(c => (c.Status || '').includes('قيد المراجعة')).length;
  const completed = items.filter(c => (c.Status || '').includes('تم الحل') || (c.Status || '').includes('مغلقة')).length;
  const urgent = items.filter(c => (c.Priority || '') === 'عالية').length;

  const elTotal = document.getElementById('totalCount');
  if (elTotal) elTotal.innerText = total;

  const elPending = document.getElementById('pendingCount');
  if (elPending) elPending.innerText = pending;

  const elCompleted = document.getElementById('completedCount');
  if (elCompleted) elCompleted.innerText = completed;

  const elUrgent = document.getElementById('urgentCount');
  if (elUrgent) elUrgent.innerText = urgent;

  const elResults = document.getElementById('resultsCount');
  if (elResults) elResults.innerText = `${total} بلاغ `;
}

function renderList(items){
  const listEl = document.getElementById('complaintsList');
  if(!listEl) return;
  listEl.innerHTML = '';

  if(!items.length){
    listEl.innerHTML = `<div style="text-align:center;color:#7f8c8d;">لا توجد نتائج مطابقة</div>`;
    return;
  }

  items.forEach(c=>{
    const when = getDateValue(c);
    const card = document.createElement('div');
    card.className = 'complaint-card';
    card.innerHTML = `
      <div class="complaint-header">
        <div>
          <div class="complaint-title">${c.Title || c.ComplaintDetails?.slice(0, 50) + (c.ComplaintDetails?.length > 50 ? '...' : '') || 'بدون عنوان'}</div>
          <div class="complaint-meta">
            <span><i class="far fa-hashtag"></i> ${c.ComplaintID}</span>
            <span><i class="far fa-building"></i> ${c.DepartmentName || '—'}</span>
            <span><i class="far fa-user"></i> ${c.EmployeeName || '—'}</span>
            <span><i class="far fa-calendar"></i> ${when ? new Date(when).toLocaleString('ar-SA') : '—'}</span>
          </div>
        </div>
        <div class="complaint-status ${statusPillClass(c.Status)}">${c.Status || '—'}</div>
      </div>
      <div class="complaint-details">${(c.Description||'').slice(0,240)}${(c.Description||'').length>240?'…':''}</div>
      <div class="complaint-footer">
        <div class="complaint-meta">
          <span><i class="far fa-tags"></i> ${c.Category || '—'}</span>
          <span><i class="far fa-flag"></i> ${c.Priority || '—'}</span>
          <span><i class="far fa-reply"></i> ردود: ${c.ResponseCount ?? 0}</span>
        </div>
        <div class="complaint-actions">
          <button class="action-btn action-btn-primary" data-open="${c.ComplaintID}">
            <i class="fas fa-eye"></i>
            تفاصيل
          </button>
          <button class="btn-delete permission-gated" data-permission="delete_complaint" data-delete="${c.ComplaintID}" data-title="${c.Title || c.ComplaintDetails?.slice(0, 30) + (c.ComplaintDetails?.length > 30 ? '...' : '') || 'بدون عنوان'}" style="display:none;">
            <i class="fas fa-trash-alt"></i>
            حذف
          </button>
        </div>
      </div>`;
    listEl.appendChild(card);
  });

  // إضافة event listeners للأزرار
  listEl.addEventListener('click', (e)=>{
    const detailsBtn = e.target.closest('button[data-open]');
    const deleteBtn = e.target.closest('button[data-delete]');
    
    if(detailsBtn) {
      openComplaintDetails(detailsBtn.dataset.open);
    } else if(deleteBtn) {
      openDeleteConfirmation(deleteBtn.dataset.delete, deleteBtn.dataset.title);
    }
  });
  
  // Apply permission gates after rendering
  initPermissionGates();
}

function renderPagination(pagination){
  state.totalPages = pagination?.totalPages || 1;
  const pagEl = document.getElementById('pagination');
  if(!pagEl) return;
  pagEl.innerHTML = '';

  const addBtn = (txt, page, disabled=false, active=false)=>{
    const b = document.createElement('button');
    b.textContent = txt;
    if (active) b.classList.add('active');
    if (disabled) b.disabled = true;
    b.addEventListener('click', ()=> { state.page = page; loadComplaints(); });
    pagEl.appendChild(b);
  };

  addBtn('السابق', Math.max(1, state.page-1), state.page===1);
  for(let p=1;p<=state.totalPages;p++){
    addBtn(String(p), p, false, p===state.page);
  }
  addBtn('التالي', Math.min(state.totalPages, state.page+1), state.page===state.totalPages);
}

async function loadComplaints(){
  try{
    showLoading();
    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);

    const apiStatus = statusMapUItoAPI[state.filters.status] || '';
    if (apiStatus) params.set('status', apiStatus);

    const res = await fetch(`${EMP_BASE}/complaints?${params.toString()}`, { headers: authHeaders() });
    if(!res.ok) throw new Error('فشل جلب الشكاوى');
    const json = await res.json();

    let items = json?.data?.complaints || [];

    if (state.filters.priority){
      items = items.filter(c => (c.Priority||'') === state.filters.priority);
    }
    if (state.filters.q){
      const q = state.filters.q.trim();
      items = items.filter(c =>
        String(c.Title||'').includes(q) ||
        String(c.ComplaintDetails||'').includes(q) ||
        String(c.Description||'').includes(q) ||
        String(c.Category||'').includes(q) ||
        String(c.ComplaintID||'').includes(q)
      );
    }

    items = applySort(items);
    state.currentList = items;

    renderStats(items);
    renderList(items);
    renderPagination(json?.data?.pagination);
  }catch(err){
    console.error(err);
    showError('تعذر تحميل الشكاوى');
  }finally{
    hideLoading();
  }
}

function fillDetailsView(data){
  const box = document.getElementById('complaintDetails');
  if(!box) return;

  const c = data.complaint;
  const responses = data.responses || [];
  const when = getDateValue(c);
  box.innerHTML = `
    <div class="complaint-detail-item">
      <h4>العنوان</h4><p>${c.Title || c.ComplaintDetails?.slice(0, 100) + (c.ComplaintDetails?.length > 100 ? '...' : '') || '—'}</p>
    </div>
    <div class="complaint-detail-item">
      <h4>الوصف</h4><p>${c.Description || '—'}</p>
    </div>
    <div class="complaint-detail-item">
      <h4>البيانات</h4>
      <p><strong>رقم البلاغ :</strong> ${c.ComplaintID} — <strong>القسم:</strong> ${c.DepartmentName || '—'}</p>
      <p><strong>الحالة:</strong> ${c.Status || '—'} — <strong>الأولوية:</strong> ${c.Priority || '—'}</p>
      <p><strong>صاحب البلاغ :</strong> ${c.EmployeeName || '—'} — <strong>مسندة إلى:</strong> ${c.AssignedToName || '—'}</p>
      <p><strong>تاريخ الإنشاء:</strong> ${when ? new Date(when).toLocaleString('ar-SA'): '—'}</p>
    </div>
    <div class="complaint-responses">
      <h4>الردود</h4>
      ${responses.map(r=>`
        <div class="response-item">
          <div class="response-header">
            <span class="response-author">${r.EmployeeName || '—'}</span>
            <span class="response-date">${r.CreatedAt ? new Date(r.CreatedAt).toLocaleString('ar-SA'): '—'}</span>
          </div>
          <div>${r.Content || ''}</div>
        </div>
      `).join('') || '<div style="color:#7f8c8d;">لا توجد ردود بعد</div>'}
    </div>
  `;
}

async function openComplaintDetails(id){
  try{
    showLoading();
    const res = await fetch(`${EMP_BASE}/complaints/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('لا يمكن جلب تفاصيل البلاغ ');
    const json = await res.json();
    
    // تعيين البلاغ  الحالية
    currentComplaint = json.data;
    
    fillDetailsView(json.data);
    openModal('detailsModal');

    document.getElementById('respondBtn')?.addEventListener('click', ()=>{
      const t = document.getElementById('responseText');
      if (t) t.value = '';
      openModal('responseModal');
    });
    document.getElementById('updateStatusBtn')?.addEventListener('click', ()=>{
      openModal('statusModal');
    });
    document.getElementById('closeDetailsBtn')?.addEventListener('click', ()=> closeModal('detailsModal'));

    document.getElementById('submitResponseBtn')?.addEventListener('click', async ()=>{
      // التحقق من وجود العناصر المطلوبة
      const responseTextEl = document.getElementById('responseText');
      const responseTypeEl = document.getElementById('responseType');
      const newStatusEl = document.getElementById('newStatus');
      const notesEl = document.getElementById('notes');
      
      if (!responseTextEl || !responseTypeEl) {
        console.error('عناصر الرد غير موجودة في DOM');
        alert('خطأ في تحميل نموذج الرد');
        return;
      }
      
      const responseText = responseTextEl.value?.trim();
      const responseType = responseTypeEl.value || 'رد رسمي';
      const newStatus = newStatusEl?.value;
      const notes = notesEl?.value?.trim() || '';

      if (!responseText) {
        alert('يرجى إدخال نص الرد');
        const responseTextEl = document.getElementById('responseText');
        if (responseTextEl) responseTextEl.focus();
        return;
      }

      if (!responseType) {
        alert('يرجى اختيار نوع الرد');
        const responseTypeEl = document.getElementById('responseType');
        if (responseTypeEl) responseTypeEl.focus();
        return;
      }

      // إظهار رسالة تحميل
      const sendBtn = document.getElementById('submitResponseBtn');
      const originalText = sendBtn.textContent;
      sendBtn.textContent = 'جاري الإرسال...';
      sendBtn.disabled = true;

      try {
        // إضافة الرد
        const responseData = {
          complaintId: id,
          responseText: responseText,
          responseType: responseType,
          employeeId: JSON.parse(localStorage.getItem('user')).EmployeeID
        };

        const response = await fetch(`${API_BASE_URL}/responses/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
          },
          body: JSON.stringify(responseData)
        });

        const data = await response.json();

        if (data.success) {
          // تحديث الحالة إذا تم اختيارها
          if (newStatus) {
            await updateComplaintStatus(id, newStatus, notes);
          }

          // إظهار رسالة نجاح
          alert('تم إضافة الرد بنجاح');
          
          // مسح النموذج
          const responseTextEl = document.getElementById('responseText');
          const responseTypeEl = document.getElementById('responseType');
          const newStatusEl = document.getElementById('newStatus');
          const notesEl = document.getElementById('notes');
          
          if (responseTextEl) responseTextEl.value = '';
          if (responseTypeEl) responseTypeEl.value = '';
          if (newStatusEl) newStatusEl.value = '';
          if (notesEl) notesEl.value = '';
          
          closeModal('responseModal');
          await openComplaintDetails(id);
          await loadComplaints();
          
        } else {
          alert('خطأ في إضافة الرد: ' + data.message);
        }

      } catch (error) {
        console.error('خطأ في إضافة الرد:', error);
        alert('حدث خطأ في الخادم');
      } finally {
        // إعادة تفعيل الزر
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
      }
    });
    document.getElementById('cancelResponseBtn')?.addEventListener('click', ()=> closeModal('responseModal'));
    document.getElementById('closeResponseModal')?.addEventListener('click', ()=> closeModal('responseModal'));

    document.getElementById('closeStatusModal')?.addEventListener('click', ()=> closeModal('statusModal'));
    document.getElementById('updateStatusBtn')?.addEventListener('click', ()=> openModal('statusModal'));
    document.getElementById('newStatus')?.addEventListener('change', ()=>{});
    document.getElementById('statusModal')?.querySelector('.btn.btn-primary')?.addEventListener('click', async ()=>{
      // التحقق من وجود العناصر المطلوبة
      const newStatusEl = document.getElementById('newStatus');
      const notesEl = document.getElementById('statusRemarks');
      
      if (!newStatusEl) {
        console.error('عنصر الحالة غير موجود في DOM');
        alert('خطأ في تحميل نموذج تحديث الحالة');
        return;
      }
      
      const newStatus = newStatusEl.value;
      const notes = notesEl?.value?.trim() || '';

      if (!newStatus) {
        alert('يرجى اختيار الحالة الجديدة');
        return;
      }

      if (newStatus === currentComplaint?.CurrentStatus) {
        alert('الحالة المختارة هي نفس الحالة الحالية');
        return;
      }

      // تأكيد التغيير
      if (!confirm(`هل أنت متأكد من تغيير حالة البلاغ  إلى "${newStatus}"؟`)) {
        return;
      }

      // إظهار رسالة التحميل
      const saveBtn = document.querySelector('.btn.btn-primary');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'جاري الحفظ...';
      saveBtn.disabled = true;

      try {
        const response = await fetch(`${API_BASE_URL}/complaints/update-status/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
          },
          body: JSON.stringify({
            newStatus: newStatus,
            notes: notes,
            employeeId: JSON.parse(localStorage.getItem('user')).EmployeeID
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('تم تحديث الحالة بنجاح');
          
          // تحديث الحالة في البلاغ  الحالية
          if (currentComplaint) {
            currentComplaint.CurrentStatus = newStatus;
          }
          
          // تحديث البيانات في localStorage
          localStorage.setItem("selectedComplaint", JSON.stringify(currentComplaint));
          
          // إرسال إشعار للصفحات الأخرى عن التحديث
          localStorage.setItem('complaintStatusUpdated', JSON.stringify({
            complaintId: id,
            newStatus: newStatus,
            timestamp: Date.now()
          }));
          
          // مسح النموذج
          const newStatusEl = document.getElementById('newStatus');
          const notesEl = document.getElementById('statusRemarks');
          
          if (newStatusEl) newStatusEl.value = '';
          if (notesEl) notesEl.value = '';
          
          closeModal('statusModal');
          await openComplaintDetails(id);
          await loadComplaints();
          
        } else {
          alert('خطأ في تحديث الحالة: ' + (data.message || 'خطأ غير معروف'));
        }

      } catch (error) {
        console.error('خطأ في تحديث الحالة:', error);
        alert('حدث خطأ في الاتصال بالخادم');
      } finally {
        // إعادة تفعيل الزر
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }
    });

  }catch(err){
    console.error(err);
    showError('فشل فتح تفاصيل البلاغ ');
  }finally{
    hideLoading();
  }
}

// وظائف الحذف
function openDeleteConfirmation(complaintId, complaintTitle) {
  state.currentComplaintToDelete = complaintId;
  
  // ملء معلومات البلاغ  في modal التأكيد
  const infoDiv = document.getElementById('deleteComplaintInfo');
  if (infoDiv) {
    infoDiv.innerHTML = `
      <h4>معلومات البلاغ  المراد حذفها:</h4>
      <p><strong>رقم البلاغ :</strong> ${complaintId}</p>
      <p><strong>العنوان:</strong> ${complaintTitle}</p>
      <div class="form-group" style="margin-top: 1rem;">
        <label for="deleteReason" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">سبب الحذف:</label>
        <textarea id="deleteReason" rows="3" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;" 
                  placeholder="يرجى كتابة سبب حذف هذه البلاغ ..."></textarea>
      </div>
    `;
  }
  
  openModal('deleteConfirmModal');
}

async function deleteComplaint(complaintId) {
  try {
    const reason = document.getElementById('deleteReason')?.value?.trim();
    
    if (!reason) {
      showError('يرجى كتابة سبب الحذف');
      return;
    }

    showLoading();
    const res = await fetch(`${API_BASE_URL}/complaints/soft-delete/${complaintId}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason: reason })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'فشل حذف البلاغ ');
    }

    const result = await res.json();
    showSuccess(result.message || 'تم حذف البلاغ  بنجاح وتم إرسال طلب للمراجعة');
    closeModal('deleteConfirmModal');
    state.currentComplaintToDelete = null;
    
    // إعادة تحميل قائمة الشكاوى
    await loadComplaints();

  } catch (err) {
    console.error('خطأ في حذف البلاغ :', err);
    showError(err.message || 'فشل حذف البلاغ ');
  } finally {
    hideLoading();
  }
}

function wireUI(){
  document.getElementById('sortBy')?.addEventListener('change', (e)=>{
    state.sortBy = e.target.value;
    renderList(applySort(state.currentList));
  });

  document.getElementById('statusFilter')?.addEventListener('change', (e)=>{
    state.filters.status = e.target.value || '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('priorityFilter')?.addEventListener('change', (e)=>{
    state.filters.priority = e.target.value || '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('searchInput')?.addEventListener('input', (e)=>{
    state.filters.q = e.target.value || '';
    state.page = 1;
    const filtered = applySort(
      (state.currentList||[]).filter(c =>
        String(c.Title||'').includes(state.filters.q) ||
        String(c.ComplaintDetails||'').includes(state.filters.q) ||
        String(c.Description||'').includes(state.filters.q) ||
        String(c.Category||'').includes(state.filters.q) ||
        String(c.ComplaintID||'').includes(state.filters.q)
      )
    );
    renderStats(filtered);
    renderList(filtered);
  });

  document.getElementById('clearFilters')?.addEventListener('click', ()=>{
    state.filters = { status:'', priority:'', q:'' };
    const s = document.getElementById('statusFilter'); if (s) s.value = '';
    const p = document.getElementById('priorityFilter'); if (p) p.value = '';
    const q = document.getElementById('searchInput'); if (q) q.value = '';
    state.page = 1;
    loadComplaints();
  });

  document.getElementById('newComplaintBtn')?.addEventListener('click', ()=>{
    window.location.href = '../New complaint/Newcomplaint.html';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', ()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login/login.html';
  });

  // Event listeners للـ modals
  document.getElementById('closeErrorModal')?.addEventListener('click', ()=> closeModal('errorModal'));
  document.getElementById('closeErrorBtn')?.addEventListener('click', ()=> closeModal('errorModal'));
  document.getElementById('closeDetailsModal')?.addEventListener('click', ()=> closeModal('detailsModal'));
  
  // Event listeners لـ modal الحذف
  document.getElementById('closeDeleteModal')?.addEventListener('click', ()=> {
    closeModal('deleteConfirmModal');
    state.currentComplaintToDelete = null;
  });
  
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', ()=> {
    closeModal('deleteConfirmModal');
    state.currentComplaintToDelete = null;
  });
  
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async ()=> {
    if (state.currentComplaintToDelete) {
      await deleteComplaint(state.currentComplaintToDelete);
    }
  });
  
  // Initialize permission gates
  initPermissionGates();
}

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
    const deleteButtons = document.querySelectorAll('[data-permission="delete_complaint"]');
    deleteButtons.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    return;
  }
  
  const perms = getCachedPermsForCurrentUser();
  
  // Check delete_complaint permission
  const hasDeletePermission = perms.includes('delete_complaint');
  const deleteButtons = document.querySelectorAll('[data-permission="delete_complaint"]');
  deleteButtons.forEach(btn => {
    btn.style.display = hasDeletePermission ? 'inline-block' : 'none';
  });
}

async function loadNotifBadge(){
  try{
    const res = await fetch(`${EMP_BASE}/notifications?page=1&limit=1`, { headers: authHeaders() });
    if(!res.ok) return;
    const json = await res.json();
    const badge = document.getElementById('notificationBadge');
    if (badge){
      const unread = json?.data?.unreadCount ?? 0;
      badge.textContent = unread;
      badge.style.display = unread>0 ? 'flex' : 'none';
    }
  }catch(e){}
}

document.addEventListener('DOMContentLoaded', async ()=>{
  if(!guardEmployee()) return;
  wireUI();
  await loadComplaints();
  await loadNotifBadge();
  const url = new URL(window.location.href);
  const openId = url.searchParams.get('open');
  if (openId) openComplaintDetails(openId);
});