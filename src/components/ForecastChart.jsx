import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, ComposedChart, Legend
} from 'recharts';
import { GlassPanel, LoadingSkeleton } from './ui';
import { TrendingUp, Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-3 border-none shadow-2xl text-xs space-y-1">
                <p className="font-bold text-wine mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between gap-4">
                        <span className="text-muted">{entry.name}:</span>
                        <span className="font-bold" style={{ color: entry.color }}>
                            ${entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const ForecastChart = ({ data, loading }) => {
    const [showForecast, setShowForecast] = useState(true);

    if (loading) {
        return (
            <GlassPanel className="h-[400px] flex flex-col justify-between">
                <LoadingSkeleton className="h-6 w-48" />
                <LoadingSkeleton className="h-64 w-full" />
            </GlassPanel>
        );
    }

    return (
        <GlassPanel className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-wine" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-wine">Giving Forecast</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowForecast(!showForecast)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${showForecast ? 'bg-wine text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                        {showForecast ? 'FORECAST ON' : 'ACTUALS ONLY'}
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A0E1A" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#4A0E1A" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#1F6F54" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#757575' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#757575' }}
                            tickFormatter={(val) => `$${val / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Confidence Interval Area */}
                        {showForecast && (
                            <Area
                                type="monotone"
                                dataKey="high"
                                dataKey2="low"
                                stroke="none"
                                fill="#1F6F54"
                                fillOpacity={0.05}
                                name="Confidence Range"
                            />
                        )}

                        {/* Actual Amount Line */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#4A0E1A"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4A0E1A', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                            name="Actual Giving"
                        />

                        {/* Forecast Amount Line */}
                        {showForecast && (
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke="#1F6F54"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Forecasted"
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </GlassPanel>
    );
};
