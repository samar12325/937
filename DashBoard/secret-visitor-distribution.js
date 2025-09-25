let currentLang = localStorage.getItem('lang') || 'ar';

// API Base URL
const API_BASE_URL = 'http://localhost:3001/api';

// إضافة نظام الصلاحيات
let userPermissions = [];

// ====== تحميل صلاحيات المستخدم ======
async function loadUserPermissions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found');
            return [];
        }

        const API_BASE = (/:5502|:5503/.test(location.href)) ? 'http://localhost:3001' : '';
        const res = await fetch(`${API_BASE}/api/auth/me/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const { data } = await res.json();
        userPermissions = data?.permissions || [];
        console.log('🔍 Loaded user permissions:', userPermissions);
        console.log('🔍 Is Super Admin:', isSuperAdmin());
        console.log('🔍 Has secret_visitor_distribute_dept:', userPermissions.includes('secret_visitor_distribute_dept'));
        console.log('🔍 Has secret_visitor_distribute_between_depts:', userPermissions.includes('secret_visitor_distribute_between_depts'));
        console.log('🔍 Has secret_visitor_reply_status:', userPermissions.includes('secret_visitor_reply_status'));
        console.log('🔍 Has secret_visitor_change_status:', userPermissions.includes('secret_visitor_change_status'));
        console.log('🔍 Has secret_visitor_view_details:', userPermissions.includes('secret_visitor_view_details'));
        console.log('🔍 Has secret_visitor_track_status:', userPermissions.includes('secret_visitor_track_status'));
        return userPermissions;
    } catch (e) {
        console.error('❌ Failed to load permissions:', e);
        userPermissions = [];
        return [];
    }
}

// ====== فحص الصلاحيات ======
function getMe() {
    try { 
        return JSON.parse(localStorage.getItem('user') || '{}'); 
    }
    catch { 
        return {}; 
    }
}

function isSuperAdmin() {
    return Number(getMe()?.RoleID) === 1; // RoleID=1 = سوبر أدمن
}

function hasPermission(permission) {
    // سوبر أدمن يشوف ويستخدم كل شيء دائمًا
    if (isSuperAdmin()) return true;
    return userPermissions.includes(permission);
}

// متغيرات عامة
let departments = [];
let notes = [];
let currentNoteId = null;
let currentAssignmentId = null; // لاستخدامه في الرد وتغيير الحالة

// ====== إدارة اللغة ======
function applyLanguage() {
    const elements = document.querySelectorAll('[data-ar], [data-en]');
    elements.forEach(element => {
        const text = currentLang === 'ar' ? element.getAttribute('data-ar') : element.getAttribute('data-en');
        if (text) {
            element.textContent = text;
        }
    });
    
    // تحديث اتجاه النص
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
}

// تبديل اللغة
function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
    loadNotes(); // إعادة تحميل البيانات باللغة الجديدة
}

// ====== إدارة Custom Select ======
function initCustomSelects() {
    // Custom Select للحالة
    const statusSelect = document.getElementById('statusSelect');
    const statusOptions = document.getElementById('statusOptions');
    const selectedStatus = document.getElementById('selectedStatus');
    
    statusSelect.addEventListener('click', () => {
        statusOptions.classList.toggle('show');
    });
    
    statusOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = currentLang === 'ar' ? e.target.getAttribute('data-ar') : e.target.getAttribute('data-en');
            
            selectedStatus.textContent = text;
            selectedStatus.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            statusOptions.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            statusOptions.classList.remove('show');
            
            // إعادة تحميل البيانات عند تغيير الفلتر
            console.log('🔄 Auto-search triggered by execution status filter change');
            loadNotes();
        }
    });
    
    // Custom Select للأقسام
    const departmentSelect = document.getElementById('departmentSelect');
    const departmentOptions = document.getElementById('departmentOptions');
    const selectedDepartment = document.getElementById('selectedDepartment');
    
    departmentSelect.addEventListener('click', () => {
        departmentOptions.classList.toggle('show');
    });
    
    departmentOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = e.target.textContent;
            
            selectedDepartment.textContent = text;
            selectedDepartment.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            departmentOptions.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            departmentOptions.classList.remove('show');
        }
    });
    
    // Custom Select لحالة التوزيع
    const distributionStatusSelect = document.getElementById('distributionStatusSelect');
    const distributionStatusOptions = document.getElementById('distributionStatusOptions');
    const selectedDistributionStatus = document.getElementById('selectedDistributionStatus');
    
    distributionStatusSelect.addEventListener('click', () => {
        distributionStatusOptions.classList.toggle('show');
    });
    
    distributionStatusOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = currentLang === 'ar' ? e.target.getAttribute('data-ar') : e.target.getAttribute('data-en');
            
            selectedDistributionStatus.textContent = text;
            selectedDistributionStatus.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            distributionStatusOptions.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            distributionStatusOptions.classList.remove('show');
            
            // إعادة تحميل البيانات عند تغيير الفلتر
            console.log('🔄 Auto-search triggered by distribution status filter change');
            loadNotes();
        }
    });
    
    // Custom Select لمودال تغيير الحالة
    const statusSelectModal = document.getElementById('statusSelectModal');
    const statusOptionsModal = document.getElementById('statusOptionsModal');
    const selectedStatusModal = document.getElementById('selectedStatusModal');
    
    statusSelectModal.addEventListener('click', () => {
        statusOptionsModal.classList.toggle('show');
    });
    
    statusOptionsModal.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-select-option')) {
            const value = e.target.getAttribute('data-value');
            const text = currentLang === 'ar' ? e.target.getAttribute('data-ar') : e.target.getAttribute('data-en');
            
            selectedStatusModal.textContent = text;
            selectedStatusModal.setAttribute('data-value', value);
            
            // إزالة التحديد السابق
            statusOptionsModal.querySelectorAll('.custom-select-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // تحديد الخيار الجديد
            e.target.classList.add('selected');
            statusOptionsModal.classList.remove('show');
        }
    });
    
    // إغلاق القوائم عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-select-options').forEach(options => {
                options.classList.remove('show');
            });
        }
    });
}

// ====== تحميل الأقسام ======
async function loadDepartments() {
    try {
        const token = localStorage.getItem('token');
        
        // استخدام نفس API المستخدم في report-937.js
        const response = await fetch(`${API_BASE_URL}/departments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الأقسام');
        }
        
        const result = await response.json();
        
        // تحديث متغير departments بالشكل الصحيح
        departments = (result.data || []).map(row => ({
            DepartmentID: row.DepartmentID,
            DepartmentName: row.DepartmentName,
            DepartmentNameEn: row.DepartmentNameEn || row.DepartmentName
        }));
        
        // تحديث قائمة الأقسام في Modal التوزيع
        await populateDepartmentDropdown();
        
        // إعداد البحث في الأقسام
        setupDepartmentSearch();
        
        console.log('📋 Loaded', departments.length, 'departments from database');
        
    } catch (error) {
        console.error('Error loading departments:', error);
        showToast('فشل في تحميل الأقسام', 'error');
    }
}

