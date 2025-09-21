import React from 'react';

// A smaller version of the sparkles icon for use inside buttons
export const SparklesButtonIcon: React.FC<{className?: string}> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 6.343l2.829 2.829m11.314-2.829l-2.829 2.829M12 21v-4M21 12h-4M17.657 17.657l-2.829-2.829M6.343 17.657l2.829-2.829" />
    </svg>
);
