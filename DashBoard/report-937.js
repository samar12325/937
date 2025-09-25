// ===================== report-937.js (Excel-driven totals per department) =====================

// اجعل الرسم عالي الدقّة على كل الأجهزة
if (window.Chart) {
  Chart.defaults.devicePixelRatio = 2; // جرّب 3 إذا تبغى حِدّة أعلى
}

// لغة
let currentLang = localStorage.getItem('lang') || 'ar';

// Charts
let complaintCategoriesChart;
let departmentComplaintsChart;

// Data for Main Card
const mainCardData = { totalReports: 804 };

// Complaint Categories (ثابتة إلى أن نوصلها بمصدر بيانات)
const complaintCategoriesData = {
  labels: {
    ar: [
      'مشكلات متعلقة بسحب الدم',
      'مشكلات التواصل مع الطبيب/الممرض',
      'حجز موعد',
      'نقص دواء',
      'إجراءات متعلقة بالتشخيص',
      'تحاليل تخصصية',
      'مشكلات صرف الوصفة الطبية',
      'طلب تغيير/تأجيل موعد',
      'مشكلات باستقبال الحالة',
      'انتقال في المبنى',
      'الرعاية الطبية دون الأوراق',
      'الأوراق المرضية'
    ],
    en: [
      'Issues Related to Blood Draw',
      'Communication Issues with Doctor/Nurse',
      'Appointment Booking',
      'Medication Shortage',
      'Diagnostic Procedures',
      'Specialized Lab Tests',
      'Prescription Dispensing Issues',
      'Appointment Change/Postponement Request',
      'Patient Reception Issues',
      'In-Building Transfer',
      'Medical Care without Documentation',
      'Medical Certificates (Sick Notes)'
    ]
  },
  values: [220, 110, 80, 60, 40, 30, 20, 15, 10, 5, 5, 5]
};

// All departments from the database (finalData.sql) - 70 departments
const departmentComplaintsData = {
  labels: {
    ar: [
      'قسم المدير التنفيذي للمستشفى', 'قسم المشرحة', 'قسم التنسيق الطبي وأهلية العلاج', 'قسم خدمات الضيف',
      'قسم المراجعة الداخلية', 'قسم الشؤون القانونية', 'قسم سلاسل الإمداد', 'قسم الوقاية ومكافحة العدوى',
      'قسم الجودة والتميز المؤسسي', 'قسم التواصل والعلاقات العامة', 'قسم وحدة التخطيط والاستعداد للطوارئ',
      'قسم الشؤون المالية والإدارية', 'قسم الموارد البشرية', 'قسم الشؤون الأكاديمية والتدريب',
      'قسم المرافق والشؤون الهندسية', 'قسم الإدارة الإستراتيجية', 'قسم مكتب الخدمات التمريضية',
      'قسم الطب الباطني العام', 'قسم الجراحة العامة', 'قسم المسالك البولية', 'قسم جراحة اليوم الواحد',
      'قسم الأنف والأذن والحنجرة', 'قسم العظام', 'قسم جراحة المخ والأعصاب', 'قسم العمليات الجراحية',
      'قسم الطوارئ', 'قسم العناية المركزة', 'قسم الرعاية التنفسية', 'قسم التخدير', 'قسم الصيدلية',
      'قسم الخدمة الاجتماعية', 'قسم المختبرات الطبية', 'قسم بنك الدم', 'قسم الرعاية المنزلية',
      'قسم الأشعة', 'قسم التغذية العامة', 'قسم التغذية العلاجية', 'قسم التأهيل الطبي',
      'قسم التعقيم المركزي', 'قسم البصريات', 'قسم العيادات الخارجية', 'قسم التوعية الدينية والدعم الروحي',
      'قسم التثقيف والتوعية الصحية', 'قسم الصحة العامة', 'قسم الصحة المهنية', 'قسم مركز الأسنان',
      'قسم مركز حساسية القمح', 'قسم مركز الشيخوخة', 'قسم مركز الجلدية', 'قسم مكتب الخدمات الطبية',
      'قسم شؤون المرضى', 'قسم المعلومات الصحية', 'قسم مكتب الدخول', 'قسم الأمن السيبراني',
      'قسم تجربة المريض', 'قسم الصحة الرقمية', 'قسم الباطنة – أمراض الدم', 'قسم الباطنة – القلب',
      'قسم الباطنة – الصدرية', 'قسم الباطنة – الأمراض المعدية', 'قسم الباطنة – أمراض الكلية',
      'قسم الباطنة – العصبية', 'قسم الباطنة – الرعاية التلطيفية', 'قسم الباطنة – الغدد الصماء',
      'قسم الباطنة – الروماتيزم', 'قسم جراحة الأوعية الدموية', 'قسم وحدة العيون',
      'قسم جراحة الوجه والفكين', 'قسم إدارة القبول ودعم الوصول', 'قسم إدارة الأسرة'
    ],
    en: [
      'Office of the Hospital Executive Director', 'Morgue', 'Medical Coordination and Eligibility', 'Guest Services',
      'Internal Audit', 'Legal Affairs', 'Supply Chain', 'Infection Prevention and Control',
      'Quality and Institutional Excellence', 'Communications and Public Relations', 'Hospital Emergency Planning and Preparedness Unit (HEPPU)',
      'Finance and Administration', 'Human Resources', 'Academic Affairs and Training',
      'Facilities and Engineering', 'Strategic Management', 'Nursing Services Office',
      'General Internal Medicine', 'General Surgery', 'Urology', 'Same-Day Surgery',
      'Otorhinolaryngology', 'Orthopaedics', 'Neurosurgery', 'Surgical Procedures',
      'Emergency', 'Intensive Care', 'Respiratory Care', 'Anaesthesia', 'Pharmacy',
      'Social Services', 'Medical Laboratories', 'Blood Bank', 'Home Care',
      'Radiology', 'General Nutrition', 'Therapeutic Nutrition', 'Medical Rehabilitation',
      'Central Sterilization', 'Optometry', 'Outpatient Clinics', 'Religious Awareness and Spiritual Support',
      'Health Education and Awareness', 'Public Health', 'Occupational Health', 'Dental Centre',
      'Wheat Allergy Centre', 'Geriatric Centre', 'Dermatology Centre', 'Medical Services Office',
      'Patient Affairs', 'Health Informatics', 'Admissions Office', 'Cybersecurity',
      'Patient Experience', 'Digital Health', 'Internal Medicine – Hematology', 'Internal Medicine – Cardiology',
      'Internal Medicine – Pulmonary', 'Internal Medicine – Infectious Diseases', 'Internal Medicine – Nephrology',
      'Internal Medicine – Neurology', 'Internal Medicine – Palliative Care', 'Internal Medicine – Endocrinology',
      'Internal Medicine – Rheumatology', 'Vascular Surgery', 'Ophthalmology Unit',
      'Oral and Maxillofacial Surgery', 'Admissions Management and Access Support', 'Family Management'
    ]
  },
  values: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]
};

// ===================== Persistence (Database + LocalStorage) =====================
const STORAGE_KEY = 'report937:state:v1';
const API_BASE_URL = 'http://localhost:3001/api';

