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
  User, 
  LogOut, 
  X, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ArrowRight,
  Home,
  Truck
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEMO_USERS, normalizeRole } from '../../data/demoUsers';

export const AccountSwitcher = ({ dropup = true, style = {} }) => {
  const { currentRole, switchAccountWithCredentials, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const containerRef = useRef(null);
  const modalContentRef = useRef(null);

  const accountOptions = [
    {
      key: ROLES.CUSTOMER,
      nameKey: 'customerName',
      defaultName: 'Household Customer',
      iconPrefix: '🏠',
      Icon: Home,
      path: '/customer',
      color: '#059669',
      bg: '#d1fae5',
      email: DEMO_USERS.customer.email
    },
    {
      key: ROLES.COLLECTOR,
      nameKey: 'collectorName',
      defaultName: 'Informal Scrap Collector',
      iconPrefix: '📱',
      Icon: Smartphone,
      path: '/collector',
      color: '#15803d',
      bg: '#dcfce7',
      email: DEMO_USERS.collector.email
    },
    {
      key: ROLES.REPAIR_SHOP,
      nameKey: 'repairName',
      defaultName: 'Repair Shop',
      iconPrefix: '🔧',
      Icon: Wrench,
      path: '/repair-shop',
      color: '#d97706',
      bg: '#fef3c7',
      email: DEMO_USERS.repair.email
    },
    {
      key: ROLES.RECYCLER,
      nameKey: 'recyclerName',
      defaultName: 'Authorized Recycler',
      iconPrefix: '♻',
      Icon: Recycle,
      path: '/recycler',
      color: '#0284c7',
      bg: '#e0f2fe',
      email: DEMO_USERS.recycler.email
    },
    {
      key: ROLES.ADMIN,
      nameKey: 'adminName',
      defaultName: 'Administrator',
      iconPrefix: '🛡',
      Icon: ShieldCheck,
      path: '/admin',
      color: '#0f172a',
      bg: '#f1f5f9',
      email: DEMO_USERS.admin.email
    }
  ];

  const normalizedCurrent = normalizeRole(currentRole);
  const currentOption = accountOptions.find((a) => a.key === normalizedCurrent) || accountOptions[0];
  const CurrentIcon = currentOption.Icon;
  const currentLabel = t(currentOption.nameKey, currentOption.defaultName);

  // Close trigger menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Handle Escape key for both menu and modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          closeModal();
        } else if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isMenuOpen]);

  // Open the secure switch modal with a target role pre-selected
  const openSwitchModal = (initialTargetRole = null) => {
    setIsMenuOpen(false);
    setError('');
    setPassword('');
    setShowPassword(false);

    // If target role provided, select it; otherwise default to a non-current role
    const target = initialTargetRole || accountOptions.find((a) => a.key !== normalizedCurrent)?.key || 'collector';
    setSelectedRole(target);

    // Set email of target account (password remains strictly empty)
    const targetAcc = accountOptions.find((a) => a.key === target);
    setEmail(targetAcc ? targetAcc.email : '');

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPassword('');
    setError('');
    setIsVerifying(false);
  };

  const handleRoleSelection = (roleKey) => {
    setSelectedRole(roleKey);
    setError('');
    setPassword('');

    const targetAcc = accountOptions.find((a) => a.key === roleKey);
    if (targetAcc) {
      setEmail(targetAcc.email);
    }
  };

  const handleSwitchSubmit = (e) => {
    e.preventDefault();
    setError('');

    // If currently signed-in account is selected, no re-auth required
    if (selectedRole === normalizedCurrent) {
      closeModal();
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError(t('invalidAccountIdOrPassword'));
      return;
    }

    setIsVerifying(true);

    // Simulate verification delay for realistic security feedback
    setTimeout(() => {
      const result = switchAccountWithCredentials(selectedRole, email, password);
      setIsVerifying(false);

      if (result.success) {
        closeModal();
        navigate(result.path);
      } else {
        setError(t('invalidAccountIdOrPassword'));
        setPassword('');
      }
    }, 280);
  };

  const isCurrentAccountSelected = selectedRole === normalizedCurrent;

  return (
    <>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
        {/* Lower-Left Account Switcher Trigger */}
        <button
          type="button"
          id="account-switcher-trigger"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: isMenuOpen ? '#f1f5f9' : '#ffffff',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
          title={t('switchAccount')}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: currentOption.bg,
              color: currentOption.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CurrentIcon size={17} />
          </div>

          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentOption.iconPrefix} {currentLabel}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: '#64748b',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{t('switchAccount')}</span>
              {dropup ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </div>
          </div>
        </button>

        {/* Popover Menu with Switch Account & Logout */}
        {isMenuOpen && (
          <div
            role="menu"
            id="account-switcher-dropdown"
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
              zIndex: 200,
              padding: '0.45rem',
              minWidth: '240px',
              animation: 'slideUp 0.15s ease-out'
            }}
          >
            {/* Header */}
            <div style={{ padding: '0.45rem 0.65rem 0.35rem 0.65rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <RefreshCw size={12} color="#15803d" />
                <span>{t('switchAccount')}</span>
              </div>
            </div>

            {/* 4 Account Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {accountOptions.map((opt) => {
                const isCurrent = opt.key === normalizedCurrent;
                const OptIcon = opt.Icon;
                const optLabel = t(opt.nameKey, opt.defaultName);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => openSwitchModal(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: isCurrent ? '#f0fdf4' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'transparent';
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#15803d' : '#0f172a' }}>
                        {opt.iconPrefix} {optLabel}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>
                          {t('currentAccount')}
                        </div>
                      )}
                    </div>

                    {isCurrent && (
                      <Check size={14} color="#15803d" style={{ strokeWidth: 3 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#f1f5f9', margin: '0.4rem 0' }} />

            {/* Logout Action */}
            <button
              id="account-switcher-logout-button"
              type="button"
              onClick={() => {
                logout();
                setIsMenuOpen(false);
                navigate('/login');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '0.55rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#dc2626',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <LogOut size={15} />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                {t('logout')}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECURE ACCOUNT SWITCHING AUTHENTICATION MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div
          id="account-switch-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-switch-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div
            ref={modalContentRef}
            id="account-switch-modal-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RefreshCw size={17} />
                </div>
                <h2 id="account-switch-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {t('switchAccount')}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSwitchSubmit} style={{ padding: '1.25rem 1.5rem' }}>
              
              {/* Step 1: Target Account Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                  {t('selectAccount')}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {accountOptions.map((opt) => {
                    const isSelected = selectedRole === opt.key;
                    const isCurrent = opt.key === normalizedCurrent;
                    const OptIcon = opt.Icon;
                    const optLabel = t(opt.nameKey, opt.defaultName);

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleRoleSelection(opt.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${opt.color}` : '1.5px solid #e2e8f0',
                          background: isSelected ? opt.bg : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '6px',
                            background: isSelected ? '#ffffff' : opt.bg,
                            color: opt.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <OptIcon size={14} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: isSelected ? 800 : 600,
                              color: isSelected ? opt.color : '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {optLabel}
                          </div>
                          {isCurrent && (
                            <span style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 700, display: 'block' }}>
                              ✓ {t('currentAccount')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Already Signed In Notice (When user selects currently active account) */}
              {isCurrentAccountSelected ? (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Check size={18} color="#16a34a" />
                  <span>{t('alreadySignedIn')}</span>
                </div>
              ) : (
                /* Step 2: Authenticate Account Credentials */
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} color="#15803d" />
                    <span>{t('authenticateAccount')}</span>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div
                      id="account-switch-error"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        animation: 'shake 0.2s ease-in-out'
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Account ID / Email */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label
                      htmlFor="switch-account-email"
                      style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}
                    >
                      {t('accountIdOrEmail')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Mail size={16} />
                      </div>
                      <input
                        id="switch-account-email"
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="account@scrapsetu.demo"
                        required
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem 0.6rem 2.3rem',
                          fontSize: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          outline: 'none',
                          color: '#0f172a'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      htmlFor="switch-account-password"
                      style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}
                    >
                      {t('password')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Lock size={16} />
                      </div>
                      <input
                        id="switch-account-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="••••••••"
                        required
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '0.6rem 2.3rem 0.6rem 2.3rem',
                          fontSize: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          outline: 'none',
                          color: '#0f172a'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                        title={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: [ Cancel ] [ Switch Account → ] */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  id="switch-account-cancel"
                  onClick={closeModal}
                  style={{
                    padding: '0.65rem 1.15rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  id="switch-account-submit"
                  disabled={isVerifying || isCurrentAccountSelected}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    background: isCurrentAccountSelected
                      ? '#e2e8f0'
                      : isVerifying
                      ? '#86efac'
                      : '#15803d',
                    color: isCurrentAccountSelected ? '#94a3b8' : '#ffffff',
                    cursor: isCurrentAccountSelected || isVerifying ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isCurrentAccountSelected ? 'none' : '0 2px 6px rgba(21, 128, 61, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentAccountSelected && !isVerifying) {
                      e.currentTarget.style.background = '#166534';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentAccountSelected && !isVerifying) {
                      e.currentTarget.style.background = '#15803d';
                    }
                  }}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>{t('verifying')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('switchAccount')}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSwitcher;
