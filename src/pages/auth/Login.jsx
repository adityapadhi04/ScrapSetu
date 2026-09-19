import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DEMO_USERS, ROLE_PATHS } from '../../data/demoUsers';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Wrench, 
  Recycle, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);

  // If already authenticated, redirect to authorized dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      const redirectPath = location.state?.from?.pathname || ROLE_PATHS[role] || '/collector';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location]);

  const handleDemoSelect = (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setSelectedDemoRole(roleKey);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(t('invalidCredentials'));
      return;
    }

    setIsSubmitting(true);

    // Small simulated network debounce for realistic auth feel
    setTimeout(() => {
      const result = login(email, password);
      setIsSubmitting(false);

      if (result.success) {
        const dest = location.state?.from?.pathname || result.path || '/collector';
        navigate(dest, { replace: true });
      } else {
        setError(t('invalidCredentials'));
      }
    }, 350);
  };

  const demoAccounts = [
    {
      key: 'collector',
      labelKey: 'collectorName',
      fallback: 'Informal Scrap Collector',
      Icon: Smartphone,
      color: '#15803d',
      bg: '#dcfce7',
      email: DEMO_USERS.collector.email
    },
    {
      key: 'repair',
      labelKey: 'repairName',
      fallback: 'Repair Shop',
      Icon: Wrench,
      color: '#d97706',
      bg: '#fef3c7',
      email: DEMO_USERS.repair.email
    },
    {
      key: 'recycler',
      labelKey: 'recyclerName',
      fallback: 'Authorized Recycler',
      Icon: Recycle,
      color: '#0284c7',
      bg: '#e0f2fe',
      email: DEMO_USERS.recycler.email
    },
    {
      key: 'admin',
      labelKey: 'adminName',
      fallback: 'Administrator',
      Icon: ShieldCheck,
      color: '#0f172a',
      bg: '#f1f5f9',
      email: DEMO_USERS.admin.email
    }
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 100%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Main Login Card */}
        <Card style={{ padding: '2rem 1.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
          
          {/* Header Brand & Titles */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '1.5rem',
                marginBottom: '0.75rem'
              }}
            >
              ♻
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {t('welcomeBackTitle')}
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              {t('loginPrompt')}
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div
              id="login-error-alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                animation: 'shake 0.2s ease-in-out'
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Email / Demo ID Field */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem'
                }}
              >
                {t('email')}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Mail size={17} />
                </div>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@scrapsetu.demo"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    fontSize: '0.92rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#15803d')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem'
                }}
              >
                {t('password')}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Lock size={17} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                    fontSize: '0.92rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                    background: '#ffffff',
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-button"
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '10px',
                border: 'none',
                background: isSubmitting ? '#86efac' : '#15803d',
                color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = '#166534';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = '#15803d';
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>{t('loggingIn')}</span>
                </>
              ) : (
                <>
                  <span>{t('signIn')}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection (for SIH Judges / Evaluators) */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} color="#15803d" />
                {t('demoAccountsAvailable')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {t('useDemoAccount')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {demoAccounts.map((acc) => {
                const isSelected = selectedDemoRole === acc.key;
                const AccIcon = acc.Icon;
                const roleLabel = t(acc.labelKey, acc.fallback);
                return (
                  <button
                    key={acc.key}
                    type="button"
                    onClick={() => handleDemoSelect(acc.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      border: isSelected ? `2px solid ${acc.color}` : '1px solid #e2e8f0',
                      background: isSelected ? acc.bg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '6px',
                        background: acc.bg,
                        color: acc.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <AccIcon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? acc.color : '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {roleLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Informational Disclaimer Footer */}
        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8', marginTop: '1rem', lineHeight: 1.4 }}>
          ScrapSetu Frontend Demo System • National SIH Evaluation Prototype
        </p>
      </div>
    </div>
  );
};

export default Login;