async function saveToDatabase() {
  try {
    console.log('💾 حفظ البيانات في قاعدة البيانات...');
    
    // تحضير بيانات الأقسام
    const departments = departmentComplaintsData.labels.ar.map((nameAr, index) => ({
      nameAr: nameAr,
      nameEn: departmentComplaintsData.labels.en[index] || nameAr,
      count: Number(departmentComplaintsData.values[index]) || 0
    }));
    
    // تحضير بيانات فئات الشكاوى
    const categories = complaintCategoriesData.labels.ar.map((nameAr, index) => ({
      nameAr: nameAr,
      nameEn: complaintCategoriesData.labels.en[index] || nameAr,
      count: Number(complaintCategoriesData.values[index]) || 0
    }));
    
    const payload = {
      departments: departments,
      categories: categories,
      totalReports: Number(mainCardData.totalReports) || 0
    };
    
    const response = await fetch(`${API_BASE_URL}/report-937/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ تم حفظ البيانات في قاعدة البيانات:', result);
    toast(currentLang === 'ar' ? 'تم الحفظ في قاعدة البيانات' : 'Saved to database');
    
    // حفظ نسخة احتياطية محلياً أيضاً
    saveToLocal();
    
  } catch (error) {
    console.error('❌ فشل في حفظ البيانات في قاعدة البيانات:', error);
    toast(currentLang === 'ar' ? 'فشل الحفظ في قاعدة البيانات - تم الحفظ محلياً' : 'Database save failed - saved locally', true);
    
    // احتياطي: حفظ محلياً
    saveToLocal();
  }
}

function saveToLocal() {
  try {
    const payload = {
      departments: departmentComplaintsData.values.map(n => Number(n) || 0),
      totalReports: Number(mainCardData.totalReports) || 0,
      ts: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.log('✅ Saved to localStorage.');
  } catch (e) {
    console.error('❌ Failed to save:', e);
  }
}

async function loadFromDatabase() {
  try {
    console.log('📊 تحميل البيانات من قاعدة البيانات...');
    
    const response = await fetch(`${API_BASE_URL}/report-937/data`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      const { departments, categories, totalReports } = result.data;
      
      // تحديث بيانات الأقسام
      if (departments && Array.isArray(departments)) {
        departmentComplaintsData.labels.ar = departments.map(d => d.department_name_ar);
        departmentComplaintsData.labels.en = departments.map(d => d.department_name_en || d.department_name_ar);
        departmentComplaintsData.values = departments.map(d => Number(d.complaint_count) || 0);
      }
      
      // تحديث بيانات فئات الشكاوى
      if (categories && Array.isArray(categories)) {
        complaintCategoriesData.labels.ar = categories.map(c => c.category_name_ar);
        complaintCategoriesData.labels.en = categories.map(c => c.category_name_en || c.category_name_ar);
        complaintCategoriesData.values = categories.map(c => Number(c.complaint_count) || 0);
      }
      
      // تحديث إجمالي البلاغات
      if (totalReports !== undefined) {
        mainCardData.totalReports = Number(totalReports) || 0;
      }
      
      console.log('✅ تم تحميل البيانات من قاعدة البيانات');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ فشل في تحميل البيانات من قاعدة البيانات:', error);
    return false;
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    if (Array.isArray(data.departments)) {
      const fixedLen = departmentComplaintsData.labels.ar.length;
      const vals = data.departments.slice(0, fixedLen);
      while (vals.length < fixedLen) vals.push(0);
      departmentComplaintsData.values = vals.map(n => Number(n) || 0);
    }
    if (typeof data.totalReports !== 'undefined') {
      mainCardData.totalReports = Number(data.totalReports) || 0;
    }
    console.log('ℹ️ Loaded from localStorage.');
    return true;
  } catch (e) {
    console.warn('⚠️ Could not load saved data:', e);
    return false;
  }
}

// ===================== UI helpers =====================
function getFont() { return currentLang === 'ar' ? 'Tajawal' : 'Merriweather'; }

function updateMainCard() {
  document.getElementById('totalReports').textContent = mainCardData.totalReports;
}

// Populate department dropdown with all 70 departments
function populateDepartmentDropdown() {
  const departmentOptions = document.getElementById('departmentOptions');
  if (!departmentOptions) return;

  // Clear existing options except "All" and "Add Section"
  const existingOptions = departmentOptions.querySelectorAll('.custom-select-option:not([data-value="all"]):not([data-value="add-section"])');
  existingOptions.forEach(option => option.remove());

  // Add all 70 departments
  departmentComplaintsData.labels.ar.forEach((deptName, index) => {
    const option = document.createElement('div');
    option.className = 'custom-select-option';
    option.setAttribute('data-value', deptName);
    option.setAttribute('data-ar', deptName);
    option.setAttribute('data-en', departmentComplaintsData.labels.en[index]);
    option.textContent = deptName;
    departmentOptions.appendChild(option);
  });

  // Ensure "Add Section" option exists
  ensureAddSectionOption();

  console.log('📋 Department dropdown populated with', departmentComplaintsData.labels.ar.length, 'departments');
}

// Function to ensure "Add Section" option exists in dropdown
function ensureAddSectionOption() {
  const departmentOptions = document.getElementById('departmentOptions');
  if (!departmentOptions) return;

  // Check if "Add Section" option already exists
  const existingAddOption = departmentOptions.querySelector('[data-value="add-section"]');
  if (existingAddOption) return;

  // Create divider
  const divider = document.createElement('div');
  divider.className = 'custom-select-divider';

  // Create "Add Section" option
  const addOption = document.createElement('div');
  addOption.className = 'custom-select-option add-section-option';
  addOption.setAttribute('data-value', 'add-section');
  addOption.setAttribute('data-ar', 'إضافة قسم جديد');
  addOption.setAttribute('data-en', 'Add New Section');
  
  // Add icon and text
  addOption.innerHTML = `
    <i class="fas fa-plus ml-2"></i>
    <span data-ar="إضافة قسم جديد" data-en="Add New Section">إضافة قسم جديد</span>
  `;

  // Append to dropdown
  departmentOptions.appendChild(divider);
  departmentOptions.appendChild(addOption);

  console.log('✅ "Add Section" option added to dropdown');
}

// Function to filter chart by selected department
function filterChartByDepartment(selectedValue) {
  if (!departmentComplaintsChart) return;
  
  console.log('🔍 Filtering chart by department:', selectedValue);
  
  if (selectedValue === 'all') {
    // Show all departments
    departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
    departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
    departmentComplaintsChart.options.plugins.title = { display: false };
  } else {
    // Show only selected department
    const filteredData = {
      labels: { ar: [], en: [] },
      values: []
    };
    
    // Find the selected department and show only that one
    for (let i = 0; i < departmentComplaintsData.labels.ar.length; i++) {
      if (departmentComplaintsData.labels.ar[i] === selectedValue || 
          departmentComplaintsData.labels.en[i] === selectedValue) {
        filteredData.labels.ar.push(departmentComplaintsData.labels.ar[i]);
        filteredData.labels.en.push(departmentComplaintsData.labels.en[i]);
        filteredData.values.push(departmentComplaintsData.values[i]);
        break;
      }
    }
    
    // If no department found, show all
    if (filteredData.labels.ar.length === 0) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.options.plugins.title = { display: false };
    } else {
      // Update chart with filtered data
      departmentComplaintsChart.data.labels = filteredData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = filteredData.values;
      departmentComplaintsChart.options.plugins.title = {
        display: true,
        text: currentLang === 'ar' ? 
          `البلاغات في: ${selectedValue}` : 
          `Complaints in: ${selectedValue}`,
        font: { size: 16, weight: 'bold' }
      };
    }
  }
  
  departmentComplaintsChart.update();
  console.log('✅ Chart filtered successfully');
  console.log('- Current labels:', departmentComplaintsChart.data.labels);
  console.log('- Current data:', departmentComplaintsChart.data.datasets[0].data);
  
  // Update the chart title to show filtering status
  const chartTitle = document.querySelector('#departmentComplaintsChart').closest('.chart-container').querySelector('h2');
  if (chartTitle && selectedValue !== 'all') {
    const originalTitle = chartTitle.getAttribute('data-original-title') || chartTitle.textContent;
    if (!chartTitle.getAttribute('data-original-title')) {
      chartTitle.setAttribute('data-original-title', originalTitle);
    }
    chartTitle.textContent = currentLang === 'ar' ? 
      `البلاغات في: ${selectedValue}` : 
      `Complaints in: ${selectedValue}`;
    chartTitle.style.color = '#059669'; // Green to indicate filtering
  } else if (chartTitle && selectedValue === 'all') {
    const originalTitle = chartTitle.getAttribute('data-original-title');
    if (originalTitle) {
      chartTitle.textContent = originalTitle;
      chartTitle.style.color = ''; // Reset color
    }
  }
}

// Function to reset department filter
function resetDepartmentFilter() {
  const departmentSelect = document.getElementById('departmentSelect');
  if (departmentSelect) {
    const span = departmentSelect.querySelector('span');
    span.textContent = currentLang === 'ar' ? 'اختر الإدارة/القسم' : 'Choose Department/Section';
    span.dataset.value = 'all';
    filterChartByDepartment('all');
  }
}

// Function to open add section modal
function openAddSectionModal() {
  const modal = document.getElementById('addSectionModal');
  if (modal) {
    modal.style.display = 'flex';
    // Reset form
    document.getElementById('addSectionForm').reset();
    // Focus on first input
    document.getElementById('sectionNameAr').focus();
  }
}

// Function to close add section modal
function closeAddSectionModal() {
  const modal = document.getElementById('addSectionModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to check server connection
async function checkServerConnection() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    return response.ok;
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    return false;
  }
}

// Function to save new section to database
async function saveNewSection() {
  const nameAr = document.getElementById('sectionNameAr').value.trim();
  const nameEn = document.getElementById('sectionNameEn').value.trim();
  const description = document.getElementById('sectionDescription').value.trim();
  
  // Validation
  if (!nameAr || !nameEn) {
    alert(currentLang === 'ar' ? 
      'يرجى إدخال اسم القسم باللغتين العربية والإنجليزية' : 
      'Please enter section name in both Arabic and English');
    return;
  }
  
  // Check if section already exists
  const existingSection = departmentComplaintsData.labels.ar.find(section => 
    section.toLowerCase() === nameAr.toLowerCase()
  );
  
  if (existingSection) {
    alert(currentLang === 'ar' ? 
      'هذا القسم موجود بالفعل' : 
      'This section already exists');
    return;
  }
  
  try {
    // Check server connection first
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      throw new Error('الخادم غير متاح. يرجى تشغيل الخادم أولاً.');
    }

    // Save to database via API
    const response = await fetch('http://localhost:3001/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        nameAr: nameAr,
        nameEn: nameEn,
        description: description
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Section saved to database:', result);
    
    // Add new section to local data
    departmentComplaintsData.labels.ar.push(nameAr);
    departmentComplaintsData.labels.en.push(nameEn);
    departmentComplaintsData.values.push(0); // Start with 0 complaints
    
    // Add to alias map
    deptAliasMap[nameAr] = [nameAr, nameEn, nameAr.toLowerCase(), nameEn.toLowerCase()];
    
    // Update dropdown
    populateDepartmentDropdown();
    
    // Update chart
    if (departmentComplaintsChart) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.update();
    }
    
    // Save to localStorage
    saveToLocal();
    
    // Close modal
    closeAddSectionModal();
    
    // Show success message
    toast(currentLang === 'ar' ? 
      `تم إضافة القسم "${nameAr}" بنجاح إلى قاعدة البيانات` : 
      `Section "${nameEn}" added successfully to database`);
    
    console.log('✅ New section added:', { nameAr, nameEn, description, dbId: result.id });
    
  } catch (error) {
    console.error('❌ Error saving section to database:', error);
    
    // Fallback: save locally if database fails
    console.log('🔄 Falling back to local storage...');
    
    // Add new section to local data
    departmentComplaintsData.labels.ar.push(nameAr);
    departmentComplaintsData.labels.en.push(nameEn);
    departmentComplaintsData.values.push(0);
    
    // Add to alias map
    deptAliasMap[nameAr] = [nameAr, nameEn, nameAr.toLowerCase(), nameEn.toLowerCase()];
    
    // Update dropdown and chart
    populateDepartmentDropdown();
    if (departmentComplaintsChart) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.update();
    }
    
    // Save to localStorage
    saveToLocal();
    
    // Close modal
    closeAddSectionModal();
    
    // Show warning message
    toast(currentLang === 'ar' ? 
      `تم إضافة القسم "${nameAr}" محلياً (لم يتم حفظه في قاعدة البيانات)` : 
      `Section "${nameEn}" added locally (not saved to database)`);
  }
}

// Function to setup modal event listeners
function setupModalEventListeners() {
  const modal = document.getElementById('addSectionModal');
  if (!modal) return;
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddSectionModal();
    }
  });
  
  // Close modal when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeAddSectionModal();
    }
  });
  
  // Handle form submission with Enter key
  const form = document.getElementById('addSectionForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveNewSection();
    });
  }
}

// Function to setup department search functionality
function setupDepartmentSearch() {
  const searchInput = document.getElementById('departmentSearch');
  const departmentSelect = document.getElementById('departmentSelect');
  const selectedDepartment = document.getElementById('selectedDepartment');
  const departmentOptions = document.getElementById('departmentOptions');
  
  if (!searchInput || !departmentSelect || !selectedDepartment || !departmentOptions) return;
  
  // Show/hide search input vs selected department text
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
  
  // Filter departments based on search input
  function filterDepartments(searchTerm) {
    const options = departmentOptions.querySelectorAll('.custom-select-option:not([data-value="all"]):not([data-value="add-section"])');
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
    
    // Show "Add Section" option if no matches and user typed something
    const addSectionOption = departmentOptions.querySelector('[data-value="add-section"]');
    if (addSectionOption) {
      if (searchLower !== '' && !hasMatches) {
        addSectionOption.style.display = 'block';
      } else if (searchLower === '') {
        addSectionOption.style.display = 'block';
      } else {
        addSectionOption.style.display = 'none';
      }
    }
  }
  
  // Handle search input events
  searchInput.addEventListener('input', (e) => {
    filterDepartments(e.target.value);
  });
  
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Find first visible option and select it
      const firstVisible = departmentOptions.querySelector('.custom-select-option[style*="block"]:not([style*="none"])');
      if (firstVisible) {
        firstVisible.click();
      }
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      filterDepartments('');
      toggleSearchMode(false);
    }
  });
  
  // Handle clicks on department select
  departmentSelect.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Toggle dropdown
    const isOpen = departmentOptions.classList.contains('open');
    if (!isOpen) {
      // Opening dropdown - switch to search mode
      toggleSearchMode(true);
      departmentOptions.classList.add('open');
      const icon = departmentSelect.querySelector('.fas');
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    } else {
      // Closing dropdown
      departmentOptions.classList.remove('open');
      toggleSearchMode(false);
      const icon = departmentSelect.querySelector('.fas');
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  });
  
  // Handle option selection
  departmentOptions.addEventListener('click', (event) => {
    // Check if clicked on department name (not action buttons)
    const departmentName = event.target.closest('.department-name');
    const actionButton = event.target.closest('.action-btn');
    
    if (actionButton) {
      // Don't handle selection if clicked on action buttons
      return;
    }
    
    const optionElement = event.target.closest('.custom-select-option');
    if (optionElement) {
      const selectedValue = optionElement.dataset.value;
      const selectedText = departmentName ? departmentName.textContent.trim() : optionElement.textContent.trim();
      
      // Update display
      selectedDepartment.textContent = selectedText;
      selectedDepartment.dataset.value = selectedValue;
      
      // Close dropdown and switch back to display mode
      departmentOptions.classList.remove('open');
      toggleSearchMode(false);
      searchInput.value = '';
      filterDepartments('');
      
      const icon = departmentSelect.querySelector('.fas');
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
      
      // Handle department filtering
      if (selectedValue === 'add-section') {
        openAddSectionModal();
      } else {
        filterChartByDepartment(selectedValue);
      }
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!departmentSelect.contains(e.target)) {
      departmentOptions.classList.remove('open');
      toggleSearchMode(false);
      searchInput.value = '';
      filterDepartments('');
      
      const icon = departmentSelect.querySelector('.fas');
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  });
}
// الخريطة الخاصة بمرادفات الأقسام
const deptAliasMap = {
  'قسم المدير التنفيذي للمستشفى': ['قسم المدير التنفيذي للمستشفى', 'Office of the Hospital Executive Director', 'executive director', 'مدير تنفيذي'],
  'قسم المشرحة': ['قسم المشرحة', 'Morgue', 'mortuary', 'مشرحة'],
  'قسم التنسيق الطبي وأهلية العلاج': ['قسم التنسيق الطبي وأهلية العلاج', 'Medical Coordination and Eligibility', 'medical coordination', 'تنسيق طبي'],
  'قسم خدمات الضيف': ['قسم خدمات الضيف', 'Guest Services', 'guest services', 'خدمات ضيف'],
  'قسم المراجعة الداخلية': ['قسم المراجعة الداخلية', 'Internal Audit', 'internal audit', 'مراجعة داخلية'],
  'قسم الشؤون القانونية': ['قسم الشؤون القانونية', 'Legal Affairs', 'legal affairs', 'شؤون قانونية'],
  'قسم سلاسل الإمداد': ['قسم سلاسل الإمداد', 'Supply Chain', 'supply chain', 'سلاسل إمداد'],
  'قسم الوقاية ومكافحة العدوى': ['قسم الوقاية ومكافحة العدوى', 'Infection Prevention and Control', 'infection control', 'وقاية عدوى'],
  'قسم الجودة والتميز المؤسسي': ['قسم الجودة والتميز المؤسسي', 'Quality and Institutional Excellence', 'quality', 'جودة'],
  'قسم التواصل والعلاقات العامة': ['قسم التواصل والعلاقات العامة', 'Communications and Public Relations', 'communications', 'تواصل'],
  'قسم وحدة التخطيط والاستعداد للطوارئ': ['قسم وحدة التخطيط والاستعداد للطوارئ', 'Hospital Emergency Planning and Preparedness Unit (HEPPU)', 'emergency planning', 'تخطيط طوارئ'],
  'قسم الشؤون المالية والإدارية': ['قسم الشؤون المالية والإدارية', 'Finance and Administration', 'finance', 'شؤون مالية'],
  'قسم الموارد البشرية': ['قسم الموارد البشرية', 'Human Resources', 'human resources', 'موارد بشرية'],
  'قسم الشؤون الأكاديمية والتدريب': ['قسم الشؤون الأكاديمية والتدريب', 'Academic Affairs and Training', 'academic affairs', 'شؤون أكاديمية'],
  'قسم المرافق والشؤون الهندسية': ['قسم المرافق والشؤون الهندسية', 'Facilities and Engineering', 'facilities', 'مرافق'],
  'قسم الإدارة الإستراتيجية': ['قسم الإدارة الإستراتيجية', 'Strategic Management', 'strategic management', 'إدارة إستراتيجية'],
  'قسم مكتب الخدمات التمريضية': ['قسم مكتب الخدمات التمريضية', 'Nursing Services Office', 'nursing services', 'خدمات تمريضية'],
  'قسم الطب الباطني العام': ['قسم الطب الباطني العام', 'General Internal Medicine', 'internal medicine', 'طب باطني'],
  'قسم الجراحة العامة': ['قسم الجراحة العامة', 'General Surgery', 'general surgery', 'جراحة عامة'],
  'قسم المسالك البولية': ['قسم المسالك البولية', 'Urology', 'urology', 'مسالك بولية'],
  'قسم جراحة اليوم الواحد': ['قسم جراحة اليوم الواحد', 'Same-Day Surgery', 'same day surgery', 'جراحة يوم واحد'],
  'قسم الأنف والأذن والحنجرة': ['قسم الأنف والأذن والحنجرة', 'Otorhinolaryngology', 'ENT', 'أنف أذن حنجرة'],
  'قسم العظام': ['قسم العظام', 'Orthopaedics', 'orthopaedics', 'عظام'],
  'قسم جراحة المخ والأعصاب': ['قسم جراحة المخ والأعصاب', 'Neurosurgery', 'neurosurgery', 'جراحة مخ أعصاب'],
  'قسم العمليات الجراحية': ['قسم العمليات الجراحية', 'Surgical Procedures', 'surgical procedures', 'عمليات جراحية'],
  'قسم الطوارئ': ['قسم الطوارئ', 'Emergency', 'emergency', 'طوارئ'],
  'قسم العناية المركزة': ['قسم العناية المركزة', 'Intensive Care', 'intensive care', 'عناية مركزة'],
  'قسم الرعاية التنفسية': ['قسم الرعاية التنفسية', 'Respiratory Care', 'respiratory care', 'رعاية تنفسية'],
  'قسم التخدير': ['قسم التخدير', 'Anaesthesia', 'anaesthesia', 'تخدير'],
  'قسم الصيدلية': ['قسم الصيدلية', 'Pharmacy', 'pharmacy', 'صيدلية'],
  'قسم الخدمة الاجتماعية': ['قسم الخدمة الاجتماعية', 'Social Services', 'social services', 'خدمة اجتماعية'],
  'قسم المختبرات الطبية': ['قسم المختبرات الطبية', 'Medical Laboratories', 'medical laboratories', 'مختبرات طبية'],
  'قسم بنك الدم': ['قسم بنك الدم', 'Blood Bank', 'blood bank', 'بنك دم'],
  'قسم الرعاية المنزلية': ['قسم الرعاية المنزلية', 'Home Care', 'home care', 'رعاية منزلية'],
  'قسم الأشعة': ['قسم الأشعة', 'Radiology', 'radiology', 'أشعة'],
  'قسم التغذية العامة': ['قسم التغذية العامة', 'General Nutrition', 'general nutrition', 'تغذية عامة'],
  'قسم التغذية العلاجية': ['قسم التغذية العلاجية', 'Therapeutic Nutrition', 'therapeutic nutrition', 'تغذية علاجية'],
  'قسم التأهيل الطبي': ['قسم التأهيل الطبي', 'Medical Rehabilitation', 'medical rehabilitation', 'تأهيل طبي'],
  'قسم التعقيم المركزي': ['قسم التعقيم المركزي', 'Central Sterilization', 'central sterilization', 'تعقيم مركزي'],
  'قسم البصريات': ['قسم البصريات', 'Optometry', 'optometry', 'بصريات'],
  'قسم العيادات الخارجية': ['قسم العيادات الخارجية', 'Outpatient Clinics', 'outpatient clinics', 'عيادات خارجية'],
  'قسم التوعية الدينية والدعم الروحي': ['قسم التوعية الدينية والدعم الروحي', 'Religious Awareness and Spiritual Support', 'religious awareness', 'توعية دينية'],
  'قسم التثقيف والتوعية الصحية': ['قسم التثقيف والتوعية الصحية', 'Health Education and Awareness', 'health education', 'تثقيف صحي'],
  'قسم الصحة العامة': ['قسم الصحة العامة', 'Public Health', 'public health', 'صحة عامة'],
  'قسم الصحة المهنية': ['قسم الصحة المهنية', 'Occupational Health', 'occupational health', 'صحة مهنية'],
  'قسم مركز الأسنان': ['قسم مركز الأسنان', 'Dental Centre', 'dental centre', 'مركز أسنان'],
  'قسم مركز حساسية القمح': ['قسم مركز حساسية القمح', 'Wheat Allergy Centre', 'wheat allergy centre', 'مركز حساسية قمح'],
  'قسم مركز الشيخوخة': ['قسم مركز الشيخوخة', 'Geriatric Centre', 'geriatric centre', 'مركز شيخوخة'],
  'قسم مركز الجلدية': ['قسم مركز الجلدية', 'Dermatology Centre', 'dermatology centre', 'مركز جلدية'],
  'قسم مكتب الخدمات الطبية': ['قسم مكتب الخدمات الطبية', 'Medical Services Office', 'medical services office', 'مكتب خدمات طبية'],
  'قسم شؤون المرضى': ['قسم شؤون المرضى', 'Patient Affairs', 'patient affairs', 'شؤون مرضى'],
  'قسم المعلومات الصحية': ['قسم المعلومات الصحية', 'Health Informatics', 'health informatics', 'معلومات صحية'],
  'قسم مكتب الدخول': ['قسم مكتب الدخول', 'Admissions Office', 'admissions office', 'مكتب دخول'],
  'قسم الأمن السيبراني': ['قسم الأمن السيبراني', 'Cybersecurity', 'cybersecurity', 'أمن سيبراني'],
  'قسم تجربة المريض': ['قسم تجربة المريض', 'Patient Experience', 'patient experience', 'تجربة مريض'],
  'قسم الصحة الرقمية': ['قسم الصحة الرقمية', 'Digital Health', 'digital health', 'صحة رقمية'],
  'قسم الباطنة – أمراض الدم': ['قسم الباطنة – أمراض الدم', 'Internal Medicine – Hematology', 'hematology', 'باطنة أمراض دم'],
  'قسم الباطنة – القلب': ['قسم الباطنة – القلب', 'Internal Medicine – Cardiology', 'cardiology', 'باطنة قلب'],
  'قسم الباطنة – الصدرية': ['قسم الباطنة – الصدرية', 'Internal Medicine – Pulmonary', 'pulmonary', 'باطنة صدرية'],
  'قسم الباطنة – الأمراض المعدية': ['قسم الباطنة – الأمراض المعدية', 'Internal Medicine – Infectious Diseases', 'infectious diseases', 'باطنة أمراض معدية'],
  'قسم الباطنة – أمراض الكلية': ['قسم الباطنة – أمراض الكلية', 'Internal Medicine – Nephrology', 'nephrology', 'باطنة أمراض كلية'],
  'قسم الباطنة – العصبية': ['قسم الباطنة – العصبية', 'Internal Medicine – Neurology', 'neurology', 'باطنة عصبية'],
  'قسم الباطنة – الرعاية التلطيفية': ['قسم الباطنة – الرعاية التلطيفية', 'Internal Medicine – Palliative Care', 'palliative care', 'باطنة رعاية تلطيفية'],
  'قسم الباطنة – الغدد الصماء': ['قسم الباطنة – الغدد الصماء', 'Internal Medicine – Endocrinology', 'endocrinology', 'باطنة غدد صماء'],
  'قسم الباطنة – الروماتيزم': ['قسم الباطنة – الروماتيزم', 'Internal Medicine – Rheumatology', 'rheumatology', 'باطنة روماتيزم'],
  'قسم جراحة الأوعية الدموية': ['قسم جراحة الأوعية الدموية', 'Vascular Surgery', 'vascular surgery', 'جراحة أوعية دموية'],
  'قسم وحدة العيون': ['قسم وحدة العيون', 'Ophthalmology Unit', 'ophthalmology', 'وحدة عيون'],
  'قسم جراحة الوجه والفكين': ['قسم جراحة الوجه والفكين', 'Oral and Maxillofacial Surgery', 'oral surgery', 'جراحة وجه فكين'],
  'قسم إدارة القبول ودعم الوصول': ['قسم إدارة القبول ودعم الوصول', 'Admissions Management and Access Support', 'admissions management', 'إدارة قبول'],
  'قسم إدارة الأسرة': ['قسم إدارة الأسرة', 'Family Management', 'family management', 'إدارة أسرة']
};

// مرادفات التصنيفات (مفاتيح عربية)
const categoryAliasMap = {
  'مشكلات متعلقة بسحب الدم': [
    'مشكلات متعلقة بسحب الدم', 'سحب الدم', 'مشاكل سحب الدم', 'blood draw', 'phlebotomy issues', 'withdrawal issues'
  ],
  'مشكلات التواصل مع الطبيب/الممرض': [
    'مشكلات التواصل مع الطبيب/الممرض', 'التواصل مع الطبيب', 'سوء التواصل', 'communication issues', 'doctor nurse communication'
  ],
  'حجز موعد': [
    'حجز موعد', 'الحجوزات', 'booking', 'appointment booking', 'appointment'
  ],
  'نقص دواء': [
    'نقص دواء', 'نفاد الدواء', 'انقطاع الدواء', 'medication shortage', 'drug shortage'
  ],
  'إجراءات متعلقة بالتشخيص': [
    'إجراءات متعلقة بالتشخيص', 'إجراءات التشخيص', 'فحوصات', 'diagnostic procedures', 'diagnostics'
  ],
  'تحاليل تخصصية': [
    'تحاليل تخصصية', 'تحاليل خاصة', 'اختبارات تخصصية', 'specialized tests', 'specialized lab tests'
  ],
  'مشكلات صرف الوصفة الطبية': [
    'مشكلات صرف الوصفة الطبية', 'مشاكل صرف الوصفة', 'صرف الوصفات', 'prescription dispensing issues', 'prescription problems'
  ],
  'طلب تغيير/تأجيل موعد': [
    'طلب تغيير/تأجيل موعد', 'تغيير موعد', 'تأجيل موعد', 'تعديل موعد', 'appointment change', 'postponement'
  ],
  'مشكلات باستقبال الحالة': [
    'مشكلات باستقبال الحالة', 'استقبال الحالة', 'استقبال المرضى', 'patient reception issues', 'reception issues'
  ],
  'انتقال في المبنى': [
    'انتقال في المبنى', 'نقل داخل المبنى', 'داخل المبنى', 'in-building transfer', 'internal transfer'
  ],
  'الرعاية الطبية دون الأوراق': [
    'الرعاية الطبية دون الأوراق', 'بدون أوراق', 'الرعاية الطبية بدون مستندات', 'medical care without documentation'
  ],
  'الأوراق المرضية': [
    'الأوراق المرضية', 'التقارير الطبية', 'إجازات مرضية', 'sick notes', 'medical certificates'
  ]
};

function createHorizontalBarChart(ctx, dataLabels, dataValues, chartName) {
  let maxX, stepSizeX;
  if (chartName === 'Complaint Categories by Scope') {
    maxX = 250; stepSizeX = 50;
  } else if (chartName === 'Total Registered Complaints in Departments - Sections') {
    // Dynamic scaling based on the maximum value in the data
    const maxValue = Math.max(...dataValues);
    if (maxValue <= 0) {
      // اترك Chart.js يختار المدى تلقائيًا
      maxX = undefined;
      stepSizeX = undefined;
    } else {
      maxX = Math.max(10, Math.ceil(maxValue / 5) * 5); // Round up to nearest 5, minimum 10
      stepSizeX = Math.max(2, Math.floor(maxX / 10)); // Dynamic step size, minimum 2
    }
  }

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dataLabels[currentLang],
      datasets: [{
        label: chartName,
        data: dataValues,
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 1,
        borderRadius: 5,
        barThickness: 8,
        categoryPercentage: 0.9,
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: false
        },
        tooltip: {
          rtl: currentLang === 'ar',
          bodyFont: { family: getFont() },
          titleFont: { family: getFont() }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ...(maxX !== undefined && { max: maxX }),
          ticks: {
            ...(stepSizeX !== undefined && { stepSize: stepSizeX }),
            font: { family: getFont(), size: 12, color: '#333' }
          },
          grid: { drawBorder: false, color: 'rgba(0,0,0,0.1)' },
          position: currentLang === 'ar' ? 'top' : 'bottom'
        },
          y: {
            ticks: { 
              font: { family: getFont(), size: 9, color: '#333' },
              padding: 4
            },
            grid: { display: false },
            reverse: currentLang === 'ar'
          }
      },

      // 👇 تمت إضافة مرادفات التصنيفات + التخزين + التوجيه مع تمرير التصنيف
      onClick: function (evt, elements) {
        if (!elements.length) return;
        const index = elements[0].index;

        // ——— الرسمـة اليمين: التصنيفات ———
        if (chartName === 'Complaint Categories by Scope') {
          const canonicalAr = complaintCategoriesData.labels.ar[index];
          const displayName = dataLabels[currentLang][index];
          localStorage.setItem('selectedCategory', displayName);
          localStorage.setItem('report937:selectedCategory', displayName);
          localStorage.setItem('report937:selectedCategoryAliases', JSON.stringify(categoryAliasMap[canonicalAr] || []));
          window.location.href = 'report-937-details.html?category=' + encodeURIComponent(displayName);
          return;
        }

        // ——— الرسمـة اليسار: الأقسام ———
        if (chartName === 'Total Registered Complaints in Departments - Sections') {
          const department = dataLabels[currentLang][index];

          // مرادفات القسم المختار (لو ما لقينا، نحط الاسم نفسه فقط)
          const aliases = deptAliasMap[department] || [department];

          // خزّن الاختيار للصفحة التفصيلية
          localStorage.setItem('selectedDepartment', department); // اختياري للتوافق
          localStorage.setItem('report937:selectedDepartment', department);
          localStorage.setItem('report937:selectedDepartmentAliases', JSON.stringify(aliases));

          // افتح صفحة التفاصيل مع تمرير القسم في الرابط
          window.location.href = 'report-937-details.html?department=' + encodeURIComponent(department);
          return;
        }
      }
    }
  });
}

function updateAllCharts() {
  const font = getFont();

  if (complaintCategoriesChart) {
    complaintCategoriesChart.data.labels = complaintCategoriesData.labels[currentLang];
    complaintCategoriesChart.data.datasets[0].data = complaintCategoriesData.values;
    complaintCategoriesChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    complaintCategoriesChart.options.plugins.tooltip.bodyFont.family = font;
    complaintCategoriesChart.options.plugins.tooltip.titleFont.family = font;
    complaintCategoriesChart.options.scales.x.ticks.font.family = font;
    complaintCategoriesChart.options.scales.y.ticks.font.family = font;
    complaintCategoriesChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
    complaintCategoriesChart.options.scales.y.reverse = currentLang === 'ar';
    complaintCategoriesChart.update();
  }

  if (departmentComplaintsChart) {
    departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
    departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
    departmentComplaintsChart.options.plugins.tooltip.rtl = currentLang === 'ar';
    departmentComplaintsChart.options.plugins.tooltip.bodyFont.family = font;
    departmentComplaintsChart.options.plugins.tooltip.titleFont.family = font;
    departmentComplaintsChart.options.scales.x.ticks.font.family = font;
    departmentComplaintsChart.options.scales.y.ticks.font.family = font;
    departmentComplaintsChart.options.scales.x.position = currentLang === 'ar' ? 'top' : 'bottom';
    departmentComplaintsChart.options.scales.y.reverse = currentLang === 'ar';
    departmentComplaintsChart.update();
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.classList.remove('lang-ar', 'lang-en');
  document.body.classList.add(lang === 'ar' ? 'lang-ar' : 'lang-en');

  document.querySelectorAll('[data-ar], [data-en]').forEach(el => {
    const textContent = el.getAttribute(`data-${lang}`);
    if (textContent) el.textContent = textContent;
  });

  const langTextSpan = document.getElementById('langText');
  if (langTextSpan) langTextSpan.textContent = lang === 'ar' ? 'العربية | English' : 'English | العربية';

  const dropdowns = ['day', 'week', 'month', 'quarter', 'department'];
  dropdowns.forEach(id => {
    const span = document.getElementById(`selected${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (span) {
      const selectedValue = span.dataset.value;
      const optionElement = document.querySelector(`#${id}Options .custom-select-option[data-value="${selectedValue}"]`);
      if (optionElement) {
        span.textContent = optionElement.getAttribute(`data-${lang}`);
      } else {
        if (id === 'day') span.textContent = lang === 'ar' ? 'اختر اليوم' : 'Choose Day';
        else if (id === 'week') span.textContent = lang === 'ar' ? 'اختر الأسبوع' : 'Choose Week';
        else if (id === 'month') span.textContent = lang === 'ar' ? 'اختر الشهر' : 'Choose Month';
        else if (id === 'quarter') span.textContent = lang === 'ar' ? 'اختر الربع' : 'Choose Quarter';
        else if (id === 'department') span.textContent = lang === 'ar' ? 'اختر الإدارة/القسم' : 'Choose Department/Section';
      }
    }
  });

  updateAllCharts();
}

// ===================== Excel: إجمالي البلاغات لكل قسم من الملفات =====================

// إشعار بسيط
function toast(msg, isError = false) {
  const old = document.querySelector('.toast-937'); if (old) old.remove();
  const t = document.createElement('div');
  t.className = `toast-937 fixed bottom-6 ${currentLang === 'ar' ? 'right-6' : 'left-6'} z-50 px-4 py-3 rounded-lg shadow-lg text-white`;
  t.style.background = isError ? '#dc2626' : '#16a34a';
  t.style.fontFamily = getFont();
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('opacity-0'), 2500);
  setTimeout(() => t.remove(), 3000);
}