// دالة ملء القائمة المنسدلة للأقسام
async function populateDepartmentDropdown() {
    const departmentOptions = document.getElementById('departmentOptions');
    if (!departmentOptions) return;

    // مسح الخيارات الموجودة
    departmentOptions.innerHTML = '';

    try {
        // إضافة الأقسام من قاعدة البيانات
        departments.forEach(dept => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.setAttribute('data-value', dept.DepartmentID);
            option.setAttribute('data-ar', dept.DepartmentName);
            option.setAttribute('data-en', dept.DepartmentNameEn || dept.DepartmentName);
            option.textContent = currentLang === 'ar' ? dept.DepartmentName : (dept.DepartmentNameEn || dept.DepartmentName);
            departmentOptions.appendChild(option);
        });

        console.log('📋 Department dropdown populated with', departments.length, 'departments from database');
        
    } catch (error) {
        console.error('Error populating department dropdown:', error);
    }
}

// ====== إعداد البحث في الأقسام ======
function setupDepartmentSearch() {
    const searchInput = document.getElementById('departmentSearch');
    const departmentSelect = document.getElementById('departmentSelect');
    const selectedDepartment = document.getElementById('selectedDepartment');
    const departmentOptions = document.getElementById('departmentOptions');
    
    if (!searchInput || !departmentSelect || !selectedDepartment || !departmentOptions) return;
    
    // إظهار/إخفاء حقل البحث مقابل النص المحدد
    function toggleSearchMode(showSearch) {
        if (showSearch) {
            searchInput.style.display = 'block';
            selectedDepartment.style.display = 'none';
            searchInput.focus();
        } else {
            searchInput.style.display = 'none';
            selectedDepartment.style.display = 'block';
        }
    }
    
    // تصفية الأقسام حسب البحث
    function filterDepartments(searchTerm) {
        const options = departmentOptions.querySelectorAll('.custom-select-option');
        const searchLower = searchTerm.toLowerCase().trim();
        
        let hasMatches = false;
        
        options.forEach(option => {
            const textAr = option.getAttribute('data-ar') || '';
            const textEn = option.getAttribute('data-en') || '';
            const optionText = textAr + ' ' + textEn;
            
            if (searchLower === '' || optionText.toLowerCase().includes(searchLower)) {
                option.style.display = 'block';
                hasMatches = true;
            } else {
                option.style.display = 'none';
            }
        });
        
        // إظهار رسالة "لا توجد نتائج" إذا لم توجد أقسام مطابقة
        if (searchLower !== '' && !hasMatches) {
            // إزالة رسالة "لا توجد نتائج" السابقة
            const existingNoResults = departmentOptions.querySelector('.no-results-message');
            if (existingNoResults) {
                existingNoResults.remove();
            }
            
            // إضافة رسالة "لا توجد نتائج"
            const noResults = document.createElement('div');
            noResults.className = 'custom-select-option no-results-message';
            noResults.style.color = '#6b7280';
            noResults.style.fontStyle = 'italic';
            noResults.textContent = currentLang === 'ar' ? 'لا توجد أقسام مطابقة' : 'No matching departments';
            departmentOptions.appendChild(noResults);
        } else {
            // إزالة رسالة "لا توجد نتائج" إذا وجدت نتائج
            const existingNoResults = departmentOptions.querySelector('.no-results-message');
            if (existingNoResults) {
                existingNoResults.remove();
            }
        }
    }
    
    // إظهار/إخفاء القائمة المنسدلة
    function toggleDropdown() {
        const isOpen = departmentOptions.classList.contains('open');
        
        if (!isOpen) {
            departmentOptions.classList.add('open');
            toggleSearchMode(true);
        } else {
            departmentOptions.classList.remove('open');
            toggleSearchMode(false);
        }
    }
    
    // Event listeners
    searchInput.addEventListener('input', (e) => {
        filterDepartments(e.target.value);
    });
    
    departmentSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });
    
    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!departmentSelect.contains(e.target) && !departmentOptions.contains(e.target)) {
            departmentOptions.classList.remove('open');
            toggleSearchMode(false);
        }
    });
    
    // اختيار قسم
    departmentOptions.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-select-option');
        if (!option || option.classList.contains('no-results-message')) return;
        
        const value = option.getAttribute('data-value');
        const textAr = option.getAttribute('data-ar');
        const textEn = option.getAttribute('data-en');
        
        if (value) {
            selectedDepartment.setAttribute('data-value', value);
            selectedDepartment.textContent = currentLang === 'ar' ? textAr : (textEn || textAr);
            
            departmentOptions.classList.remove('open');
            toggleSearchMode(false);
            searchInput.value = '';
        }
    });
}

