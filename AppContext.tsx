import React, { createContext, useContext } from 'react';
import { useAppController } from './useAppController';

// Create a type for the context value based on the return type of useAppController
type AppContextType = ReturnType<typeof useAppController>;

// Create the context with a default value (null) and check for it to ensure it's used within the provider
const AppContext = createContext<AppContextType | null>(null);

// Create a provider component that wraps its children with the context
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const controller = useAppController();
    return (
        <AppContext.Provider value={controller}>
            {children}
        </AppContext.Provider>
    );
};

// Create a custom hook for easy consumption of the context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
