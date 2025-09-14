// src/pages/customer-portal/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);

  // Load real customer data
  const loadCustomerData = useCallback(async () => {
    try {
      setRefreshing(true);
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login-registration');
        return;
      }

      console.log('Loading customer data for user:', session.user.id);

      // Get user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', session.user.id)
        .single();

      console.log('Credits data:', creditsData);

      // Get credit ledger for usage history
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Ledger data:', ledgerData);

        const currentCredits = creditsData?.balance || 0;
        const totalCreditsUsed = ledgerData?.reduce((sum, entry) => 
          entry.delta < 0 ? sum + Math.abs(entry.delta) : sum, 0) || 0;

        const customerData = {
      customer: {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url || null,
            joinedDate: new Date(session.user.created_at).toISOString().split('T')[0],
        preferredLanguage: 'en-US',
        timezone: 'America/New_York'
      },
      subscription: {
            id: 'free_tier',
        plan: {
              name: 'Free Tier',
              price: 0,
          currency: 'USD',
          interval: 'month',
          features: [
                '3 free credits',
                'Basic AI generation',
                'Community support'
          ]
        },
        status: 'active',
            currentPeriodStart: new Date().toISOString().split('T')[0],
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextBillingDate: null,
        cancelAtPeriodEnd: false,
        trialEnd: null
      },
      usage: {
            credits: {
              current: currentCredits,
              used: totalCreditsUsed,
              total: currentCredits + totalCreditsUsed
            },
            images: {
              generated: totalCreditsUsed,
              remaining: currentCredits
            }
          },
          paymentMethods: [], // No stored payment methods per requirements
          invoices: [], // Will be handled by Stripe customer portal
      notifications: {
        billingReminders: true,
        usageAlerts: true,
        subscriptionChanges: true,
        marketingEmails: false,
        securityAlerts: true
          },
          creditHistory: ledgerData || []
        };

        setCustomerData(customerData);
        setLocale(customerData?.customer?.preferredLanguage);
        setCurrency(customerData?.subscription?.plan?.currency);
        setLoading(false);
      } catch (error) {
        console.error('Error loading customer data:', error);
        setLoading(false);
      } finally {
        setRefreshing(false);
      }
    }
  }, [navigate]);

  // Load data on component mount
  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

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
            <div className="flex items-center justify-between">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: 'Home' },
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
              <button
                onClick={loadCustomerData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                <Icon name={refreshing ? "Loader2" : "RefreshCw"} size={16} className={refreshing ? "animate-spin" : ""} />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
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