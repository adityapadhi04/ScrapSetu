import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';
import { Layers } from 'lucide-react';

export const RoleSwitcherBar = () => {
  const { currentRole, setRole, isOffline, toggleOffline } = useAuth();

  return (
    <div className="role-switcher-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Layers size={14} color="#38bdf8" />
        <span style={{ fontWeight: 700, color: '#94a3b8' }}>
          PROTOTYPE ROLE SWITCHER:
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <NavLink
          to="/collector"
          onClick={() => setRole(ROLES.COLLECTOR)}
          className={currentRole === ROLES.COLLECTOR ? 'active' : ''}
        >
          📱 Collector
        </NavLink>
        <NavLink
          to="/recycler"
          onClick={() => setRole(ROLES.RECYCLER)}
          className={currentRole === ROLES.RECYCLER ? 'active' : ''}
        >
          ♻️ Recycler
        </NavLink>
        <NavLink
          to="/repair-shop"
          onClick={() => setRole(ROLES.REPAIR_SHOP)}
          className={currentRole === ROLES.REPAIR_SHOP ? 'active' : ''}
        >
          🔧 Repair Shop
        </NavLink>
        <NavLink
          to="/admin"
          onClick={() => setRole(ROLES.ADMIN)}
          className={currentRole === ROLES.ADMIN ? 'active' : ''}
        >
          🛡️ Admin
        </NavLink>

        <button
          onClick={toggleOffline}
          style={{
            background: isOffline ? '#78350f' : '#14532d',
            color: isOffline ? '#fef3c7' : '#bbf7d0',
            border: `1px solid ${isOffline ? '#f59e0b' : '#22c55e'}`,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginLeft: '8px'
          }}
          title="Simulate Field Offline Condition"
        >
          {isOffline ? '🟠 Simulated: OFFLINE' : '🟢 ONLINE'}
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcherBar;
