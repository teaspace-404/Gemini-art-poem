import React from 'react';

// An icon to represent flipping or switching between two states.
export const FlipIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path fill="currentColor" stroke="currentColor" d="M5 16.25V7.75L11 12L5 16.25Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 16.25V7.75L13 12L19 16.25Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 6.5C14.192 5.432 12.633 4.75 11 4.75C8.097 4.75 5.75 6.5 5.75 6.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 6.5L16.25 4.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 6.5L13.75 6.25" />
    </svg>
);