// ====== تحميل الملاحظات ======
async function loadNotes() {
    try {
        const token = localStorage.getItem('token');
        const fromDate = document.getElementById('fromDate').value;
        const toDate = document.getElementById('toDate').value;
        const statusValue = document.getElementById('selectedStatus').getAttribute('data-value') || 'all';
        
        let url = `${API_BASE_URL}/secret-visitor/notes?status=${statusValue}`;
        if (fromDate && toDate) {
            url += `&from=${fromDate}&to=${toDate}`;
        }
        
        console.log('🔍 Loading notes from:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل الملاحظات');
        }
        
        const result = await response.json();
        notes = result.data || [];
        
        console.log('📊 Loaded notes:', notes.length);
        if (notes.length > 0) {
            console.log('📊 Sample note with distribution:', {
                id: notes[0].id,
                assigned_department_id: notes[0].assigned_department_id,
                assigned_to_employee_id: notes[0].assigned_to_employee_id,
                isDistributed: !!(notes[0].assigned_department_id || notes[0].assigned_to_employee_id)
            });
        }
        
        renderNotesTable();
        updateStatistics();
        
    } catch (error) {
        console.error('Error loading notes:', error);
        showToast('فشل في تحميل الملاحظات', 'error');
    }
}

// ====== عرض جدول الملاحظات ======
function renderNotesTable() {
    const tbody = document.getElementById('notesTableBody');
    
    // تطبيق فلتر حالة التوزيع محلياً
    const distributionStatusValue = document.getElementById('selectedDistributionStatus').getAttribute('data-value') || 'all';
    let filteredNotes = notes;
    
    if (distributionStatusValue !== 'all') {
        filteredNotes = notes.filter(note => {
            const isDistributed = note.assigned_department_id || note.assigned_to_employee_id;
            if (distributionStatusValue === 'distributed') {
                return isDistributed;
            } else if (distributionStatusValue === 'not_distributed') {
                return !isDistributed;
            }
            return true;
        });
    }
    
    if (filteredNotes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    ${currentLang === 'ar' ? 'لا توجد ملاحظات' : 'No notes found'}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredNotes.map(note => {
        // استخدام الحالة الثلاثية مع قيمة افتراضية
        const executionStatus = note.execution_status || 'in_progress'; // افتراضي: تحت التنفيذ
        const statusClass = getTriStatusClass(executionStatus);
        const statusText = getTriStatusText(executionStatus);
        
        // التحقق من حالة التوزيع
        const isDistributed = note.assigned_department_id || note.assigned_to_employee_id;
        const distributionClass = isDistributed ? 'distribution-distributed' : 'distribution-not-distributed';
        const distributionText = isDistributed 
            ? (currentLang === 'ar' ? 'تم التوزيع' : 'Distributed')
            : (currentLang === 'ar' ? 'لم يتم التوزيع' : 'Not Distributed');
        
        // Debug log for distribution status
        if (note.id === 1) { // Log for first note only
            console.log('🔍 Distribution status for note:', {
                id: note.id,
                assigned_department_id: note.assigned_department_id,
                assigned_to_employee_id: note.assigned_to_employee_id,
                isDistributed: isDistributed,
                distributionText: distributionText,
                assignment_id: note.assignment_id || note.assignmentId
            });
        }
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${currentLang === 'ar' ? (note.department_name_ar || 'غير محدد') : (note.department_name_en || note.department_name_ar || 'Not specified')}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title="${note.note_text || ''}">
                    ${note.note_text || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${note.responsible_department || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${note.location || '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="distribution-status ${distributionClass}">${distributionText}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${note.created_at ? new Date(note.created_at).toLocaleDateString('ar-SA') : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${getActionButtons(note)}
                </td>
            </tr>
        `;
    }).join('');
}

// ====== فتح Modal التوزيع ======
function openAssignModal(noteId) {
    currentNoteId = noteId;
    document.getElementById('assignModal').classList.remove('hidden');
}

// ====== إغلاق Modal التوزيع ======
function closeAssignModal() {
    document.getElementById('assignModal').classList.add('hidden');
    currentNoteId = null;
    
    // إعادة تعيين اختيار القسم
    const selectedDepartment = document.getElementById('selectedDepartment');
    selectedDepartment.textContent = currentLang === 'ar' ? 'اختر القسم' : 'Select Department';
    selectedDepartment.removeAttribute('data-value');
    
    // مسح حقل البحث عن القسم
    const departmentSearch = document.getElementById('departmentSearch');
    if (departmentSearch) {
        departmentSearch.value = '';
    }
    
    // إعادة عرض جميع الأقسام
    const departmentOptions = document.getElementById('departmentOptions');
    if (departmentOptions) {
        const allOptions = departmentOptions.querySelectorAll('.custom-select-option');
        allOptions.forEach(option => {
            option.style.display = 'block';
        });
        
        // إزالة رسالة "لا توجد نتائج"
        const noResultsMsg = departmentOptions.querySelector('.no-results-message');
        if (noResultsMsg) {
            noResultsMsg.remove();
        }
        
        // إغلاق القائمة المنسدلة
        departmentOptions.classList.remove('open');
    }
}

// ====== دوال مودال الرد ======
function openReplyModal(assignmentId) {
    if (!assignmentId) {
        showToast(currentLang === 'ar' ? 'التعيين غير معروف – حدّد تعيين أولاً' : 'Assignment not found - please assign first', 'error');
        return;
    }
    currentAssignmentId = assignmentId;
    document.getElementById('replyModal').classList.remove('hidden');
    const ta = document.getElementById('replyText');
    if (ta) ta.value = '';
}

function closeReplyModal() {
    document.getElementById('replyModal').classList.add('hidden');
    currentAssignmentId = null;
    const ta = document.getElementById('replyText');
    if (ta) ta.value = '';
}

async function confirmReply() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('انتهت الجلسة – سجّل الدخول');

        if (!currentAssignmentId) throw new Error('لا يوجد تعيين محدد');

        const textarea = document.getElementById('replyText');
        const replyText = (textarea?.value || '').trim();
        if (!replyText) throw new Error('الرد مطلوب');

        // عطّل الزر أثناء الإرسال
        const btn = document.getElementById('btnConfirmReply');
        if (btn) btn.disabled = true;

        let res = null;

        // محاولة إرسال الرد للملاحظة الموزعة أولاً
        try {
            res = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${currentAssignmentId}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reply_text: replyText })
            });
        } catch (error) {
            console.log('Assignment reply failed, trying note reply...');
        }

        // إذا فشل أو لم يكن هناك assignment، جرب مسار الملاحظة العامة
        if (!res || !res.ok) {
            res = await fetch(`${API_BASE_URL}/secret-visitor/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    note_id: currentAssignmentId,
                    reply_text: replyText,
                    replied_by: JSON.parse(localStorage.getItem('user') || '{}').EmployeeID
                })
            });
        }

        if (!res || !res.ok) {
            // لو 403 -> مشكلة صلاحيات/إسناد
            if (res && res.status === 403) {
                throw new Error('ليس لديك صلاحية للرد على هذا التعيين – يجب أن تكون المكلّف به أو تملك صلاحية خاصة');
            }
            const err = await res?.json().catch(() => ({}));
            throw new Error(err?.message || 'فشل في إرسال الرد');
        }

        // نجاح
        closeReplyModal();
        showToast(currentLang === 'ar' ? 'تم إرسال الرد' : 'Reply sent', 'success');
        loadNotes(); // إعادة تحميل البيانات
    } catch (err) {
        showToast(err.message || 'فشل في إرسال الرد', 'error');
    } finally {
        const btn = document.getElementById('btnConfirmReply');
        if (btn) btn.disabled = false;
    }
}

