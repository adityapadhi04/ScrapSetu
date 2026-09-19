import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Wrench, 
  Recycle, 
  ShieldCheck, 
  RefreshCw, 
  ChevronUp, 
  ChevronDown, 
  Check,
  User
} from 'lucide-react';
import { useAuth, ROLES, ROLE_CONFIG } from '../../context/AuthContext';
import { getStrings } from '../../locales/strings';

export const AccountSwitcher = ({ dropup = true, style = {} }) => {
  const { currentRole, switchAccount, currentUser, language } = useAuth();
  const navigate = useNavigate();
  const t = getStrings(language);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const accountOptions = [
    {
      key: ROLES.COLLECTOR,
      label: 'Informal Scrap Collector',
      sublabel: 'Collector Account',
      icon: Smartphone,
      path: '/collector',
      color: '#15803d',
      bg: '#dcfce7'
    },
    {
      key: ROLES.REPAIR_SHOP,
      label: 'Repair Shop',
      sublabel: 'Repair Entity Account',
      icon: Wrench,
      path: '/repair-shop',
      color: '#d97706',
      bg: '#fef3c7'
    },
    {
      key: ROLES.RECYCLER,
      label: 'Authorized Recycler',
      sublabel: 'Recycler Facility Account',
      icon: Recycle,
      path: '/recycler',
      color: '#0284c7',
      bg: '#e0f2fe'
    },
    {
      key: ROLES.ADMIN,
      label: 'Administrator',
      sublabel: 'Admin Account',
      icon: ShieldCheck,
      path: '/admin',
      color: '#0f172a',
      bg: '#f1f5f9'
    }
  ];

  const currentOption = accountOptions.find((a) => a.key === currentRole) || accountOptions[0];
  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (account) => {
    switchAccount(account.key);
    setIsOpen(false);
    navigate(account.path);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button at Lower-Left */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0.65rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          background: isOpen ? '#f8fafc' : '#ffffff',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
        title="Switch Account"
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '8px',
            background: currentOption.bg,
            color: currentOption.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <CurrentIcon size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentUser?.name || currentOption.label}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{currentOption.sublabel}</span>
            {dropup ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: dropup ? 'calc(100% + 8px)' : 'auto',
            top: dropup ? 'auto' : 'calc(100% + 8px)',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 120,
            padding: '0.5rem',
            minWidth: '240px'
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.5rem 0.65rem 0.4rem 0.65rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <RefreshCw size={12} color="#15803d" />
              <span>{t.switchAccount || 'Switch Account'}</span>
            </div>
          </div>

          {/* Account Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {accountOptions.map((opt) => {
              const isSelected = opt.key === currentRole;
              const OptIcon = opt.icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#f0fdf4' : 'transparent',
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
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      background: opt.bg,
                      color: opt.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <OptIcon size={15} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#15803d' : '#0f172a' }}>
                      {opt.label}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={14} color="#15803d" style={{ strokeWidth: 3 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSwitcher;
