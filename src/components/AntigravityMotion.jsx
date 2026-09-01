import React, { useEffect, useRef, useState } from 'react';

/**
 * Antigravity Motion Wrapper Component
 * Adds premium lift animations with spring easing and entrance effects
 * 
 * @param {string} variant - Animation variant: 'lift' | 'lift-glow' | 'fade-up' | 'spring'
 * @param {number} delay - Entrance animation delay in ms
 * @param {boolean} disabled - Disable all animations
 */
const AntigravityMotion = ({ 
    children, 
    variant = 'lift',
    delay = 0,
    disabled = false,
    className = '',
    style = {}
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        if (disabled) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        setIsVisible(true);
                    }, delay);
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [delay, disabled]);

    const getAnimationClass = () => {
        if (disabled) return '';
        
        const baseClass = 'antigravity';
        const variantClass = `antigravity-${variant}`;
        const visibleClass = isVisible ? 'antigravity-visible' : '';
        
        return `${baseClass} ${variantClass} ${visibleClass}`;
    };

    return (
        <div 
            ref={elementRef}
            className={`${getAnimationClass()} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default AntigravityMotion;
