import React from 'react';

// Advanced search icon for a future feature placeholder.
export const AdvancedSearchIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 11.65a6 6 0 11-12 0 6 6 0 0112 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h6M3 12h6" />
    </svg>
);
