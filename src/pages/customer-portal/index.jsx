// src/pages/customer-portal/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import AccountOverview from './components/AccountOverview';
import SubscriptionCard from './components/SubscriptionCard';
// Billing section removed per requirements
import UsageTracking from './components/UsageTracking';
import NotificationSettings from './components/NotificationSettings';
import SupportWidget from './components/SupportWidget';
import BottomNavigation from './components/BottomNavigation';
import MobileHeader from './components/MobileHeader';

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState('en-US');
  const [currency, setCurrency] = useState('USD');
  const [showSupportChat, setShowSupportChat] = useState(false);

  // Mock customer data
  useEffect(() => {
    const mockCustomerData = {
      customer: {
        id: 'cust_12345',
        name: 'John Doe',
        email: 'john.doe@company.com',
        avatar: null,
        joinedDate: '2023-06-15',
        preferredLanguage: 'en-US',
        timezone: 'America/New_York'
      },
      subscription: {
        id: 'sub_67890',
        plan: {
          name: 'Professional',
          price: 49.99,
          currency: 'USD',
          interval: 'month',
          features: [
            'Up to 10,000 API calls/month',
            '100GB Storage',
            '24/7 Support',
            'Advanced Analytics'
          ]
        },
        status: 'active',
        currentPeriodStart: '2024-01-01',
        currentPeriodEnd: '2024-02-01',
        nextBillingDate: '2024-02-01',
        cancelAtPeriodEnd: false,
        trialEnd: null
      },
      usage: {
        apiCalls: {
          current: 7543,
          limit: 10000,
          percentage: 75.43
        },
        storage: {
          current: 68.5,
          limit: 100,
          percentage: 68.5,
          unit: 'GB'
        },
        users: {
          current: 8,
          limit: 15,
          percentage: 53.33
        }
      },
      paymentMethods: [
        {
          id: 'pm_1',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true
        },
        {
          id: 'pm_2',
          type: 'card',
          brand: 'mastercard',
          last4: '8888',
          expiryMonth: 8,
          expiryYear: 2026,
          isDefault: false
        }
      ],
      invoices: [
        {
          id: 'inv_001',
          number: 'INV-2024-001',
          amount: 49.99,
          currency: 'USD',
          status: 'paid',
          date: '2024-01-01',
          dueDate: '2024-01-15',
          pdfUrl: '/invoices/inv_001.pdf'
        },
        {
          id: 'inv_002',
          number: 'INV-2023-012',
          amount: 49.99,
          currency: 'USD',
          status: 'paid',
          date: '2023-12-01',
          dueDate: '2023-12-15',
          pdfUrl: '/invoices/inv_002.pdf'
        },
        {
          id: 'inv_003',
          number: 'INV-2023-011',
          amount: 49.99,
          currency: 'USD',
          status: 'overdue',
          date: '2023-11-01',
          dueDate: '2023-11-15',
          pdfUrl: '/invoices/inv_003.pdf'
        }
      ],
      notifications: {
        billingReminders: true,
        usageAlerts: true,
        subscriptionChanges: true,
        marketingEmails: false,
        securityAlerts: true
      }
    };

    setTimeout(() => {
      setCustomerData(mockCustomerData);
      setLocale(mockCustomerData?.customer?.preferredLanguage);
      setCurrency(mockCustomerData?.subscription?.plan?.currency);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount, currencyCode = currency) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    })?.format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })?.format(new Date(date));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUpgradePlan = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-portal`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ returnUrl: window.location.href })
      });
      
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  const handleDowngradePlan = () => handleUpgradePlan();

  const handleCancelSubscription = () => handleUpgradePlan();
  const handleBuyTopup = async () => {
    try {
      console.log('Buy credits button clicked');
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        alert('Please log in to buy credits');
        return;
      }

      console.log('Creating checkout session for user:', session.user.id);
      console.log('Price ID:', import.meta.env.VITE_STRIPE_PRICE_TOPUP_100);
      
      if (!import.meta.env.VITE_STRIPE_PRICE_TOPUP_100) {
        alert('Error: Stripe price ID not configured. Please contact support.');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          priceId: import.meta.env.VITE_STRIPE_PRICE_TOPUP_100, 
          mode: 'payment',
          userId: session.user.id
        })
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok && data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('Error response:', data);
        const errorMessage = data?.error || data?.message || 'Failed to create checkout session';
        alert(`Error: ${errorMessage}. Please check the console for details.`);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleAddPaymentMethod = () => {
    console.log('Add payment method clicked');
    // Implement add payment method logic
  };

  const handleRemovePaymentMethod = (paymentMethodId) => {
    console.log('Remove payment method:', paymentMethodId);
    // Implement remove payment method logic
  };

  const handleDownloadInvoice = (invoiceId) => {
    console.log('Download invoice:', invoiceId);
    // Implement invoice download logic
  };

  const handleDisputeInvoice = (invoiceId) => {
    console.log('Dispute invoice:', invoiceId);
    // Implement invoice dispute logic
  };

  const handleUpdateNotifications = (notificationSettings) => {
    console.log('Update notifications:', notificationSettings);
    // Implement notification settings update logic
  };

  const handleSupportChat = () => {
    setShowSupportChat(true);
  };

  const handleCloseSupportChat = () => {
    setShowSupportChat(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-text-secondary">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-error mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">Unable to Load Account</h1>
          <p className="text-text-secondary mb-4">We're having trouble loading your account information.</p>
          <button
            onClick={() => window.location?.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <AccountOverview
              customer={customerData?.customer}
              subscription={customerData?.subscription}
              usage={customerData?.usage}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
            <SubscriptionCard
              subscription={customerData?.subscription}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onUpgrade={handleUpgradePlan}
              onDowngrade={handleDowngradePlan}
              onCancel={handleCancelSubscription}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleUpgradePlan} 
                className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary-600 transition-colors"
              >
                Manage Subscription
              </button>
              <button onClick={handleBuyTopup} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">Buy 100 credits ($19.99)</button>
            </div>
            <UsageTracking
              usage={customerData?.usage}
              subscription={customerData?.subscription}
            />
          </div>
        );
      // billing tab removed
      case 'settings':
        return (
          <div className="space-y-6">
            <NotificationSettings
              notifications={customerData?.notifications}
              onUpdate={handleUpdateNotifications}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobileHeader
        customer={customerData?.customer}
        onSupportClick={handleSupportChat}
      />
      {/* Main Content */}
      <main className="pb-20 lg:pb-8">
        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden lg:block bg-surface border-b border-border-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: 'Home' },
                { id: 'billing', label: 'Billing', icon: 'CreditCard' },
                { id: 'settings', label: 'Settings', icon: 'Settings' }
              ]?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => handleTabChange(tab?.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab?.id
                      ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border-light'
                  }`}
                >
                  <Icon name={tab?.icon} size={20} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {renderTabContent()}
        </div>
      </main>
      {/* Mobile Bottom Navigation - only Overview and Settings */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      {/* Support Widget */}
      <SupportWidget
        isOpen={showSupportChat}
        onOpen={handleSupportChat}
        onClose={handleCloseSupportChat}
        customer={customerData?.customer}
      />
    </div>
  );
};

export default CustomerPortal;