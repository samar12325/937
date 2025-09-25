// إعدادات API
const API_BASE_URL = 'http://localhost:3001/api';

// متغيرات عامة
let complaintData = null;




// تحميل بيانات البلاغ 
async function loadComplaintDetails() {
  localStorage.removeItem("patientFileNumber");

  // دائماً اجلب complaintId من الرابط أولاً
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('complaintId') || urlParams.get('id') || urlParams.get('complaint');
  
  console.log('🔍 [DETAILS] Loading complaint details for ID:', complaintId);

  if (!complaintId) {
    console.error('❌ [DETAILS] No complaint ID found in URL');
    alert("لا توجد بيانات بلاغ  متاحة");
    goBack();
    return;
  }

  let selectedComplaint = localStorage.getItem("selectedComplaint");

  // تحقق من أن البيانات المحفوظة تتطابق مع complaintId المطلوب
  let shouldReload = true;
  if (selectedComplaint) {
    try {
      const cachedData = JSON.parse(selectedComplaint);
      if (cachedData.ComplaintID == complaintId) {
        console.log('✅ [DETAILS] Using cached data for complaint:', complaintId);
        shouldReload = false;
      } else {
        console.log('🔄 [DETAILS] Different complaint ID, reloading data');
        localStorage.removeItem("selectedComplaint");
      }
    } catch (e) {
      console.log('🔄 [DETAILS] Invalid cached data, reloading');
      localStorage.removeItem("selectedComplaint");
    }
  }

  // 1) جلب البيانات من API إذا لم تكن موجودة أو مختلفة
  if (shouldReload) {

    try {
      const token = localStorage.getItem('token');
      console.log('🔍 [DETAILS] Fetching data from API:', `${API_BASE_URL}/complaints/details/${complaintId}`);
      
      const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🔍 [DETAILS] API Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 [DETAILS] API Response data:', data);

      if (!(data.success && data.data.complaint)) {
        throw new Error('فشل في جلب بيانات البلاغ  من API');
      }

      const complaintToSave = normalizeComplaintForStorage(data.data.complaint, 'details-api');
      selectedComplaint = JSON.stringify(complaintToSave);
      localStorage.setItem("selectedComplaint", selectedComplaint);
      
      console.log('✅ [DETAILS] Data saved to localStorage for complaint:', complaintId);
    } catch (apiError) {
      console.error('❌ [DETAILS] خطأ في جلب بيانات البلاغ  من API:', apiError);
      alert("لا توجد بيانات بلاغ  متاحة");
      goBack();
      return;
    }
  }

  // 2) استخدم الكاش
  try {
    complaintData = JSON.parse(selectedComplaint);

    // إذا ناقصة بعض الحقول، جلب ودمج
    if (!complaintData.PatientName || !complaintData.DepartmentName) {
      await refreshComplaintFromApi(complaintData.ComplaintID);
      selectedComplaint = localStorage.getItem("selectedComplaint");
      complaintData = JSON.parse(selectedComplaint);
    }

    // 3) مهم: لو FileNumber غير موجود → أعد الجلب مرة واحدة حتى لو بقية الحقول موجودة
    if (!hasFileNumber(complaintData)) {
      await refreshComplaintFromApi(complaintData.ComplaintID);
      selectedComplaint = localStorage.getItem("selectedComplaint");
      complaintData = JSON.parse(selectedComplaint);
    }

    // عرض
    populateComplaintDetails();

  } catch (error) {
    console.error('خطأ في تحميل بيانات البلاغ :', error);
    alert("خطأ في تحميل بيانات البلاغ ");
    goBack();
  }
}

/* Helpers */

function hasFileNumber(obj) {
  if (!obj) return false;
  const direct = obj.FileNumber || obj.fileNumber;
  const nested = obj.Patient && (obj.Patient.FileNumber || obj.Patient.fileNumber);
  const cached = localStorage.getItem('patientFileNumber');
  return !!( (direct && String(direct).trim() !== '') ||
             (nested && String(nested).trim() !== '') ||
             (cached && String(cached).trim() !== '') );
}

