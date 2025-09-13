// src/pages/customer-portal/components/SubscriptionCard.jsx
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const SubscriptionCard = ({ subscription, formatCurrency, formatDate, onUpgrade, onDowngrade, onCancel }) => {
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Mock plan options
  const planOptions = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19.99,
      features: ['Up to 5,000 API calls/month', '50GB Storage', 'Email Support']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49.99,
      features: ['Up to 10,000 API calls/month', '100GB Storage', '24/7 Support', 'Advanced Analytics'],
      current: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      features: ['Unlimited API calls', '500GB Storage', 'Priority Support', 'Custom Analytics', 'SLA']
    }
  ];

  const calculateProration = (newPrice, currentPrice) => {
    const daysRemaining = Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));
    const daysInPeriod = Math.ceil((new Date(subscription.currentPeriodEnd) - new Date(subscription.currentPeriodStart)) / (1000 * 60 * 60 * 24));
    const proratedCredit = (currentPrice * daysRemaining) / daysInPeriod;
    const proratedCharge = (newPrice * daysRemaining) / daysInPeriod;
    return proratedCharge - proratedCredit;
  };

  const handlePlanChange = async (plan) => {
    setSelectedPlan(plan);
    const prorationAmount = calculateProration(plan?.price, subscription?.plan?.price);
    
    // Always redirect to Stripe customer portal for plan changes
    // Stripe will handle the upgrade/downgrade logic
    onUpgrade(); // This will open the customer portal
    
    setShowPlanOptions(false);
  };

  const handleCancelSubscription = () => {
    onCancel();
    setShowCancelConfirm(false);
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Subscription Management</h2>
        <button
          onClick={() => setShowPlanOptions(!showPlanOptions)}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Icon name="RefreshCw" size={16} className="mr-2" />
          {showPlanOptions ? 'Hide Plans' : 'View Plans'}
        </button>
      </div>
      {/* Current Plan Details */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{subscription?.plan?.name} Plan</h3>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(subscription?.plan?.price)}
              <span className="text-sm font-normal text-text-secondary">/{subscription?.plan?.interval}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Next billing</p>
            <p className="text-lg font-semibold text-text-primary">
              {formatDate(subscription?.nextBillingDate)}
            </p>
          </div>
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-secondary">Plan Features:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subscription?.plan?.features?.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Icon name="Check" size={16} className="text-success flex-shrink-0" />
                <span className="text-sm text-text-primary">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Plan Options */}
      {showPlanOptions && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Available Plans</h3>
          <p className="text-sm text-text-secondary mb-4">
            Click on any plan below to manage your subscription through Stripe's secure portal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planOptions?.map((plan) => (
              <div
                key={plan?.id}
                className={`border rounded-lg p-4 transition-all ${
                  plan?.current
                    ? 'border-primary bg-primary-50' 
                    : 'border-border-light hover:border-primary hover:bg-surface-hover cursor-pointer hover:shadow-md'
                }`}
                onClick={() => !plan?.current && handlePlanChange(plan)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-text-primary">{plan?.name}</h4>
                  {plan?.current && (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-primary mb-2">
                  {formatCurrency(plan?.price)}
                  <span className="text-sm font-normal text-text-secondary">/month</span>
                </p>
                <div className="space-y-1">
                  {plan?.features?.slice(0, 2)?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Icon name="Check" size={14} className="text-success flex-shrink-0" />
                      <span className="text-xs text-text-secondary">{feature}</span>
                    </div>
                  ))}
                  {plan?.features?.length > 2 && (
                    <p className="text-xs text-text-tertiary">+{plan?.features?.length - 2} more features</p>
                  )}
                </div>
                {!plan?.current && (
                  <div className="mt-3">
                    <div className="text-xs text-text-secondary">
                      Click to {plan?.price > subscription?.plan?.price ? 'upgrade' : 'downgrade'} via Stripe
                      {plan?.price !== subscription?.plan?.price && (
                        <span className="block font-medium text-text-primary">
                          Prorated: {formatCurrency(Math.abs(calculateProration(plan?.price, subscription?.plan?.price)))}
                          {calculateProration(plan?.price, subscription?.plan?.price) >= 0 ? ' charge' : ' credit'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Subscription Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowPlanOptions(!showPlanOptions)}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
        >
          <Icon name="Zap" size={16} className="mr-2" />
          {showPlanOptions ? 'Hide Plans' : 'View All Plans'}
        </button>
        
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-error text-error rounded-lg hover:bg-error-50 transition-colors text-sm font-medium"
        >
          <Icon name="XCircle" size={16} className="mr-2" />
          Cancel Subscription
        </button>
      </div>
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg shadow-modal max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <Icon name="AlertTriangle" size={24} className="text-warning mr-3" />
              <h3 className="text-lg font-semibold text-text-primary">Cancel Subscription</h3>
            </div>
            <p className="text-text-secondary mb-6">
              Are you sure you want to cancel your subscription? Your access will continue until {formatDate(subscription?.currentPeriodEnd)}, after which your account will be downgraded.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-border-light text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error-600 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;