// ====== دوال مودال تغيير الحالة ======
function openStatusModal(assignmentId, noteId) {
    currentAssignmentId = assignmentId;
    currentNoteId = noteId; // تخزين noteId للاستخدام في confirmStatusChange
    document.getElementById('statusModal').classList.remove('hidden');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.add('hidden');
    currentAssignmentId = null;
    currentNoteId = null; // مسح noteId أيضاً
    
    // إعادة تعيين القيم
    const selectedStatusModal = document.getElementById('selectedStatusModal');
    selectedStatusModal.textContent = currentLang === 'ar' ? 'اختر الحالة' : 'Select Status';
    selectedStatusModal.removeAttribute('data-value');
    
    const statusReason = document.getElementById('statusReason');
    if (statusReason) statusReason.value = '';
}

async function confirmStatusChange() {
    const selectedStatus = document.getElementById('selectedStatusModal').getAttribute('data-value');
    const reason = (document.getElementById('statusReason')?.value || '').trim();
    
    if (!selectedStatus) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار الحالة' : 'Please select a status', 'warning');
        return;
    }
    
    if (!currentAssignmentId) {
        showToast(currentLang === 'ar' ? 'هذا البلاغ غير موزع بعد' : 'This note is not assigned yet', 'warning');
        return;
    }
    
    try {
        // استخدام دالة updateStatus الجديدة مع noteId
        await updateStatus(currentAssignmentId, selectedStatus, currentNoteId);
        closeStatusModal();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// ====== دالة تغيير الحالة ======
// newStatus ∈ ['in_progress','executed','not_executed'] فقط
async function updateStatus(assignmentId, newStatus, noteId) {
    if (!assignmentId && !noteId) {
        showToast(currentLang === 'ar' ? 'معرف البلاغ مطلوب' : 'Note ID is required', 'warning');
        return;
    }

    const ALLOWED_ASSIGN = new Set(['assigned','in_progress','executed','not_executed']);
    const ALLOWED_EXEC   = new Set(['executed','not_executed']);

    try {
        const token = localStorage.getItem('token');

        // 1) حدّث حالة التعيين (must be one of ALLOWED_ASSIGN)
        if (!ALLOWED_ASSIGN.has(newStatus)) {
            throw new Error(currentLang === 'ar' ? 'حالة غير صحيحة' : 'Invalid status');
        }

        let res = null;

        // إذا كان هناك assignmentId (ملاحظة موزعة)، جرب مسار التعيين أولاً
        if (assignmentId && assignmentId !== noteId) {
            res = await fetch(`${API_BASE_URL}/secret-visitor/assigned/${assignmentId}/status`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        }

        // إذا فشل أو لم يكن هناك assignmentId (ملاحظة غير موزعة)، استخدم مسار الملاحظات
        if (!res || !res.ok) {
            if (['executed', 'not_executed'].includes(newStatus) && noteId) {
                res = await fetch(`${API_BASE_URL}/secret-visitor/notes/${noteId}/execution-status`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ execution_status: newStatus })
                });
            } else if (noteId) {
                // للحالات الأخرى، جرب مسار الملاحظات مباشرة
                res = await fetch(`${API_BASE_URL}/secret-visitor/notes/${noteId}/execution-status`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ execution_status: newStatus })
                });
            }
        }

        if (!res || !res.ok) {
            const e = await res?.json().catch(() => ({}));
            throw new Error(e?.message || 'فشل في تحديث الحالة');
        }

        showToast(currentLang === 'ar' ? 'تم تحديث الحالة' : 'Status updated', 'success');
        loadNotes();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// ====== دوال مساعدة للحالة الثلاثية ======
function getTriStatusText(status) {
    const map = {
        executed: (currentLang === 'ar' ? 'منفذ' : 'Executed'),
        not_executed: (currentLang === 'ar' ? 'غير منفذ' : 'Not Executed'),
        in_progress: (currentLang === 'ar' ? 'تحت التنفيذ' : 'In Progress')
    };
    return map[status] || status;
}