function normalizeComplaintForStorage(c, sourceTag) {
  const normalized = {
    ...c,
    _dataSource: sourceTag || 'api',
    _timestamp: Date.now()
  };

  // طبّع FileNumber بأي شكل متاح
  normalized.FileNumber =
    normalized.FileNumber ||
    (normalized.Patient && (normalized.Patient.FileNumber || normalized.Patient.fileNumber)) ||
    normalized.fileNumber ||
    null;

  if (normalized.FileNumber) {
    localStorage.setItem('patientFileNumber', normalized.FileNumber);
  }

  return normalized;
}

async function refreshComplaintFromApi(complaintId) {
  if (!complaintId) return;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/complaints/details/${complaintId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success && data.data.complaint) {
      const fresh = normalizeComplaintForStorage(data.data.complaint, 'details-api-refresh');
      localStorage.setItem("selectedComplaint", JSON.stringify(fresh));
    }
  } catch (e) {
    console.log('refreshComplaintFromApi failed:', e.message);
  }
}


// تعبئة تفاصيل البلاغ 
function populateComplaintDetails() {
  if (!complaintData) return;

  // تحديث عنوان البلاغ  مع تنسيق رقم البلاغ 
  const complaintTitle = document.querySelector('.complaint-title');
  if (complaintTitle) {
    const complaintNumber = String(complaintData.ComplaintID).padStart(6, '0');
    complaintTitle.textContent = `تفاصيل البلاغ رقم #${complaintNumber}`;
    complaintTitle.setAttribute('data-ar', `تفاصيل البلاغ رقم #${complaintNumber}`);
    complaintTitle.setAttribute('data-en', `Report Details No. #${complaintNumber}`);
  }

  // تحديث تاريخ البلاغ  مع الوقت
  const complaintDate = document.querySelector('.complaint-date');
  if (complaintDate) {
    const date = new Date(complaintData.ComplaintDate);
    const formattedDate = date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullDateTime = `${formattedDate} - الساعة ${formattedTime}`;
    complaintDate.textContent = fullDateTime;
    complaintDate.setAttribute('data-ar', fullDateTime);
    complaintDate.setAttribute('data-en', `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} - ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`);
  }

  // تحديث حالة البلاغ 
  const complaintStatus = document.querySelector('.complaint-status');
  if (complaintStatus) {
    const status = complaintData.CurrentStatus || 'جديدة';
    complaintStatus.textContent = status;
    complaintStatus.setAttribute('data-ar', status);
    complaintStatus.setAttribute('data-en', status);
  }

  // تحديث بيانات مقدم البلاغ 
  updateComplainantInfo();

  // تحديث تفاصيل البلاغ 
  updateComplaintInfo();

  // تحديث المرفقات
  updateAttachments();

  // تحديث الرد على البلاغ 
  updateResponse();

  // تحديث سجل التاريخ
  updateHistory();

  // تحديث اللغة للعناصر الجديدة
  applyLanguage(currentLang);
}

// تحديث بيانات مقدم البلاغ 

function updateComplainantInfo() {
  // الاسم
  const patientNameElement = document.getElementById('patientName');
  if (patientNameElement) {
    const patientName =
      complaintData.PatientName ||
      complaintData.patientName ||
      complaintData.FullName ||
      complaintData.fullName ||
      'غير محدد';
    patientNameElement.textContent = patientName;
  }

  // رقم الهوية
  const nationalIdElement = document.getElementById('nationalId');
  if (nationalIdElement) {
    nationalIdElement.textContent =
      complaintData.NationalID_Iqama ||
      complaintData.nationalId ||
      'غير محدد';
  }

  // رقم الملف الطبي (حقيقي، ليس رقم الهوية)
  const medicalFileElement = document.getElementById('medicalFileNumber');
  if (medicalFileElement) {
    const fileNo =
      complaintData.FileNumber ||
      (complaintData.Patient && (complaintData.Patient.FileNumber || complaintData.Patient.fileNumber)) ||
      complaintData.fileNumber ||
      localStorage.getItem('patientFileNumber') ||
      '';
    medicalFileElement.textContent =
      fileNo && String(fileNo).trim() !== '' ? fileNo : 'لا يوجد رقم ملف';
  }

  // رقم الجوال
  const mobileElement = document.getElementById('mobileNumber');
  if (mobileElement) {
    mobileElement.textContent = complaintData.ContactNumber || 'غير محدد';
  }
}



