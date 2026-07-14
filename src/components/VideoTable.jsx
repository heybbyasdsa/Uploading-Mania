import React, { useState } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  MoreVertical, Eye, ThumbsUp, MessageCircle, Share2,
  Youtube, Music2, Instagram, PlaySquare, RefreshCw, Trash2, ExternalLink
} from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const PlatformIcon = ({ platform, size = 14 }) => {
  if (platform === 'youtube') return <Youtube size={size} style={{ color: '#ff0000' }} />;
  if (platform === 'tiktok') return <Music2 size={size} style={{ color: '#010101' }} />;
  if (platform === 'instagram') return <Instagram size={size} style={{ color: '#e1306c' }} />;
  return <PlaySquare size={size} />;
};

const formatNum = (n) => {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const MobileVideoList = ({ videos, onVideoClick, openMenuId, setOpenMenuId, handleRefreshStats, handleDelete }) => {
  if (videos.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem' }}>
        <PlaySquare size={48} />
        <h3>No videos found</h3>
        <p>Try adjusting your filters.</p>
      </div>
    );
  }
  return (
    <div className="mobile-video-list">
      {videos.map(v => (
        <div key={v._id} className="mobile-video-card">
          <div className="mvc-header">
            <div className="video-thumbnail-cell">
              {v.thumbnail ? (
                <img className="video-thumb" src={v.thumbnail} alt={v.title} />
              ) : (
                <div className="video-thumb-placeholder"><PlaySquare size={20} /></div>
              )}
              <div className="video-title-block">
                <span className="video-title" onClick={() => onVideoClick(v)}>{v.title}</span>
                <span className="video-channel">{v.channelName}</span>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setOpenMenuId(openMenuId === v._id ? null : v._id)}>
                <MoreVertical size={16} />
              </button>
              {openMenuId === v._id && (
                <div style={{
                  position: 'absolute', right: 0, top: 30, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
                  boxShadow: 'var(--shadow-lg)', zIndex: 99, minWidth: 160, overflow: 'hidden'
                }}>
                  <button style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onClick={() => { onVideoClick(v); setOpenMenuId(null); }}>
                    <Eye size={15} /> Details
                  </button>
                  <button style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onClick={() => window.open(v.url, '_blank')}>
                    <ExternalLink size={15} /> Open Link
                  </button>
                  {v.platform === 'youtube' && (
                    <button style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }} onClick={() => handleRefreshStats(v._id)}>
                      <RefreshCw size={15} /> Refresh
                    </button>
                  )}
                  <button style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-danger)', borderTop: '1px solid var(--border)' }} onClick={() => handleDelete(v._id)}>
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mvc-stats">
            <div className="mvc-stat"><Eye size={13}/> {formatNum(v.stats?.views)}</div>
            <div className="mvc-stat"><ThumbsUp size={13}/> {formatNum(v.stats?.likes)}</div>
            <div className="mvc-stat"><MessageCircle size={13}/> {formatNum(v.stats?.comments)}</div>
          </div>
          <div className="mvc-footer">
            <span className={`platform-badge platform-badge-${v.platform}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
              <PlatformIcon platform={v.platform} size={10} /> {v.platform}
            </span>
            <div className="customer-info" style={{ gap: 4 }}>
              <div className="customer-avatar" style={{ width: 18, height: 18, fontSize: '0.6rem' }}>{v.workerName?.[0]?.toUpperCase()}</div>
              <span style={{ fontSize: '0.75rem' }}>{v.workerName}</span>
            </div>
            <span className="text-muted text-xs">{new Date(v.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const VideoTable = ({
  videos,
  total,
  totalPages,
  currentPage,
  onPageChange,
  onVideoClick,
  onRefresh,
  filters,
  setFilters,
  workers,
  hideControls = false
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this video from the dashboard?')) return;
    await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE' });
    onRefresh();
    setOpenMenuId(null);
  };

  const handleRefreshStats = async (id) => {
    try {
      await fetch(`${API_BASE}/videos/${id}/refresh`, { method: 'PUT' });
      onRefresh();
    } catch (e) { console.error(e); }
    setOpenMenuId(null);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'mostViews', label: 'Most Views' },
    { value: 'mostLikes', label: 'Most Likes' },
    { value: 'mostComments', label: 'Most Comments' },
  ];

  const startIndex = (currentPage - 1) * 10 + 1;
  const endIndex = Math.min(currentPage * 10, total);

  return (
    <div className="sales-container">
      {!hideControls && (
        <>
          <div className="section-header">
            <div className="header-left">
              <h2>Video Library</h2>
              <p>All uploaded videos across platforms</p>
            </div>
            <div className="header-actions" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="search-bar">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by title, channel, worker..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
              <button className="btn-secondary" onClick={onRefresh}>
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="filter-bar">
            <span className="filter-label">Filter:</span>

            <select
              className="filter-select"
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })}
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
            </select>

            <select
              className="filter-select"
              value={filters.worker}
              onChange={(e) => setFilters({ ...filters, worker: e.target.value, page: 1 })}
            >
              <option value="all">All Workers</option>
              {workers?.map(w => (
                <option key={w.username} value={w.username}>{w.name}</option>
              ))}
            </select>

            <span className="filter-label">From:</span>
            <input
              type="date"
              className="filter-date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
            />
            <span className="filter-label">To:</span>
            <input
              type="date"
              className="filter-date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
            />

            <select
              className="filter-select"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
            >
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {(filters.search || filters.platform !== 'all' || filters.worker !== 'all' || filters.from || filters.to) && (
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                onClick={() => setFilters({ search: '', platform: 'all', worker: 'all', from: '', to: '', sort: 'newest', page: 1 })}
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      <div className="table-wrapper card">
        <div className="desktop-table">
          <table className="sales-table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Platform</th>
              <th>Worker</th>
              <th><Eye size={13} style={{ display: 'inline', marginRight: 4 }} />Views</th>
              <th><ThumbsUp size={13} style={{ display: 'inline', marginRight: 4 }} />Likes</th>
              <th><MessageCircle size={13} style={{ display: 'inline', marginRight: 4 }} />Comments</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {videos.length > 0 ? videos.map((v) => (
              <tr key={v._id}>
                {/* Thumbnail + Title */}
                <td>
                  <div className="video-thumbnail-cell">
                    {v.thumbnail ? (
                      <img className="video-thumb" src={v.thumbnail} alt={v.title} />
                    ) : (
                      <div className="video-thumb-placeholder">
                        <PlaySquare size={20} />
                      </div>
                    )}
                    <div className="video-title-block">
                      <span className="video-title" onClick={() => onVideoClick(v)}>{v.title}</span>
                      <span className="video-channel">{v.channelName}</span>
                    </div>
                  </div>
                </td>

                {/* Platform */}
                <td>
                  <span className={`platform-badge platform-badge-${v.platform}`}>
                    <PlatformIcon platform={v.platform} size={11} />
                    {v.platform.charAt(0).toUpperCase() + v.platform.slice(1)}
                  </span>
                </td>

                {/* Worker */}
                <td>
                  <div className="customer-info">
                    <div className="customer-avatar">{v.workerName?.[0]?.toUpperCase()}</div>
                    <span>{v.workerName}</span>
                  </div>
                </td>

                {/* Stats */}
                <td><span className="stat-num views">{formatNum(v.stats?.views)}</span></td>
                <td><span className="stat-num likes">{formatNum(v.stats?.likes)}</span></td>
                <td><span className="stat-num comments">{formatNum(v.stats?.comments)}</span></td>

                {/* Date Added */}
                <td>
                  <div className="date-time">
                    <span>{new Date(v.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-muted text-xs">{new Date(v.addedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>

                {/* Actions */}
                <td style={{ position: 'relative' }}>
                  <button className="btn-icon" onClick={() => setOpenMenuId(openMenuId === v._id ? null : v._id)}>
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === v._id && (
                    <div style={{
                      position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
                      boxShadow: 'var(--shadow-lg)', zIndex: 99, minWidth: 160, overflow: 'hidden'
                    }}>
                      <button
                        style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                        onClick={() => { onVideoClick(v); setOpenMenuId(null); }}
                      >
                        <Eye size={15} /> View Details
                      </button>
                      <button
                        style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                        onClick={() => window.open(v.url, '_blank')}
                      >
                        <ExternalLink size={15} /> Open Link
                      </button>
                      {v.platform === 'youtube' && (
                        <button
                          style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb' }}
                          onClick={() => handleRefreshStats(v._id)}
                        >
                          <RefreshCw size={15} /> Refresh Stats
                        </button>
                      )}
                      <button
                        style={{ width: '100%', padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-danger)', borderTop: '1px solid var(--border)' }}
                        onClick={() => handleDelete(v._id)}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <PlaySquare size={48} />
                    <h3>No videos found</h3>
                    <p>Try adjusting your filters or add your first video.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        <MobileVideoList 
          videos={videos} 
          onVideoClick={onVideoClick} 
          openMenuId={openMenuId} 
          setOpenMenuId={setOpenMenuId} 
          handleRefreshStats={handleRefreshStats} 
          handleDelete={handleDelete} 
        />

        <div className="table-footer">
          <p>{total > 0 ? `Showing ${startIndex}–${endIndex} of ${total} videos` : 'No videos'}</p>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="page-nav"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    className={currentPage === pg ? 'active' : ''}
                    onClick={() => onPageChange(pg)}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="page-nav"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTable;
