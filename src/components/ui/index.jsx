import React from 'react';

export const GlassPanel = ({ children, className = '', hover = false }) => (
    <div className={`
        glass-panel p-6 
        ${hover ? 'hover:-translate-y-1 transition-transform duration-300' : ''} 
        ${className}
    `}>
        {children}
    </div>
);

export const MetricCard = ({ title, value, icon: Icon, trend, isPositive, colorClass = 'text-wine' }) => (
    <GlassPanel hover className="relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-5 group-hover:opacity-20 transition-opacity ${colorClass.replace('text-', 'bg-')}`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon size={24} className={colorClass} />
            </div>
            {trend && (
                <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-sm font-medium text-muted mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-primary">{value || '...'}</h3>
        </div>
    </GlassPanel>
);

export const SmartButton = ({ children, loading, variant = 'primary', ...props }) => (
    <button
        disabled={loading}
        className={`btn btn-${variant} flex items-center justify-center gap-2 group disabled:opacity-70`}
        {...props}
    >
        {loading ? <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-5 h-5" /> : children}
    </button>
);

export const StatusBadge = ({ status, type = 'info' }) => {
    const types = {
        success: 'bg-green-50 text-green-600',
        error: 'bg-red-50 text-red-600',
        info: 'bg-blue-50 text-blue-600',
        warning: 'bg-yellow-50 text-yellow-600'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${types[type]}`}>
            {status}
        </span>
    );
};

export const FinanceInput = ({ label, icon: Icon, ...props }) => (
    <div className="form-group">
        {label && <label className="label">{label}</label>}
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />}
            <input className={`input ${Icon ? 'pl-10' : ''}`} {...props} />
        </div>
    </div>
);

export const LoadingSkeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}></div>
);