// تحديث تفاصيل البلاغ 
function updateComplaintInfo() {
  // تحديث القسم المرتبط
  const departmentElement = document.getElementById('departmentName');
  if (departmentElement) {
    departmentElement.textContent = complaintData.DepartmentName || 'غير محدد';
  }
  
  // تحديث تاريخ الزيارة مع الوقت
  const visitDateElement = document.getElementById('visitDate');
  if (visitDateElement) {
    const visitDate = new Date(complaintData.ComplaintDate);
    const formattedVisitDate = visitDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const formattedVisitTime = visitDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    visitDateElement.innerHTML = `${formattedVisitDate}<br><small style="color: #666;">${formattedVisitTime}</small>`;
  }
  
  // تحديث نوع البلاغ  الرئيسي
  const complaintTypeElement = document.getElementById('complaintTypeName');
  if (complaintTypeElement) {
    complaintTypeElement.textContent = complaintData.ComplaintTypeName || 'غير محدد';
  }
  
  // تحديث البلاغ  الفرعية
  const subTypeElement = document.getElementById('subTypeName');
  if (subTypeElement) {
    subTypeElement.textContent = complaintData.SubTypeName || 'غير محدد';
  }

  // تحديث تفاصيل البلاغ 
  const detailsElement = document.getElementById('complaintDetails');
  if (detailsElement) {
    detailsElement.textContent = complaintData.ComplaintDetails || 'لا توجد تفاصيل';
  }
}

// تحديث المرفقات
function updateAttachments() {
  const attachmentBox = document.querySelector('.attachment-box');
  if (attachmentBox) {
    // إذا كانت هناك مرفقات في البيانات
    if (complaintData.attachments && complaintData.attachments.length > 0) {
      const attachmentsHTML = complaintData.attachments.map(attachment => {
        const fileUrl = `http://localhost:3001/uploads/${attachment.path}`;
        const isImage = attachment.type && attachment.type.startsWith('image/');
        
        return `
          <div class="attachment-file">
            <i class="ri-${isImage ? 'image-line' : 'file-text-line'}"></i>
            <span>${attachment.name}</span>
            <small>(${(attachment.size / 1024 / 1024).toFixed(2)} MB)</small>
          </div>
          <div class="attachment-actions">
            <button onclick="previewAttachment('${fileUrl}', '${attachment.name}', '${attachment.type}')">
              <i class="ri-eye-line"></i>
              <span data-ar="معاينة" data-en="Preview">معاينة</span>
            </button>
            <button onclick="downloadFile('${fileUrl}', '${attachment.name}')">
              <i class="ri-download-2-line"></i>
              <span data-ar="تحميل" data-en="Download">تحميل</span>
            </button>
          </div>
        `;
      }).join('');
      
      attachmentBox.innerHTML = attachmentsHTML;
    } else {
      // رسالة إذا لم تكن هناك مرفقات
      attachmentBox.innerHTML = `
        <div class="attachment-file">
          <i class="ri-inbox-line"></i>
          <span data-ar="لا توجد مرفقات" data-en="No attachments">لا توجد مرفقات</span>
        </div>
      `;
    }
  }
}

// تحديث الرد على البلاغ 
function updateResponse() {
  const replyBox = document.querySelector('.reply-box');
  if (replyBox) {
    // إذا كان هناك رد في البيانات
    if (complaintData.ResolutionDetails) {
      const replyDate = complaintData.ResolutionDate ? new Date(complaintData.ResolutionDate) : new Date();
      const formattedReplyDate = replyDate.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedReplyTime = replyDate.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const fullReplyDateTime = `${formattedReplyDate} - الساعة ${formattedReplyTime}`;

      replyBox.innerHTML = `
        <div class="reply-header">
          <span class="reply-from" data-ar="إدارة تجربة المريض" data-en="Patient Experience Department">إدارة تجربة المريض</span>
          <span class="reply-date">${fullReplyDateTime}</span>
        </div>
        <div class="reply-text">${complaintData.ResolutionDetails}</div>
        <span class="reply-status" data-ar="تم الرد" data-en="Responded">تم الرد</span>
      `;
    } else {
      // إذا لم يكن هناك رد بعد
      replyBox.innerHTML = `
        <div class="reply-header">
          <span class="reply-from" data-ar="إدارة تجربة المريض" data-en="Patient Experience Department">إدارة تجربة المريض</span>
          <span class="reply-date" data-ar="قيد المعالجة" data-en="Under Processing">قيد المعالجة</span>
        </div>
        <div class="reply-text" data-ar="سيتم الرد على بلاغك في أقرب وقت ممكن" data-en="Your report will be responded to as soon as possible">
          سيتم الرد على بلاغك في أقرب وقت ممكن
        </div>
        <span class="reply-status" data-ar="قيد المعالجة" data-en="Under Processing">قيد المعالجة</span>
      `;
    }
  }
}

