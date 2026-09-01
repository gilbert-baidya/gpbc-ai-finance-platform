import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { gasFetch } from '../api/gasFetch';
import './Charts.css';

export const GivingTrendChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChartData();
    }, []);

    const loadChartData = async () => {
        try {
            const result = await gasFetch('getDashboardSummary');
            if (result?.monthlyData) {
                setData(result.monthlyData);
            }
        } catch (err) {
            console.error('Failed to load chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="chart-container glass-card">
                <div className="chart-header">
                    <h3>Giving Trends</h3>
                </div>
                <div className="chart-wrapper flex items-center justify-center">
                    <p className="text-gray-400">Loading chart...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="chart-container glass-card">
                <div className="chart-header">
                    <h3>Giving Trends</h3>
                </div>
                <div className="chart-wrapper flex items-center justify-center">
                    <p className="text-gray-400">No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-container glass-card">
            <div className="chart-header">
                <h3>Giving Trends</h3>
                <select className="chart-filter">
                    <option>This Year</option>
                    <option>Last Year</option>
                </select>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTithe" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A0E1A" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#4A0E1A" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOffering" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#1F6F54" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#66605B', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#66605B', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="tithe" stroke="#4A0E1A" fillOpacity={1} fill="url(#colorTithe)" strokeWidth={3} />
                        <Area type="monotone" dataKey="offering" stroke="#1F6F54" fillOpacity={1} fill="url(#colorOffering)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const IncomeExpenseChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChartData();
    }, []);

    const loadChartData = async () => {
        try {
            const result = await gasFetch('getDashboardSummary');
            if (result?.monthlyData) {
                setData(result.monthlyData);
            }
        } catch (err) {
            console.error('Failed to load chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="chart-container glass-card">
                <div className="chart-header">
                    <h3>Income vs Expense</h3>
                </div>
                <div className="chart-wrapper flex items-center justify-center">
                    <p className="text-gray-400">Loading chart...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="chart-container glass-card">
                <div className="chart-header">
                    <h3>Income vs Expense</h3>
                </div>
                <div className="chart-wrapper flex items-center justify-center">
                    <p className="text-gray-400">No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-container glass-card">
            <div className="chart-header">
                <h3>Income vs Expense</h3>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#66605B', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#66605B', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                        <Bar dataKey="tithe" name="Income" fill="#4A0E1A" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="expense" name="Expense" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