// تطبيع نص عربي/إنجليزي خفيف
const AR_DIACRITICS = /[\u064B-\u0652]/g;
function normalize(s) {
  return String(s || '').replace(AR_DIACRITICS, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// قاموس مرادفات الأقسام (ربط أسماء الملفات/التقارير بالأقسام المعروضة)
const deptSynonyms = [
  { keys: ['information center', 'info center', 'مركز المعلومات'], canonical: 'مركز المعلومات' },
  { keys: ['appointments', 'appointment', 'قسم المواعيد'], canonical: 'قسم المواعيد' },
  { keys: ['emergency', 'er', 'قسم الطوارئ'], canonical: 'قسم الطوارئ' },
  { keys: ['outpatient', 'clinics', 'قسم العيادات', 'العيادات'], canonical: 'قسم العيادات' },
  { keys: ['radiology', 'قسم الأشعة', 'الاشعة', 'radiology department'], canonical: 'قسم الأشعة' },
  { keys: ['lab', 'laboratory', 'قسم المختبر', 'المختبر'], canonical: 'قسم المختبر' },
  { keys: ['pharmacy', 'قسم الصيدلية', 'الصيدلية'], canonical: 'قسم الصيدلية' },
  { keys: ['nutrition', 'قسم التغذية', 'التغذية'], canonical: 'قسم التغذية' },
  { keys: ['physiotherapy', 'physical therapy', 'العلاج الطبيعي', 'قسم العلاج الطبيعي'], canonical: 'قسم العلاج الطبيعي' },
  { keys: ['dentistry', 'dental', 'الأسنان', 'قسم الأسنان'], canonical: 'قسم الأسنان' },

  // مرادفات لأسماء ملفاتك الشائعة
  { keys: ['hospitals-outpatient', 'outpatient department', 'hospitals outpatient'], canonical: 'قسم العيادات' },
  { keys: ['hospitals-emergency', 'emergency department', 'hospitals emergency'], canonical: 'قسم الطوارئ' },
  { keys: ['hospitals-inpatient', 'inpatient', 'ward', 'wards'], canonical: 'قسم العيادات' },        // تقريبي
  { keys: ['home health care', 'home health', 'home care'], canonical: 'قسم العلاج الطبيعي' },  // تقريبي
  { keys: ['blood bank', 'bloodbank'], canonical: 'قسم المختبر' }          // تقريبي
];

function fixedDeptList() {
  return departmentComplaintsData.labels.ar.slice();
}

function extractDeptFromReportFor(text) {
  if (!text) return '';
  const lower = String(text).toLowerCase();
  const idx = lower.indexOf('report for:');
  if (idx === -1) return '';
  const after = text.substring(idx + 'report for:'.length).trim();
  return after.split('/')[0].trim();
}

// إيجاد قيمة الإجمالي من خلايا الجدول
function findTotalFromAOA(aoa) {
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < (aoa[r] || []).length; c++) {
      const cell = aoa[r][c];
      if (typeof cell === 'string' && cell.toLowerCase().includes('mean')) {
        const inSame = Number(String(cell).replace(/.*mean[^0-9.-]*([0-9.]+).*/i, '$1'));
        if (!isNaN(inSame) && isFinite(inSame)) return inSame;
        const right = aoa[r]?.[c + 1];
        const down = aoa[r + 1]?.[c];
        const diag = aoa[r + 1]?.[c + 1];
        for (const v of [right, down, diag]) {
          const num = Number(String(v).toString().replace(/[^\d.]/g, ''));
          if (!isNaN(num) && isFinite(num)) return num;
        }
      }
    }
  }
  for (let r = 0; r < Math.min(10, aoa.length); r++) {
    for (let c = 0; c < (aoa[r] || []).length; c++) {
      const num = Number(String(aoa[r][c]).toString().replace(/[^\d.]/g, ''));
      if (!isNaN(num) && isFinite(num)) return num;
    }
  }
  return null;
}

