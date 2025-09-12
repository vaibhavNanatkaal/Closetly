import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Palette, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import ThemeToggle from '../../components/ui/ThemeToggle';

const LoginRegistration = () => {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams?.get('redirect') || '/ai-fashion-generation-studio';
      navigate(redirectTo);
    }
  }, [user, navigate, searchParams]);

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error?.message || 'Failed to sign in with Google');
      }
      // Success will be handled by auth state change
    } catch (error) {
      setError(error?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    'AI-powered fashion generation',
    'Virtual wardrobe overlay',
    'Multiple style selections',
    'Inspiration photo uploads (Pro+)',
    'Secure cloud storage',
    'Professional results'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 dark:from-background dark:via-background/98 dark:to-primary/10">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <span>FashionGen</span>
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* Left Side - Feature Showcase */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  Create Stunning{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    AI Fashion
                  </span>{' '}
                  Overlays
                </h1>
                <p className="text-xl text-muted-foreground">
                  Transform your photos with AI-powered virtual wardrobe technology. 
                  Perfect for fashion enthusiasts, influencers, and creative professionals.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {features?.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2">Get Started Today</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join thousands of users creating amazing fashion content with AI
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Free tier includes:</span>
                  <span className="font-medium">1000 credits • 1GB storage</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Authentication Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-2">Welcome</h2>
                <p className="text-muted-foreground mb-6">Sign in with Google to continue</p>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting to Google...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegistration;