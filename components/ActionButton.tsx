import React from 'react';

// A reusable button component for consistent styling
const ActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
    title?: string;
}> = ({ onClick, disabled, className = '', children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`font-semibold py-2 px-4 rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-md transform hover:scale-105 active:scale-100 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 ${className}`}
    >
        {children}
    </button>
);

export default ActionButton;
