import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { gasFetch } from '../api/gasFetch';
import './SystemStatus.css';

/**
 * System Connection Status Component
 * 
 * Features:
 * - Pings backend every 30 seconds
 * - Green (Connected), Yellow (Slow), Red (Offline)
 * - Detects timeout
 * - Shows tooltip with last sync time
 */
const SystemStatus = () => {
    const [status, setStatus] = useState('checking'); // checking, connected, slow, offline
    const [lastSync, setLastSync] = useState(null);
    const [responseTime, setResponseTime] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const intervalRef = useRef(null);

    // Ping backend
    const pingBackend = async () => {
        const startTime = Date.now();

        try {
            // Use a lightweight ping action
            await gasFetch('ping', {});
            
            const endTime = Date.now();
            const elapsed = endTime - startTime;

            setResponseTime(elapsed);
            setLastSync(new Date());

            // Determine status based on response time
            if (elapsed < 1000) {
                setStatus('connected'); // Fast (< 1s)
            } else if (elapsed < 3000) {
                setStatus('slow'); // Slow (1-3s)
            } else {
                setStatus('offline'); // Very slow (> 3s)
            }

        } catch (error) {
            setStatus('offline');
            setResponseTime(0);
            setLastSync(new Date());
        }
    };

    // Initial ping and setup interval
    useEffect(() => {
        pingBackend();

        // Ping every 30 seconds
        intervalRef.current = setInterval(() => {
            pingBackend();
        }, 30000);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Format last sync time
    const formatLastSync = () => {
        if (!lastSync) return 'Never';

        const now = new Date();
        const diffMs = now - lastSync;
        const diffSecs = Math.floor(diffMs / 1000);

        if (diffSecs < 60) return `${diffSecs}s ago`;
        if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
        return `${Math.floor(diffSecs / 3600)}h ago`;
    };

    // Get status config
    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    color: '#1F6F54',
                    bgColor: 'rgba(31, 111, 84, 0.12)',
                    icon: Wifi,
                    label: 'Connected',
                    pulse: false
                };
            case 'slow':
                return {
                    color: '#D97706',
                    bgColor: 'rgba(217, 119, 6, 0.12)',
                    icon: AlertCircle,
                    label: 'Slow',
                    pulse: true
                };
            case 'offline':
                return {
                    color: '#B91C1C',
                    bgColor: 'rgba(185, 28, 28, 0.12)',
                    icon: WifiOff,
                    label: 'Offline',
                    pulse: true
                };
            default:
                return {
                    color: '#6B7280',
                    bgColor: 'rgba(107, 114, 128, 0.12)',
                    icon: Wifi,
                    label: 'Checking...',
                    pulse: true
                };
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;

    return (
        <div 
            className="system-status-container"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div 
                className={`status-indicator ${config.pulse ? 'pulse' : ''}`}
                style={{ 
                    background: config.bgColor,
                    color: config.color 
                }}
            >
                <StatusIcon size={16} strokeWidth={2.5} />
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="status-tooltip">
                    <div className="tooltip-header">
                        <StatusIcon size={14} style={{ color: config.color }} />
                        <span className="tooltip-title">{config.label}</span>
                    </div>
                    <div className="tooltip-divider"></div>
                    <div className="tooltip-content">
                        <div className="tooltip-row">
                            <span className="tooltip-label">Last Sync:</span>
                            <span className="tooltip-value">{formatLastSync()}</span>
                        </div>
                        {responseTime > 0 && (
                            <div className="tooltip-row">
                                <span className="tooltip-label">Response:</span>
                                <span className="tooltip-value">{responseTime}ms</span>
                            </div>
                        )}
                        <div className="tooltip-row">
                            <span className="tooltip-label">Check Interval:</span>
                            <span className="tooltip-value">30s</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemStatus;
