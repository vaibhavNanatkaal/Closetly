// src/components/ui/PageHeader.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const PageHeader = ({ 
  title, 
  description, 
  actions, 
  customIcon, 
  className,
  icon: propIcon,
  gradient = false,
  glowEffect = false
}) => {
  const location = useLocation();

  // Route map to ensure consistent titles across the app
  const routeMap = {
    '/subscription-management': {
      title: 'Subscription Management',
      description: 'Comprehensive lifecycle control for customer subscriptions and plan modifications',
      icon: 'Users'
    },
    '/invoice-management': {
      title: 'Invoice Management',
      description: 'Manage, track, and generate invoices for your customers',
      icon: 'FileText'
    },
    '/payment-gateway-configuration': {
      title: 'Payment Gateway Configuration',
      description: 'Configure and manage payment processors and gateway settings',
      icon: 'Settings'
    },
    '/usage-analytics-reporting': {
      title: 'Usage Analytics & Reporting',
      description: 'Comprehensive usage metrics and revenue analytics',
      icon: 'TrendingUp'
    },
    '/customer-portal': {
      title: 'Customer Portal',
      description: 'Self-service customer portal for subscription management',
      icon: 'ExternalLink'
    },
    '/dunning-management': {
      title: 'Dunning Management',
      description: 'Automated payment retry and dunning workflow management',
      icon: 'AlertCircle'
    }
  };

  // Get current route info or use provided props
  const currentRoute = routeMap?.[location?.pathname];
  const displayTitle = title || currentRoute?.title || 'Page';
  const displayDescription = description || currentRoute?.description || '';
  const displayIcon = customIcon || propIcon || currentRoute?.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("mb-8 sm:mb-12 page-header", className)}
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
        <div className="flex-1">
          <motion.div 
            className="flex items-center space-x-4 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {displayIcon && (
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
                gradient 
                  ? "bg-gradient-fashion shadow-fashion-glow" 
                  : "bg-primary/10 border border-primary/20",
                glowEffect && "animate-pulse"
              )}>
                <Icon 
                  name={displayIcon} 
                  size={24} 
                  className={gradient ? "text-white" : "text-primary"} 
                />
              </div>
            )}
            <div>
              <h1 className={cn(
                "text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight",
                gradient 
                  ? "text-gradient-fashion" 
                  : "text-foreground"
              )}>
                {displayTitle}
              </h1>
              {displayDescription && (
                <motion.p 
                  className="text-muted-foreground text-lg sm:text-xl mt-2 font-light leading-relaxed max-w-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {displayDescription}
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>
        
        {actions && (
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 lg:mt-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;