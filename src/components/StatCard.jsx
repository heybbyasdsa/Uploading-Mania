import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, change, trend, icon: Icon, color }) => {
  return (
    <motion.div
      className="stat-card card"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stat-card-header">
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
          <Icon size={20} />
        </div>
        {change && (
          <div className={`stat-trend ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="stat-card-content">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatCard;