// تحديث سجل التاريخ
function updateHistory() {
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer || !complaintData.history) return;

  if (complaintData.history.length === 0) {
    historyContainer.innerHTML = `
      <div class="history-item">
        <div class="history-text" data-ar="لا يوجد سجل تاريخ لهذا البلاغ" data-en="No history available for this report">
          لا يوجد سجل تاريخ لهذا البلاغ
        </div>
      </div>
    `;
    return;
  }

  const historyHTML = complaintData.history.map(item => {
    const timestamp = new Date(item.Timestamp);
    const formattedHistoryDate = timestamp.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedHistoryTime = timestamp.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const fullHistoryDateTime = `${formattedHistoryDate} - الساعة ${formattedHistoryTime}`;

    return `
      <div class="history-item">
        <div class="history-header">
          <span class="history-stage">${item.Stage}</span>
          <span class="history-date">${fullHistoryDateTime}</span>
        </div>
        <div class="history-text">${item.Remarks}</div>
        ${item.EmployeeName ? `<div class="history-employee">بواسطة: ${item.EmployeeName}</div>` : ''}
        ${item.OldStatus && item.NewStatus ? `
          <div class="history-status-change">
            <span class="status-change">${item.OldStatus} → ${item.NewStatus}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  historyContainer.innerHTML = historyHTML;
}

// وظائف إضافية
function previewAttachment(url, filename, type) {
  if (url) {
    if (type && type.startsWith('image/')) {
      // فتح الصورة في نافذة جديدة
      window.open(url, '_blank');
    } else if (type === 'application/pdf') {
      // فتح PDF في نافذة جديدة
      window.open(url, '_blank');
    } else {
      alert("لا يمكن معاينة هذا النوع من الملفات. يرجى تحميله.");
    }
  } else {
    alert("لا يمكن معاينة المرفق في الوقت الحالي");
  }
}

function downloadFile(url, filename) {
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'مرفق_البلاغ ';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("لا يمكن تحميل المرفق في الوقت الحالي");
  }
}

