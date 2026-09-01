import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import './StorytellingCharts.css';

export const AnimatedFinancialChart = ({ data = [] }) => {
    const [showForecast, setShowForecast] = useState(true);

    if (data.length === 0) {
        return (
            <div className="storytelling-chart-container glass-panel">
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                    <p className="body-text text-muted">No financial timeline data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="storytelling-chart-container glass-panel">
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">Income & Expense Timeline</h3>
                    <p className="chart-subtitle">Monthly financial performance with AI-powered projections</p>
                </div>
                <button 
                    className="forecast-toggle-btn"
                    onClick={() => setShowForecast(!showForecast)}
                >
                    {showForecast ? <Eye size={16} /> : <EyeOff size={16} />}
                    {showForecast ? 'Hide' : 'Show'} Forecast
                </button>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#1F6F54" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#B91C1C" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#B91C1C" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A0E1A" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4A0E1A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#66605B', fontSize: 13, fontWeight: 600 }} 
                            dy={10} 
                        />
                        
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#66605B', fontSize: 13, fontWeight: 600 }} 
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        
                        <Tooltip
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                padding: '16px'
                            }}
                            formatter={(value) => value ? `$${value.toLocaleString()}` : 'N/A'}
                        />
                        
                        <Legend 
                            wrapperStyle={{ paddingTop: '24px' }} 
                            iconType="circle"
                            formatter={(value) => <span style={{ fontWeight: 700, fontSize: '13px' }}>{value}</span>}
                        />
                        
                        {/* Income Line */}
                        <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke="#1F6F54" 
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#1F6F54', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7 }}
                            name="Income"
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                        
                        {/* Expense Line */}
                        <Line 
                            type="monotone" 
                            dataKey="expense" 
                            stroke="#B91C1C" 
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#B91C1C', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7 }}
                            name="Expense"
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                        
                        {/* Forecast Line */}
                        {showForecast && (
                            <Line 
                                type="monotone" 
                                dataKey="forecast" 
                                stroke="#4A0E1A" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4, fill: '#4A0E1A', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                                name="Forecast"
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const IncomeExpenseStackedChart = ({ data = [] }) => {
    const monthlyData = data;

    if (monthlyData.length === 0) {
        return (
            <div className="storytelling-chart-container glass-panel">
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                    <p className="body-text text-muted">No income/expense data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="storytelling-chart-container glass-panel">
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">Income Sources vs Expenses</h3>
                    <p className="chart-subtitle">Stacked visualization of revenue streams and spending</p>
                </div>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="titheStack" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A0E1A" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#4A0E1A" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="offeringStack" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#1F6F54" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#66605B', fontSize: 13, fontWeight: 600 }} 
                            dy={10} 
                        />
                        
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#66605B', fontSize: 13, fontWeight: 600 }} 
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        
                        <Tooltip
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                padding: '16px'
                            }}
                            formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        
                        <Legend 
                            wrapperStyle={{ paddingTop: '24px' }} 
                            iconType="circle"
                            formatter={(value) => <span style={{ fontWeight: 700, fontSize: '13px' }}>{value}</span>}
                        />
                        
                        <Area 
                            type="monotone" 
                            dataKey="tithe" 
                            stackId="1"
                            stroke="#4A0E1A" 
                            fill="url(#titheStack)" 
                            strokeWidth={2}
                            name="Tithe"
                            animationDuration={1500}
                        />
                        
                        <Area 
                            type="monotone" 
                            dataKey="offering" 
                            stackId="1"
                            stroke="#1F6F54" 
                            fill="url(#offeringStack)" 
                            strokeWidth={2}
                            name="Offering"
                            animationDuration={1500}
                        />
                        
                        <Line 
                            type="monotone" 
                            dataKey="expense" 
                            stroke="#B91C1C" 
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#B91C1C', strokeWidth: 2, stroke: '#fff' }}
                            name="Expense"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
