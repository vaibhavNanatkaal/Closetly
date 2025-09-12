// src/pages/billing-dashboard/index.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import PageHeader from '../../components/ui/PageHeader';
import Icon from '../../components/AppIcon';
import RecentActivity from './components/RecentActivity';
import QuickActions from './components/QuickActions';
import MetricsCard from './components/MetricsCard';
import RevenueChart from './components/RevenueChart';
import AlertBanner from './components/AlertBanner';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedSegment, setSelectedSegment] = useState('all');

  const [dashboardMetrics, setDashboardMetrics] = useState({
    mrr: { current: 0, previous: 0, growth: 0, currency: 'USD' },
    arr: { current: 0, previous: 0, growth: 0, currency: 'USD' },
    activeSubscriptions: { current: 0, previous: 0, growth: 0 },
    churnRate: { current: 0, previous: 0, growth: 0 },
    pendingInvoices: { current: 0, amount: 0, currency: 'USD' },
    totalCreditsUsed: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-metrics`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const mrr = Number(data?.mrr || 0);
        const activeUsers = Number(data?.activeUsers || 0);
        const totalCreditsUsed = Number(data?.totalCreditsUsed || 0);
        setDashboardMetrics((prev) => ({
          ...prev,
          mrr: { ...prev.mrr, current: mrr },
          arr: { ...prev.arr, current: mrr * 12 },
          activeSubscriptions: { ...prev.activeSubscriptions, current: activeUsers },
          totalCreditsUsed,
        }));
      } catch (e) {
        // noop
      }
    })();
  }, []);

  // Mock revenue trend data
  const revenueData = [
    { month: 'Jan', mrr: 95000, arr: 1140000, subscriptions: 950 },
    { month: 'Feb', mrr: 102000, arr: 1224000, subscriptions: 1020 },
    { month: 'Mar', mrr: 108000, arr: 1296000, subscriptions: 1080 },
    { month: 'Apr', mrr: 115000, arr: 1380000, subscriptions: 1150 },
    { month: 'May', mrr: 118000, arr: 1416000, subscriptions: 1189 },
    { month: 'Jun', mrr: 125000, arr: 1500000, subscriptions: 1247 }
  ];

  // Mock subscription growth data
  const subscriptionGrowthData = [
    { month: 'Jan', new: 45, churned: 12, net: 33 },
    { month: 'Feb', new: 52, churned: 15, net: 37 },
    { month: 'Mar', new: 48, churned: 10, net: 38 },
    { month: 'Apr', new: 55, churned: 18, net: 37 },
    { month: 'May', new: 42, churned: 14, net: 28 },
    { month: 'Jun', new: 58, churned: 16, net: 42 }
  ];

  // Mock usage analytics data
  const usageData = [
    { name: 'API Calls', value: 45, color: '#3b82f6' },
    { name: 'Storage', value: 30, color: '#f59e0b' },
    { name: 'Bandwidth', value: 15, color: '#059669' },
    { name: 'Users', value: 10, color: '#dc2626' }
  ];

  // Mock alerts data
  const alerts = [
    {
      id: 1,
      type: 'error',
      title: 'Payment Failures Detected',
      message: '12 subscription payments failed in the last 24 hours. Immediate attention required.',
      action: 'View Failed Payments',
      actionPath: '/dunning-management'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Compliance Review Due',
      message: 'Monthly PCI compliance review is due by end of week.',
      action: 'Start Review',
      actionPath: '/payment-gateway-configuration'
    }
  ];

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£' },
    { value: 'INR', label: 'INR (₹)', symbol: '₹' }
  ];

  const segmentOptions = [
    { value: 'all', label: 'All Segments' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'pro', label: 'Professional' },
    { value: 'starter', label: 'Starter' }
  ];

  const formatCurrency = (amount, currency = selectedCurrency) => {
    const currencySymbol = currencyOptions?.find(c => c?.value === currency)?.symbol || '$';
    return `${currencySymbol}${amount?.toLocaleString()}`;
  };

  const formatPercentage = (value, showSign = true) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value?.toFixed(1)}%`;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-success-600';
    if (growth < 0) return 'text-error-600';
    return 'text-secondary-500';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return 'TrendingUp';
    if (growth < 0) return 'TrendingDown';
    return 'Minus';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="content-offset pt-16">
        <div className="p-4 sm:p-6 lg:p-8">
          
          {/* Page Header */}
          <div className="mb-6">
            <PageHeader 
              title="Billing Dashboard"
              description="Monitor your subscription metrics and billing performance"
              actions={[]}
              customIcon="DollarSign"
            />
          </div>

          {/* Alert Banners */}
          {alerts?.length > 0 && (
            <div className="space-y-4 mb-8">
              {alerts?.map((alert) => (
                <AlertBanner key={alert?.id} alert={alert} />
              ))}
            </div>
          )}

          {/* Filter Controls */}
          <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-3">
                <Icon name="Calendar" size={20} className="text-secondary-500 flex-shrink-0" />
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e?.target?.value)}
                  className="border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-0"
                >
                  {dateRangeOptions?.map((option) => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <Icon name="DollarSign" size={20} className="text-secondary-500 flex-shrink-0" />
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e?.target?.value)}
                  className="border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-0"
                >
                  {currencyOptions?.map((option) => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <Icon name="Filter" size={20} className="text-secondary-500 flex-shrink-0" />
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e?.target?.value)}
                  className="border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-0"
                >
                  {segmentOptions?.map((option) => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <MetricsCard
              title="Monthly Recurring Revenue"
              value={formatCurrency(dashboardMetrics?.mrr?.current)}
              change={dashboardMetrics?.mrr?.growth}
              icon="DollarSign"
              trend="up"
            />
            <MetricsCard
              title="Annual Recurring Revenue"
              value={formatCurrency(dashboardMetrics?.arr?.current)}
              change={dashboardMetrics?.arr?.growth}
              icon="TrendingUp"
              trend="up"
            />
            <MetricsCard
              title="Active Users"
              value={dashboardMetrics?.activeSubscriptions?.current?.toLocaleString()}
              change={dashboardMetrics?.activeSubscriptions?.growth}
              icon="Users"
              trend="up"
            />
            <MetricsCard
              title="Total Credits Used"
              value={dashboardMetrics?.totalCreditsUsed?.toLocaleString()}
              change={0}
              icon="BatteryCharging"
              trend="up"
            />
            <MetricsCard
              title="Churn Rate"
              value={`${dashboardMetrics?.churnRate?.current}%`}
              change={dashboardMetrics?.churnRate?.growth}
              icon="UserMinus"
              trend="down"
              isInverted={true}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            {/* Revenue Charts */}
            <div className="xl:col-span-8 space-y-6">
              <RevenueChart
                title="Revenue Trends"
                data={revenueData}
                selectedCurrency={selectedCurrency}
                formatCurrency={formatCurrency}
              />

              {/* Subscription Growth Chart */}
              <div className="bg-surface rounded-lg shadow-card border border-border-light p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="text-lg font-semibold text-text-primary">Subscription Growth</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                      <span className="text-text-secondary">New</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                      <span className="text-text-secondary">Churned</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-text-secondary">Net Growth</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subscriptionGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="new" fill="#10b981" name="New Subscriptions" />
                      <Bar dataKey="churned" fill="#ef4444" name="Churned" />
                      <Bar dataKey="net" fill="#3b82f6" name="Net Growth" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="xl:col-span-4">
              <QuickActions />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Usage Analytics */}
            <div className="xl:col-span-4">
              <div className="bg-surface rounded-lg shadow-card border border-border-light p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-6">Usage Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {usageData?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry?.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-6">
                  {usageData?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item?.color }}
                        ></div>
                        <span className="text-sm text-text-secondary truncate">{item?.name}</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{item?.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="xl:col-span-8">
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BillingDashboard;