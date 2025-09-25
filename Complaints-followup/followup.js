function goBack() {
  window.history.back();
}

// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

async function handleSubmit(e) {
  e.preventDefault();

  // جمع جميع البيانات المدخلة - الاسم اختياري الآن
  const patientName = document.getElementById('patientName')?.value?.trim() || '';
  const nationalId = document.getElementById('nationalId')?.value?.trim() || '';
  const phoneNumber = document.getElementById('phoneNumber')?.value?.trim() || '';
  const fileNumber = document.getElementById('fileNumber')?.value?.trim() || '';

  // التحقق من إدخال بيانة واحدة على الأقل (الاسم اختياري)
  if (!nationalId && !phoneNumber && !fileNumber) {
    alert("يجب إدخال بيانة واحدة على الأقل للبحث (رقم الهوية، الجوال، أو رقم الملف)");
    return;
  }

  // UI: قفل الزر أثناء البحث
  const submitBtn = document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "جاري البحث...";
  submitBtn.disabled = true;

  try {
    // إعداد معاملات البحث
    const searchParams = new URLSearchParams();
    if (patientName) searchParams.append('name', patientName);
    if (nationalId) searchParams.append('nationalId', nationalId);
    if (phoneNumber) searchParams.append('phone', phoneNumber);
    if (fileNumber) searchParams.append('fileNumber', fileNumber);

    console.log('معاملات البحث:', searchParams.toString());

    // استدعاء API البحث الجديد
    const searchResponse = await fetch(`${API_BASE_URL}/complaints/search-patient?${searchParams.toString()}`);
    const searchData = await searchResponse.json();

    console.log('نتائج البحث:', searchData);

    if (searchData.success && searchData.data.length > 0) {
      // إذا كان هناك نتيجة واحدة مطابقة
      if (searchData.data.length === 1) {
        const patient = searchData.data[0];
        
        // إذا تم إدخال اسم، تحقق من التطابق
        if (patientName) {
          const patientNameFromDB = (patient.FullName || '').toLowerCase().trim();
          const enteredName = patientName.toLowerCase().trim();
          
          const nameMatches = 
            patientNameFromDB === enteredName ||
            patientNameFromDB.includes(enteredName) ||
            enteredName.includes(patientNameFromDB);
            
          if (!nameMatches) {
            alert("الاسم المدخل لا يتطابق مع البيانات المسجلة. يرجى التأكد من صحة الاسم.");
            return;
          }
        }
        
        // حفظ بيانات المريض والانتقال
        savePatientDataAndNavigate(patient);
        
      } else {
        // إذا كان هناك أكثر من نتيجة، اعرض قائمة للاختيار
        // إذا تم إدخال اسم، قم بتصفية النتائج أولاً
        let filteredPatients = searchData.data;
        
        if (patientName) {
          filteredPatients = searchData.data.filter(patient => {
            const patientNameFromDB = (patient.FullName || '').toLowerCase().trim();
            const enteredName = patientName.toLowerCase().trim();
            
            return patientNameFromDB === enteredName ||
                   patientNameFromDB.includes(enteredName) ||
                   enteredName.includes(patientNameFromDB);
          });
          
          if (filteredPatients.length === 0) {
            alert("لا يوجد مريض يطابق الاسم المدخل ضمن النتائج المجدة.");
            return;
          }
          
          if (filteredPatients.length === 1) {
            savePatientDataAndNavigate(filteredPatients[0]);
            return;
          }
        }
        
        displayPatientSelection(filteredPatients);
      }
    } else {
      alert(searchData.message || "لا يوجد مريض مسجل بهذه البيانات");
    }
  } catch (error) {
    console.error('خطأ في البحث عن المريض:', error);
    alert("حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// دالة لحفظ بيانات المريض والانتقال
function savePatientDataAndNavigate(patient) {
  // تخزين البيانات في localStorage
  localStorage.setItem('patientName', patient.FullName);
  localStorage.setItem('patientId', String(patient.PatientID));
  localStorage.setItem('patientNationalId', patient.NationalID_Iqama || '');
  localStorage.setItem('patientContact', patient.ContactNumber || '');
  if (patient.FileNumber) {
    localStorage.setItem('patientFileNumber', patient.FileNumber);
  }

  // التحقق من وجود شكاوى
  if (patient.ComplaintsCount > 0) {
    window.location.href = "/Complaints-followup/all-complaints.html";
  } else {
    alert("لا توجد شكاوى مسجلة لهذا المريض حتى الآن.");
  }
}

// عرض قائمة المرضى للاختيار إذا كان هناك أكثر من نتيجة
function displayPatientSelection(patients) {
  const modal = document.createElement('div');
  modal.className = 'patient-selection-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>تم العثور على أكثر من مريض</h3>
      <p>يرجى اختيار المريض المطلوب:</p>
      <div class="patients-list">
        ${patients.map((patient, index) => `
          <div class="patient-item" onclick="selectPatient(${index})">
            <div class="patient-info">
              <strong>${patient.FullName}</strong><br>
              الهوية: ${patient.NationalID_Iqama || 'غير محدد'}<br>
              الجوال: ${patient.ContactNumber || 'غير محدد'}<br>
              رقم الملف: ${patient.FileNumber || 'غير محدد'}<br>
              عدد الشكاوى: ${patient.ComplaintsCount || 0}<br>
              <small style="color: #666;">تطابق في: ${patient.matchType || 'غير محدد'}</small>
            </div>
          </div>
        `).join('')}
      </div>
      <button onclick="closeModal()" class="close-btn">إغلاق</button>
    </div>
  `;

  document.body.appendChild(modal);

  // إضافة بيانات المرضى للنافذة للوصول إليها
  window.searchResults = patients;

  // إضافة الأنماط
  const style = document.createElement('style');
  style.textContent = `
    .patient-selection-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
      direction: rtl;
      text-align: right;
    }
    .patient-item {
      border: 1px solid #ddd;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    }
    .patient-item:hover {
      background: #f0f0f0;
      border-color: #007bff;
    }
    .close-btn {
      margin-top: 15px;
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .close-btn:hover {
      background: #5a6268;
    }
  `;
  document.head.appendChild(style);
}

// اختيار مريض من القائمة
function selectPatient(index) {
  const patient = window.searchResults[index];
  
  // حفظ البيانات والانتقال
  savePatientDataAndNavigate(patient);
  
  // إغلاق النافذة
  closeModal();
}

// إغلاق النافذة المنبثقة
function closeModal() {
  const modal = document.querySelector('.patient-selection-modal');
  if (modal) {
    modal.remove();
  }
}

// دوال اللغة
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

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }
});

// السكريپت الخاص بالأدوار
(function () {
  function redirectByRole() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return '/login/login.html';
    const roleId = Number(user.RoleID || user.roleId);
    if (roleId === 1) return '/superadmin/superadmin-home.html';
    if (roleId === 2) return '/employee/employee-home.html';
    if (roleId === 3) return '/dept-admin/dept-admin.html';
    return '/login/login.html';
  }

  const homeLinks = document.querySelectorAll(
    'aside .sidebar-menu a.menu-link[href$="/login/login.html"], aside .sidebar-menu a.menu-link[data-en="Home Page"], aside .sidebar-menu a.menu-link[data-ar="الصفحة الرئيسية"]'
  );

  homeLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = redirectByRole();
    });
    a.setAttribute('href', redirectByRole());
  });
})();