function getTriStatusClass(status) {
    if (status === 'executed') return 'status-done';
    if (status === 'not_executed') return 'status-rejected';
    return 'status-in-progress';
}

// ====== دالة توليد أزرار الإجراءات الموحدة ======
function getActionButtons(note) {
    const isDistributed = note.assigned_department_id || note.assigned_to_employee_id;
    const assignmentId = note.assignment_id || note.assignmentId; // إزالة note.id كـ fallback
    const buttons = [];

    // Debug log
    console.log('🔧 getActionButtons for note:', {
        id: note.id,
        isDistributed: isDistributed,
        assigned_department_id: note.assigned_department_id,
        assigned_to_employee_id: note.assigned_to_employee_id,
        assignment_id: note.assignment_id,
        assignmentId: note.assignmentId,
        finalAssignmentId: assignmentId
    });

    // زر التوزيع (يتطلب صلاحية secret_visitor_distribute_between_depts)
    console.log('🔍 Checking secret_visitor_distribute_between_depts permission:', {
        hasPermission: hasPermission('secret_visitor_distribute_between_depts'),
        isSuperAdmin: isSuperAdmin(),
        userPermissions: userPermissions,
        noteId: note.id
    });
    
    if (hasPermission('secret_visitor_distribute_between_depts')) {
        buttons.push(`
            <button onclick="openAssignModal(${note.id})" class="assign-btn">
                ${currentLang === 'ar' ? 'توزيع' : 'Assign'}
            </button>
        `);
    }

    // زر تغيير الحالة (يتطلب صلاحية secret_visitor_change_status)
    if (hasPermission('secret_visitor_change_status')) {
        console.log('✅ Adding status buttons for note:', note.id, 'isDistributed:', isDistributed);
        buttons.push(`
            <button onclick="openStatusModal(${assignmentId}, ${note.id})" class="action-btn btn-start">
                ${currentLang === 'ar' ? 'تغيير الحالة' : 'Change Status'}
            </button>
        `);
    }

    // زر الرد (يتطلب صلاحية secret_visitor_reply_status)
    if (hasPermission('secret_visitor_reply_status')) {
        const replyId = note.assignment_id && note.assignment_id !== note.id ? note.assignment_id : note.id;
        buttons.push(`
            <button onclick="openReplyModal(${replyId})" class="action-btn btn-reply" data-assignment-id="${replyId}">
                ${currentLang === 'ar' ? 'رد' : 'Reply'}
            </button>
        `);
    }

    // زر التتبّع (يتطلب صلاحية secret_visitor_track_status)
    if (hasPermission('secret_visitor_track_status')) {
        buttons.push(`
            <button onclick="openTrackModal(${note.id})" class="action-btn btn-track">
                ${currentLang === 'ar' ? 'تتبّع' : 'Track'}
            </button>
        `);
    }

    // زر التفاصيل (يتطلب صلاحية secret_visitor_view_details)
    if (hasPermission('secret_visitor_view_details')) {
        buttons.push(`
            <button onclick="openDetailsModal(${note.id})" class="action-btn btn-details">
                ${currentLang === 'ar' ? 'التفاصيل' : 'Details'}
            </button>
        `);
    }

    return `<div class="flex flex-wrap gap-1">${buttons.join('')}</div>`;
}

// ====== دالة تحديث الإحصائيات ======
function updateStatistics() {
    const total = notes.length;
    const inProgress = notes.filter(note => (note.execution_status || 'in_progress') === 'in_progress').length;
    const executed = notes.filter(note => note.execution_status === 'executed').length;
    const notExecuted = notes.filter(note => note.execution_status === 'not_executed').length;
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('executedCount').textContent = executed;
    document.getElementById('notExecutedCount').textContent = notExecuted;
}

// ====== دالة تنظيف البيانات للـ SQL ======
function cleanForSql(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k] = (v === undefined || v === '') ? null : v;
    }
    return out;
}

