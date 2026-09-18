import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, Package, IndianRupee, User, Truck, ClipboardList } from 'lucide-react';

/**
 * Mobile Bottom Navigation for Collector & Recycler
 */
export const MobileBottomNav = ({ role = 'COLLECTOR' }) => {
  const collectorItems = [
    { label: 'Home', path: '/collector', icon: Home, end: true },
    { label: 'Sell', path: '/collector/sell', icon: Camera },
    { label: 'Lots', path: '/collector/lots', icon: Package },
    { label: 'Earnings', path: '/collector/earnings', icon: IndianRupee },
    { label: 'Profile', path: '/collector/profile', icon: User }
  ];

  const recyclerItems = [
    { label: 'Home', path: '/recycler', icon: Home, end: true },
    { label: 'Lots', path: '/recycler/lots', icon: Package },
    { label: 'Pickups', path: '/recycler/pickups', icon: Truck },
    { label: 'Orders', path: '/recycler/orders', icon: ClipboardList },
    { label: 'Profile', path: '/recycler/profile', icon: User }
  ];

  const items = role === 'RECYCLER' ? recyclerItems : collectorItems;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <Icon size={20} />
            </div>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
