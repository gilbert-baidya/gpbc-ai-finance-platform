import React from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import './AIPanel.css';

const AIPanel = () => {
    return (
        <div className="ai-panel glass-panel">
            <div className="ai-header">
                <div className="ai-title">
                    <Sparkles size={18} className="ai-icon" />
                    <h3>AI Intelligence</h3>
                </div>
                <span className="badge">LIV</span>
            </div>

            <div className="ai-content">
                <div className="ai-card insight">
                    <div className="ai-card-header">
                        <TrendingUp size={16} />
                        <span>Financial Insight</span>
                    </div>
                    <p>Tithes have increased by <strong>12%</strong> compared to last month, driven by the Youth Ministry fundraising.</p>
                </div>

                <div className="ai-card risk">
                    <div className="ai-card-header">
                        <AlertTriangle size={16} />
                        <span>Risk Alert</span>
                    </div>
                    <p>Projected expenses for "Summer Camp" may exceed budget by <strong>$1,200</strong> if current spending continues.</p>
                </div>

                <div className="ai-card opportunity">
                    <div className="ai-card-header">
                        <Lightbulb size={16} />
                        <span>Ministry Opportunity</span>
                    </div>
                    <p>Surplus in "General Fund" suggests potential to launch the planned "Community Outreach" early.</p>
                </div>
            </div>

            <div className="ai-input-area">
                <input type="text" placeholder="Ask AI financial assistant..." />
            </div>
        </div>
    );
};

export default AIPanel;
