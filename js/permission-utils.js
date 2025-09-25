// Permission utilities for super admin bypass
// This file provides shared functions for handling permissions across the application

/**
 * Check if the current user is a super admin (RoleID = 1)
 * @returns {boolean} True if user is super admin
 */
function isSuperAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const roleId = Number(user?.RoleID || user?.roleId || 0);
  return roleId === 1;
}

/**
 * Apply permissions to UI elements with super admin bypass for department management
 * @param {string} API_BASE_URL - Base URL for API calls
 * @param {string} token - Authentication token
 */
async function applyPermissionsToUI(API_BASE_URL = '', token = null) {
  try {
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    if (!token) {
      console.warn('No token found, hiding permission-gated elements');
      document.querySelectorAll('.permission-gated').forEach(el => {
        el.style.display = 'none';
      });
      return;
    }

    // Super Admin bypass: show all department management elements
    if (isSuperAdmin()) {
      console.log('🔑 Super Admin detected - showing all department management elements');
      document.querySelectorAll('.permission-gated').forEach(el => {
        const perm = el.dataset.permission;
        if (perm === 'add_department' || perm === 'edit_department' || perm === 'delete_department') {
          el.style.display = '';
          console.log(`✅ Super Admin - showing element with permission: ${perm}`);
        }
      });
      return;
    }

    // For non-super admins, check permissions from server
    const res = await fetch(`${API_BASE_URL}/api/auth/me/permissions`, { 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const { data } = await res.json();
    const permissions = data?.permissions || [];

    console.log('🔍 Loaded permissions:', permissions);

    // Apply permission gating
    document.querySelectorAll('.permission-gated').forEach(el => {
      const perm = el.dataset.permission;
      if (permissions.includes(perm)) {
        el.style.display = '';
        console.log(`✅ Showing element with permission: ${perm}`);
      } else {
        el.style.display = 'none';
        console.log(`❌ Hiding element with permission: ${perm}`);
      }
    });
  } catch (e) {
    console.error('❌ Failed to load permissions:', e);
    // Default to hiding permission-gated elements for security
    document.querySelectorAll('.permission-gated').forEach(el => {
      el.style.display = 'none';
    });
  }
}

/**
 * Check if user has a specific permission (with super admin bypass for department permissions)
 * @param {string} permission - Permission to check
 * @param {Array} userPermissions - Array of user permissions (optional, will fetch if not provided)
 * @returns {boolean} True if user has permission
 */
async function hasPermission(permission, userPermissions = null) {
  // Super Admin bypass for department management permissions
  if (isSuperAdmin() && ['add_department', 'edit_department', 'delete_department'].includes(permission)) {
    return true;
  }

  // If permissions not provided, fetch them
  if (!userPermissions) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const API_BASE = (/:5502|:5503/.test(location.href)) ? 'http://localhost:3001' : '';
      const res = await fetch(`${API_BASE}/api/auth/me/permissions`, { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) return false;
      
      const { data } = await res.json();
      userPermissions = data?.permissions || [];
    } catch (e) {
      console.error('❌ Failed to fetch permissions:', e);
      return false;
    }
  }

  return userPermissions.includes(permission);
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isSuperAdmin,
    applyPermissionsToUI,
    hasPermission
  };
}
