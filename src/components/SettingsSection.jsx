import React, { useState, useEffect } from 'react';
import { Moon, Sun, Lock, Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsSection = ({ role }) => {
  const { adminUser, workerUser } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = role === 'admin' ? adminUser?.email : workerUser?.username;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    // Simulate an API call
    setSuccess('');
    setTimeout(() => {
      setSuccess('Password updated successfully! (Demo)');
      setCurrentPassword('');
      setNewPassword('');
    }, 800);
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Settings
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Profile Info */}
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Account Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Role</div>
              <div style={{ fontWeight: '500' }}>{role === 'admin' ? 'Administrator' : 'Worker'}</div>
            </div>
            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{role === 'admin' ? 'Email' : 'Username'}</div>
              <div style={{ fontWeight: '500' }}>{currentUser || 'Unknown'}</div>
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Preferences */}
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Preferences</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />} Appearance
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Toggle between light and dark mode.</div>
            </div>
            <button 
              className="btn-secondary" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
            <div>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} /> Notifications
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Receive alerts when videos reach milestones.</div>
            </div>
            <button 
              className={notifications ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Security */}
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} /> Security
          </h3>
          <form onSubmit={handlePasswordUpdate} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                required 
                style={{ background: 'var(--bg-main)' }}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                required 
                style={{ background: 'var(--bg-main)' }}
              />
            </div>
            
            {success && (
              <div style={{ color: 'var(--accent-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> {success}
              </div>
            )}
            
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Update Password</button>
          </form>
        </section>

      </div>
    </div>
  );
};

export default SettingsSection;
