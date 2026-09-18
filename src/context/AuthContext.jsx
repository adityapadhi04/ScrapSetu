import React, { createContext, useContext, useState, useEffect } from 'react';

export const ROLES = {
  COLLECTOR: 'COLLECTOR',
  REPAIR_SHOP: 'REPAIR_SHOP',
  RECYCLER: 'RECYCLER',
  ADMIN: 'ADMIN'
};

export const ROLE_CONFIG = {
  COLLECTOR: {
    key: 'COLLECTOR',
    label: 'Collector',
    vernacularLabel: 'कबाड़ीवाला / भंगारवाला',
    badgeVariant: 'success',
    path: '/collector',
    themeColor: '#15803d',
    demoUser: {
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      area: 'Dharavi Sector 3, Mumbai',
      rating: 4.8,
      verified: true
    }
  },
  RECYCLER: {
    key: 'RECYCLER',
    label: 'Authorized Recycler',
    vernacularLabel: 'अधिकृत रिसायकलर',
    badgeVariant: 'info',
    path: '/recycler',
    themeColor: '#0284c7',
    demoUser: {
      name: 'EcoGreen E-Waste Recyclers Pvt Ltd',
      cpcbRegNo: 'CPCB/EW/MH/2024/0981',
      facility: 'MIDC Rabale, Navi Mumbai',
      authorized: true
    }
  },
  REPAIR_SHOP: {
    key: 'REPAIR_SHOP',
    label: 'Repair Shop',
    vernacularLabel: 'रिपेयर शॉप / पार्ट्स खरेदीदार',
    badgeVariant: 'warning',
    path: '/repair-shop',
    themeColor: '#d97706',
    demoUser: {
      name: 'Om Electronics & Laptop Care',
      owner: 'Mahesh Sharma',
      location: 'Lamington Road, Mumbai',
      specialty: 'Laptop Motherboards & Displays'
    }
  },
  ADMIN: {
    key: 'ADMIN',
    label: 'Platform Admin',
    vernacularLabel: 'प्रशासक',
    badgeVariant: 'neutral',
    path: '/admin',
    themeColor: '#0f172a',
    demoUser: {
      name: 'ScrapSetu Governance & CPCB Liaison',
      email: 'admin@scrapsetu.in',
      role: 'Super Admin'
    }
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Read active role and preferences from localStorage for offline/reload persistence
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('scrapsetu_role') || ROLES.COLLECTOR;
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('scrapsetu_lang') || 'en';
  });

  const [isAudioActive, setIsAudioActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('scrapsetu_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('scrapsetu_lang', language);
  }, [language]);

  const switchRole = (newRole) => {
    if (ROLE_CONFIG[newRole]) {
      setCurrentRole(newRole);
    }
  };

  const toggleAudio = () => {
    setIsAudioActive((prev) => !prev);
  };

  const currentUser = ROLE_CONFIG[currentRole]?.demoUser || null;

  const value = {
    currentRole,
    currentUser,
    switchRole,
    setRole: switchRole,
    language,
    setLanguage,
    isAudioActive,
    toggleAudio
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