function mapDept(deptRaw) {
  const n = normalize(deptRaw);
  if (!n) return null;
  for (const entry of deptSynonyms) {
    for (const k of entry.keys) {
      if (n.includes(normalize(k))) return entry.canonical;
    }
  }
  return null;
}

// قراءة ملف إكسل واحد -> { deptCanon, totalVal }
function readExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof XLSX === 'undefined') {
          console.error('XLSX missing.');
          toast(currentLang === 'ar' ? 'مكتبة Excel غير محمّلة' : 'XLSX not loaded', true);
          return resolve({ deptCanon: null, totalVal: null, rows: [] });

        }
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // ✅ كل الصفوف ككائنات


        let deptRaw = '';
        for (const row of aoa) {
          for (const cell of row) {
            if (typeof cell === 'string' && cell.toLowerCase().includes('report for:')) {
              deptRaw = extractDeptFromReportFor(cell);
              break;
            }
          }
          if (deptRaw) break;
        }
        if (!deptRaw) deptRaw = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();

        const deptCanon = mapDept(deptRaw);
        const totalVal = findTotalFromAOA(aoa);

        if (!deptCanon || totalVal == null) {
          console.warn('تعذّر ربط القسم أو قراءة القيمة:', file.name, { deptRaw, deptCanon, totalVal });
          return resolve({ deptCanon: null, totalVal: null, rows });

        }
        resolve({ deptCanon, totalVal: Number(totalVal), rows });

      } catch (err) {
        console.error('فشل قراءة الملف:', file.name, err);
        resolve(null);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// نحاول اكتشاف اسم عمود القسم المعني داخل الصفوف
function findDeptKeyFromRows(rows) {
  if (!rows || !rows.length) return null;
  // أولوية للعمود "القسم المعني" كما طلب المستخدم
  const cands = ['القسم المعني', 'القسم', 'الإدارة', 'الادارة', 'القسم/الإدارة', 'department', 'section', 'unit', 'dept', 'relevant department'];
  const keys = Object.keys(rows[0] || {});
  
  // البحث أولاً عن "القسم المعني" تحديداً
  for (const k of keys) {
    const nk = normalize(k);
    if (nk.includes('القسم المعني') || nk.includes('relevant department')) {
      console.log('✅ Found "القسم المعني" column:', k);
      return k;
    }
  }
  
  // إذا لم نجد "القسم المعني"، نبحث عن الأعمدة الأخرى
  for (const k of keys) {
    const nk = normalize(k);
    if (cands.some(c => nk.includes(normalize(c)))) {
      console.log('📋 Found department column:', k);
      return k;
    }
  }
  return null;
}

// نجمع عدد الصفوف لكل قسم اعتماداً على عمود القسم المعني
function aggregateByDeptFromRows(rows) {
  const out = new Map();
  const deptKey = findDeptKeyFromRows(rows);
  
  console.log('🔍 Aggregating departments from rows...');
  console.log('- Department column found:', deptKey);
  console.log('- Total rows to process:', rows.length);
  
  for (const r of rows) {
    let deptName = deptKey ? r[deptKey] : '';
    if (!deptName || deptName.toString().trim() === '') continue;
    
    // تطابق اسم القسم مع الأقسام المحددة مسبقاً
    let canon = mapDept(deptName);
    if (!canon && deptName) { 
      canon = deptName; // لو ما قدرنا نطابق، خليه كما هو
    }
    if (!canon) continue;
    
    // زيادة العداد لكل قسم
    const currentCount = out.get(canon) || 0;
    out.set(canon, currentCount + 1);
    
    // طباعة تفاصيل للتصحيح
    if (currentCount === 0) {
      console.log(`📊 New department found: "${canon}" (from "${deptName}")`);
    }
  }
  
  console.log('📈 Final department counts:', Object.fromEntries(out));
  return out; // Map(dept -> count)
}

// نحاول اكتشاف اسم عمود التصنيف داخل الصفوف
function findCategoryKeyFromRows(rows) {
  if (!rows || !rows.length) return null;
  const cands = ['تصنيف البلاغ', 'التصنيف', 'تصنيف', 'نوع البلاغ', 'category', 'complaint category', 'complaint type', 'type'];
  const keys = Object.keys(rows[0] || {});
  for (const k of keys) {
    const nk = normalize(k);
    if (cands.some(c => nk.includes(normalize(c)))) return k;
  }
  return null;
}

// مطابقة التصنيف إلى الاسم القانوني (Arabic key)
function mapCategory(catRaw) {
  const n = normalize(catRaw);
  if (!n) return null;
  for (const [canonicalAr, aliases] of Object.entries(categoryAliasMap)) {
    for (const a of aliases) {
      if (n.includes(normalize(a))) return canonicalAr;
    }
  }
  for (const ar of complaintCategoriesData.labels.ar) {
    if (n.includes(normalize(ar))) return ar;
  }
  for (const en of complaintCategoriesData.labels.en) {
    if (n.includes(normalize(en))) {
      const idx = complaintCategoriesData.labels.en.indexOf(en);
      return complaintCategoriesData.labels.ar[idx];
    }
  }
  return null;
}

function findCategoryInRow(row) {
  for (const v of Object.values(row)) {
    const m = mapCategory(v);
    if (m) return m;
  }
  return null;
}

// استيراد عدة ملفات وتجميع "قيمة الإجمالي" لكل قسم
async function importExcelFiles(files) {
  const agg = new Map(); // dept -> sum(totalVal)
  let totalSum = 0;
  const allRows = [];    // ✅ نخزن كل الصفوف لصفحة التفاصيل
  const catAgg = new Map(); // category(ar) -> count

  for (const f of files) {
    const rec = await readExcelFile(f);
    if (!rec) continue;

    // خزن الصفوف
    if (Array.isArray(rec.rows)) allRows.push(...rec.rows);

    if (rec.deptCanon && Number.isFinite(rec.totalVal)) {
      // السلوك القديم (لو لقينا report for/mean)
      agg.set(rec.deptCanon, (agg.get(rec.deptCanon) || 0) + rec.totalVal);
      totalSum += rec.totalVal;
    } else if (rec.rows && rec.rows.length) {
      // ✅ fallback: احسب من الصفوف لكل قسم
      const m = aggregateByDeptFromRows(rec.rows);
      if (m.size) {
        for (const [dept, cnt] of m.entries()) {
          agg.set(dept, (agg.get(dept) || 0) + cnt);
          totalSum += cnt;
        }
      } else if (rec.deptCanon) {
        // ما قدرنا نكتشف عمود القسم، انسب كامل الملف للقسم المستخرج من الاسم
        const cnt = rec.rows.length;
        agg.set(rec.deptCanon, (agg.get(rec.deptCanon) || 0) + cnt);
        totalSum += cnt;
      }
    }

    // تجميع حسب التصنيف من صفوف هذا الملف
    if (rec.rows && rec.rows.length) {
      const catKey = findCategoryKeyFromRows(rec.rows);
      for (const r of rec.rows) {
        const raw = catKey ? r[catKey] : null;
        let canon = mapCategory(raw);
        if (!canon && !catKey) {
          canon = findCategoryInRow(r);
        }
        if (canon) catAgg.set(canon, (catAgg.get(canon) || 0) + 1);
      }
    }
  }

  // تعبئة القيم وفق ترتيب الأقسام الثابت
  const fixed = fixedDeptList();
  departmentComplaintsData.values = fixed.map(name => {
    const v = agg.get(name) || 0;
    return Number.isFinite(v) ? Number(v) : 0;
  });

  // إجمالي البلاغات (مجموع كل الأقسام)
  mainCardData.totalReports = Number(totalSum || 0);

  // تعبئة قيم التصنيفات وفق الترتيب الثابت (بالعربية)
  const catOrder = complaintCategoriesData.labels.ar;
  complaintCategoriesData.values = catOrder.map(name => Number(catAgg.get(name) || 0));

  // ✅ حفظ الصفوف لصفحة التفاصيل
  try { localStorage.setItem('report937:rows:v1', JSON.stringify(allRows)); } catch { }

  updateMainCard();
  updateAllCharts();
  saveToDatabase();
  
  // Reset department filter after importing new data
  resetDepartmentFilter();
  
  toast(currentLang === 'ar' ? 'تم استيراد الملفات وتحديث البيانات' : 'Files imported and data updated');
}


// دالة تصدير إلى Excel
async function exportToExcel() {
  try {
    // انتظري تحميل مكتبة XLSX
    if (typeof XLSX === 'undefined') {
      toast(currentLang === 'ar' ? 'مكتبة Excel غير محمّلة' : 'Excel library not loaded', true);
      return;
    }

    // محاولة تحديث البيانات من قاعدة البيانات أولاً
    console.log('🔄 محاولة تحديث البيانات من قاعدة البيانات...');
    const dbUpdated = await loadFromDatabase();
    if (!dbUpdated) {
      console.log('📱 استخدام البيانات المحلية كـ fallback...');
      loadFromLocal();
    }

    // إنشاء مصنف جديد
    const wb = XLSX.utils.book_new();
    
    // اسم الملف
    const fileName = 'Report-937.xlsx';
    
    // ورقة الملخص (Summary) مع ذكر كل قسم وعدد البلاغات
    const totalDepartments = departmentComplaintsData.labels.ar.length;
    const departmentsWithComplaints = departmentComplaintsData.values.filter(val => val > 0).length;
    const totalCategories = complaintCategoriesData.labels.ar.length;
    const categoriesWithData = complaintCategoriesData.values.filter(val => val > 0).length;
    
    const summaryData = [
      ['Report 937 Summary', 'ملخص تقرير 937'],
      ['', ''],
      ['Total 937 Reports', mainCardData.totalReports],
      ['إجمالي البلاغات 937', mainCardData.totalReports],
      ['', ''],
      ['Total Departments', totalDepartments],
      ['إجمالي الأقسام', totalDepartments],
      ['Departments with Complaints', departmentsWithComplaints],
      ['الأقسام التي لديها بلاغات', departmentsWithComplaints],
      ['', ''],
      ['Total Categories', totalCategories],
      ['إجمالي التصنيفات', totalCategories],
      ['Categories with Data', categoriesWithData],
      ['التصنيفات التي لديها بيانات', categoriesWithData],
      ['', ''],
      ['=== تفاصيل الأقسام والبلاغات ===', '=== Department Details and Complaints ==='],
      ['', '']
    ];
    
    // إضافة كل قسم وعدد البلاغات في الملخص
    for (let i = 0; i < departmentComplaintsData.labels.ar.length; i++) {
      const deptAr = departmentComplaintsData.labels.ar[i];
      const value = departmentComplaintsData.values[i];
      const departmentNumber = i + 1;
      
      summaryData.push([
        `${departmentNumber}. ${deptAr}`,
        `عدد البلاغات: ${value}`
      ]);
    }
    
    summaryData.push(['', '']);
    summaryData.push(['Report Date', new Date().toLocaleDateString()]);
    summaryData.push(['تاريخ التقرير', new Date().toLocaleDateString('ar-SA')]);
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    
    // ورقة التصنيفات (Categories) مع معلومات مفصلة
    const categoriesData = [];
    categoriesData.push(['Category (Arabic)', 'Category (English)', 'Count', 'Percentage', 'Status']);
    
    for (let i = 0; i < complaintCategoriesData.labels.ar.length; i++) {
      const categoryAr = complaintCategoriesData.labels.ar[i];
      const categoryEn = complaintCategoriesData.labels.en[i];
      const value = complaintCategoriesData.values[i];
      
      // حساب النسبة المئوية
      const percentage = mainCardData.totalReports > 0 ? 
        ((value / mainCardData.totalReports) * 100).toFixed(1) + '%' : '0%';
      
      // حالة التصنيف
      let status = '';
      if (value === 0) {
        status = 'No complaints';
      } else if (value < 10) {
        status = 'Low';
      } else if (value < 50) {
        status = 'Medium';
      } else {
        status = 'High';
      }
      
      categoriesData.push([categoryAr, categoryEn, value, percentage, status]);
    }
    
    const categoriesWS = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(wb, categoriesWS, 'Categories');
    
    // ورقة الأقسام (Departments) مع ذكر كل قسم وعدد البلاغات
    const departmentsData = [];
    departmentsData.push(['رقم القسم', 'اسم القسم (عربي)', 'اسم القسم (إنجليزي)', 'عدد البلاغات', 'حالة البلاغات']);
    
    for (let i = 0; i < departmentComplaintsData.labels.ar.length; i++) {
      const deptAr = departmentComplaintsData.labels.ar[i];
      const deptEn = departmentComplaintsData.labels.en[i];
      const value = departmentComplaintsData.values[i];
      const departmentNumber = i + 1;
      
      // حالة البلاغات لكل قسم
      let status = '';
      if (value === 0) {
        status = 'لا توجد بلاغات';
      } else if (value === 1) {
        status = 'بلاغ واحد';
      } else if (value <= 5) {
        status = 'بلاغات قليلة';
      } else if (value <= 20) {
        status = 'بلاغات متوسطة';
      } else {
        status = 'بلاغات كثيرة';
      }
      
      departmentsData.push([departmentNumber, deptAr, deptEn, value, status]);
    }
    
    const departmentsWS = XLSX.utils.aoa_to_sheet(departmentsData);
    XLSX.utils.book_append_sheet(wb, departmentsWS, 'Departments');
    
    // تصدير الملف
    XLSX.writeFile(wb, fileName);
    
    toast(currentLang === 'ar' ? 'تم تنزيل ملف Excel بنجاح' : 'Excel file downloaded successfully');
    
  } catch (e) {
    console.error('Error creating Excel:', e);
    toast(currentLang === 'ar' ? 'فشل إنشاء ملف Excel' : 'Failed to create Excel file', true);
  }
}




// ===================== DOM Ready =====================
document.addEventListener('DOMContentLoaded', async () => {
  const langToggleBtn = document.getElementById('langToggle');

  // محاولة تحميل البيانات من قاعدة البيانات أولاً
  const dbLoaded = await loadFromDatabase();
  if (!dbLoaded) {
    // احتياطي: تحميل من localStorage
    loadFromLocal();
  }

  // Populate department dropdown with all 70 departments
  populateDepartmentDropdown();
  
  // Ensure "Add Section" option is available
  ensureAddSectionOption();

  // Init card + charts
  updateMainCard();

  const complaintCategoriesCtx = document.getElementById('complaintCategoriesChart');
  if (complaintCategoriesCtx) {
    complaintCategoriesChart = createHorizontalBarChart(
      complaintCategoriesCtx,
      complaintCategoriesData.labels,
      complaintCategoriesData.values,
      'Complaint Categories by Scope'
    );
  }

  const departmentComplaintsCtx = document.getElementById('departmentComplaintsChart');
  if (departmentComplaintsCtx) {
    departmentComplaintsChart = createHorizontalBarChart(
  departmentComplaintsCtx,
  departmentComplaintsData.labels,
  departmentComplaintsData.values,
  'Total Registered Complaints in Departments - Sections'
);



  }

  applyLanguage(currentLang);
  
  // Add modal event listeners
  setupModalEventListeners();
  
  // Setup department search functionality
  setupDepartmentSearch();

  // تفعيل الروابط الجانبية (اختياري)
  document.querySelectorAll('.sidebar-menu .menu-link').forEach(link => {
    link.parentElement.classList.remove('active');
    if (link.getAttribute('href') === 'report-937.html') link.parentElement.classList.add('active');
  });

  // قوائم منسدلة (شكل فقط) - استثناء department لأنه يستخدم البحث
  function setupDropdown(selectId, optionsId) {
    const select = document.getElementById(selectId);
    const options = document.getElementById(optionsId);
    if (select && options) {
      select.addEventListener('click', () => {
        options.classList.toggle('open');
        const icon = select.querySelector('.fas');
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
      });

      options.addEventListener('click', (event) => {
        if (event.target.classList.contains('custom-select-option')) {
          const selectedValue = event.target.dataset.value;
          const selectedText = event.target.textContent;
          select.querySelector('span').textContent = selectedText;
          select.querySelector('span').dataset.value = selectedValue;
          options.classList.remove('open');
          const icon = select.querySelector('.fas');
          icon.classList.remove('fa-chevron-up');
          icon.classList.add('fa-chevron-down');
        }
      });
    }
  }
  // Setup dropdowns for day, week, month, quarter only (department uses search functionality)
  ['day', 'week', 'month', 'quarter'].forEach(k => setupDropdown(`${k}Select`, `${k}Options`));

  // لغة
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => applyLanguage(currentLang === 'ar' ? 'en' : 'ar'));
  }

  // تصدير PDF - تم حذفه
  
  // تصدير Excel - ربط الحدث فقط إذا كان الزر موجوداً (احترام الصلاحيات)
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', exportToExcel);
    console.log('✅ Excel export button found and event listener attached');
  } else {
    console.log('ℹ️ Excel export button not found (permission not granted)');
  }

  // تصدير PDF البسيط - ربط الحدث فقط إذا كان الزر موجوداً
  const exportReportBtn = document.getElementById('exportReportBtn');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.disabled = true;
      const old = btn.innerHTML;
      btn.innerHTML = '...جاري التصدير';
      try {
        await export937ToPDF();
      } catch (err) {
        console.error(err);
        alert('تعذّر تصدير تقرير 937');
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    });
    console.log('✅ PDF export button found and event listener attached');
  } else {
    console.log('ℹ️ PDF export button not found (permission not granted)');
  }

  // استيراد ملفات
  const importExcelBtn = document.getElementById('importExcelBtn');
  const excelInput = document.getElementById('excelInput');
  if (importExcelBtn && excelInput) {
    importExcelBtn.addEventListener('click', () => excelInput.click());
    excelInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      
      // تحقق من نوع الملف - إذا كان ملف شكاوى
      const file = files[0];
      const fileName = file.name.toLowerCase();
      
      if (fileName.includes('complaint') || fileName.includes('بلاغ ') || 
          fileName.includes('ticket') || fileName.includes('تذكرة')) {
        // استيراد شكاوى
        await importComplaintsFromExcel(file);
      } else {
        // استيراد عادي للتقارير
        await importExcelFiles(files);
      }
      
      e.target.value = '';
    });
  }

  // زر حفظ محلي
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  if (saveLocalBtn) saveLocalBtn.addEventListener('click', saveToLocal);

  // زر حفظ في قاعدة البيانات
  const saveDatabaseBtn = document.getElementById('saveDatabaseBtn');
  if (saveDatabaseBtn) saveDatabaseBtn.addEventListener('click', saveToDatabase);

  // زر تشغيل الخادم
  const startServerBtn = document.getElementById('startServerBtn');
  if (startServerBtn) {
    startServerBtn.addEventListener('click', async () => {
      try {
        // فتح ملف تشغيل الخادم
        window.open('start-backend.bat', '_blank');
        
        // انتظار قليل ثم اختبار الاتصال
        setTimeout(async () => {
          const isConnected = await checkServerConnection();
          if (isConnected) {
            toast(currentLang === 'ar' ? 'تم تشغيل الخادم بنجاح!' : 'Server started successfully!');
          } else {
            toast(currentLang === 'ar' ? 'الخادم لم يبدأ بعد. انتظر قليلاً ثم حاول مرة أخرى.' : 'Server not ready yet. Please wait and try again.', true);
          }
        }, 3000);
      } catch (error) {
        console.error('Error starting server:', error);
        toast(currentLang === 'ar' ? 'فشل في تشغيل الخادم' : 'Failed to start server', true);
      }
    });
  }

  // Check and show export button based on permissions
  checkExportPermission();
  
  // اربط زر PDF الاحترافي
  bindProPdfButton();
});