// function reopenComplaint() {
//   if (confirm("هل تريد إعادة فتح هذه البلاغ ؟")) {
//     // هنا يمكن إضافة منطق إعادة فتح البلاغ 
//     alert("تم إرسال طلب إعادة فتح البلاغ ");
//   }
// }
async function reopenComplaint() {
  if (!complaintData || !complaintData.ComplaintID) {
    alert('لا يمكن تحديد رقم البلاغ .');
    return;
  }

  if (!confirm("هل تريد إعادة فتح هذا البلاغ؟")) return;

  const btn = document.querySelector('.reopen-btn');
  const oldHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i>
                     <span data-ar="جاري الإرسال..." data-en="Sending...">جاري الإرسال...</span>`;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/complaints/reopen/${complaintData.ComplaintID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        note: 'طلب إعادة فتح من صفحة التفاصيل'
      })
    });

    const data = await res.json();
    if (data.success) {
      // إشعار للمستخدم
      showStatusUpdateNotification(complaintData.CurrentStatus || '—', 'إعادة فتح (طلب)');
      alert('تم إرسال إشعارات إعادة فتح البلاغ إلى القسم المسؤول والسوبر أدمن.');

      // (اختياري) عدّل الحالة الظاهرة مؤقتًا
      updateComplaintStatusInDetails('قيد المراجعة');
    } else {
      alert(data.message || 'فشل إرسال طلب إعادة الفتح');
    }
  } catch (e) {
    console.error('reopen error:', e);
    alert('حدث خطأ أثناء إرسال الطلب');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }
}


function goBack() {
  window.history.back();
}

// دالة طباعة تفاصيل البلاغ
function printComplaintDetails() {
  if (!complaintData) {
    alert('لا توجد بيانات للطباعة');
    return;
  }

  // إضافة تاريخ الطباعة للبطاقة
  const complaintCard = document.querySelector('.complaint-card');
  if (complaintCard) {
    const currentDate = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    complaintCard.setAttribute('data-print-date', currentDate);
  }

  // إضافة عنوان الصفحة للطباعة
  const originalTitle = document.title;
  const complaintNumber = String(complaintData.ComplaintID).padStart(6, '0');
  document.title = `تفاصيل البلاغ رقم #${complaintNumber}`;

  // إضافة CSS للطباعة إذا لم يكن موجوداً
  if (!document.getElementById('print-styles')) {
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .complaint-card, .complaint-card * {
          visibility: visible;
        }
        .complaint-card {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(printStyles);
  }

  // طباعة الصفحة
  window.print();

  // استعادة العنوان الأصلي بعد الطباعة
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

// تطبيق اللغة
// مراقبة تحديثات حالة البلاغات
function listenForStatusUpdates() {
  // مراقبة تغيير localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === 'complaintStatusUpdated') {
      const updateData = JSON.parse(e.newValue);
      if (updateData && updateData.complaintId && complaintData && complaintData.ComplaintID === updateData.complaintId) {
        console.log('تم اكتشاف تحديث حالة البلاغ  في التفاصيل:', updateData);
        updateComplaintStatusInDetails(updateData.newStatus);
      }
    }
  });

  // مراقبة التحديثات في نفس النافذة
  setInterval(() => {
    const updateData = localStorage.getItem('complaintStatusUpdated');
    if (updateData) {
      const parsed = JSON.parse(updateData);
      const timeDiff = Date.now() - parsed.timestamp;
      
      // إذا كان التحديث حديث وللبلاغ  المعروضة حالياً
      if (timeDiff < 5000 && !window.complaintStatusUpdateProcessed && 
          complaintData && complaintData.ComplaintID === parsed.complaintId) {
        console.log('تم اكتشاف تحديث حالة محلي في التفاصيل:', parsed);
        updateComplaintStatusInDetails(parsed.newStatus);
        window.complaintStatusUpdateProcessed = true;
        
        // إزالة العلامة بعد 10 ثواني
        setTimeout(() => {
          window.complaintStatusUpdateProcessed = false;
        }, 10000);
      }
    }
  }, 1000);
}

// تحديث حالة البلاغ  في صفحة التفاصيل
function updateComplaintStatusInDetails(newStatus) {
  if (!complaintData) return;

  const oldStatus = complaintData.CurrentStatus;
  
  // تحديث البيانات
  complaintData.CurrentStatus = newStatus;

  // تحديث العرض في الواجهة
  const complaintStatus = document.querySelector('.complaint-status');
  if (complaintStatus) {
    complaintStatus.textContent = newStatus;
    complaintStatus.setAttribute('data-ar', newStatus);
    complaintStatus.setAttribute('data-en', newStatus); // يمكن إضافة الترجمة لاحقاً
  }

  // تحديث localStorage
  localStorage.setItem("selectedComplaint", JSON.stringify(complaintData));

  // إظهار رسالة تنبيه للمستخدم
  showStatusUpdateNotification(oldStatus, newStatus);

  console.log(`تم تحديث حالة البلاغ في صفحة التفاصيل من "${oldStatus}" إلى "${newStatus}"`);
}

// إظهار رسالة تنبيه عن تحديث الحالة
function showStatusUpdateNotification(oldStatus, newStatus) {
  // إنشاء رسالة تنبيه مؤقتة
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: 'Tajawal', sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <strong>تم تحديث حالة البلاغ</strong><br>
    من: ${oldStatus}<br>
    إلى: <strong>${newStatus}</strong>
  `;

  // إضافة CSS للرسوم المتحركة
  if (!document.getElementById('notification-style')) {
    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // إزالة الرسالة بعد 4 ثواني
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
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

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);

  const toggleBtn = document.getElementById('langToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newLang = currentLang === 'ar' ? 'en' : 'ar';
      applyLanguage(newLang);
    });
  }

  // بدء مراقبة تحديثات الحالة
  listenForStatusUpdates();

  // تحميل تفاصيل البلاغ 
  loadComplaintDetails();
});





