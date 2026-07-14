import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const PLATFORM_COLORS = {
  youtube: '#ff0000',
  tiktok: '#010101',
  instagram: '#e1306c'
};

const VideoChart = ({ data, type, title, timelineOptions, selectedTimeline, onTimelineChange }) => {
  if (type === 'area') {
    return (
      <div className="chart-container card">
        <div className="chart-header">
          <h3>{title || 'Total Views Over Time'}</h3>
          {timelineOptions && (
            <select 
              className="chart-select"
              value={selectedTimeline}
              onChange={(e) => onTimelineChange(Number(e.target.value))}
            >
              {timelineOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                itemStyle={{ color: '#2563eb' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorViews)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="chart-container card">
        <div className="chart-header">
          <h3>{title || 'Uploads Per Day'}</h3>
          <p className="text-muted text-sm">Last 7 days</p>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const pieData = data.map(d => ({
      name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : d.name,
      value: d.count || d.value || 0,
      color: PLATFORM_COLORS[d._id] || PLATFORM_COLORS[d.name?.toLowerCase()] || '#6366f1'
    }));

    return (
      <div className="chart-container card">
        <div className="chart-header">
          <h3>{title || 'Platform Breakdown'}</h3>
          <p className="text-muted text-sm">By video count</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoChart;
