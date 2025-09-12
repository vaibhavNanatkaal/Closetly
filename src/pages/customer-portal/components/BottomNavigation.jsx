// src/pages/customer-portal/components/BottomNavigation.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'Home'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings'
    }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light z-50">
      <div className="flex items-center justify-around">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => onTabChange(tab?.id)}
            className={`flex flex-col items-center justify-center py-2 px-4 min-w-0 flex-1 transition-colors ${
              activeTab === tab?.id
                ? 'text-primary' :'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon 
              name={tab?.icon} 
              size={20} 
              className={activeTab === tab?.id ? 'text-primary' : 'text-text-secondary'}
            />
            <span className={`text-xs mt-1 font-medium ${
              activeTab === tab?.id ? 'text-primary' : 'text-text-secondary'
            }`}>
              {tab?.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;