import React from 'react';
import { Eye, Youtube, Music2, Instagram, PlaySquare } from 'lucide-react';
import { motion } from 'framer-motion';

const PERIOD_CONFIG = {
  today: { label: "Today's Top", color: '#2563eb' },
  week: { label: 'This Week', color: '#16a34a' },
  month: { label: 'This Month', color: '#7c3aed' }
};

const PlatformIcon = ({ platform, size = 14 }) => {
  if (platform === 'youtube') return <Youtube size={size} style={{ color: '#ff0000' }} />;
  if (platform === 'tiktok') return <Music2 size={size} style={{ color: '#010101' }} />;
  if (platform === 'instagram') return <Instagram size={size} style={{ color: '#e1306c' }} />;
  return <PlaySquare size={size} />;
};

const formatNum = (n) => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const TopVideoCard = ({ video, period, onVideoClick }) => {
  const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.today;

  if (!video) {
    return (
      <div className="top-video-card" style={{ opacity: 0.5 }}>
        <div className="top-video-period">
          <span className="period-label">{config.label}</span>
        </div>
        <div className="top-video-thumb-wrap" style={{ marginTop: '0.5rem' }}>
          <div className="top-video-thumb-placeholder">
            <PlaySquare size={32} />
          </div>
        </div>
        <div className="top-video-info">
          <p className="top-video-title">No videos yet</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="top-video-card"
      whileHover={{ y: -4 }}
      onClick={() => onVideoClick && onVideoClick(video)}
    >
      <div className="top-video-period">
        <span className="period-label">{config.label}</span>
        <span className={`platform-badge platform-badge-${video.platform}`}>
          <PlatformIcon platform={video.platform} size={11} />
          {video.platform}
        </span>
      </div>

      <div className="top-video-thumb-wrap">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="top-video-thumb-placeholder">
            <PlaySquare size={32} />
          </div>
        )}
        <div className="top-video-overlay">
          <div className="top-video-views">
            <Eye size={14} />
            {formatNum(video.stats?.views)}
          </div>
        </div>
      </div>

      <div className="top-video-info">
        <p className="top-video-title">{video.title}</p>
        <div className="top-video-meta">
          <span className="top-video-worker">by {video.workerName}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {video.stats?.likes?.toLocaleString() || 0} ♥
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TopVideoCard;
