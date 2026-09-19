/**
 * ScrapSetu — Centralized Demo User Configuration
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * These are DEMO credentials for frontend evaluation and SIH demonstration only.
 * Real authentication, password hashing, and authorization will be handled
 * server-side in future modules. Real credentials or passwords should NEVER be
 * stored in frontend client code or persistent storage.
 */

export const ACCOUNT_ROLES = {
  COLLECTOR: 'collector',
  REPAIR: 'repair',
  RECYCLER: 'recycler',
  ADMIN: 'admin'
};

export const ROLE_PATHS = {
  collector: '/collector',
  repair: '/repair-shop',
  recycler: '/recycler',
  admin: '/admin'
};

export const DEMO_USERS = {
  collector: {
    id: 'usr-collector-01',
    email: 'collector@scrapsetu.demo',
    password: 'collector123',
    name: 'Ramesh Kumar',
    displayName: 'Informal Scrap Collector',
    roleNameKey: 'collectorName',
    role: 'collector',
    dashboardPath: '/collector',
    iconPrefix: '📱',
    badgeVariant: 'success',
    themeColor: '#15803d',
    meta: {
      phone: '+91 98765 43210',
      area: 'Dharavi Sector 3, Mumbai',
      rating: 4.8,
      verified: true
    }
  },
  repair: {
    id: 'usr-repair-01',
    email: 'repair@scrapsetu.demo',
    password: 'repair123',
    name: 'Om Electronics & Laptop Care',
    owner: 'Mahesh Sharma',
    displayName: 'Repair Shop',
    roleNameKey: 'repairName',
    role: 'repair',
    dashboardPath: '/repair-shop',
    iconPrefix: '🔧',
    badgeVariant: 'warning',
    themeColor: '#d97706',
    meta: {
      location: 'Lamington Road, Mumbai',
      regNo: 'SE-84910/MUM',
      specialty: 'Laptop Motherboards & Displays'
    }
  },
  recycler: {
    id: 'usr-recycler-01',
    email: 'recycler@scrapsetu.demo',
    password: 'recycler123',
    name: 'EcoGreen E-Waste Recyclers Pvt Ltd',
    displayName: 'Authorized Recycler',
    roleNameKey: 'recyclerName',
    role: 'recycler',
    dashboardPath: '/recycler',
    iconPrefix: '♻',
    badgeVariant: 'info',
    themeColor: '#0284c7',
    meta: {
      cpcbRegNo: 'CPCB/EW/MH/2024/0981',
      facility: 'MIDC Rabale, Navi Mumbai',
      authorized: true
    }
  },
  admin: {
    id: 'usr-admin-01',
    email: 'admin@scrapsetu.demo',
    password: 'admin123',
    name: 'CPCB Governance & Admin Cell',
    displayName: 'Administrator',
    roleNameKey: 'adminName',
    role: 'admin',
    dashboardPath: '/admin',
    iconPrefix: '🛡',
    badgeVariant: 'neutral',
    themeColor: '#0f172a',
    meta: {
      department: 'Central Pollution Control Board E-Waste Cell',
      role: 'Super Administrator'
    }
  }
};

/**
 * Normalizes any legacy or variant role string to standard lowercase:
 * 'collector' | 'repair' | 'recycler' | 'admin'
 */
export const normalizeRole = (role) => {
  if (!role) return 'collector';
  const lower = String(role).toLowerCase().replace(/_/g, '-');
  if (lower.includes('collector')) return 'collector';
  if (lower.includes('repair')) return 'repair';
  if (lower.includes('recycler')) return 'recycler';
  if (lower.includes('admin')) return 'admin';
  return 'collector';
};

/**
 * Validates demo credentials against configured demo accounts.
 * Returns non-sensitive session user object without passwords on success, or null on failure.
 */
export const authenticateDemoUser = (email, password) => {
  if (!email || !password) {
    return { success: false, error: 'Missing credentials' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  const matchedKey = Object.keys(DEMO_USERS).find((k) => {
    return DEMO_USERS[k].email.toLowerCase() === cleanEmail;
  });

  if (!matchedKey) {
    return { success: false, error: 'Invalid email or password' };
  }

  const demoUser = DEMO_USERS[matchedKey];
  if (demoUser.password !== cleanPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Return safe session user object (NEVER INCLUDE PASSWORD)
  return {
    success: true,
    user: {
      userId: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      displayName: demoUser.displayName,
      role: demoUser.role,
      roleNameKey: demoUser.roleNameKey,
      dashboardPath: demoUser.dashboardPath,
      iconPrefix: demoUser.iconPrefix,
      meta: demoUser.meta
    }
  };
};

/**
 * Retrieve demo user by role (used for demo account switching)
 */
export const getDemoUserByRole = (role) => {
  const norm = normalizeRole(role);
  const demoUser = DEMO_USERS[norm] || DEMO_USERS.collector;
  return {
    userId: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    displayName: demoUser.displayName,
    role: demoUser.role,
    roleNameKey: demoUser.roleNameKey,
    dashboardPath: demoUser.dashboardPath,
    iconPrefix: demoUser.iconPrefix,
    meta: demoUser.meta
  };
};
