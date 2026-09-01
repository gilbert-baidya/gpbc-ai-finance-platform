import React from 'react';
import { Activity, TrendingUp, Shield, Target } from 'lucide-react';
import './FinancialHealthScore.css';

export const FinancialHealthScore = ({ score = 0, grade = 'N/A', factors = [] }) => {
    // Calculate stroke offset for circular progress
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Determine grade from score
    const calculatedGrade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    const displayGrade = grade !== 'N/A' ? grade : calculatedGrade;

    const displayFactors = factors;

    const getGradeColor = (grade) => {
        if (grade === 'A') return '#1F6F54';
        if (grade === 'B') return '#2B4C7E';
        if (grade === 'C') return '#D4AF37';
        return '#B91C1C';
    };

    return (
        <div className="financial-health-score glass-panel">
            <div className="health-score-header">
                <h3 className="section-title text-wine">Financial Health Score</h3>
                <p className="body-text text-muted" style={{ marginTop: '4px' }}>
                    Comprehensive financial wellness assessment
                </p>
            </div>

            <div className="health-score-body">
                {/* Circular Score Visualization */}
                <div className="score-circle-container">
                    <svg className="score-circle" viewBox="0 0 160 160">
                        {/* Background Circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke="rgba(74, 14, 26, 0.1)"
                            strokeWidth="12"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="none"
                            stroke={getGradeColor(grade)}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className="score-progress-ring"
                            transform="rotate(-90 80 80)"
                        />
                    </svg>
                    <div className="score-center">
                        <div className="score-number">{score}</div>
                        <div className="score-grade" style={{ color: getGradeColor(grade) }}>
                            Grade {grade}
                        </div>
                    </div>
                </div>

                {/* Health Factors Breakdown */}
                {displayFactors.length > 0 && (
                    <div className="health-factors">
                        {displayFactors.map((factor, index) => {
                            const Icon = factor.icon;
                            return (
                                <div key={index} className="health-factor-item">
                                    <div className="factor-header">
                                        <div className="factor-icon" style={{ background: `${factor.color}15` }}>
                                            <Icon size={16} color={factor.color} />
                                        </div>
                                        <span className="factor-label">{factor.label}</span>
                                        <span className="factor-score" style={{ color: factor.color }}>
                                            {factor.score}
                                        </span>
                                    </div>
                                    <div className="factor-progress-bar">
                                        <div 
                                            className="factor-progress-fill"
                                            style={{ 
                                                width: `${factor.score}%`,
                                                background: factor.color
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
