import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Desktop Sidebar Navigation Component
 */
export const Sidebar = ({ items = [], title = 'Menu' }) => {
  return (
    <aside className="app-sidebar" aria-label="Sidebar Navigation">
      <div style={{ padding: '0 0.5rem 1rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon size={18} />}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--color-primary-100)',
                    color: 'var(--color-primary-800)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '99px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
