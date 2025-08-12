import  { createContext, useContext, useState } from 'react';
import React from 'react';

const AppContext = createContext({
  prompt: '',
  setPrompt: () => {},
  currentStep: 0,
  setCurrentStep: () => {},
  loading: false,
  setLoading: () => {},
});

// Create provider component
export const AppProvider = ({ children }) => {
  const [prompt, setPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      prompt,
      setPrompt,
      currentStep,
      setCurrentStep,
      loading,
      setLoading,
    }),
    [prompt, currentStep, loading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 