/**
 * شريط تبديل المستخدم - يظهر زر العودة عندما يكون المستخدم في وضع التبديل
 */

// التحقق من وجود تبديل مستخدم وإضافة شريط العودة
function checkAndShowImpersonationBanner() {
  if (isImpersonating()) {
    showImpersonationBanner();
  } else {
    hideImpersonationBanner();
  }
}

// إظهار شريط تبديل المستخدم
function showImpersonationBanner() {
  // التحقق من وجود الشريط مسبقاً
  if (document.getElementById('impersonation-banner')) {
    return;
  }

  // إنشاء الشريط
  const banner = document.createElement('div');
  banner.id = 'impersonation-banner';
  banner.className = 'impersonation-banner';
  banner.innerHTML = `
    <div class="impersonation-content">
      <div class="impersonation-info">
        <i class="fas fa-user-shield"></i>
        <span>أنت حالياً في حساب مستخدم آخر</span>
      </div>
      <button class="impersonation-btn" onclick="safeEndImpersonation()">
        <i class="fas fa-arrow-left"></i>
        <span>العودة إلى حسابك</span>
      </button>
    </div>
  `;

  // إضافة CSS للشريط
  const style = document.createElement('style');
  style.textContent = `
    .impersonation-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 2px 20px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-family: 'Tajawal', sans-serif;
      height: 24px;
    }
    
    .impersonation-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .impersonation-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      font-size: 11px;
    }
    
    .impersonation-info i {
      font-size: 12px;
    }
    
    .impersonation-btn {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-weight: 600;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: all 0.3s ease;
    }
    
    .impersonation-btn:hover {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.5);
      transform: translateY(-1px);
    }
    
    .impersonation-btn i {
      font-size: 10px;
    }
    
    /* تعديل المساحة العلوية للصفحة */
    body.impersonating {
      padding-top: 24px;
    }
    
    /* تعديل الهيدر إذا كان موجود */
    .header.impersonating {
      top: 24px;
    }
  `;

  // إضافة الشريط والستايل للصفحة
  document.head.appendChild(style);
  document.body.insertBefore(banner, document.body.firstChild);
  
  // إضافة كلاس للجسم
  document.body.classList.add('impersonating');
  
  // تعديل موضع الهيدر إذا كان موجود
  const header = document.querySelector('.header');
  if (header) {
    header.classList.add('impersonating');
  }
  
  console.log('✅ تم إظهار شريط تبديل المستخدم');
}

// إخفاء شريط تبديل المستخدم
function hideImpersonationBanner() {
  const banner = document.getElementById('impersonation-banner');
  if (banner) {
    banner.remove();
  }
  
  // إزالة كلاس من الجسم
  document.body.classList.remove('impersonating');
  
  // إزالة كلاس من الهيدر
  const header = document.querySelector('.header');
  if (header) {
    header.classList.remove('impersonating');
  }
  
  console.log('✅ تم إخفاء شريط تبديل المستخدم');
}

// تشغيل التحقق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // انتظار قليل للتأكد من تحميل auth-helpers.js
  setTimeout(checkAndShowImpersonationBanner, 100);
});

// دالة آمنة لإنهاء التبديل
async function safeEndImpersonation() {
  try {
    // إظهار رسالة تحميل
    const btn = document.querySelector('.impersonation-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>جاري العودة...</span>';
      btn.disabled = true;
    }
    
    // محاولة إنهاء التبديل
    await endImpersonation();
    
  } catch (e) {
    console.error('❌ خطأ في إنهاء التبديل:', e);
    
    // استعادة الزر
    const btn = document.querySelector('.impersonation-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-arrow-left"></i><span>العودة إلى حسابك</span>';
      btn.disabled = false;
    }
    
    // محاولة استعادة البيانات المحفوظة مباشرة
    const rootToken = localStorage.getItem('rootToken');
    const rootUser = localStorage.getItem('rootUser');
    
    if (rootToken && rootUser) {
      console.log('🔄 محاولة استعادة الحساب الأصلي مباشرة...');
      localStorage.setItem('token', rootToken);
      localStorage.setItem('user', rootUser);
      localStorage.removeItem('rootToken');
      localStorage.removeItem('rootUser');
      
      // إخفاء الشريط
      hideImpersonationBanner();
      
      // إعادة توجيه
      window.location.href = '/superadmin/superadmin-home.html';
    } else {
      alert('حدث خطأ في العودة للحساب الأصلي. يرجى تسجيل الدخول مرة أخرى.');
    }
  }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAndShowImpersonationBanner,
    showImpersonationBanner,
    hideImpersonationBanner,
    safeEndImpersonation
  };
}
