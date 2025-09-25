const API_BASE_URL = 'http://localhost:3001/api';
const EMP_BASE = `${API_BASE_URL}/employee`;

const state = {
  page: 1,
  limit: 10,
  sortBy: 'newest',
  filters: { status: '', priority: '', q: '' },
  totalPages: 1,
  currentList: [],
  currentComplaintToDelete: null
};

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
  if (!token || !userRaw) {
    window.location.href = '../login/login.html';
    return false;
  }
  const user = JSON.parse(userRaw);
  // تعديل للسماح للمدير بالوصول
  if (Number(user.RoleID) !== 2 && Number(user.RoleID) !== 3 && user.Username?.toLowerCase() !== 'employee' && user.Username?.toLowerCase() !== 'director'){
    window.location.href = '../login/home.html';
    return false;
  }
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.FullName || user.Username || 'المدير';
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

function showError(message) {
  const modal = document.getElementById('errorModal');
  const messageEl = document.getElementById('errorMessage');
  if (messageEl) messageEl.textContent = message;
  if (modal) modal.style.display = 'flex';
}

function hideError() {
  const modal = document.getElementById('errorModal');
  if (modal) modal.style.display = 'none';
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    'جديدة': 'badge-new',
    'قيد المعالجة': 'badge-pending',
    'قيد المراجعة': 'badge-pending',
    'تم الحل': 'badge-done',
    'مغلقة': 'badge-done'
  };
  return statusClasses[status] || 'badge-pending';
}

function getPriorityBadgeClass(priority) {
  const priorityClasses = {
    'عالية': 'badge-danger',
    'متوسطة': 'badge-pending',
    'منخفضة': 'badge-new'
  };
  return priorityClasses[priority] || 'badge-new';
}

async function fetchComplaints() {
  try {
    showLoading();
    
    const params = new URLSearchParams({
      page: state.page,
      limit: state.limit,
      sortBy: state.sortBy,
      ...(state.filters.status && { status: statusMapUItoAPI[state.filters.status] }),
      ...(state.filters.priority && { priority: state.filters.priority }),
      ...(state.filters.q && { q: state.filters.q })
    });

    const response = await fetch(`${EMP_BASE}/complaints?${params}`, {
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      state.currentList = data.data.complaints || [];
      state.totalPages = data.data.totalPages || 1;
      renderComplaints();
      updateStats();
      updatePagination();
    } else {
      throw new Error(data.message || 'فشل في تحميل الشكاوى');
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
    showError('حدث خطأ في تحميل الشكاوى: ' + error.message);
  } finally {
    hideLoading();
  }
}

function renderComplaints() {
  const container = document.getElementById('complaintsList');
  const resultsCount = document.getElementById('resultsCount');
  
  if (!container) return;

  if (state.currentList.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 2rem; color: #7f8c8d;">
        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>لا توجد شكاوى مسندة إليك حالياً</p>
      </div>
    `;
    if (resultsCount) resultsCount.textContent = '0 بلاغ ';
    return;
  }

  container.innerHTML = state.currentList.map(complaint => `
    <div class="complaint-card" data-complaint-id="${complaint.ComplaintID}">
      <div class="complaint-main">
        <h4>${complaint.Subject || 'بدون عنوان'}</h4>
        <div class="complaint-meta">
          <span class="badge ${getStatusBadgeClass(complaint.Status)}">${complaint.Status}</span>
          ${complaint.Priority ? `<span class="badge ${getPriorityBadgeClass(complaint.Priority)}">${complaint.Priority}</span>` : ''}
          <span>رقم البلاغ : ${complaint.ComplaintID}</span>
          <span>التاريخ: ${formatDate(complaint.CreatedAt)}</span>
        </div>
        <p class="complaint-details">${complaint.Description ? complaint.Description.substring(0, 150) + (complaint.Description.length > 150 ? '...' : '') : 'لا يوجد وصف'}</p>
      </div>
      <div class="complaint-actions">
        <button class="action-btn action-btn-primary" onclick="viewComplaintDetails(${complaint.ComplaintID})">
          <i class="fas fa-eye"></i> عرض التفاصيل
        </button>
        <button class="action-btn action-btn-secondary" onclick="respondToComplaint(${complaint.ComplaintID})">
          <i class="fas fa-reply"></i> إضافة رد
        </button>
        <button class="action-btn action-btn-secondary" onclick="updateComplaintStatus(${complaint.ComplaintID})">
          <i class="fas fa-edit"></i> تحديث الحالة
        </button>
      </div>
    </div>
  `).join('');

  if (resultsCount) {
    resultsCount.textContent = `${state.currentList.length} بلاغ `;
  }
}

function updateStats() {
  const totalCount = document.getElementById('totalCount');
  const pendingCount = document.getElementById('pendingCount');
  const completedCount = document.getElementById('completedCount');
  const urgentCount = document.getElementById('urgentCount');

  if (totalCount) totalCount.textContent = state.currentList.length;
  
  if (pendingCount) {
    const pending = state.currentList.filter(c => c.Status === 'قيد المعالجة' || c.Status === 'قيد المراجعة').length;
    pendingCount.textContent = pending;
  }
  
  if (completedCount) {
    const completed = state.currentList.filter(c => c.Status === 'تم الحل' || c.Status === 'مغلقة').length;
    completedCount.textContent = completed;
  }
  
  if (urgentCount) {
    const urgent = state.currentList.filter(c => c.Priority === 'عالية').length;
    urgentCount.textContent = urgent;
  }
}

function updatePagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  if (state.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let paginationHTML = '';
  
  // زر السابق
  if (state.page > 1) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${state.page - 1})">السابق</button>`;
  }
  
  // أرقام الصفحات
  const startPage = Math.max(1, state.page - 2);
  const endPage = Math.min(state.totalPages, state.page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === state.page ? 'active' : '';
    paginationHTML += `<button class="page-btn ${isActive}" onclick="changePage(${i})">${i}</button>`;
  }
  
  // زر التالي
  if (state.page < state.totalPages) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${state.page + 1})">التالي</button>`;
  }
  
  container.innerHTML = paginationHTML;
}

