import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/customer-portal');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6">
            <Icon name="AlertTriangle" size={64} className="text-primary-600" />
          </div>
          <h1 className="text-6xl font-bold text-primary-700 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-text-primary mb-4">Page Not Found</h2>
          <p className="text-text-secondary mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoHome}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Icon name="Home" size={20} />
            <span>Go to Customer Portal</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full bg-surface border border-border-light text-text-primary py-3 px-6 rounded-lg font-medium hover:bg-surface-hover transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Icon name="ArrowLeft" size={20} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-8 pt-6 border-t border-border-light">
          <p className="text-sm text-text-tertiary mb-4">Need help? Try these:</p>
          <div className="flex justify-center space-x-6 text-sm">
            <button
              onClick={() => navigate('/customer-portal')}
              className="text-primary hover:text-primary-700 transition-colors duration-200"
            >
              Customer Portal
            </button>
            <button
              onClick={() => navigate('/ai-fashion-generation-studio')}
              className="text-primary hover:text-primary-700 transition-colors duration-200"
            >
              AI Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;