// ====== تأكيد التوزيع ======
async function confirmAssign() {
    const departmentId = document.getElementById('selectedDepartment').getAttribute('data-value');
    
    if (!departmentId) {
        showToast(currentLang === 'ar' ? 'يرجى اختيار قسم' : 'Please select a department', 'warning');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const department = departments.find(d => d.DepartmentID == departmentId);
        
        // تنظيف البيانات قبل الإرسال
        const currentEmployeeId = Number(localStorage.getItem('EmployeeID')) || null;
        const rawPayload = {
            note_id: Number(currentNoteId),
            assigned_department_id: departmentId ? Number(departmentId) : null,
            assigned_department_name_ar: department?.DepartmentName || null,
            assigned_department_name_en: department?.DepartmentNameEn || department?.DepartmentName || null,
            assigned_to_employee_id: currentEmployeeId // استخدام الموظف الحالي
        };
        
        const payload = cleanForSql(rawPayload);
        
        console.log('assign payload →', payload);
        
        const response = await fetch(`${API_BASE_URL}/secret-visitor/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'فشل في توزيع الملاحظة');
        }
        
        const result = await response.json();
        console.log('✅ Assignment successful:', result);
        showToast(currentLang === 'ar' ? 'تم إرسال البلاغ إلى القسم' : 'Report sent to department', 'success');
        closeAssignModal();
        
        // إعادة تحميل الجدول بعد التوزيع
        console.log('🔄 Reloading notes after assignment...');
        loadNotes();
        
    } catch (error) {
        console.error('Error assigning note:', error);
        showToast(error.message, 'error');
    }
}

// ====== إظهار Toast ======
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // إظهار Toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // إخفاء Toast بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
}

// ====== تهيئة الصفحة ======
document.addEventListener('DOMContentLoaded', async function() {
    // تطبيق اللغة
    applyLanguage();
    
    // تحميل صلاحيات المستخدم
    await loadUserPermissions();
    
    // فتح جميع عناصر data-permission للسوبر أدمن
    if (isSuperAdmin()) {
        document.querySelectorAll('[data-permission]').forEach(el => {
            el.style.display = '';
            console.log('🔓 Super Admin: Showing element with permission:', el.getAttribute('data-permission'));
        });
    }
    
    // تهيئة Custom Selects
    initCustomSelects();
    
    // تحميل البيانات
    loadDepartments();
    loadNotes();
    
    // ربط الأحداث
    document.getElementById('langToggle').addEventListener('click', toggleLanguage);
    document.getElementById('cancelAssignBtn').addEventListener('click', closeAssignModal);
    document.getElementById('confirmAssignBtn').addEventListener('click', confirmAssign);
    
    // إغلاق Modal عند النقر خارجها
    document.getElementById('assignModal').addEventListener('click', (e) => {
        if (e.target.id === 'assignModal') {
            closeAssignModal();
        }
    });
    
    // إغلاق Modal الرد عند النقر خارجها
    document.getElementById('replyModal').addEventListener('click', (e) => {
        if (e.target.id === 'replyModal') {
            closeReplyModal();
        }
    });
    
    // إغلاق Modal تغيير الحالة عند النقر خارجها
    document.getElementById('statusModal').addEventListener('click', (e) => {
        if (e.target.id === 'statusModal') {
            closeStatusModal();
        }
    });
    
    // تحميل تلقائي عند تغيير التواريخ والفلاتر
    document.getElementById('fromDate').addEventListener('change', () => {
        console.log('🔄 Auto-search triggered by from date change');
        loadNotes();
    });
    document.getElementById('toDate').addEventListener('change', () => {
        console.log('🔄 Auto-search triggered by to date change');
        loadNotes();
    });
    
    // تعيين التواريخ الافتراضية (آخر 30 يوم)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    document.getElementById('toDate').value = today.toISOString().split('T')[0];
    document.getElementById('fromDate').value = thirtyDaysAgo.toISOString().split('T')[0];
});

// ====== دوال التتبّع (Timeline) ======
let currentTrackNoteId = null;

// ====== دوال التفاصيل (Details) ======
let currentDetailsNoteId = null;

function openTrackModal(noteId) {
    currentTrackNoteId = noteId;
    document.getElementById('trackModal').classList.remove('hidden');
    loadTrackData();
}

function closeTrackModal() {
    document.getElementById('trackModal').classList.add('hidden');
    currentTrackNoteId = null;
    document.getElementById('trackAssignments').innerHTML = '';
    document.getElementById('trackReplies').innerHTML = '';
}

async function loadTrackData() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/secret-visitor/notes/${currentTrackNoteId}/timeline`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            const e = await res.json().catch(()=>({}));
            throw new Error(e?.message || 'فشل في تحميل التتبّع');
        }
        const { data } = await res.json();

        renderTrackAssignments(data.assignments || []);
        renderTrackReplies(data.replies || []);
        renderTrackPath(data.assignments || [], data.replies || []);
    } catch (err) {
        console.error('track load error:', err);
        showToast(err.message || 'فشل في تحميل التتبّع', 'error');
    }
}

function renderTrackAssignments(items) {
    const ul = document.getElementById('trackAssignments');
    if (!items.length) {
        ul.innerHTML = `<li class="text-sm text-gray-500 italic">${currentLang==='ar'?'لا توجد تحويلات أو تعيينات':'No assignments found'}</li>`;
        return;
    }
    ul.innerHTML = items.map(a => {
        const dept = (currentLang==='ar' ? (a.assigned_department_name_ar || '-') : (a.assigned_department_name_en || a.assigned_department_name_ar || '-'));
        const emp = a.assigned_employee_name || '-';
        const at  = a.assigned_at ? new Date(a.assigned_at).toLocaleString('ar-SA') : '-';
        const statusText = getTriStatusText(a.status);
        const reason = a.reason ? ` – <span class="text-gray-500 text-xs">${a.reason}</span>` : '';
        return `
            <li class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="text-sm font-medium text-gray-800 mb-1">
                            <span class="text-blue-600">assigned</span> إلى <strong>${dept}</strong>
                        </div>
                        <div class="text-xs text-gray-500">${at}</div>
                    </div>
                    <div class="text-xs text-gray-400">${statusText}</div>
                </div>
            </li>
        `;
    }).join('');
}

