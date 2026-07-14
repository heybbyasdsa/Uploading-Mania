import React, { useState, useEffect } from 'react';
import { X, ExternalLink, RefreshCw, Eye, ThumbsUp, MessageCircle, Share2, Youtube, Music2, Instagram, PlaySquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

const PlatformIcon = ({ platform, size = 16 }) => {
  if (platform === 'youtube') return <Youtube size={size} style={{ color: '#ff0000' }} />;
  if (platform === 'tiktok') return <Music2 size={size} style={{ color: '#010101' }} />;
  if (platform === 'instagram') return <Instagram size={size} style={{ color: '#e1306c' }} />;
  return <PlaySquare size={size} />;
};

const formatNum = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const VideoDetailModal = ({ isOpen, onClose, video, onSuccess }) => {
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen || !video) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API_BASE}/videos/${video._id}/refresh`, { method: 'PUT' });
      onSuccess();
      onClose();
    } catch (e) { console.error(e); }
    setRefreshing(false);
  };

  const miniStats = [
    { icon: Eye, label: 'Views', value: video.stats?.views, color: '#2563eb' },
    { icon: ThumbsUp, label: 'Likes', value: video.stats?.likes, color: '#16a34a' },
    { icon: MessageCircle, label: 'Comments', value: video.stats?.comments, color: '#f59e0b' }
  ];

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-content card modal-wide"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <PlatformIcon platform={video.platform} size={22} />
              <div>
                <h3 style={{ fontSize: '1.05rem' }}>Video Details</h3>
                <p className="text-secondary text-sm">
                  Added by <strong>{video.workerName}</strong> · {new Date(video.addedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>

          {/* Thumbnail */}
          {video.thumbnail ? (
            <img className="video-detail-thumb" src={video.thumbnail} alt={video.title} />
          ) : (
            <div className="video-detail-thumb-placeholder">
              <PlaySquare size={48} />
            </div>
          )}

          {/* Title + Channel */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.35 }}>
              {video.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`platform-badge platform-badge-${video.platform}`}>
                <PlatformIcon platform={video.platform} size={11} />
                {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)}
              </span>
              {video.channelName && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  📺 {video.channelName}
                </span>
              )}
              {video.publishedAt && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  📅 Published {new Date(video.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="video-detail-stats">
            {miniStats.map(({ icon: Icon, label, value, color }) => (
              <div className="mini-stat" key={label}>
                <div style={{ color, marginBottom: 4 }}><Icon size={18} /></div>
                <div className="mini-stat-value" style={{ color }}>{formatNum(value)}</div>
                <div className="mini-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {video.description && (
            <div className="video-detail-desc">
              {video.description}
            </div>
          )}

          {/* Tags */}
          {video.tags?.length > 0 && (
            <div className="video-tags">
              {video.tags.map(tag => (
                <span key={tag} className="video-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Last refreshed */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Stats last updated: {new Date(video.lastRefreshed).toLocaleString()}
          </p>

          {/* Actions */}
          <div className="video-detail-actions">
            <a href={video.url} target="_blank" rel="noreferrer">
              <button className="btn-open-link">
                <ExternalLink size={15} /> Open on {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)}
              </button>
            </a>
            {video.platform === 'youtube' && (
              <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh Stats'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VideoDetailModal;
