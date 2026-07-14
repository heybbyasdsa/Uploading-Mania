import React from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  Youtube,
  Music2,
  Instagram,
  Users,
  Settings,
  LogOut,
  Video,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose, role, onLogout }) => {
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'videos', label: 'All Videos', icon: PlaySquare },
  ];

  const platformItems = [
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'tiktok', label: 'TikTok', icon: Music2 },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
  ];

  const platformActiveClass = (id) => {
    if (activeTab === id) return `nav-item active-${id}`;
    return 'nav-item';
  };

  const platformIndicatorClass = (id) => {
    return `active-indicator active-indicator-${id}`;
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-icon">
              <Video size={18} />
            </div>
            <span>Uploading <span>Mania</span></span>
          </div>
          <button className="mobile-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        {mainItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="active-pill"
                  className="active-indicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}

        {role !== 'worker' && (
          <>
            <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>Platforms</div>
            {platformItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={platformActiveClass(item.id)}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className={platformIndicatorClass(item.id)}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </>
        )}

        {role !== 'worker' && (
          <>
            <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>Team</div>
            <button
              className={`nav-item ${activeTab === 'workers' ? 'active' : ''}`}
              onClick={() => setActiveTab('workers')}
            >
              <Users size={20} />
              <span>Workers</span>
              {activeTab === 'workers' && (
                <motion.div
                  layoutId="active-pill"
                  className="active-indicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button className="nav-item logout" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
