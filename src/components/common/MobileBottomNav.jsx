import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Camera, Package, IndianRupee, User, Truck, ClipboardList } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Mobile Bottom Navigation for Collector & Recycler with full localization
 */
export const MobileBottomNav = ({ role = 'COLLECTOR' }) => {
  const { t } = useLanguage();

  const collectorItems = [
    { label: t('home'), path: '/collector', icon: Home, end: true },
    { label: t('sellScrap'), path: '/collector/sell', icon: Camera },
    { label: t('lots'), path: '/collector/lots', icon: Package },
    { label: t('earnings'), path: '/collector/earnings', icon: IndianRupee },
    { label: t('profile'), path: '/collector/profile', icon: User }
  ];

  const recyclerItems = [
    { label: t('home'), path: '/recycler', icon: Home, end: true },
    { label: t('availableLots'), path: '/recycler/lots', icon: Package },
    { label: t('pickupRequests'), path: '/recycler/pickups', icon: Truck },
    { label: t('transactions'), path: '/recycler/orders', icon: ClipboardList },
    { label: t('profile'), path: '/recycler/profile', icon: User }
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
