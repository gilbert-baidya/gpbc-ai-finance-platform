import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import './MetricCard.css';

const MetricCard = ({ title, value, trend, isPositive, icon: Icon }) => {
    return (
        <div className="metric-card glass-card">
            <div className="card-header">
                <span className="card-title">{title}</span>
                <div className="icon-wrapper">
                    {Icon ? <Icon size={20} /> : <Activity size={20} />}
                </div>
            </div>

            <div className="card-body">
                <h2 className="card-value">{value}</h2>
                {trend && (
                    <div className={`trend-indicator ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>

            <div className="glow-effect"></div>
        </div>
    );
};

export default MetricCard;
