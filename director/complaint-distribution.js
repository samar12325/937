/* ====== توزيع البلاغات ====== */

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
let currentStatus = 'unassigned';
let allComplaints = [];
let allDepartments = [];
let selectedComplaints = new Set();

/* ====== أدوات DOM ====== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Complaint Distribution Page Loading ===');
  
  // اختبار فوري لإظهار المحتوى
  setTimeout(() => {
    const layout = document.querySelector('.distribution-layout');
    if (layout) {
      layout.style.display = 'grid';
      layout.style.visibility = 'visible';
      console.log('Distribution layout forced visible');
    }
    
    const panels = document.querySelectorAll('.complaints-panel, .assignment-panel');
    panels.forEach((panel, index) => {
      panel.style.display = 'flex';
      panel.style.visibility = 'visible';
      console.log(`Panel ${index + 1} forced visible`);
    });
  }, 100);
  const complaintsList = $('#complaints-list');
  const loadingComplaints = $('#loading-complaints');
  const noComplaints = $('#no-complaints');
  
  const unassignedTab = $('#unassigned-tab');
  const assignedTab = $('#assigned-tab');
  
  const categoryFilter = $('#category-filter');
  const priorityFilter = $('#priority-filter');
  const departmentFilter = $('#department-filter');
  const dateFrom = $('#date-from');
  const dateTo = $('#date-to');
  const clearFilters = $('#clear-filters');
  
  const selectedCount = $('#selected-count');
  const assignSelectedBtn = $('#assign-selected-btn');
  const noSelectionHint = $('#no-selection-hint');
  const assignmentForm = $('#assignment-form');
  const systemSuggestion = $('#system-suggestion');
  const suggestionContent = $('#suggestion-content');
  const applySuggestion = $('#apply-suggestion');
  
  const assignDepartment = $('#assign-department');
  const assignEmployee = $('#assign-employee');
  const assignmentReason = $('#assignment-reason');
  const cancelAssignment = $('#cancel-assignment');
  const confirmAssignment = $('#confirm-assignment');
  
  const selectedComplaintsList = $('#selected-complaints-list');
  const toast = $('#toast');
  const toastMessage = $('#toast-message');
  const langToggle = $('#langToggle');

  // التحقق من وجود العناصر المطلوبة
  console.log('DOM Elements check:');
  console.log('- complaintsList:', !!complaintsList);
  console.log('- loadingComplaints:', !!loadingComplaints);
  console.log('- assignmentForm:', !!assignmentForm);
  console.log('- departmentFilter:', !!departmentFilter);

  // تحميل البيانات الأولية
  async function initializeData() {
    await Promise.all([
      loadDepartments(),
      loadComplaintCategories(),
      loadComplaints()
    ]);
  }

  // تحميل الأقسام
  async function loadDepartments() {
    try {
      const res = await fetch(`${API_BASE_URL}/director/departments`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          console.warn('Director endpoints not available, using fallback data');
          loadDepartmentsFallback();
          return;
        }
        throw new Error('Failed to fetch departments');
      }
      
      const payload = await res.json();
      allDepartments = payload?.data || [];
      
      populateDepartmentFilters();
    } catch (error) {
      console.error('Error loading departments:', error);
      loadDepartmentsFallback();
    }
  }

  function loadDepartmentsFallback() {
    // بيانات الأقسام الشاملة
    allDepartments = [
      { DepartmentID: 1, DepartmentName: 'قسم المدير التنفيذي للمستشفى' },
      { DepartmentID: 2, DepartmentName: 'قسم المشرحة' },
      { DepartmentID: 3, DepartmentName: 'قسم التنسيق الطبي وأهلية العلاج' },
      { DepartmentID: 4, DepartmentName: 'قسم خدمات الضيف' },
      { DepartmentID: 5, DepartmentName: 'قسم المراجعة الداخلية' },
      { DepartmentID: 18, DepartmentName: 'قسم الطب الباطني العام' },
      { DepartmentID: 19, DepartmentName: 'قسم الجراحة العامة' },
      { DepartmentID: 22, DepartmentName: 'قسم الأنف والأذن والحنجرة' },
      { DepartmentID: 26, DepartmentName: 'قسم الطوارئ' },
      { DepartmentID: 30, DepartmentName: 'قسم الصيدلية' },
      { DepartmentID: 35, DepartmentName: 'قسم الأشعة' },
      { DepartmentID: 40, DepartmentName: 'قسم البصريات' },
      { DepartmentID: 58, DepartmentName: 'قسم الباطنة – القلب' }
    ];
    
    console.log('Using fallback departments data:', allDepartments.length, 'departments');
    populateDepartmentFilters();
  }

  function populateDepartmentFilters() {
    // مرشح الأقسام
    departmentFilter.innerHTML = '<option value="" data-ar="جميع الأقسام" data-en="All Departments">جميع الأقسام</option>';
    assignDepartment.innerHTML = '<option value="" data-ar="اختر قسماً..." data-en="Choose department...">اختر قسماً...</option>';
    
    allDepartments.forEach(dept => {
      const option1 = document.createElement('option');
      option1.value = dept.DepartmentID;
      option1.textContent = dept.DepartmentName;
      departmentFilter.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = dept.DepartmentID;
      option2.textContent = dept.DepartmentName;
      assignDepartment.appendChild(option2);
    });
  }

  // تحميل فئات البلاغات
  async function loadComplaintCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/types`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        const payload = await res.json();
        const categories = payload?.data || [];
        
        categoryFilter.innerHTML = '<option value="" data-ar="جميع الفئات" data-en="All Categories">جميع الفئات</option>';
        categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.ComplaintTypeID;
          option.textContent = cat.TypeName;
          categoryFilter.appendChild(option);
        });
        console.log('Loaded', categories.length, 'complaint categories');
      } else {
        loadCategoriesFallback();
      }
    } catch (error) {
      console.error('Error loading complaint categories:', error);
      loadCategoriesFallback();
    }
  }

  function loadCategoriesFallback() {
    // فئات البلاغات الأساسية
    const categories = [
      { ComplaintTypeID: 1, TypeName: 'الخدمات الطبية والعلاجية' },
      { ComplaintTypeID: 2, TypeName: 'المواعيد والتحويلات' },
      { ComplaintTypeID: 3, TypeName: 'الصيدلية والدواء' },
      { ComplaintTypeID: 4, TypeName: 'الكوادر الصحية وسلوكهم' },
      { ComplaintTypeID: 6, TypeName: 'خدمات المرضى العامة' },
      { ComplaintTypeID: 7, TypeName: 'الاستقبال وخدمة العملاء' },
      { ComplaintTypeID: 10, TypeName: 'تجربة الزوار والمرافقين' },
      { ComplaintTypeID: 11, TypeName: 'خدمات الطوارئ والإسعاف' }
    ];
    
    categoryFilter.innerHTML = '<option value="" data-ar="جميع الفئات" data-en="All Categories">جميع الفئات</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.ComplaintTypeID;
      option.textContent = cat.TypeName;
      categoryFilter.appendChild(option);
    });
    
    console.log('Using fallback complaint categories:', categories.length, 'categories');
  }

  // تحميل البلاغات
  async function loadComplaints() {
    try {
      loadingComplaints.hidden = false;
      noComplaints.hidden = true;
      complaintsList.innerHTML = '';

      const params = new URLSearchParams({
        status: currentStatus,
        ...(categoryFilter.value && { category: categoryFilter.value }),
        ...(priorityFilter.value && { priority: priorityFilter.value }),
        ...(departmentFilter.value && { departmentId: departmentFilter.value }),
        ...(dateFrom.value && { dateFrom: dateFrom.value }),
        ...(dateTo.value && { dateTo: dateTo.value }),
        _t: Date.now()   // كاسر كاش
      });

      const res = await fetch(`${API_BASE_URL}/director/complaints?${params}`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) {
        if (res.status === 404) {
          console.warn('Director complaints endpoint not available, using fallback data');
          loadComplaintsFallback();
          return;
        }
        throw new Error('Failed to fetch complaints');
      }
      
      const payload = await res.json();
      allComplaints = payload?.data || [];

      loadingComplaints.hidden = true;
      renderComplaints(allComplaints);
      
    } catch (error) {
      console.error(error);
      loadingComplaints.hidden = true;
      loadComplaintsFallback();
    }
  }

  function loadComplaintsFallback() {
    // بيانات شكاوى وهمية للاختبار
    if (currentStatus === 'unassigned') {
      allComplaints = [
        {
          ComplaintID: 20,
          title: 'مشكلة في الخدمة',
          ComplaintDate: '2025-09-09',
          CurrentStatus: 'جديدة',
          Priority: 'متوسطة',
          category: 'خدمات المرضى العامة',
          patientName: 'سمورة',
          ageInDays: 2
        },
        {
          ComplaintID: 21,
          title: 'تأخير في الموعد',
          ComplaintDate: '2025-09-08',
          CurrentStatus: 'جديدة',
          Priority: 'عاجل',
          category: 'المواعيد والتحويلات',
          patientName: 'أحمد محمد',
          ageInDays: 3
        },
        {
          ComplaintID: 22,
          title: 'مشكلة في البصريات',
          ComplaintDate: '2025-09-07',
          CurrentStatus: 'جديدة',
          Priority: 'عالية',
          category: 'الخدمات الطبية والعلاجية',
          patientName: 'فاطمة علي',
          ageInDays: 4
        }
      ];
    } else {
      allComplaints = [
        {
          ComplaintID: 9,
          title: 'بلاغ  معينة للمراجعة',
          ComplaintDate: '2025-09-05',
          CurrentStatus: 'قيد المراجعة',
          Priority: 'متوسطة',
          category: 'خدمات المرضى العامة',
          patientName: 'محمد أحمد',
          assignedToName: 'رنيم',
          ageInDays: 6
        }
      ];
    }
    
    console.log('Using fallback complaints data:', allComplaints.length, 'complaints for status:', currentStatus);
    loadingComplaints.hidden = true;
    renderComplaints(allComplaints);
  }

  function renderComplaints(complaints) {
    complaintsList.innerHTML = '';
    
    if (!complaints.length) {
      noComplaints.hidden = false;
      return;
    }
    
    noComplaints.hidden = true;

    complaints.forEach(complaint => {
      const complaintRow = document.createElement('div');
      complaintRow.className = 'complaint-row';
      complaintRow.setAttribute('data-complaint-id', complaint.ComplaintID);
      
      const ageText = complaint.ageInDays === 0 ? 
        (currentLanguage === 'ar' ? 'اليوم' : 'Today') :
        `${complaint.ageInDays} ${currentLanguage === 'ar' ? 'يوم' : 'days'}`;
      
      complaintRow.innerHTML = `
        <input type="checkbox" class="complaint-checkbox" 
               onchange="toggleComplaintSelection(${complaint.ComplaintID}, this.checked)">
        <div class="complaint-info">
          <div class="complaint-title">${complaint.title || 'بلاغ  بدون عنوان'}</div>
          <div class="complaint-meta">
            <span class="category-badge">${complaint.category || ''}</span>
            <span class="priority-badge ${complaint.Priority}">${complaint.Priority}</span>
            <span class="age-badge">${ageText}</span>
            ${complaint.assignedToName ? `<span class="assigned-to">→ ${complaint.assignedToName}</span>` : ''}
          </div>
        </div>
        <div class="complaint-id">#${complaint.ComplaintID}</div>
        <div class="complaint-patient">${complaint.patientName || ''}</div>
        <div class="complaint-actions">
          <button class="details-badge" onclick="viewComplaintDetails(${complaint.ComplaintID})"
                  data-ar="تفاصيل" data-en="Details">تفاصيل</button>
          <button class="followup-badge" onclick="followupComplaint(${complaint.ComplaintID})"
                  data-ar="متابعة" data-en="Follow up">متابعة</button>
        </div>
      `;
      
      complaintsList.appendChild(complaintRow);
    });
    
    updateSelectionUI();
  }

  // تبديل تحديد البلاغ 
  window.toggleComplaintSelection = function(complaintId, isSelected) {
    if (isSelected) {
      selectedComplaints.add(complaintId);
    } else {
      selectedComplaints.delete(complaintId);
    }
    updateSelectionUI();
  };

  function updateSelectionUI() {
    const count = selectedComplaints.size;
    selectedCount.textContent = count;
    assignSelectedBtn.disabled = count === 0;
    
    if (count > 0) {
      noSelectionHint.hidden = true;
      assignmentForm.hidden = false;
      updateSelectedComplaintsList();
    } else {
      noSelectionHint.hidden = false;
      assignmentForm.hidden = true;
      systemSuggestion.hidden = true;
    }
  }

  function updateSelectedComplaintsList() {
    selectedComplaintsList.innerHTML = '';
    
    selectedComplaints.forEach(complaintId => {
      const complaint = allComplaints.find(c => c.ComplaintID === complaintId);
      if (!complaint) return;
      
      const item = document.createElement('div');
      item.className = 'selected-complaint-item';
      item.innerHTML = `
        <span class="selected-complaint-title">#${complaint.ComplaintID} - ${complaint.title || 'بلاغ  بدون عنوان'}</span>
        <button class="remove-selected" onclick="removeFromSelection(${complaintId})" 
                title="${currentLanguage === 'ar' ? 'إزالة' : 'Remove'}">×</button>
      `;
      
      selectedComplaintsList.appendChild(item);
    });
  }

  window.removeFromSelection = function(complaintId) {
    selectedComplaints.delete(complaintId);
    const checkbox = $(`[data-complaint-id="${complaintId}"] .complaint-checkbox`);
    if (checkbox) checkbox.checked = false;
    updateSelectionUI();
  };

  // دالة getSuggestion محذوفة - تم استبدالها بزر التفاصيل

  // دوال الاقتراحات محذوفة - تم استبدالها بزر التفاصيل

  // تحديث قائمة الموظفين عند اختيار القسم
  assignDepartment.addEventListener('change', async () => {
    const departmentId = assignDepartment.value;
    console.log('Department selected for assignment:', departmentId);
    
    // مسح قائمة الموظفين
    assignEmployee.innerHTML = '<option value="" data-ar="اختر موظفاً..." data-en="Choose employee...">اختر موظفاً...</option>';
    
    if (!departmentId) {
      assignEmployee.disabled = true;
      showEmployeeMessage('اختر قسماً أولاً');
      return;
    }
    
    try {
      // محاولة تحميل موظفي القسم من API
      const res = await fetch(`${API_BASE_URL}/director/departments/${departmentId}/employees`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        const payload = await res.json();
        const employees = payload?.data || [];
        populateEmployeeDropdown(employees, departmentId);
      } else if (res.status === 404) {
        // استخدام بيانات وهمية
        const employees = getEmployeesFallback(departmentId);
        populateEmployeeDropdown(employees, departmentId);
      } else {
        throw new Error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      // استخدام بيانات وهمية كحل أخير
      const employees = getEmployeesFallback(departmentId);
      populateEmployeeDropdown(employees, departmentId);
    }
  });

  function populateEmployeeDropdown(employees, departmentId) {
    console.log('Populating employee dropdown for department', departmentId, 'with', employees.length, 'employees');
    
    if (!employees.length) {
      assignEmployee.innerHTML = '<option value="" data-ar="لا يوجد موظفون نشطون في هذا القسم" data-en="No active staff in this department">لا يوجد موظفون نشطون في هذا القسم</option>';
      assignEmployee.disabled = true;
      showEmployeeMessage('لا يوجد موظفون نشطون في هذا القسم');
      return;
    }
    
    // ترتيب الموظفين حسب عدد البلاغات المفتوحة (الأقل انشغالاً أولاً)
    const sortedEmployees = employees.sort((a, b) => (a.openComplaintsCount || 0) - (b.openComplaintsCount || 0));
    
    sortedEmployees.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.EmployeeID;
      const workloadText = emp.openComplaintsCount || 0;
      const roleText = getRoleText(emp.RoleID);
      option.textContent = `${emp.FullName} - ${roleText} (${workloadText} شكاوى مفتوحة)`;
      option.setAttribute('data-workload', workloadText);
      assignEmployee.appendChild(option);
    });
    
    assignEmployee.disabled = false;
    hideEmployeeMessage();
    console.log('Employee dropdown populated with', sortedEmployees.length, 'active employees');
  }

  function getEmployeesFallback(departmentId) {
    const employeesByDept = {
      40: [ // قسم البصريات
        { EmployeeID: 12, FullName: 'رنيم', RoleID: 2, openComplaintsCount: 1 },
        { EmployeeID: 4, FullName: 'سمر', RoleID: 3, openComplaintsCount: 2 },
        { EmployeeID: 14, FullName: 'سمورة', RoleID: 2, openComplaintsCount: 0 }
      ],
      58: [ // قسم الباطنة - القلب
        { EmployeeID: 3, FullName: 'محمود حامد', RoleID: 2, openComplaintsCount: 1 },
        { EmployeeID: 2, FullName: 'محمود', RoleID: 3, openComplaintsCount: 0 }
      ],
      35: [ // قسم الأشعة
        { EmployeeID: 5, FullName: 'سحر', RoleID: 2, openComplaintsCount: 0 }
      ],
      26: [ // قسم الطوارئ
        { EmployeeID: 11, FullName: 'سارة علي', RoleID: 2, openComplaintsCount: 1 }
      ]
    };
    
    return employeesByDept[departmentId] || [];
  }

  function getRoleText(roleId) {
    switch (roleId) {
      case 2: return currentLanguage === 'ar' ? 'موظف' : 'Employee';
      case 3: return currentLanguage === 'ar' ? 'مدير قسم' : 'Manager';
      default: return 'Staff';
    }
  }

  function showEmployeeMessage(message) {
    let messageDiv = $('#employee-selection-message');
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = 'employee-selection-message';
      messageDiv.className = 'form-hint';
      messageDiv.style.cssText = 'color: #d97706; font-size: 12px; margin-top: 4px; font-style: italic;';
      assignEmployee.parentNode.appendChild(messageDiv);
    }
    messageDiv.textContent = message;
    messageDiv.hidden = false;
  }

  function hideEmployeeMessage() {
    const messageDiv = $('#employee-selection-message');
    if (messageDiv) {
      messageDiv.hidden = true;
    }
  }

  // تبويبات الحالة
  unassignedTab.addEventListener('click', () => switchStatus('unassigned'));
  assignedTab.addEventListener('click', () => switchStatus('assigned'));

  function switchStatus(status) {
    currentStatus = status;
    
    unassignedTab.classList.toggle('active', status === 'unassigned');
    assignedTab.classList.toggle('active', status === 'assigned');
    
    // مسح التحديدات
    selectedComplaints.clear();
    updateSelectionUI();
    
    loadComplaints();
  }

  // المرشحات
  [categoryFilter, priorityFilter, departmentFilter, dateFrom, dateTo].forEach(filter => {
    filter.addEventListener('change', loadComplaints);
  });

  clearFilters.addEventListener('click', () => {
    categoryFilter.value = '';
    priorityFilter.value = '';
    departmentFilter.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    loadComplaints();
  });

  // تعيين البلاغات
  assignSelectedBtn.addEventListener('click', () => {
    if (selectedComplaints.size === 0) return;
    
    // التمرير لنموذج التعيين
    assignmentForm.scrollIntoView({ behavior: 'smooth' });
  });

  cancelAssignment.addEventListener('click', () => {
    selectedComplaints.clear();
    $$('.complaint-checkbox').forEach(cb => cb.checked = false);
    updateSelectionUI();
  });

  confirmAssignment.addEventListener('click', async () => {
    if (selectedComplaints.size === 0) {
      showToast('يجب اختيار بلاغ  واحدة على الأقل', 'error');
      return;
    }

    if (!assignDepartment.value) {
      showToast('يجب اختيار قسم للتعيين', 'error');
      return;
    }

    // تعطيل الزر لمنع النقرات المتكررة
    confirmAssignment.disabled = true;
    confirmAssignment.textContent = currentLanguage === 'ar' ? 'جارٍ التعيين...' : 'Assigning...';

    try {
      const departmentName = allDepartments.find(d => d.DepartmentID == assignDepartment.value)?.DepartmentName || '';
      const employeeName = assignEmployee.value ? 
        assignEmployee.options[assignEmployee.selectedIndex]?.text.split(' - ')[0] || '' : null;

      const assignmentData = {
        complaintIds: Array.from(selectedComplaints),
        departmentId: parseInt(assignDepartment.value),
        employeeId: assignEmployee.value ? parseInt(assignEmployee.value) : null,
        reason: assignmentReason.value.trim() || `تم التعيين بواسطة المدير العام`
      };

      console.log('Sending assignment request:', assignmentData);

      console.log('🔍 Sending assignment request to:', `${API_BASE_URL}/director/complaints/assign`);
      console.log('🔍 Assignment data:', assignmentData);
      console.log('🔍 Headers:', { 'Content-Type': 'application/json', ...getAuthHeaders() });

      const res = await fetch(`${API_BASE_URL}/director/complaints/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(assignmentData)
      });

      console.log('🔍 Response status:', res.status);
      console.log('🔍 Response headers:', Object.fromEntries(res.headers.entries()));

      if (res.ok) {
        const result = await res.json();
        console.log('✅ Assignment successful:', result);

        const departmentName = allDepartments.find(d => d.DepartmentID == assignDepartment.value)?.DepartmentName || '';
        const employeeName = assignEmployee.value ? 
          assignEmployee.options[assignEmployee.selectedIndex]?.text.split(' - ')[0] || '' : null;
        const assignedTo = employeeName ? `${departmentName} → ${employeeName}` : departmentName;

        const ids = Array.from(selectedComplaints);
        const successMessage = ids.length === 1
          ? `تم تعيين البلاغ #${ids[0]} إلى ${assignedTo}`
          : `تم تعيين ${ids.length} شكاوى إلى ${assignedTo}`;

        showToast(successMessage, 'success');

        // (1) اشطب فورًا من تبويب "غير معينة" إن كنا عليه الآن
        if (currentStatus === 'unassigned') {
          removeAssignedFromUnassigned(ids);
        }

        // (2) نظّف النموذج
        resetAssignmentForm();

        // (3) صفّر المرشحات قبل التحويل (اختياري لكنه يريحك)
        clearAllFilters();

        // (4) انتقل إلى تبويب "معينة" وحمّل من الخادم (مع كاسر كاش داخل loadComplaints)
        switchStatus('assigned');
        
      } else {
        console.error('❌ Assignment failed:', res.status, res.statusText);
        let errorMessage = 'فشل في تعيين البلاغات';
        
        try {
          const errorData = await res.json();
          console.error('❌ Error details:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorMessage = `خطأ ${res.status}: ${res.statusText}`;
        }
        
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error assigning complaints:', error);
      
      // محاكاة النجاح للاختبار عندما لا يكون API متاحاً
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('API not available, simulating successful assignment');
        
        const departmentName = allDepartments.find(d => d.DepartmentID == assignDepartment.value)?.DepartmentName || '';
        const employeeName = assignEmployee.value ? 
          assignEmployee.options[assignEmployee.selectedIndex]?.text.split(' - ')[0] || '' : null;
        
        const assignedTo = employeeName ? `${departmentName} → ${employeeName}` : departmentName;
        const successMessage = selectedComplaints.size === 1 ? 
          `تم تعيين البلاغ  #${Array.from(selectedComplaints)[0]} إلى ${assignedTo} (محاكاة)` :
          `تم تعيين ${selectedComplaints.size} شكاوى إلى ${assignedTo} (محاكاة)`;
        
        showToast(successMessage, 'success');

        const ids = Array.from(selectedComplaints);
        
        // (1) اشطب فورًا من تبويب "غير معينة" إن كنا عليه الآن
        if (currentStatus === 'unassigned') {
          removeAssignedFromUnassigned(ids);
        }

        // (2) نظّف النموذج
        resetAssignmentForm();

        // (3) صفّر المرشحات قبل التحويل
        clearAllFilters();

        // (4) انتقل إلى تبويب "معينة" وحمّل من الخادم
        switchStatus('assigned');
      } else {
        console.error('❌ Unexpected error during assignment:', error);
        showToast(`خطأ غير متوقع: ${error.message}`, 'error');
      }
    } finally {
      // إعادة تفعيل الزر
      confirmAssignment.disabled = false;
      confirmAssignment.textContent = currentLanguage === 'ar' ? 'تأكيد التعيين' : 'Confirm Assignment';
    }
  });

  function resetAssignmentForm() {
    selectedComplaints.clear();
    $$('.complaint-checkbox').forEach(cb => cb.checked = false);
    updateSelectionUI();
    assignDepartment.value = '';
    assignEmployee.value = '';
    assignEmployee.disabled = true;
    assignmentReason.value = '';
    systemSuggestion.hidden = true;
    hideEmployeeMessage();
  }

  // إزالة "متفائلة" من تبويب غير معينة فورًا
  function removeAssignedFromUnassigned(assignedIds) {
    // حدّث الحالة المحلية
    allComplaints = allComplaints.filter(c => !assignedIds.includes(c.ComplaintID));
    // واحذف الصفوف من الـDOM
    assignedIds.forEach(id => {
      const row = document.querySelector(`[data-complaint-id="${id}"]`);
      if (row) row.remove();
    });
    // في حال صارت القائمة فاضية
    const noComplaints = document.getElementById('no-complaints');
    if (allComplaints.length === 0 && noComplaints) {
      noComplaints.hidden = false;
      noComplaints.textContent = 'تم تعيين جميع البلاغات بنجاح!';
    }
  }

  // صفّر المرشحات قبل فتح "معينة"
  function clearAllFilters() {
    categoryFilter.value = '';
    priorityFilter.value = '';
    departmentFilter.value = '';
    dateFrom.value = '';
    dateTo.value = '';
  }


  // إدارة اللغة
  langToggle.addEventListener('click', toggleLanguage);

  function toggleLanguage() {
    currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute('lang', currentLanguage);
    document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
    document.body.className = `lang-${currentLanguage}`;

    updateLanguageTexts();
    renderComplaints(allComplaints);
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

  // التأكد من ظهور التخطيط الأساسي
  function ensureLayoutVisible() {
    const layout = $('.distribution-layout');
    const complaintsPanel = $('.complaints-panel');
    const assignmentPanel = $('.assignment-panel');
    
    if (layout) {
      layout.style.display = 'grid';
      layout.style.visibility = 'visible';
      console.log('Distribution layout is visible');
    }
    
    if (complaintsPanel) {
      complaintsPanel.style.display = 'flex';
      complaintsPanel.style.visibility = 'visible';
      console.log('Complaints panel is visible');
    }
    
    if (assignmentPanel) {
      assignmentPanel.style.display = 'flex';
      assignmentPanel.style.visibility = 'visible';
      console.log('Assignment panel is visible');
    }
  }

  // بدء التطبيق
  console.log('Starting complaint distribution app...');
  ensureLayoutVisible();
  initializeData();
});

// وظائف عامة للشكاوى
window.followupComplaint = function(complaintId) {
  // فتح صفحة المتابعة الموجودة مع معرف البلاغ 
  console.log('Following up complaint:', complaintId);
  window.location.href = `/Complaints-followup/followup.html?complaint=${complaintId}`;
};

// فتح صفحة تفاصيل الشكوى
window.viewComplaintDetails = function(complaintId) {
  console.log('➡️ فتح تفاصيل الشكوى:', complaintId);

  // امسح الكاش القديم حتى ما يعرض شكوى قديمة
  localStorage.removeItem('selectedComplaint');
  // خزّن الـID كاحتياط
  localStorage.setItem('selectedComplaintId', String(complaintId));

  // استخدم مسار مُرمّز (المسافة = %20)
  const encodedPath = `/general%20complaints/details.html?complaintId=${encodeURIComponent(complaintId)}`;
  console.log('🔗 [DETAILS] Redirecting to:', encodedPath);
  
  window.location.href = encodedPath;
};