// Simple permission checking for export buttons
async function checkExportPermission() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = Number(user?.RoleID || 0);
    
    // Super Admin has all permissions
    if (roleId === 1) {
      const exportExcelBtn = document.getElementById('exportExcelBtn');
      const exportProPdfBtn = document.getElementById('exportProPdfBtn');
      if (exportExcelBtn) {
        exportExcelBtn.style.display = '';
        console.log('[REPORT-937] Super Admin - showing Excel export button');
      }
      if (exportProPdfBtn) {
        exportProPdfBtn.style.display = '';
        console.log('[REPORT-937] Super Admin - showing Pro PDF export button');
      }
      return;
    }

    // Check for reports_export permission
    const empId = user?.EmployeeID || user?.employeeId || user?.id;
    if (!empId) return;

    // Check cached permissions
    const cacheKey = `userPermissions:${empId}`;
    const cached = localStorage.getItem(cacheKey);
    let perms = [];
    if (cached) {
      try {
        perms = JSON.parse(cached);
      } catch (e) {
        console.warn('[REPORT-937] Failed to parse cached permissions:', e);
      }
    }

    // Check permission flags
    const flags = JSON.parse(localStorage.getItem('permissionsFlags') || '{}');
    
    const hasPermission = perms.includes('reports_export') || flags.reports_export === true;
    
    // Handle Excel export button
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
      if (hasPermission) {
        exportExcelBtn.style.display = '';
        console.log('[REPORT-937] Permission granted - showing Excel export button');
      } else {
        exportExcelBtn.style.display = 'none';
        console.log('[REPORT-937] Permission denied - hiding Excel export button');
      }
    }
    
    // Handle Pro PDF export button
    const exportProPdfBtn = document.getElementById('exportProPdfBtn');
    if (exportProPdfBtn) {
      if (hasPermission) {
        exportProPdfBtn.style.display = '';
        console.log('[REPORT-937] Permission granted - showing Pro PDF export button');
      } else {
        exportProPdfBtn.style.display = 'none';
        console.log('[REPORT-937] Permission denied - hiding Pro PDF export button');
      }
    }
  } catch (error) {
    console.error('[REPORT-937] Error checking export permission:', error);
  }
}

