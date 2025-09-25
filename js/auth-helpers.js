/**
 * مساعدات التوثيق - استخراج بيانات المستخدم الحالي
 * يوحد طريقة قراءة EmployeeID من مصادر مختلفة
 */

/**
 * استخراج رقم الموظف الحالي من localStorage أو التوكن
 * @returns {number|null} رقم الموظف أو null إذا لم يوجد
 */
function getCurrentEmployeeId() {
  try {
    // أولاً: جرب قراءة من localStorage.user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const fromUser = Number(user?.EmployeeID ?? user?.employeeId ?? user?.id);
    if (Number.isInteger(fromUser) && fromUser > 0) {
      console.log('🔍 EmployeeID من localStorage.user:', fromUser);
      return fromUser;
    }

    // ثانياً: جرب قراءة من التوكن
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ لا يوجد token في localStorage');
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '')) || {};
      const fromToken = Number(payload?.EmployeeID ?? payload?.employeeId ?? payload?.id);
      if (Number.isInteger(fromToken) && fromToken > 0) {
        console.log('🔍 EmployeeID من token:', fromToken);
        return fromToken;
      }
    } catch (tokenError) {
      console.error('❌ خطأ في فك تشفير التوكن:', tokenError);
    }

    console.log('❌ لم يتم العثور على EmployeeID صالح');
    return null;
  } catch (error) {
    console.error('❌ خطأ في getCurrentEmployeeId:', error);
    return null;
  }
}

/**
 * استخراج بيانات المستخدم الحالي كاملة
 * @returns {object|null} بيانات المستخدم أو null إذا لم توجد
 */
function getCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && Object.keys(user).length > 0) {
      return user;
    }
    return null;
  } catch (error) {
    console.error('❌ خطأ في getCurrentUser:', error);
    return null;
  }
}

/**
 * استخراج رقم الدور الحالي
 * @returns {number|null} رقم الدور أو null إذا لم يوجد
 */
function getCurrentRoleId() {
  try {
    const user = getCurrentUser();
    if (user) {
      const roleId = Number(user?.RoleID ?? user?.roleId);
      if (Number.isInteger(roleId) && roleId > 0) {
        return roleId;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ خطأ في getCurrentRoleId:', error);
    return null;
  }
}

/**
 * التحقق من كون المستخدم الحالي سوبر أدمن
 * @returns {boolean}
 */
function isCurrentUserSuperAdmin() {
  return getCurrentRoleId() === 1;
}

/**
 * التحقق من وجود تبديل مستخدم نشط
 * @returns {boolean}
 */
function isImpersonating() {
  try {
    const rootToken = localStorage.getItem('rootToken');
    const rootUser = localStorage.getItem('rootUser');
    return !!(rootToken && rootUser);
  } catch (error) {
    console.error('❌ خطأ في التحقق من التبديل:', error);
    return false;
  }
}

/**
 * إنهاء تبديل المستخدم والعودة للحساب الأصلي
 */
async function endImpersonation() {
  try {
    // التحقق من وجود بيانات السوبر أدمن الأصلية
    const rootToken = localStorage.getItem('rootToken');
    const rootUser = localStorage.getItem('rootUser');
    
    if (!rootToken || !rootUser) {
      console.log('⚠️ لا توجد بيانات سوبر أدمن محفوظة، محاولة إنهاء التبديل عبر API...');
      
      // محاولة إنهاء التبديل عبر API
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/users/impersonate/end', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No active impersonation');
      }
      
      // إعادة توجيه لصفحة السوبر أدمن
      window.location.href = '/superadmin/superadmin-home.html';
      return;
    }
    
    console.log('✅ تم العثور على بيانات السوبر أدمن الأصلية، استعادة الحساب...');
    
    // استعادة بيانات السوبر أدمن الأصلية مباشرة
    localStorage.setItem('token', rootToken);
    localStorage.setItem('user', rootUser);
    localStorage.removeItem('rootToken');
    localStorage.removeItem('rootUser');
    
    // إخفاء شريط التبديل
    if (typeof hideImpersonationBanner === 'function') {
      hideImpersonationBanner();
    }
    
    // إعادة توجيه لصفحة السوبر أدمن
    window.location.href = '/superadmin/superadmin-home.html';
    
  } catch (e) {
    console.error('❌ خطأ في إنهاء التبديل:', e);
    
    // في حالة الخطأ، محاولة استعادة البيانات المحفوظة
    const rootToken = localStorage.getItem('rootToken');
    const rootUser = localStorage.getItem('rootUser');
    
    if (rootToken && rootUser) {
      console.log('🔄 محاولة استعادة الحساب الأصلي رغم الخطأ...');
      localStorage.setItem('token', rootToken);
      localStorage.setItem('user', rootUser);
      localStorage.removeItem('rootToken');
      localStorage.removeItem('rootUser');
      window.location.href = '/superadmin/superadmin-home.html';
    } else {
      alert('حدث خطأ في العودة للحساب الأصلي: ' + e.message);
    }
  }
}

/**
 * توحيد بيانات المستخدم بعد الـ impersonate
 * @param {object} userData - بيانات المستخدم من الـ API
 * @returns {object} بيانات موحدة
 */
function normalizeUserData(userData) {
  if (!userData) return {};
  
  return {
    EmployeeID: Number(userData.EmployeeID ?? userData.employeeId ?? userData.id ?? 0),
    RoleID: Number(userData.RoleID ?? userData.roleId ?? 0),
    DepartmentID: userData.DepartmentID ?? userData.departmentId ?? null,
    Username: userData.Username ?? userData.username ?? '',
    FullName: userData.FullName ?? userData.fullName ?? '',
    Email: userData.Email ?? userData.email ?? ''
  };
}

/**
 * حفظ بيانات المستخدم الموحدة في localStorage
 * @param {object} userData - بيانات المستخدم
 */
function saveNormalizedUser(userData) {
  try {
    const normalized = normalizeUserData(userData);
    localStorage.setItem('user', JSON.stringify(normalized));
    console.log('✅ تم حفظ بيانات المستخدم الموحدة:', normalized);
  } catch (error) {
    console.error('❌ خطأ في حفظ بيانات المستخدم:', error);
  }
}

// تصدير الدوال للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentEmployeeId,
    getCurrentUser,
    getCurrentRoleId,
    isCurrentUserSuperAdmin,
    normalizeUserData,
    saveNormalizedUser
  };
}