function renderTrackReplies(items) {
    const ul = document.getElementById('trackReplies');
    if (!items.length) {
        ul.innerHTML = `<li class="text-sm text-gray-500 italic">${currentLang==='ar'?'لا توجد ردود':'No replies found'}</li>`;
        return;
    }
    ul.innerHTML = items.map(r => {
        const by = r.replied_by_name || `#${r.replied_by || '-'}`;
        const at = r.created_at ? new Date(r.created_at).toLocaleString('ar-SA') : '-';
        const text = (r.reply_text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `
            <li class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="text-sm text-gray-800 mb-2">${text}</div>
                        <div class="text-xs text-gray-500">${by} • ${at}</div>
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

// دالة إنشاء مسار التتبع البصري
function renderTrackPath(assignments, replies) {
    const pathContainer = document.getElementById('pathSteps');
    if (!pathContainer) return;

    // إنشاء خطوات المسار
    const steps = [];
    
    // الخطوة الأولى: تقديم البلاغ
    steps.push({
        id: 'submitted',
        title: currentLang === 'ar' ? 'تم تقديم البلاغ' : 'Report Submitted',
        status: 'completed',
        icon: '✓'
    });

    // إضافة خطوات التحويلات
    assignments.forEach((assignment, index) => {
        const deptName = currentLang === 'ar' ? 
            (assignment.assigned_department_name_ar || 'قسم غير محدد') : 
            (assignment.assigned_department_name_en || assignment.assigned_department_name_ar || 'Unknown Department');
        
        steps.push({
            id: `assignment_${index}`,
            title: currentLang === 'ar' ? `إحالة إلى ${deptName}` : `Referred to ${deptName}`,
            status: assignment.status === 'executed' ? 'completed' : 
                   assignment.status === 'in_progress' ? 'current' : 'pending',
            icon: assignment.status === 'executed' ? '✓' : 
                  assignment.status === 'in_progress' ? '⏳' : '⏸'
        });
    });

    // إضافة خطوات الردود
    if (replies.length > 0) {
        steps.push({
            id: 'replied',
            title: currentLang === 'ar' ? 'تم الرد' : 'Replied',
            status: 'completed',
            icon: '💬'
        });
    }

    // الخطوة الأخيرة: الحل
    const hasExecutedAssignment = assignments.some(a => a.status === 'executed');
    if (hasExecutedAssignment) {
        steps.push({
            id: 'resolved',
            title: currentLang === 'ar' ? 'تم الحل' : 'Resolved',
            status: 'completed',
            icon: '✓'
        });
        
        steps.push({
            id: 'closed',
            title: currentLang === 'ar' ? 'مغلقة' : 'Closed',
            status: 'completed',
            icon: '✗'
        });
    } else {
        steps.push({
            id: 'resolved',
            title: currentLang === 'ar' ? 'تم الحل' : 'Resolved',
            status: 'pending',
            icon: '⏸'
        });
        
        steps.push({
            id: 'closed',
            title: currentLang === 'ar' ? 'مغلقة' : 'Closed',
            status: 'pending',
            icon: '⏸'
        });
    }

    // إنشاء HTML للمسار
    pathContainer.innerHTML = steps.map(step => `
        <div class="path-step ${step.status}">
            <div class="path-step-icon">${step.icon}</div>
            <div class="path-step-text">${step.title}</div>
        </div>
    `).join('');
}

// دالة طباعة التتبّع
function printTimeline() {
    try {
        // إنشاء نافذة طباعة جديدة
        const printWindow = window.open('', '_blank');
        
        // الحصول على محتوى المودال
        const trackContent = document.getElementById('trackContent');
        const trackAssignments = document.getElementById('trackAssignments');
        const trackReplies = document.getElementById('trackReplies');
        
        // إنشاء HTML للطباعة
        const printHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تتبّع البلاغ - ${currentLang === 'ar' ? 'الزائر السري' : 'Secret Visitor'}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #2c3e50;
                    }
                    .header .date {
                        margin-top: 10px;
                        font-size: 14px;
                        color: #666;
                    }
                    .section {
                        margin: 30px 0;
                        page-break-inside: avoid;
                    }
                    .section h2 {
                        color: #2c3e50;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                        font-size: 18px;
                    }
                    .timeline-item {
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        padding: 15px;
                        margin: 10px 0;
                        background: #f9f9f9;
                    }
                    .timeline-item .main-info {
                        font-weight: bold;
                        margin-bottom: 5px;
                        font-size: 14px;
                    }
                    .timeline-item .details {
                        font-size: 12px;
                        color: #666;
                    }
                    .no-data {
                        text-align: center;
                        color: #999;
                        font-style: italic;
                        padding: 20px;
                    }
                    .print-footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${currentLang === 'ar' ? 'تتبّع البلاغ - الزائر السري' : 'Secret Visitor - Note Timeline'}</h1>
                    <div class="date">${currentLang === 'ar' ? 'تاريخ الطباعة' : 'Print Date'}: ${new Date().toLocaleString('ar-SA')}</div>
                </div>
                
                <div class="section">
                    <h2>${currentLang === 'ar' ? 'تحويلات وتعيينات' : 'Assignments & Transfers'}</h2>
                    ${trackAssignments.innerHTML}
                </div>
                
                <div class="section">
                    <h2>${currentLang === 'ar' ? 'الردود' : 'Replies'}</h2>
                    ${trackReplies.innerHTML}
                </div>
                
                <div class="print-footer">
                    ${currentLang === 'ar' ? 'تم طباعة هذا التقرير من نظام الزائر السري' : 'This report was printed from Secret Visitor System'}
                </div>
            </body>
            </html>
        `;
        
        // كتابة المحتوى في النافذة الجديدة
        printWindow.document.write(printHTML);
        printWindow.document.close();
        
        // انتظار تحميل المحتوى ثم فتح نافذة الطباعة
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            
            // إغلاق النافذة بعد الطباعة
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
        
        showToast(currentLang === 'ar' ? 'تم فتح نافذة الطباعة' : 'Print window opened', 'success');
        
    } catch (error) {
        console.error('Print error:', error);
        showToast(currentLang === 'ar' ? 'فشل في الطباعة' : 'Print failed', 'error');
    }
}

// ====== دوال مودال التفاصيل ======
function openDetailsModal(noteId) {
    currentDetailsNoteId = noteId;
    document.getElementById('detailsModal').classList.remove('hidden');
    loadDetailsData();
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.add('hidden');
    currentDetailsNoteId = null;
    // مسح المحتوى
    document.getElementById('noteBasicInfo').innerHTML = '';
    document.getElementById('noteDistributionInfo').innerHTML = '';
    document.getElementById('noteContent').innerHTML = '';
    document.getElementById('detailsAssignments').innerHTML = '';
    document.getElementById('detailsReplies').innerHTML = '';
}

// دالة النزول للأسفل
function scrollToBottom() {
    const detailsContent = document.getElementById('detailsContent');
    if (detailsContent) {
        detailsContent.scrollTo({
            top: detailsContent.scrollHeight,
            behavior: 'smooth'
        });
    }
}

async function loadDetailsData() {
    try {
        const token = localStorage.getItem('token');
        
        // جلب بيانات البلاغ الأساسية
        const note = notes.find(n => n.id === currentDetailsNoteId);
        if (!note) {
            throw new Error('البلاغ غير موجود');
        }

        // عرض المعلومات الأساسية
        renderNoteBasicInfo(note);
        renderNoteDistributionInfo(note);
    } catch (err) {
        console.error('Details load error:', err);
        showToast(err.message || 'فشل في تحميل التفاصيل', 'error');
    }
}

function renderNoteBasicInfo(note) {
    const container = document.getElementById('noteBasicInfo');
    const createdDate = note.created_at ? new Date(note.created_at).toLocaleString('ar-SA') : '-';
    const updatedDate = note.updated_at ? new Date(note.updated_at).toLocaleString('ar-SA') : '-';
    
    container.innerHTML = `
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'رقم البلاغ' : 'Note ID'}</div>
            <div class="text-sm text-gray-600">${note.id}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'}</div>
            <div class="text-sm text-gray-600">${createdDate}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'تاريخ التحديث' : 'Updated Date'}</div>
            <div class="text-sm text-gray-600">${updatedDate}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'حالة التنفيذ' : 'Execution Status'}</div>
            <div class="text-sm text-gray-600">${getTriStatusText(note.execution_status)}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'الموقع' : 'Location'}</div>
            <div class="text-sm text-gray-600">${note.location || '-'}</div>
        </div>
    `;
}

function renderNoteDistributionInfo(note) {
    const container = document.getElementById('noteDistributionInfo');
    const isDistributed = note.assigned_department_id || note.assigned_to_employee_id;
    const distributionStatus = isDistributed 
        ? (currentLang === 'ar' ? 'تم التوزيع' : 'Distributed')
        : (currentLang === 'ar' ? 'غير موزع' : 'Not Distributed');
    
    container.innerHTML = `
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'حالة التوزيع' : 'Distribution Status'}</div>
            <div class="text-sm text-gray-600">${distributionStatus}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'القسم المسند' : 'Assigned Department'}</div>
            <div class="text-sm text-gray-600">${note.assigned_department_name_ar || '-'}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'الموظف المسند' : 'Assigned Employee'}</div>
            <div class="text-sm text-gray-600">${note.assigned_employee_name || '-'}</div>
        </div>
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div class="text-sm font-medium text-gray-800 mb-1">${currentLang === 'ar' ? 'معرف التعيين' : 'Assignment ID'}</div>
            <div class="text-sm text-gray-600">${note.assignment_id || '-'}</div>
        </div>
    `;
}



// دالة طباعة التفاصيل
function printDetails() {
    try {
        // إنشاء نافذة طباعة جديدة
        const printWindow = window.open('', '_blank');
        
        // الحصول على محتوى المودال
        const noteBasicInfo = document.getElementById('noteBasicInfo');
        const noteDistributionInfo = document.getElementById('noteDistributionInfo');
        
        // التحقق من وجود العناصر
        if (!noteBasicInfo || !noteDistributionInfo) {
            throw new Error('عناصر الطباعة غير موجودة');
        }
        
        // إنشاء HTML للطباعة
        const printHTML = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تفاصيل البلاغ - ${currentLang === 'ar' ? 'الزائر السري' : 'Secret Visitor'}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        line-height: 1.6;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #333;
                        padding-bottom: 15px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #2c3e50;
                    }
                    .header .date {
                        margin-top: 10px;
                        font-size: 14px;
                        color: #666;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .info-box {
                        border: 1px solid #3b82f6;
                        border-radius: 5px;
                        padding: 15px;
                        background: #dbeafe;
                    }
                    .info-box h3 {
                        margin-top: 0;
                        color: #1e40af;
                        font-size: 16px;
                        margin-bottom: 15px;
                    }
                    .info-item {
                        margin: 10px 0;
                        padding: 8px;
                        background: white;
                        border-radius: 3px;
                        border: 1px solid #e5e7eb;
                    }
                    .info-label {
                        font-weight: bold;
                        color: #374151;
                        font-size: 14px;
                    }
                    .info-value {
                        color: #6b7280;
                        font-size: 14px;
                        margin-top: 2px;
                    }
                    .print-footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #ddd;
                        padding-top: 15px;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${currentLang === 'ar' ? 'تفاصيل البلاغ - الزائر السري' : 'Secret Visitor - Note Details'}</h1>
                    <div class="date">${currentLang === 'ar' ? 'تاريخ الطباعة' : 'Print Date'}: ${new Date().toLocaleString('ar-SA')}</div>
                </div>
                
                <div class="info-grid">
                    <div class="info-box">
                        <h3>${currentLang === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}</h3>
                        ${noteBasicInfo.innerHTML}
                    </div>
                    <div class="info-box">
                        <h3>${currentLang === 'ar' ? 'حالة التوزيع' : 'Distribution Status'}</h3>
                        ${noteDistributionInfo.innerHTML}
                    </div>
                </div>
                
                <div class="print-footer">
                    ${currentLang === 'ar' ? 'تم طباعة هذا التقرير من نظام الزائر السري' : 'This report was printed from Secret Visitor System'}
                </div>
            </body>
            </html>
        `;
        
        // كتابة المحتوى في النافذة الجديدة
        printWindow.document.write(printHTML);
        printWindow.document.close();
        
        // انتظار تحميل المحتوى ثم فتح نافذة الطباعة
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            
            // إغلاق النافذة بعد الطباعة
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
        
        showToast(currentLang === 'ar' ? 'تم فتح نافذة طباعة التفاصيل' : 'Print details window opened', 'success');
        
    } catch (error) {
        console.error('Print details error:', error);
        showToast(currentLang === 'ar' ? 'فشل في طباعة التفاصيل' : 'Print details failed', 'error');
    }
}