function changePage(page) {
  if (page >= 1 && page <= state.totalPages) {
    state.page = page;
    fetchComplaints();
  }
}

async function viewComplaintDetails(complaintId) {
  try {
    showLoading();
    
    const response = await fetch(`${EMP_BASE}/complaints/${complaintId}`, {
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const complaint = data.data;
      showComplaintDetailsModal(complaint);
    } else {
      throw new Error(data.message || 'فشل في تحميل تفاصيل البلاغ ');
    }
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    showError('حدث خطأ في تحميل تفاصيل البلاغ : ' + error.message);
  } finally {
    hideLoading();
  }
}

function showComplaintDetailsModal(complaint) {
  const modal = document.getElementById('detailsModal');
  const detailsContainer = document.getElementById('complaintDetails');
  
  if (!modal || !detailsContainer) return;

  detailsContainer.innerHTML = `
    <div class="complaint-detail-item">
      <h4>معلومات البلاغ </h4>
      <p><strong>رقم البلاغ :</strong> ${complaint.ComplaintID}</p>
      <p><strong>الموضوع:</strong> ${complaint.Subject || 'غير محدد'}</p>
      <p><strong>الحالة:</strong> <span class="badge ${getStatusBadgeClass(complaint.Status)}">${complaint.Status}</span></p>
      <p><strong>الأولوية:</strong> ${complaint.Priority ? `<span class="badge ${getPriorityBadgeClass(complaint.Priority)}">${complaint.Priority}</span>` : 'غير محدد'}</p>
      <p><strong>تاريخ الإنشاء:</strong> ${formatDate(complaint.CreatedAt)}</p>
      <p><strong>آخر تحديث:</strong> ${formatDate(complaint.UpdatedAt)}</p>
    </div>
    
    <div class="complaint-detail-item">
      <h4>تفاصيل البلاغ </h4>
      <p>${complaint.Description || 'لا يوجد وصف'}</p>
    </div>
    
    ${complaint.Attachments && complaint.Attachments.length > 0 ? `
    <div class="complaint-detail-item">
      <h4>المرفقات</h4>
      ${complaint.Attachments.map(attachment => `
        <p><a href="${attachment.FilePath}" target="_blank">${attachment.FileName}</a></p>
      `).join('')}
    </div>
    ` : ''}
    
    ${complaint.Responses && complaint.Responses.length > 0 ? `
    <div class="complaint-responses">
      <h4>الردود</h4>
      ${complaint.Responses.map(response => `
        <div class="response-item">
          <div class="response-header">
            <span class="response-author">${response.ResponderName || 'غير محدد'}</span>
            <span class="response-date">${formatDate(response.CreatedAt)}</span>
          </div>
          <div class="response-type">${response.ResponseType || 'رد'}</div>
          <div class="response-text">${response.ResponseText}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
  `;

  modal.style.display = 'flex';
}

function respondToComplaint(complaintId) {
  state.currentComplaintId = complaintId;
  const modal = document.getElementById('responseModal');
  if (modal) {
    document.getElementById('responseText').value = '';
    document.getElementById('responseType').value = 'رد رسمي';
    modal.style.display = 'flex';
  }
}

function updateComplaintStatus(complaintId) {
  state.currentComplaintId = complaintId;
  const modal = document.getElementById('statusModal');
  if (modal) {
    document.getElementById('newStatus').value = '';
    document.getElementById('statusRemarks').value = '';
    modal.style.display = 'flex';
  }
}

async function submitResponse() {
  try {
    const responseText = document.getElementById('responseText').value.trim();
    const responseType = document.getElementById('responseType').value;
    
    if (!responseText) {
      showError('يرجى كتابة نص الرد');
      return;
    }

    showLoading();
    
    const response = await fetch(`${EMP_BASE}/complaints/${state.currentComplaintId}/respond`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        responseText,
        responseType
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      hideResponseModal();
      fetchComplaints();
      showSuccess('تم إرسال الرد بنجاح');
    } else {
      throw new Error(data.message || 'فشل في إرسال الرد');
    }
  } catch (error) {
    console.error('Error submitting response:', error);
    showError('حدث خطأ في إرسال الرد: ' + error.message);
  } finally {
    hideLoading();
  }
}

async function submitStatusUpdate() {
  try {
    const newStatus = document.getElementById('newStatus').value;
    const statusRemarks = document.getElementById('statusRemarks').value.trim();
    
    if (!newStatus) {
      showError('يرجى اختيار الحالة الجديدة');
      return;
    }

    showLoading();
    
    const response = await fetch(`${EMP_BASE}/complaints/${state.currentComplaintId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        status: newStatus,
        remarks: statusRemarks
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      hideStatusModal();
      fetchComplaints();
      showSuccess('تم تحديث الحالة بنجاح');
    } else {
      throw new Error(data.message || 'فشل في تحديث الحالة');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    showError('حدث خطأ في تحديث الحالة: ' + error.message);
  } finally {
    hideLoading();
  }
}

function hideResponseModal() {
  const modal = document.getElementById('responseModal');
  if (modal) modal.style.display = 'none';
}

function hideStatusModal() {
  const modal = document.getElementById('statusModal');
  if (modal) modal.style.display = 'none';
}

function hideDetailsModal() {
  const modal = document.getElementById('detailsModal');
  if (modal) modal.style.display = 'none';
}

function showSuccess(message) {
  // يمكن إضافة toast notification هنا
  alert(message);
}

function applyFilters() {
  state.page = 1;
  state.filters.status = document.getElementById('statusFilter').value;
  state.filters.priority = document.getElementById('priorityFilter').value;
  state.filters.q = document.getElementById('searchInput').value.trim();
  fetchComplaints();
}

function clearFilters() {
  document.getElementById('statusFilter').value = '';
  document.getElementById('priorityFilter').value = '';
  document.getElementById('searchInput').value = '';
  state.filters = { status: '', priority: '', q: '' };
  state.page = 1;
  fetchComplaints();
}

function changeSort() {
  state.sortBy = document.getElementById('sortBy').value;
  state.page = 1;
  fetchComplaints();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  if (!guardEmployee()) return;
  
  // تحميل البيانات الأولية
  fetchComplaints();
  
  // Event listeners للفلاتر
  document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
  document.getElementById('priorityFilter')?.addEventListener('change', applyFilters);
  document.getElementById('searchInput')?.addEventListener('input', debounce(applyFilters, 500));
  document.getElementById('clearFilters')?.addEventListener('click', clearFilters);
  document.getElementById('sortBy')?.addEventListener('change', changeSort);
  
  // Event listeners للأزرار
  document.getElementById('newComplaintBtn')?.addEventListener('click', () => {
    window.location.href = '../New complaint/Newcomplaint.html';
  });
  
  // Event listeners للـ modals
  document.getElementById('closeErrorModal')?.addEventListener('click', hideError);
  document.getElementById('closeErrorBtn')?.addEventListener('click', hideError);
  document.getElementById('closeDetailsModal')?.addEventListener('click', hideDetailsModal);
  document.getElementById('closeDetailsBtn')?.addEventListener('click', hideDetailsModal);
  document.getElementById('closeResponseModal')?.addEventListener('click', hideResponseModal);
  document.getElementById('cancelResponseBtn')?.addEventListener('click', hideResponseModal);
  document.getElementById('closeStatusModal')?.addEventListener('click', hideStatusModal);
  document.getElementById('cancelStatusBtn')?.addEventListener('click', hideStatusModal);
  
  // Event listeners للإجراءات
  document.getElementById('submitResponseBtn')?.addEventListener('click', submitResponse);
  document.getElementById('submitStatusBtn')?.addEventListener('click', submitStatusUpdate);
  document.getElementById('respondBtn')?.addEventListener('click', () => {
    hideDetailsModal();
    respondToComplaint(state.currentComplaintId);
  });
  document.getElementById('updateStatusBtn')?.addEventListener('click', () => {
    hideDetailsModal();
    updateComplaintStatus(state.currentComplaintId);
  });
  
  // إغلاق الـ modals عند النقر خارجها
  window.addEventListener('click', function(event) {
    const errorModal = document.getElementById('errorModal');
    const detailsModal = document.getElementById('detailsModal');
    const responseModal = document.getElementById('responseModal');
    const statusModal = document.getElementById('statusModal');
    
    if (event.target === errorModal) hideError();
    if (event.target === detailsModal) hideDetailsModal();
    if (event.target === responseModal) hideResponseModal();
    if (event.target === statusModal) hideStatusModal();
  });
});

// Utility function for debouncing
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
