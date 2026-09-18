import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Volume2, Globe, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth, ROLE_CONFIG } from '../../context/AuthContext';
import Badge from './Badge';

export const Header = () => {
  const { currentRole, setRole, language, setLanguage, isAudioActive, toggleAudio } = useAuth();
  const navigate = useNavigate();

  const currentRoleInfo = ROLE_CONFIG[currentRole] || ROLE_CONFIG['COLLECTOR'];

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleRoleLogout = () => {
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand */}
        <Link to="/" className="header-brand">
          <img src="/logo.svg" alt="ScrapSetu" className="header-logo" />
          <div className="header-title-wrap">
            <span className="header-title">ScrapSetu</span>
            <span className="header-badge-team">SIH26229 • CLUELESS CODERS</span>
          </div>
        </Link>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Audio helper toggle for low-literacy */}
          {currentRole === 'COLLECTOR' && (
            <button
              onClick={toggleAudio}
              className={`btn btn-outline`}
              style={{
                padding: '0.4rem 0.75rem',
                minHeight: '38px',
                borderRadius: 'var(--radius-full)',
                borderColor: isAudioActive ? 'var(--color-primary-500)' : undefined,
                background: isAudioActive ? 'var(--color-primary-50)' : undefined
              }}
              title="Voice Guide / बोलकर बताएं"
            >
              <Volume2 size={16} color={isAudioActive ? '#15803d' : '#64748b'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {isAudioActive ? 'Audio ON' : 'Audio'}
              </span>
            </button>
          )}

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={16} color="#64748b" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="form-select"
              style={{
                padding: '0.35rem 0.6rem',
                fontSize: '0.82rem',
                minHeight: '36px',
                borderRadius: '8px',
                width: 'auto'
              }}
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>

          {/* Role Status Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant={currentRoleInfo.badgeVariant || 'info'}>
              {currentRoleInfo.label}
            </Badge>

            <button
              onClick={handleRoleLogout}
              className="btn btn-ghost"
              style={{ padding: '6px 10px', minHeight: '36px' }}
              title="Switch Role / Home"
            >
              <LogOut size={16} />
              <span style={{ fontSize: '0.8rem' }}>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
