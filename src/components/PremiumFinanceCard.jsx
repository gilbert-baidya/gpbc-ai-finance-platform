import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Gift, Wallet, Activity } from 'lucide-react';
import './PremiumFinanceCard.css';

/**
 * Premium Finance Summary Card with Animation
 * 
 * Features:
 * - Animated number count up
 * - Trend arrow indicator
 * - Monthly label
 * - Glass morphism background
 * - Dark mode support
 * - Stripe/Linear premium SaaS style
 */
const PremiumFinanceCard = ({ 
    title, 
    amount, 
    trend = 0, 
    icon: Icon = DollarSign,
    colorTheme = 'wine' // wine, green, blue, gold
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    // Animate number count up
    useEffect(() => {
        if (!isVisible || !amount) return;

        const duration = 1500; // 1.5 seconds
        const steps = 60;
        const increment = amount / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setDisplayValue(amount);
                clearInterval(timer);
            } else {
                setDisplayValue(prev => Math.min(prev + increment, amount));
            }
        }, stepDuration);

        return () => clearInterval(timer);
    }, [amount, isVisible]);

    // Intersection Observer for animation trigger
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Determine trend direction
    const isPositiveTrend = trend > 0;
    const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

    return (
        <div 
            ref={cardRef}
            className={`premium-finance-card theme-${colorTheme}`}
            data-trend={isPositiveTrend ? 'up' : 'down'}
        >
            {/* Background Gradient */}
            <div className="card-gradient"></div>

            {/* Header */}
            <div className="card-header">
                <div className="card-icon-wrapper">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="card-title">{title}</div>
            </div>

            {/* Amount */}
            <div className="card-amount">
                {formatCurrency(displayValue)}
            </div>

            {/* Footer */}
            <div className="card-footer">
                <div className="monthly-label">This Month</div>
                {trend !== 0 && (
                    <div className={`trend-badge ${isPositiveTrend ? 'positive' : 'negative'}`}>
                        <TrendIcon size={14} strokeWidth={2.5} />
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            {/* Glass Shine Effect */}
            <div className="card-shine"></div>
        </div>
    );
};

/**
 * Finance Summary Grid Component
 * Displays all 4 cards in responsive grid
 */
export const FinanceSummaryCards = ({ data }) => {
    const cards = [
        {
            title: 'Tithes',
            amount: data?.tithe || 0,
            trend: 12.5,
            icon: Gift,
            colorTheme: 'wine'
        },
        {
            title: 'Offerings',
            amount: data?.offering || 0,
            trend: 8.3,
            icon: Wallet,
            colorTheme: 'green'
        },
        {
            title: 'Expenses',
            amount: data?.expenses || 0,
            trend: -3.2,
            icon: Activity,
            colorTheme: 'blue'
        },
        {
            title: 'Net Balance',
            amount: data?.netBalance || 0,
            trend: data?.netBalance >= 0 ? 15.7 : -5.2,
            icon: DollarSign,
            colorTheme: data?.netBalance >= 0 ? 'green' : 'wine'
        }
    ];

    return (
        <div className="finance-summary-grid">
            {cards.map((card, index) => (
                <PremiumFinanceCard
                    key={index}
                    title={card.title}
                    amount={card.amount}
                    trend={card.trend}
                    icon={card.icon}
                    colorTheme={card.colorTheme}
                />
            ))}
        </div>
    );
};

export default PremiumFinanceCard;
