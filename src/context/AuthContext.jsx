import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { 
  DEMO_USERS, 
  ROLE_PATHS, 
  normalizeRole, 
  authenticateDemoUser, 
  getDemoUserByRole 
} from '../data/demoUsers';

export const ROLES = {
  COLLECTOR: 'collector',
  REPAIR_SHOP: 'repair',
  REPAIR: 'repair',
  RECYCLER: 'recycler',
  ADMIN: 'admin'
};

export const ROLE_CONFIG = {
  collector: {
    key: 'collector',
    labelKey: 'collectorName',
    label: 'Informal Scrap Collector',
    vernacularLabel: 'कबाड़ीवाला / भंगारवाला',
    badgeVariant: 'success',
    path: '/collector',
    themeColor: '#15803d',
    demoUser: DEMO_USERS.collector
  },
  COLLECTOR: {
    key: 'collector',
    labelKey: 'collectorName',
    label: 'Informal Scrap Collector',
    vernacularLabel: 'कबाड़ीवाला / भंगारवाला',
    badgeVariant: 'success',
    path: '/collector',
    themeColor: '#15803d',
    demoUser: DEMO_USERS.collector
  },
  recycler: {
    key: 'recycler',
    labelKey: 'recyclerName',
    label: 'Authorized Recycler',
    vernacularLabel: 'अधिकृत रिसायकलर',
    badgeVariant: 'info',
    path: '/recycler',
    themeColor: '#0284c7',
    demoUser: DEMO_USERS.recycler
  },
  RECYCLER: {
    key: 'recycler',
    labelKey: 'recyclerName',
    label: 'Authorized Recycler',
    vernacularLabel: 'अधिकृत रिसायकलर',
    badgeVariant: 'info',
    path: '/recycler',
    themeColor: '#0284c7',
    demoUser: DEMO_USERS.recycler
  },
  repair: {
    key: 'repair',
    labelKey: 'repairName',
    label: 'Repair Shop',
    vernacularLabel: 'रिपेयर शॉप / पार्ट्स खरेदीदार',
    badgeVariant: 'warning',
    path: '/repair-shop',
    themeColor: '#d97706',
    demoUser: DEMO_USERS.repair
  },
  REPAIR: {
    key: 'repair',
    labelKey: 'repairName',
    label: 'Repair Shop',
    vernacularLabel: 'रिपेयर शॉप / पार्ट्स खरेदीदार',
    badgeVariant: 'warning',
    path: '/repair-shop',
    themeColor: '#d97706',
    demoUser: DEMO_USERS.repair
  },
  REPAIR_SHOP: {
    key: 'repair',
    labelKey: 'repairName',
    label: 'Repair Shop',
    vernacularLabel: 'रिपेयर शॉप / पार्ट्स खरेदीदार',
    badgeVariant: 'warning',
    path: '/repair-shop',
    themeColor: '#d97706',
    demoUser: DEMO_USERS.repair
  },
  admin: {
    key: 'admin',
    labelKey: 'adminName',
    label: 'Administrator',
    vernacularLabel: 'प्रशासक',
    badgeVariant: 'neutral',
    path: '/admin',
    themeColor: '#0f172a',
    demoUser: DEMO_USERS.admin
  },
  ADMIN: {
    key: 'admin',
    labelKey: 'adminName',
    label: 'Administrator',
    vernacularLabel: 'प्रशासक',
    badgeVariant: 'neutral',
    path: '/admin',
    themeColor: '#0f172a',
    demoUser: DEMO_USERS.admin
  }
};

const AuthContext = createContext(null);

const STORAGE_KEY = 'scrapsetu_auth';

