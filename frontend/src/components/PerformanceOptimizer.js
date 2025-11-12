// src/components/PerformanceOptimizer.js
import { useEffect } from 'react';

const PerformanceOptimizer = () => {
    useEffect(() => {
        // Disable animations during scroll for better performance
        let scrollTimer;
        const handleScroll = () => {
            document.body.classList.add('no-transition');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                document.body.classList.remove('no-transition');
            }, 100);
        };

        // Use passive scroll listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimer);
        };
    }, []);

    return null;
};

export default PerformanceOptimizer;