// دالة تعديل قسم
function editDepartment(id, nameAr, nameEn, description) {
  console.log('✏️ Editing department:', { id, nameAr, nameEn, description });
  
  // Fill the edit modal with current data
  document.getElementById('editSectionId').value = id;
  document.getElementById('editSectionNameAr').value = nameAr;
  document.getElementById('editSectionNameEn').value = nameEn;
  document.getElementById('editSectionDescription').value = description || '';
  
  // Show the edit modal
  document.getElementById('editSectionModal').style.display = 'flex';
}

// دالة حذف قسم
async function deleteDepartment(id, name) {
  console.log('🗑️ Deleting department:', { id, name });
  
  const confirmed = confirm(
    currentLang === 'ar' ? 
    `هل أنت متأكد من حذف القسم "${name}"؟\n\nسيتم حذف القسم نهائياً من قاعدة البيانات.` :
    `Are you sure you want to delete the department "${name}"?\n\nThis action cannot be undone.`
  );
  
  if (!confirmed) return;
  
  try {
    // Check server connection first
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      throw new Error('الخادم غير متاح. يرجى تشغيل الخادم أولاً.');
    }

    const response = await fetch(`http://localhost:3001/api/departments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في حذف القسم');
    }
    
    console.log('✅ Department deleted successfully');
    
    // Show success message
    alert(currentLang === 'ar' ? 
      'تم حذف القسم بنجاح!' : 
      'Department deleted successfully!'
    );
    
    // Reload departments from database
    await loadDepartmentsFromDatabase();
    await populateDepartmentDropdown();
    
    // Update chart
    if (departmentComplaintsChart) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.update();
    }
    
  } catch (error) {
    console.error('❌ Error deleting department:', error);
    alert(currentLang === 'ar' ? 
      `خطأ في حذف القسم: ${error.message}` : 
      `Error deleting department: ${error.message}`
    );
  }
}

// دالة تحديث قسم
async function updateSection() {
  const id = document.getElementById('editSectionId').value;
  const nameAr = document.getElementById('editSectionNameAr').value.trim();
  const nameEn = document.getElementById('editSectionNameEn').value.trim();
  const description = document.getElementById('editSectionDescription').value.trim();
  
  // Validation
  if (!nameAr || !nameEn) {
    alert(currentLang === 'ar' ? 
      'يرجى إدخال اسم القسم باللغتين العربية والإنجليزية' : 
      'Please enter section name in both Arabic and English');
    return;
  }
  
  try {
    // Check server connection first
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      throw new Error('الخادم غير متاح. يرجى تشغيل الخادم أولاً.');
    }

    const response = await fetch(`http://localhost:3001/api/departments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        nameAr: nameAr,
        nameEn: nameEn,
        description: description
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في تحديث القسم');
    }
    
    console.log('✅ Department updated successfully');
    
    // Show success message
    alert(currentLang === 'ar' ? 
      'تم تحديث القسم بنجاح!' : 
      'Department updated successfully!'
    );
    
    // Close modal
    closeEditSectionModal();
    
    // Reload departments from database
    await loadDepartmentsFromDatabase();
    await populateDepartmentDropdown();
    
    // Update chart
    if (departmentComplaintsChart) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.update();
    }
    
  } catch (error) {
    console.error('❌ Error updating department:', error);
    alert(currentLang === 'ar' ? 
      `خطأ في تحديث القسم: ${error.message}` : 
      `Error updating department: ${error.message}`
    );
  }
}

// دالة إغلاق modal التعديل
function closeEditSectionModal() {
  document.getElementById('editSectionModal').style.display = 'none';
  // Clear form
  document.getElementById('editSectionForm').reset();
}