export const AuthProvider = ({ children }) => {
  const { currentLanguage, language, setLanguage, t, translate } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRoleState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Restore authenticated session from localStorage on application mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.isAuthenticated && session.role) {
          const normRole = normalizeRole(session.role);
          const fullDemoUser = getDemoUserByRole(normRole);
          setUser({
            ...fullDemoUser,
            userId: session.userId || fullDemoUser.userId,
            email: session.email || fullDemoUser.email,
            name: session.name || fullDemoUser.name
          });
          setRoleState(normRole);
          setIsAuthenticated(true);
        } else {
          // Corrupted or invalid structure
          localStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
          setUser(null);
          setRoleState(null);
        }
      }
    } catch (e) {
      console.error('Failed to restore ScrapSetu session:', e);
      localStorage.removeItem(STORAGE_KEY);
      setIsAuthenticated(false);
      setUser(null);
      setRoleState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Demo Login Handler
   * Validates credentials against demo users and stores safe session data
   */
  const login = (email, password) => {
    const res = authenticateDemoUser(email, password);
    if (res.success && res.user) {
      const authenticatedUser = res.user;
      const userRole = normalizeRole(authenticatedUser.role);

      setUser(authenticatedUser);
      setRoleState(userRole);
      setIsAuthenticated(true);

      // Persist safe session in localStorage (NEVER store passwords or password hashes!)
      const safeSession = {
        isAuthenticated: true,
        userId: authenticatedUser.userId,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: userRole,
        loginTimestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));

      return { success: true, user: authenticatedUser, path: authenticatedUser.dashboardPath };
    }

    return { success: false, error: res.error || 'Invalid credentials' };
  };

  /**
   * Logout Handler
   * Clears state and removes session from localStorage
   */
  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error removing auth session:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    setRoleState(null);
    return true;
  };

  /**
   * Secure Account Switcher requiring credentials for the target role
   * Validates target role and credentials; keeps current session completely untouched if invalid.
   */
  const switchAccountWithCredentials = (targetRole, email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Invalid account ID or password. Please try again.' };
    }

    const res = authenticateDemoUser(email, password);
    if (!res.success || !res.user) {
      return { success: false, error: 'Invalid account ID or password. Please try again.' };
    }

    // Verify that the authenticated demo user matches the selected targetRole
    const authRole = normalizeRole(res.user.role);
    const targetNorm = normalizeRole(targetRole);

    if (authRole !== targetNorm) {
      return { success: false, error: 'Invalid account ID or password. Please try again.' };
    }

    // Successfully validated: update user, role, and persistent session
    const authenticatedUser = res.user;
    setUser(authenticatedUser);
    setRoleState(authRole);
    setIsAuthenticated(true);

    const safeSession = {
      isAuthenticated: true,
      userId: authenticatedUser.userId,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authRole,
      loginTimestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));

    return { success: true, user: authenticatedUser, path: authenticatedUser.dashboardPath };
  };

  /**
   * Demo Account Switcher (Bypass/helper)
   * Updates active demo user, role, and persistent session
   */
  const switchAccount = (newRole) => {
    const norm = normalizeRole(newRole);
    const newDemoUser = getDemoUserByRole(norm);

    setUser(newDemoUser);
    setRoleState(norm);
    setIsAuthenticated(true);

    const safeSession = {
      isAuthenticated: true,
      userId: newDemoUser.userId,
      email: newDemoUser.email,
      name: newDemoUser.name,
      role: norm,
      loginTimestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSession));

    return newDemoUser.dashboardPath;
  };

  const switchRole = switchAccount;
  const setRole = switchAccount;

  const toggleAudio = () => {
    setIsAudioActive((prev) => !prev);
  };

  const toggleOffline = () => {
    setIsOffline((prev) => !prev);
  };

  // Backward compatibility: currentUser and currentRole
  const currentRole = role || 'collector';
  const currentUser = user || (ROLE_CONFIG[currentRole]?.demoUser) || null;

  const value = {
    isAuthenticated,
    user,
    currentUser,
    role: currentRole,
    currentRole,
    isLoading,
    login,
    logout,
    switchAccount,
    switchAccountWithCredentials,
    switchRole,
    setRole,
    language: currentLanguage,
    currentLanguage,
    setLanguage,
    t,
    translate,
    isAudioActive,
    toggleAudio,
    isOffline,
    toggleOffline
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
