import React from 'react';
import { Bell, Search, ChevronDown, Plus, Menu } from 'lucide-react';

const Header = ({ title, onAddVideo, onMenuToggle, globalSearch, setGlobalSearch, userName = 'Admin', userRole = 'Administrator', userInitials = 'AD' }) => {
  return (
    <header className="main-header glass">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <h1>{title}</h1>
      </div>

      <div className="header-right">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Global search..." 
            value={globalSearch} 
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <button className="btn-primary" onClick={onAddVideo}>
            <Plus size={17} />
            <span>Add Video</span>
          </button>

          <button className="icon-btn">
            <Bell size={20} />
            <span className="notification-dot"></span>
          </button>

          <div className="user-profile">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
