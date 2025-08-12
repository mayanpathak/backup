
import React from 'react';

// Utility function to conditionally join Tailwind CSS classes.
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ');
}

// --- Type Definition for Tab ---
type Tab = 'code' | 'preview';

interface TabViewProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// --- Inline SVG Icons (replacing lucide-react for self-containment) ---
const IconCode2 = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8s11 8 11 8s-4 8-11 8s-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// --- Tab Configuration Constant ---
const tabsConfig = [
  { id: 'code', label: 'Code', icon: IconCode2 },
  { id: 'preview', label: 'Preview', icon: IconEye },
];

export function TabView({ activeTab, onTabChange }: TabViewProps) {
  return (
    <div
      className="relative flex border border-gray-800 rounded-lg bg-gray-900 overflow-hidden w-fit"
      role="tablist" // ARIA role for a set of tabs
      aria-label="Code and Preview Views"
    >
      {tabsConfig.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as Tab)}
            className={cn(
              "relative z-10 flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
              isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            )}
            role="tab" // ARIA role for each tab button
            aria-selected={isActive} // Indicate if the tab is currently selected
            tabIndex={isActive ? 0 : -1} // Make active tab focusable by default, others focusable by arrow keys
            id={`tab-${tab.id}`} // Unique ID for each tab
            aria-controls={`panel-${tab.id}`} // Associate with corresponding panel (if applicable)
          >
            <IconComponent />
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        );
      })}

      {/* Dynamic highlight indicator for the active tab */}
      {/* This requires a slightly more complex calculation if it needs to smoothly move */}
      {/* For simplicity, we'll apply it directly to the active button's background */}
      {/* If a continuous sliding indicator is desired, it would involve Framer Motion or calculating width/position */}
      <div
        className={cn(
          "absolute inset-0 bg-gray-800 rounded-lg transition-all duration-300 ease-in-out",
          activeTab === 'code' ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{
          width: `calc(50% + ${activeTab === 'code' ? '0px' : '0px'})` // Adjust width dynamically if needed for exact fit
        }}
        aria-hidden="true" // Hide from screen readers as it's purely decorative
      ></div>
    </div>
  );
}
