import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, PlaySquare, MessageCircle, Users,
  Youtube, Music2, Instagram, AlertTriangle
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import VideoChart from './components/SalesChart';
import VideoTable from './components/VideoTable';
import TopVideoCard from './components/TopVideoCard';
import AddVideoModal from './components/AddVideoModal';
import VideoDetailModal from './components/VideoDetailModal';
import WorkersSection from './components/WorkersSection';
import SettingsSection from './components/SettingsSection';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

const formatNum = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

// Prepare chart data from API response
const buildViewsChartData = (viewsOverTime, days = 30) => {
  const chartData = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = viewsOverTime?.find(x => x._id === key);
    chartData.push({
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: found?.views || 0
    });
  }
  return chartData;
};

const buildUploadsChartData = (uploadsPerDay) => {
  const last7 = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = uploadsPerDay?.find(x => x._id === key);
    last7.push({
      name: dayNames[d.getDay()],
      count: found?.count || 0
    });
  }
  return last7;
};

function App() {
  const { adminLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chartTimeline, setChartTimeline] = useState(30);

  // State removed mock data definitions

  // Dashboard data
  const [dashData, setDashData] = useState(null);

  // Video table data
  const [videos, setVideos] = useState([]);
  const [videoTotal, setVideoTotal] = useState(0);
  const [videoTotalPages, setVideoTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '', platform: 'all', worker: 'all', from: '', to: '', sort: 'newest', page: 1
  });

  // Workers
  const [workers, setWorkers] = useState([]);

  // Real fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/videos/dashboard`);
      const data = await res.json();
      setDashData(data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchVideos = useCallback(async (f) => {
    try {
      const params = new URLSearchParams(f);
      const res = await fetch(`${API_BASE}/videos?${params.toString()}`);
      const data = await res.json();
      setVideos(data.videos);
      setVideoTotal(data.total);
      setVideoTotalPages(data.totalPages);
    } catch (e) { console.error(e); }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/workers`);
      const data = await res.json();
      setWorkers(data);
    } catch (e) { console.error(e); }
  }, []);

  // On mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchWorkers()]);
      setLoading(false);
    };
    init();
    // Disabled background polling to save Apify credits! Data updates manually or on action.
  }, [fetchDashboard, fetchWorkers]);

  // Fetch videos whenever filters change or tab changes
  useEffect(() => {
    const tabFilters = { ...filters };
    if (activeTab === 'youtube') tabFilters.platform = 'youtube';
    else if (activeTab === 'tiktok') tabFilters.platform = 'tiktok';
    else if (activeTab === 'instagram') tabFilters.platform = 'instagram';
    fetchVideos(tabFilters);
  }, [filters, activeTab, fetchVideos]);

  const handleRefreshAll = () => {
    fetchDashboard();
    fetchWorkers();
    const tabFilters = { ...filters };
    if (activeTab === 'youtube') tabFilters.platform = 'youtube';
    else if (activeTab === 'tiktok') tabFilters.platform = 'tiktok';
    else if (activeTab === 'instagram') tabFilters.platform = 'instagram';
    fetchVideos(tabFilters);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setIsDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Platform-specific filters for sidebar tabs
  const getTableFiltersForTab = () => {
    if (activeTab === 'youtube') return { ...filters, platform: 'youtube' };
    if (activeTab === 'tiktok') return { ...filters, platform: 'tiktok' };
    if (activeTab === 'instagram') return { ...filters, platform: 'instagram' };
    return filters;
  };

  const pageTitle = {
    dashboard: 'Dashboard',
    videos: 'All Videos',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    workers: 'Workers'
  }[activeTab] || 'Uploading Mania';

  const renderContent = () => {
    if (loading) return <div className="loading">Loading Uploading Mania...</div>;

    // ─── DASHBOARD ───
    if (activeTab === 'dashboard') {
      const totals = dashData?.totals || {};
      const platformBreakdown = dashData?.platformBreakdown || [];
      const viewsChart = buildViewsChartData(dashData?.viewsOverTime, chartTimeline);
      const uploadsChart = buildUploadsChartData(dashData?.uploadsPerDay);

      return (
        <>
          <div className="dashboard-header">
            <div>
              <p className="text-secondary">Track your team's video performance across all platforms</p>
            </div>
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <PlaySquare size={18} />
              <span>Add Video</span>
            </button>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid">
            <StatCard
              title="Total Views"
              value={formatNum(totals.totalViews)}
              change={totals.totalVideos > 0 ? 'Live' : null}
              trend="up"
              icon={Eye}
              color="#2563eb"
            />
            <StatCard
              title="Total Videos"
              value={totals.totalVideos?.toLocaleString() || '0'}
              change={totals.totalVideos > 0 ? 'Tracked' : null}
              trend="up"
              icon={PlaySquare}
              color="#16a34a"
            />
            <StatCard
              title="Total Comments"
              value={formatNum(totals.totalComments)}
              change={totals.totalComments > 0 ? 'Across all' : null}
              trend="up"
              icon={MessageCircle}
              color="#7c3aed"
            />
            <StatCard
              title="Active Workers"
              value={workers.length}
              change={workers.length > 0 ? 'Team' : null}
              trend="up"
              icon={Users}
              color="#f59e0b"
            />
          </div>

          {/* Top Videos: Today / Week / Month */}
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
              🏆 Top Performing Videos
            </h2>
          </div>
          <div className="top-videos-grid">
            <TopVideoCard video={dashData?.topToday} period="today" onVideoClick={handleVideoClick} />
            <TopVideoCard video={dashData?.topWeek} period="week" onVideoClick={handleVideoClick} />
            <TopVideoCard video={dashData?.topMonth} period="month" onVideoClick={handleVideoClick} />
          </div>

          {/* Platform Breakdown Cards */}
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
              📊 Platform Breakdown
            </h2>
          </div>
          <div className="platform-cards">
            {['youtube', 'tiktok', 'instagram'].map(p => {
              const found = platformBreakdown.find(x => x._id === p);
              const icons = { youtube: Youtube, tiktok: Music2, instagram: Instagram };
              const PIcon = icons[p];
              return (
                <div key={p} className="platform-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab(p)}>
                  <div className={`platform-icon-circle ${p}`}>
                    <PIcon size={24} />
                  </div>
                  <div className="platform-card-info">
                    <h4>{p.charAt(0).toUpperCase() + p.slice(1)}</h4>
                    <div className="platform-card-count">{found?.count || 0}</div>
                    <div className="platform-card-sub">{formatNum(found?.views || 0)} total views</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <VideoChart 
              data={viewsChart} 
              type="area" 
              title="Total Views" 
              timelineOptions={[
                { label: '1 Week', value: 7 },
                { label: '2 Weeks', value: 14 },
                { label: '1 Month', value: 30 },
                { label: '2 Months', value: 60 }
              ]}
              selectedTimeline={chartTimeline}
              onTimelineChange={setChartTimeline}
            />
            <VideoChart data={uploadsChart} type="bar" title="Uploads Per Day (Last 7 Days)" />
          </div>

          {/* Platform Pie */}
          <div className="charts-grid single-chart" style={{ marginBottom: '2rem' }}>
            <VideoChart data={platformBreakdown} type="pie" title="Platform Distribution" />
          </div>

          {/* Recent Videos */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>🆕 Recently Added</h2>
          </div>
          {dashData?.recentVideos?.length > 0 ? (
            <VideoTable
              videos={dashData.recentVideos}
              total={dashData.recentVideos.length}
              totalPages={1}
              currentPage={1}
              onPageChange={() => {}}
              onVideoClick={handleVideoClick}
              onRefresh={handleRefreshAll}
              filters={{ search: '', platform: 'all', worker: 'all', from: '', to: '', sort: 'newest' }}
              setFilters={() => {}}
              workers={workers}
              hideControls={true}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <PlaySquare size={40} style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-secondary)' }}>No videos yet</h3>
              <p>Click "Add Video" to paste your first link!</p>
            </div>
          )}
        </>
      );
    }

    // ─── SETTINGS ───
    if (activeTab === 'settings') {
      return <SettingsSection role="admin" />;
    }

    // ─── WORKERS ───
    if (activeTab === 'workers') {
      return <WorkersSection workers={workers} onRefresh={() => { fetchWorkers(); handleRefreshAll(); }} />;
    }

    // ─── ALL VIDEOS / PLATFORM TABS ───
    const effectiveFilters = getTableFiltersForTab();
    return (
      <VideoTable
        videos={videos}
        total={videoTotal}
        totalPages={videoTotalPages}
        currentPage={effectiveFilters.page || 1}
        onPageChange={handlePageChange}
        onVideoClick={handleVideoClick}
        onRefresh={handleRefreshAll}
        filters={activeTab === 'videos' ? filters : { ...filters, platform: activeTab }}
        setFilters={(f) => {
          if (activeTab !== 'videos') {
            setFilters({ ...f, platform: activeTab });
          } else {
            setFilters(f);
          }
        }}
        workers={workers}
      />
    );
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        role="admin"
        onLogout={adminLogout}
      />

      <main className="main-viewport">
        <Header 
          title={pageTitle} 
          onAddVideo={() => setIsAddModalOpen(true)} 
          onMenuToggle={() => setIsMobileMenuOpen(true)}
          globalSearch={filters.search}
          setGlobalSearch={(val) => setFilters(prev => ({ ...prev, search: val }))}
        />
        <div className="content">
          {renderContent()}
        </div>
      </main>

      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefreshAll}
        workers={workers}
      />

      {selectedVideo && (
        <VideoDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setSelectedVideo(null); }}
          video={selectedVideo}
          onSuccess={handleRefreshAll}
        />
      )}
    </div>
  );
}

export default App;
