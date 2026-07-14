import React, { useState, useEffect } from 'react';
import { X, Link2, Youtube, Music2, Instagram, PlaySquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const detectPlatformFE = (url) => {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  return null;
};

const PlatformInfo = {
  youtube: { label: 'YouTube', color: '#ff0000', icon: Youtube, note: 'Stats will be auto-fetched via YouTube API.' },
  tiktok: { label: 'TikTok', color: '#010101', icon: Music2, note: 'Basic info will be fetched. Enter stats manually after adding.' },
  instagram: { label: 'Instagram', color: '#e1306c', icon: Instagram, note: 'Basic info will be fetched. Enter stats manually after adding.' },
};

const AddVideoModal = ({ isOpen, onClose, onSuccess, workers, lockedWorker }) => {
  const [url, setUrl] = useState('');
  const [workerUsername, setWorkerUsername] = useState(lockedWorker || 'admin');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const detectedPlatform = detectPlatformFE(url);
  const platformInfo = detectedPlatform ? PlatformInfo[detectedPlatform] : null;
  const selectedWorker = workers?.find(w => w.username === workerUsername);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setWorkerUsername(lockedWorker || 'admin');
      setCategory('General');
      setError('');
      setSuccess('');
    }
  }, [isOpen, lockedWorker]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please enter a video URL.'); return; }
    if (!detectedPlatform) { setError('Only YouTube, TikTok, and Instagram URLs are supported.'); return; }
    if (!workerUsername) { setError('Please select which worker is adding this video.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          workerName: selectedWorker?.name || (workerUsername === 'admin' ? 'Admin' : workerUsername),
          workerUsername,
          category
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add video.');
      } else {
        setSuccess(`✅ "${data.title}" added successfully!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError('Network error — make sure the server is running.');
    }
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
        >
          <div className="modal-header">
            <div>
              <h3>Add New Video</h3>
              <p className="text-secondary text-sm">Paste a YouTube, TikTok, or Instagram link</p>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* URL Input */}
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label><Link2 size={14} /> Video URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or TikTok/Instagram link"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); setSuccess(''); }}
                required
                autoFocus
              />
              {url && (
                <div className={`url-detect-bar ${detectedPlatform || 'unknown'}`}>
                  {detectedPlatform ? (
                    <>
                      {React.createElement(PlatformInfo[detectedPlatform].icon, { size: 14 })}
                      <span>{PlatformInfo[detectedPlatform].label} detected — {PlatformInfo[detectedPlatform].note}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>Unknown platform. Only YouTube, TikTok, Instagram are supported.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
              {/* Worker Select */}
              {!lockedWorker && (
                <div className="form-group">
                  <label>Worker</label>
                  <select
                    value={workerUsername}
                    onChange={(e) => setWorkerUsername(e.target.value)}
                    required
                  >
                    <option value="admin">Admin (You)</option>
                    {workers?.filter(w => w.username !== 'admin').map(w => (
                      <option key={w.username} value={w.username}>{w.name} (@{w.username})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>General</option>
                  <option>Gaming</option>
                  <option>Education</option>
                  <option>Entertainment</option>
                  <option>Music</option>
                  <option>Tech</option>
                  <option>Lifestyle</option>
                  <option>Sports</option>
                  <option>News</option>
                </select>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 10, padding: '0.75rem 1rem', color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <CheckCircle2 size={15} /> {success}
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Fetching Data...</>
                ) : (
                  <><PlaySquare size={17} /> Add Video</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddVideoModal;
