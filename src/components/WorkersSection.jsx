import React, { useState } from 'react';
import { Users, Plus, Trash2, X, Eye, PlaySquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const formatNum = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const AddWorkerModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create worker'); }
      else { onSuccess(); onClose(); setForm({ name: '', username: '', password: '' }); }
    } catch { setError('Network error'); }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 460 }}
        >
          <div className="modal-header">
            <div>
              <h3>Add Worker</h3>
              <p className="text-secondary text-sm">Create a new team member account</p>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Full Name</label>
              <input type="text" placeholder="e.g. Rahul Singh" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Username</label>
              <input type="text" placeholder="e.g. rahul123" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Password</label>
              <input type="password" placeholder="Set a password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : <><Plus size={16} /> Create Worker</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const WorkersSection = ({ workers, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this worker?')) return;
    await fetch(`${API_BASE}/workers/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div>
      <div className="section-header">
        <div className="header-left">
          <h2>Workers</h2>
          <p>Manage your video upload team</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add Worker</span>
        </button>
      </div>

      <div className="table-wrapper card">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Username</th>
              <th><PlaySquare size={13} style={{ display: 'inline', marginRight: 4 }} />Videos</th>
              <th><Eye size={13} style={{ display: 'inline', marginRight: 4 }} />Total Views</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workers.length > 0 ? workers.map((w) => (
              <tr key={w._id} className="worker-row">
                <td>
                  <div className="worker-avatar-cell">
                    <div className="worker-avatar-circle" style={{ background: w.avatarColor }}>
                      {w.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="worker-name-block">
                      <span className="worker-name">{w.name}</span>
                    </div>
                  </div>
                </td>
                <td><span className="sale-id">@{w.username}</span></td>
                <td><span className="worker-stat-pill">{w.videoCount || 0} videos</span></td>
                <td><span className="stat-num views">{formatNum(w.totalViews)}</span></td>
                <td>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {new Date(w.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
                <td>
                  <button className="btn-icon danger" onClick={() => handleDelete(w._id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <Users size={48} />
                    <h3>No workers yet</h3>
                    <p>Add your first team member to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {workers.length > 0 && (
          <div className="table-footer">
            <p>{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      <AddWorkerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};

export default WorkersSection;