// دالة ملء القائمة المنسدلة للأقسام مع أزرار التعديل والحذف
async function populateDepartmentDropdown() {
  const departmentOptions = document.getElementById('departmentOptions');
  if (!departmentOptions) return;

  // Clear existing options except "All" and "Add Section"
  const existingOptions = departmentOptions.querySelectorAll('.custom-select-option:not([data-value="all"]):not([data-value="add-section"])');
  existingOptions.forEach(option => option.remove());

  try {
    // Fetch departments from database
    const response = await fetch('http://localhost:3001/api/departments', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const departments = data.data || [];
      
      // Add departments from database with edit/delete buttons
      departments.forEach(dept => {
        const option = document.createElement('div');
        option.className = 'custom-select-option department-option';
        option.setAttribute('data-value', dept.DepartmentName);
        option.setAttribute('data-ar', dept.DepartmentName);
        option.setAttribute('data-en', dept.DepartmentNameEn || dept.DepartmentName);
        option.setAttribute('data-id', dept.DepartmentID);
        
        // Create the option content with actions
        option.innerHTML = `
          <div class="department-option-with-actions">
            <div class="department-name">${dept.DepartmentName}</div>
            <div class="department-actions">
              <button class="action-btn edit-btn permission-gated" data-permission="edit_department" onclick="event.stopPropagation(); editDepartment(${dept.DepartmentID}, '${dept.DepartmentName}', '${dept.DepartmentNameEn || ''}', '${dept.Description || ''}')" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete-btn permission-gated" data-permission="delete_department" onclick="event.stopPropagation(); deleteDepartment(${dept.DepartmentID}, '${dept.DepartmentName}')" title="حذف">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
        
        departmentOptions.appendChild(option);
      });

      console.log('📋 Department dropdown populated with', departments.length, 'departments from database');
      
      // Apply permissions to the newly created edit/delete buttons
      applyPermissionsToDepartmentButtons();
    } else {
      console.warn('⚠️ Failed to fetch departments from database, using static data');
      // Fallback to static data
      departmentComplaintsData.labels.ar.forEach((deptName, index) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', deptName);
        option.setAttribute('data-ar', deptName);
        option.setAttribute('data-en', departmentComplaintsData.labels.en[index]);
        option.textContent = deptName;
        departmentOptions.appendChild(option);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    // Fallback to static data
    departmentComplaintsData.labels.ar.forEach((deptName, index) => {
      const option = document.createElement('div');
      option.className = 'custom-select-option';
      option.setAttribute('data-value', deptName);
      option.setAttribute('data-ar', deptName);
      option.setAttribute('data-en', departmentComplaintsData.labels.en[index]);
      option.textContent = deptName;
      departmentOptions.appendChild(option);
    });
  }

  // Ensure "Add Section" option exists
  ensureAddSectionOption();
}

// دالة جلب الأقسام من قاعدة البيانات
async function loadDepartmentsFromDatabase() {
  try {
    const response = await fetch('http://localhost:3001/api/departments', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      const departments = data.data || [];
      
      // Update department data with real data from database
      departmentComplaintsData.labels.ar = departments.map(dept => dept.DepartmentName);
      departmentComplaintsData.labels.en = departments.map(dept => dept.DepartmentNameEn || dept.DepartmentName);
      
      // Initialize values array with zeros if not exists
      if (departmentComplaintsData.values.length === 0) {
        departmentComplaintsData.values = new Array(departments.length).fill(0);
      }
      
      console.log('✅ Loaded', departments.length, 'departments from database');
      return true;
    }
  } catch (error) {
    console.error('❌ Error loading departments from database:', error);
  }
  return false;
}

// دالة حفظ قسم جديد
async function saveNewSection() {
  const nameAr = document.getElementById('sectionNameAr').value.trim();
  const nameEn = document.getElementById('sectionNameEn').value.trim();
  const description = document.getElementById('sectionDescription').value.trim();
  
  // Validation
  if (!nameAr || !nameEn) {
    alert(currentLang === 'ar' ? 
      'يرجى إدخال اسم القسم باللغتين العربية والإنجليزية' : 
      'Please enter section name in both Arabic and English');
    return;
  }
  
  try {
    // Check server connection first
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      throw new Error('الخادم غير متاح. يرجى تشغيل الخادم أولاً.');
    }

    const response = await fetch('http://localhost:3001/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        nameAr: nameAr,
        nameEn: nameEn,
        description: description
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في حفظ القسم');
    }
    
    console.log('✅ Department saved successfully');
    
    // Show success message
    alert(currentLang === 'ar' ? 
      'تم حفظ القسم بنجاح!' : 
      'Department saved successfully!'
    );
    
    // Close modal
    closeAddSectionModal();
    
    // Reload departments from database
    await loadDepartmentsFromDatabase();
    await populateDepartmentDropdown();
    
    // Update chart
    if (departmentComplaintsChart) {
      departmentComplaintsChart.data.labels = departmentComplaintsData.labels[currentLang];
      departmentComplaintsChart.data.datasets[0].data = departmentComplaintsData.values;
      departmentComplaintsChart.update();
    }
    
  } catch (error) {
    console.error('❌ Error saving section:', error);
    alert(currentLang === 'ar' ? 
      `خطأ في حفظ القسم: ${error.message}` : 
      `Error saving section: ${error.message}`
    );
  }
}

// دالة إغلاق modal إضافة قسم
function closeAddSectionModal() {
  document.getElementById('addSectionModal').style.display = 'none';
  // Clear form
  document.getElementById('addSectionForm').reset();
}

// دالة استيراد الشكاوى من Excel (النظام المتطور)
async function importComplaintsFromExcel(file) {
  try {
    console.log('📥 بدء استيراد ملف الشكاوى المتطور:', file.name);
    
    const isServerConnected = await checkServerConnection();
    if (!isServerConnected) {
      throw new Error('الخادم غير متاح. يرجى تشغيل الخادم أولاً.');
    }

    const formData = new FormData();
    formData.append('excelFile', file);
    
    toast(currentLang === 'ar' ? 'جاري استيراد الشكاوى...' : 'Importing complaints...');
    
    const response = await fetch('http://localhost:3001/api/excel-complaints/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ تم استيراد الشكاوى بنجاح:', data.data);
      
      // عرض النتائج
      showImportResults(data.data);
      
      // تحديث الرسوم البيانية
      await updateChartsAfterImport();
      
    } else {
      throw new Error(data.message || 'فشل في استيراد الشكاوى');
    }

  } catch (error) {
    console.error('❌ خطأ في استيراد الشكاوى:', error);
    toast(currentLang === 'ar' ? 
      `خطأ في استيراد الشكاوى: ${error.message}` : 
      `Error importing complaints: ${error.message}`, true);
  }
}

// دالة تحديث الرسوم البيانية بعد الاستيراد
async function updateChartsAfterImport() {
  try {
    console.log('🔄 تحديث الرسوم البيانية بعد الاستيراد...');
    
    // تحميل البيانات الجديدة من قاعدة البيانات
    await loadComplaintsDataFromDatabase();
    
    // تحديث الرسوم البيانية
    updateChartsWithRealData();
    
    // حفظ البيانات في قاعدة البيانات
    saveToDatabase();
    
    console.log('✅ تم تحديث الرسوم البيانية بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث الرسوم البيانية:', error);
  }
}

// ====== دوال مساعدة لتحسين جودة التصدير ======

// دالة تضمن إن الرسوم جاهزة + الخطوط محمّلة
async function ensureReadyForExport(charts = []) {
  // انتظر تحميل الخطوط (يأثر على وضوح النص بالمحاور)
  if (document.fonts?.ready) { 
    try { 
      await document.fonts.ready; 
    } catch {} 
  }

  // احفظ الأبعاد الأصلية للكانفس
  const originalDimensions = new Map();
  const canvases = document.querySelectorAll('#exportArea canvas, .chart-container canvas');
  canvases.forEach(cnv => {
    const container = cnv.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const height = rect.height || 400;
      const width = rect.width || 800;
      
      // احفظ الأبعاد الأصلية
      originalDimensions.set(cnv, {
        width: cnv.style.width,
        height: cnv.style.height,
        canvasWidth: cnv.width,
        canvasHeight: cnv.height
      });
      
      // ثبّت الأبعاد للتصدير
      cnv.style.width = width + 'px';
      cnv.style.height = height + 'px';
    }
  });

  // انتظر فريم/فريمين علشان تضمن انتهاء أي أنيميشن
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // وقّف الأنيميشن مؤقتًا وحدث الرسوم
  charts.forEach(ch => {
    if (!ch) return;
    const prevAnim = ch.options.animation;
    ch.options.animation = false;
    ch.update('none');           // تحديث فوري بدون أنيميشن
    ch.__prevAnim = prevAnim;    // نخزن القيمة القديمة لإرجاعها لاحقًا
  });

  // احفظ الأبعاد الأصلية للاستعادة لاحقاً
  charts.forEach(ch => {
    if (ch && ch.canvas) {
      const dims = originalDimensions.get(ch.canvas);
      if (dims) {
        ch.__originalDims = dims;
      }
    }
  });
}

function restoreChartsAnimation(charts = []) {
  charts.forEach(ch => {
    if (!ch) return;
    
    // استعد الأبعاد الأصلية
    if (ch.__originalDims && ch.canvas) {
      const dims = ch.__originalDims;
      ch.canvas.style.width = dims.width;
      ch.canvas.style.height = dims.height;
      ch.canvas.width = dims.canvasWidth;
      ch.canvas.height = dims.canvasHeight;
      delete ch.__originalDims;
    }
    
    // استعد الأنيميشن
    ch.options.animation = (ch.__prevAnim === undefined) ? {duration: 800} : ch.__prevAnim;
    delete ch.__prevAnim;
    
    // حدث الرسم البياني
    if (ch.resize) {
      ch.resize();
    }
    ch.update('none');
  });
}

// دالة للحصول على لقطة عالية الدقة من الكانفس
function canvasToImageHD(chart, ratio = 3) {
  const canvas = chart.canvas || chart; // دعم الكانفس المباشر
  const { clientWidth: wCSS, clientHeight: hCSS } = canvas;
  if (!wCSS || !hCSS) return canvas.toDataURL('image/png', 1.0);

  // احفظ المقاسات والأنماط الحالية
  const prevW = canvas.width;
  const prevH = canvas.height;
  const prevStyleWidth = canvas.style.width;
  const prevStyleHeight = canvas.style.height;

  // ارفع الدقة
  const newW = Math.round(wCSS * ratio);
  const newH = Math.round(hCSS * ratio);
  
  canvas.width = newW;
  canvas.height = newH;
  canvas.style.width = wCSS + 'px';
  canvas.style.height = hCSS + 'px';
  
  // تأكد من أن الكانفس يعيد الرسم بالدقة الجديدة
  if (chart && chart.resize) {
    chart.resize();
    chart.update('none');
  }

  const dataURL = canvas.toDataURL('image/png', 1.0);

  // رجّع المقاسات والأنماط الأصلية
  canvas.width = prevW;
  canvas.height = prevH;
  canvas.style.width = prevStyleWidth;
  canvas.style.height = prevStyleHeight;
  
  if (chart && chart.resize) {
    chart.resize();
    chart.update('none');
  }

  return dataURL;
}

// ====== زر تصدير PDF الاحترافي (غلاف + ملخص + رسوم + جداول) ======
function bindProPdfButton() {
  const btn = document.getElementById('exportProPdfBtn');
  if (!btn) return;
  btn.addEventListener('click', exportProPDF);
}

// 🔧 كتلة مساعدة: تحويل HTML جاهز لصورة (PNG) ثم ترجيع dataURL
async function htmlBlockToDataURL({ width = 700, html, scale = 3 }) {
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-10000px';
  wrap.style.top = '0';
  wrap.style.width = width + 'px';
  wrap.style.padding = '0';
  wrap.style.margin = '0';
  wrap.style.background = 'transparent';
  wrap.style.fontFamily = getFont?.() || (currentLang === 'ar' ? 'Tajawal' : 'Merriweather');
  wrap.style.lineHeight = '1.4';
  wrap.style.wordWrap = 'break-word';
  wrap.style.whiteSpace = 'normal';
  wrap.style.overflow = 'visible';
  wrap.dir = (currentLang === 'ar') ? 'rtl' : 'ltr';
  wrap.lang = currentLang;

  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  // انتظر قليلاً لضمان تحميل الخطوط
  await new Promise(resolve => setTimeout(resolve, 100));

  const canvas = await html2canvas(wrap, { 
    scale, 
    backgroundColor: null,
    useCORS: true,
    allowTaint: false,
    logging: false
  });
  const dataURL = canvas.toDataURL('image/png', 1.0);
  document.body.removeChild(wrap);
  return { dataURL, w: canvas.width / scale, h: canvas.height / scale };
}

// 🔧 مُساعد إدراج "جدول HTML → صورة PDF"
async function addHtmlTableAsImage(doc, {title, headers, rows, startY, pageMargin=36}) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ابني HTML للعنوان + الجدول (RTL للعربي)
  const tableHTML = `
    <div style="font-family:${getFont?.() || (currentLang==='ar'?'Tajawal':'Merriweather')};
                direction:${currentLang==='ar'?'rtl':'ltr'};
                text-align:${currentLang==='ar'?'right':'left'}">
      ${title ? `<div style="font-weight:700;font-size:16px;margin:0 0 10px">${title}</div>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr>
            ${headers.map((h,i)=>`
              <th style="padding:8px;border:1px solid #e5e7eb;background:#2563eb;color:#fff;
                         ${currentLang==='ar'?'font-weight:700;':''}">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r=>`
            <tr>
              ${r.map((cell,j)=>`
                <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb">${cell}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  // حوّل HTML لصورة
  const block = await htmlBlockToDataURL({ width: 680, html: tableHTML, scale: 3 });

  // لو المساحة ما تكفي بالصفحة الحالية، انتقل لصفحة جديدة
  if (startY + block.h > H - pageMargin) {
    doc.addPage();
    startY = pageMargin;
  }

  // ضيف الصورة مع الحفاظ على العرض داخل الهوامش
  const maxW = W - pageMargin*2;
  const scale = Math.min(1, maxW / block.w);
  const drawW = block.w * scale;
  const drawH = block.h * scale;
  doc.addImage(block.dataURL, 'PNG', (W - drawW)/2, startY, drawW, drawH);

  return startY + drawH + 14; // ارجع الموضع التالي للكتابة
}

async function exportProPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 36;             // هامش جانبي
    const HEADER_H = 50;      // ارتفاع الهيدر
    const TOP = HEADER_H + 24;// أول سطر محتوى بعد الهيدر
    const now = new Date();
    const dateStr = now.toLocaleString(currentLang === 'ar' ? 'ar-SA' : 'en-GB');

    // ✅ تأكد الرسوم جاهزة
    await ensureReadyForExport([complaintCategoriesChart, departmentComplaintsChart]);

    // ============ صفحة الغلاف (بدون شعار) ============

    // نص الغلاف كـ HTML (يتنسّق بخط الصفحة Tajawal/Merriweather ثم يتحوّل لصورة)
    const coverTitle = (currentLang === 'ar') ? 'تقرير مؤشرات بلاغات 937' : '937 Reports Indicators';
    const coverSub1  = (currentLang === 'ar') ? `إجمالي البلاغات: ${Number(mainCardData?.totalReports || 0)}`
                                              : `Total reports: ${Number(mainCardData?.totalReports || 0)}`;
    const coverSub2  = (currentLang === 'ar') ? `تاريخ الإنشاء: ${dateStr}` : `Generated on: ${dateStr}`;

    const coverHTML = `
      <div style="text-align:center; padding:40px 20px; line-height:1.4;">
        <div style="font-weight:700; font-size:32px; margin-bottom:20px; word-wrap:break-word; white-space:normal;">${coverTitle}</div>
        <div style="font-size:16px; margin-bottom:12px; word-wrap:break-word;">${coverSub1}</div>
        <div style="font-size:14px; color:#555; word-wrap:break-word;">${coverSub2}</div>
      </div>
    `;

    const cover = await htmlBlockToDataURL({ width: 680, html: coverHTML, scale: 3 });
    const coverX = (W - cover.w) / 2;
    const coverY = (H - cover.h) / 2 - 40;
    doc.addImage(cover.dataURL, 'PNG', coverX, Math.max(coverY, 80), cover.w, cover.h);

    // (مُعطَّل) وسم مائي
    // doc.setTextColor(150);
    // doc.setFontSize(60);
    // doc.text('CONFIDENTIAL', W / 2, H - 80, { align: 'center', angle: -20 });
    // doc.setTextColor(0);

    // ===== رأس/تذييل للصفحات التالية (نصي بسيط بدون عربي داخل jsPDF) =====
    function addHeaderFooter() {
      doc.setDrawColor(230); doc.setFillColor(245);
      doc.rect(0, 0, W, 50, 'F');
      doc.setFontSize(9); doc.setTextColor(70);
      doc.text('937 Reports - Professional Report', M, 25);
      doc.setDrawColor(230); doc.line(M, H-30, W-M, H-30);
      doc.setTextColor(120);
      const pageInfo = `${doc.getCurrentPageInfo().pageNumber} / ${doc.getNumberOfPages()}`;
      doc.text(pageInfo, W - M, H - 12, { align: 'right' });
      doc.setTextColor(0);
    }

    // ============ صفحة "ملخص المؤشرات" ============ 
    doc.addPage(); addHeaderFooter();

    // نص العنوان كصورة (عربي/إنجليزي)
    const kpiTitle = (currentLang === 'ar') ? 'ملخص المؤشرات' : 'KPIs Summary';
    const kpiTitleBlock = await htmlBlockToDataURL({
      width: 700,
      html: `<div style="font-weight:700; font-size:22px; line-height:1.4; padding:8px 12px; text-align:${currentLang==='ar'?'right':'left'}; word-wrap:break-word; white-space:normal;">${kpiTitle}</div>`,
      scale: 3
    });
    doc.addImage(kpiTitleBlock.dataURL, 'PNG', M, TOP, kpiTitleBlock.w, kpiTitleBlock.h);

    // جدول KPIs كصورة HTML (عربي صحيح)
    let y = TOP + kpiTitleBlock.h + 16;
    y = await addHtmlTableAsImage(doc, {
      title: currentLang==='ar' ? 'ملخص المؤشرات' : 'KPIs Summary',
      headers: [ currentLang==='ar' ? 'المؤشر' : 'Metric', currentLang==='ar' ? 'القيمة' : 'Value' ],
      rows: [
        [ currentLang==='ar'?'عدد التصنيفات':'Categories', String((complaintCategoriesData?.labels?.[currentLang]||[]).length) ],
        [ currentLang==='ar'?'عدد الأقسام':'Departments', String((departmentComplaintsData?.labels?.[currentLang]||[]).length) ],
        [ currentLang==='ar'?'إجمالي البلاغات':'Total Reports', String(Number(mainCardData?.totalReports||0)) ],
      ],
      startY: y
    });

    // ============ صفحة الرسوم: التصنيفات ============
    doc.addPage(); addHeaderFooter();

    const catTitle = (currentLang==='ar') ? 'تصنيفات البلاغات الواردة حسب النطاق' : 'Complaint Categories by Scope';
    const catTitleBlock = await htmlBlockToDataURL({
      width: 700,
      html: `<div style="font-weight:700; font-size:20px; line-height:1.4; padding:8px 12px; text-align:${currentLang==='ar'?'right':'left'}; word-wrap:break-word; white-space:normal;">${catTitle}</div>`,
      scale: 3
    });
    doc.addImage(catTitleBlock.dataURL, 'PNG', M, TOP, catTitleBlock.w, catTitleBlock.h);

    const catCanvas = document.getElementById('complaintCategoriesChart');
    if (catCanvas && complaintCategoriesChart) {
      const imgW = W - M * 2;
      const imgH = imgW * 0.5;
      const img = canvasToImageHD(complaintCategoriesChart, 3);
      const afterCatTitleY = TOP + catTitleBlock.h + 12; // ← يعتمد على ارتفاع العنوان الحقيقي
      doc.addImage(img, 'PNG', M, afterCatTitleY, imgW, imgH, undefined, 'FAST');
    }
    // جدول تفصيلي كصورة HTML (عربي صحيح)
    const catRows = (complaintCategoriesData?.labels?.[currentLang]||[]).map((name,i)=>[
      String(i+1), name, String((complaintCategoriesData?.values||[])[i]||0)
    ]);
    const afterCatChartY = (TOP + catTitleBlock.h + 12) + ((W - M*2) * 0.5) + 20;
    y = await addHtmlTableAsImage(doc, {
      title: currentLang==='ar' ? 'تفاصيل التصنيفات' : 'Category Details',
      headers: [ currentLang==='ar'?'#':'#', currentLang==='ar'?'التصنيف':'Category', currentLang==='ar'?'العدد':'Count' ],
      rows: catRows,
      startY: afterCatChartY
    });

    // ============ صفحة الرسوم: الأقسام ============
    doc.addPage(); addHeaderFooter();

    const deptTitle = (currentLang==='ar') ? 'إجمالي البلاغات في الإدارات/الأقسام' : 'Total Registered Complaints in Departments/Sections';
    const deptTitleBlock = await htmlBlockToDataURL({
      width: 700,
      html: `<div style="font-weight:700; font-size:20px; line-height:1.4; padding:8px 12px; text-align:${currentLang==='ar'?'right':'left'}; word-wrap:break-word; white-space:normal;">${deptTitle}</div>`,
      scale: 3
    });
    doc.addImage(deptTitleBlock.dataURL, 'PNG', M, TOP, deptTitleBlock.w, deptTitleBlock.h);

    const deptCanvas = document.getElementById('departmentComplaintsChart');
    if (deptCanvas && departmentComplaintsChart) {
      const imgW = W - M * 2;
      const imgH = imgW * 0.5;
      const img = canvasToImageHD(departmentComplaintsChart, 3);
      const afterDeptTitleY = TOP + deptTitleBlock.h + 12;
      doc.addImage(img, 'PNG', M, afterDeptTitleY, imgW, imgH, undefined, 'FAST');
    }

    // جدول تفصيلي كصورة HTML (عربي صحيح)
    const deptRows = (departmentComplaintsData?.labels?.[currentLang]||[]).map((name,i)=>[
      String(i+1), name, String((departmentComplaintsData?.values||[])[i]||0)
    ]);
    const afterDeptChartY = (TOP + deptTitleBlock.h + 12) + ((W - M*2) * 0.5) + 20;
    y = await addHtmlTableAsImage(doc, {
      title: currentLang==='ar' ? 'تفاصيل الأقسام' : 'Department Details',
      headers: [ currentLang==='ar'?'#':'#', currentLang==='ar'?'القسم':'Department', currentLang==='ar'?'العدد':'Count' ],
      rows: deptRows,
      startY: afterDeptChartY
    });

    // ============ حفظ الملف ============
    const fileName = currentLang === 'ar'
      ? `تقرير_بلاغات_937_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.pdf`
      : `937_Reports_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.pdf`;
    doc.save(fileName);
    
    // رسالة تأكيد بسيطة
    if (typeof toast === 'function') {
      toast(currentLang === 'ar' ? 'تم تصدير الملف بنجاح' : 'File exported successfully', false);
    } else {
      console.log(currentLang === 'ar' ? '✅ تم تصدير الملف بنجاح' : '✅ File exported successfully');
    }

  } catch (err) {
    console.error('❌ PDF export failed:', err);
    alert(currentLang === 'ar' ? 'فشل تصدير PDF' : 'PDF export failed');
  } finally {
    // رجّع الأنيميشن لو كنت مفعّله
    restoreChartsAnimation([complaintCategoriesChart, departmentComplaintsChart]);
  }
}

// ====== 937: High-Quality PDF Export (per chart) ======

// تعريف البلوكات المطلوبة للتصدير
const blocks937 = [
  { 
    selector: '.chart-container:first-child', 
    title: 'تصنيفات البلاغات الواردة حسب النطاق' 
  },
  { 
    selector: '.chart-container:last-child', 
    title: 'إجمالي البلاغات المسجّلة في الإدارات / الأقسام' 
  }
];

async function export937ToPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('l', 'mm', 'a4');

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableW = pageW - margin * 2;

  // ✅ تأكد الرسوم جاهزة
  await ensureReadyForExport([complaintCategoriesChart, departmentComplaintsChart]);

  for (let i = 0; i < blocks937.length; i++) {
    const { selector, title } = blocks937[i];
    const src = document.querySelector(selector);
    if (!src) continue;

    // 1) Sandbox ثابت العرض 794px (عرض A4 بكسل) عشان ما ينضغط
    const sandbox = document.createElement('div');
    sandbox.style.cssText = `
      position: fixed; left: -9999px; top: 0;
      width: 794px; background: #fff; padding: 0;
      direction: ${document.documentElement.dir || 'rtl'};
      font-family: Tajawal, Inter, Arial, sans-serif;
      overflow: visible;
    `;
    
    // عنوان واضح لكل صفحة
    const header = document.createElement('div');
    header.style.cssText = `
      width: 100%; text-align: center; font-weight: 800;
      font-size: 20px; line-height: 1.4; margin: 16px 0 14px;  /* مساحة أكبر تحت العنوان */
      word-break: break-word; white-space: normal;
    `;
    header.textContent = title;
    sandbox.appendChild(header);

    // 2) ننسخ الكرت فقط
    const clone = src.cloneNode(true);
    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    // 3) ثبّت ارتفاع حاويات الرسوم داخل النسخة (حتى ما تتقلص أثناء الالتقاط)
    const liveCanvases  = src.querySelectorAll('canvas');
    const cloneCanvases = sandbox.querySelectorAll('canvas');
    liveCanvases.forEach((cnv, idx) => {
      const h = cnv.parentElement?.getBoundingClientRect?.().height || cnv.height || 420;
      const ch = cloneCanvases[idx]?.parentElement;
      if (ch) ch.style.height = `${Math.max(380, Math.round(h))}px`;
    });

    // 4) نحول canvas إلى صور داخل النسخة (لثبات الدقة العالية)
    const imgPromises = [];
    liveCanvases.forEach((cnv, idx) => {
      try {
        const chart = (cnv.id === 'complaintCategoriesChart') ? complaintCategoriesChart
                     : (cnv.id === 'departmentComplaintsChart') ? departmentComplaintsChart
                     : null;

        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        // استخدام canvasToImageHD للحصول على دقة عالية
        img.src = chart ? canvasToImageHD(chart, 3) : canvasToImageHD({ canvas: cnv }, 3);
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxWidth = '100%';

        // ✅ انتظر تحميل الصورة قبل الالتقاط
        const p = ('decode' in img) ? img.decode().catch(()=>{}) : new Promise(res=>{
          img.onload = img.onerror = res;
        });
        imgPromises.push(p);

        if (cloneCanvases[idx]) cloneCanvases[idx].replaceWith(img);
      } catch (e) {
        console.warn('Failed to convert canvas to image:', e);
      }
    });

    // ✅ انتظر كل الصور
    await Promise.all(imgPromises);

    // 5) لقطة عالية (scale 3 يجعلها حادّة)
    const canvas = await html2canvas(sandbox, {
      scale: 3,
      backgroundColor: '#fff',
      useCORS: true,
      logging: false,
      windowWidth: sandbox.scrollWidth,
      windowHeight: sandbox.scrollHeight,
      allowTaint: false
    });
    document.body.removeChild(sandbox);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 6) أضف الصفحة: اضبط الارتفاع بنسبة العرض
    const imgH = canvas.height * (usableW / canvas.width);
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, margin, usableW, Math.min(imgH, pageH - margin * 2), undefined, 'FAST');
  }

  pdf.save('تقرير_937.pdf');
  
  // رجّع الأنيميشن لو كنت مفعّله
  restoreChartsAnimation([complaintCategoriesChart, departmentComplaintsChart]);
}

// ربط زر التصدير الاحترافي
document.getElementById('exportProPdfBtn')?.addEventListener('click', async (e) => {
  e.preventDefault(); 
  e.stopPropagation();
  const btn = e.currentTarget;
  btn.disabled = true; 
  const old = btn.innerHTML; 
  btn.innerHTML = '...جاري التصدير';
  try { 
    await exportProPDF(); 
  } catch (err) { 
    console.error(err); 
    alert('تعذّر تصدير التقرير الاحترافي'); 
  }
  finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
});
