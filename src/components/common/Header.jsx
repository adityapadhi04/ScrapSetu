import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../../locales/strings';

export const Header = () => {
  const { language, setLanguage, isOffline, toggleOffline } = useAuth();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLangOpen(false);
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLangOpen]);

  return (
    <header className="app-header" style={{ padding: '0.75rem 1.5rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* LEFT: ♻ ScrapSetu */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#0f172a'
          }}
        >
          <span style={{ fontSize: '1.45rem', lineHeight: 1 }}>♻</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', letterSpacing: '-0.02em' }}>
            ScrapSetu
          </span>
        </Link>

        {/* RIGHT: Status indicator & Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Subtle System Status Indicator */}
          <button
            type="button"
            onClick={toggleOffline}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '99px',
              border: '1px solid',
              borderColor: isOffline ? '#fde68a' : '#dcfce7',
              background: isOffline ? '#fffbeb' : '#f0fdf4',
              color: isOffline ? '#b45309' : '#15803d',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="System Status Indicator (Click to toggle simulated offline state)"
            aria-label={`System is currently ${isOffline ? 'Offline' : 'Online'}. Click to toggle.`}
          >
            <span style={{ fontSize: '0.7rem', color: isOffline ? '#d97706' : '#22c55e' }}>
              {isOffline ? '○' : '●'}
            </span>
            <span>{isOffline ? 'Offline' : 'Online'}</span>
          </button>

          <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />

          {/* Language Selector Dropdown */}
          <div ref={langMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-haspopup="true"
              aria-expanded={isLangOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.4rem 0.75rem',
                minHeight: '36px',
                borderRadius: '8px',
                fontSize: '0.86rem',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Select Language"
            >
              <span>🌐</span>
              <span style={{ fontWeight: 600 }}>{currentLangObj.nativeName}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>▾</span>
            </button>

            {isLangOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 120,
                  width: '210px',
                  padding: '0.4rem',
                  animation: 'slideUp 0.15s ease-out'
                }}
              >
                <div style={{ padding: '0.4rem 0.6rem 0.35rem 0.6rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🌐 Select Language
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {SUPPORTED_LANGUAGES.map((langItem) => {
                    const isSelected = language === langItem.code;
                    return (
                      <button
                        key={langItem.code}
                        type="button"
                        onClick={() => {
                          setLanguage(langItem.code);
                          setIsLangOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          color: isSelected ? '#15803d' : '#0f172a',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: 14, display: 'inline-block', textAlign: 'center', color: '#15803d', fontWeight: 800 }}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{langItem.nativeName}</span>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {langItem.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
