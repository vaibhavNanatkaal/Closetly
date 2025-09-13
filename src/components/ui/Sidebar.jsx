import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState({
    overview: true,
    billing: true,
    analytics: true,
    configuration: true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationGroups = [
    {
      id: 'overview',
      title: 'Overview',
      items: []
    },
    {
      id: 'billing',
      title: 'Billing Operations',
      items: [
        {
          label: 'Subscription Management',
          path: '/subscription-management',
          icon: 'Users',
          tooltip: 'Manage customer subscriptions and plans'
        },
        {
          label: 'Invoice Management',
          path: '/invoice-management',
          icon: 'FileText',
          tooltip: 'Create and manage invoices'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      items: [
        {
          label: 'Usage Analytics & Reporting',
          path: '/usage-analytics-reporting',
          icon: 'TrendingUp',
          tooltip: 'Usage metrics and revenue analytics'
        }
      ]
    },
    {
      id: 'configuration',
      title: 'Configuration',
      items: [
        {
          label: 'Payment Gateway Configuration',
          path: '/payment-gateway-configuration',
          icon: 'Settings',
          tooltip: 'Configure payment processors'
        },
        {
          label: 'Dunning Management',
          path: '/dunning-management',
          icon: 'AlertCircle',
          tooltip: 'Automated payment retry settings'
        }
      ]
    }
  ];

  const customerPortalItem = {
    label: 'Customer Portal',
    path: '/customer-portal',
    icon: 'ExternalLink',
    tooltip: 'Self-service customer portal'
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev?.[groupId]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const Logo = () => (
    <div className="flex items-center space-x-2 p-4">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <Icon name="DollarSign" size={20} className="text-white" />
      </div>
      <span className="text-xl font-semibold text-text-primary">BillFlow</span>
    </div>
  );

  const NavigationGroup = ({ group }) => (
    <div className="mb-6">
      <button
        onClick={() => toggleGroup(group?.id)}
        className="flex items-center justify-between w-full nav-group-header hover:text-text-secondary transition-colors duration-200"
      >
        <span className={`text-left ${
          group?.id === 'analytics' ? 'whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]' : ''
        }`}>
          {group?.title}
        </span>
        <Icon
          name="ChevronDown"
          size={16}
          className={`transform transition-transform duration-200 flex-shrink-0 ml-2 ${
            expandedGroups?.[group?.id] ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {expandedGroups?.[group?.id] && (
        <div className="mt-2 space-y-1">
          {group?.items?.map((item) => (
            <NavigationItem key={item?.path} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  const NavigationItem = ({ item }) => (
    <button
      onClick={() => handleNavigation(item?.path)}
      className={`nav-item w-full ${
        isActivePath(item?.path) ? 'nav-item-active' : 'nav-item-inactive'
      }`}
      title={item?.tooltip}
    >
      <Icon name={item?.icon} size={18} className="mr-3 flex-shrink-0" />
      <span className="truncate text-left font-medium">{item?.label}</span>
      {isActivePath(item?.path) && (
        <div className="ml-auto w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-300 p-2 bg-surface rounded-lg shadow-card border border-border-light"
      >
        <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
      </button>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-100"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-surface border-r border-border-light shadow-card z-100
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 sidebar-width
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="border-b border-border-light">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {navigationGroups?.map((group) => (
              <NavigationGroup key={group?.id} group={group} />
            ))}

            {/* Customer Portal - Separate Section */}
            <div className="border-t border-border-light pt-4 mt-4">
              <div className="nav-group-header mb-2">Customer Access</div>
              <NavigationItem item={customerPortalItem} />
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border-light p-4">
            <div className="text-xs text-text-tertiary">
              <p>BillFlow v2.1.0</p>
              <p className="mt-1">© 2024 BillFlow Inc.</p>
            </div>
          </div>
        </div>
      </aside>
      {/* Bottom Tab Navigation for Mobile - Removed */}
    </>
  );
};

export default Sidebar;