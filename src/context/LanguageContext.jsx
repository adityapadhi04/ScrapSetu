import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STRINGS, SUPPORTED_LANGUAGES } from '../locales/strings';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  // Read saved language from localStorage on startup; default to English
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('scrapsetu_language') || localStorage.getItem('scrapsetu_lang');
    return (saved && STRINGS[saved]) ? saved : 'en';
  });

  // Keep localStorage synced whenever language changes
  useEffect(() => {
    localStorage.setItem('scrapsetu_language', currentLanguage);
    localStorage.setItem('scrapsetu_lang', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = useCallback((langCode) => {
    if (STRINGS[langCode]) {
      setCurrentLanguage(langCode);
      localStorage.setItem('scrapsetu_language', langCode);
      localStorage.setItem('scrapsetu_lang', langCode);
    }
  }, []);

  // Central translation function t(key, fallback)
  const t = useCallback((key, fallback) => {
    const activeDict = STRINGS[currentLanguage] || STRINGS.en;
    if (activeDict && activeDict[key] !== undefined) {
      return activeDict[key];
    }
    const fallbackDict = STRINGS.en;
    if (fallbackDict && fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    return fallback !== undefined ? fallback : key;
  }, [currentLanguage]);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const value = {
    currentLanguage,
    language: currentLanguage,
    setLanguage,
    t,
    translate: t,
    currentLangObj,
    supportedLanguages: SUPPORTED_LANGUAGES,
    strings: STRINGS[currentLanguage] || STRINGS.en
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
