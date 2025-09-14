import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      // Get user credits from the new credit system
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('Error fetching user credits:', creditError);
      }

      // Create a simplified user profile with credit information
      const userProfile = {
        id: userId,
        current_api_credits: creditData?.balance || 0,
        // Add other user data as needed
      };

      setUserProfile(userProfile);
      setSubscription(null); // No subscription system for now
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    // Get initial session
    supabase?.auth?.getSession()?.then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setError(error?.message);
      }
      
      if (session?.user) {
        setUser(session?.user);
        fetchUserProfile(session?.user?.id);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session?.user) {
          setUser(session?.user);
          await fetchUserProfile(session?.user?.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
        setError(null);
      }
    );

    return () => subscription?.unsubscribe();
  }, [fetchUserProfile]);

  // On first login, grant welcome credits if user has no credits row
  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        
        console.log('Checking welcome credits for user:', user.id);
        
        // Check if user already has credits
        const { data: credits, error: creditsErr } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Credits check result:', { credits, creditsErr });

        // If no credits row exists, grant welcome credits
        if (creditsErr && creditsErr.code === 'PGRST116') {
          console.log('No credits row found, granting welcome credits...');
          const { data: grantResult, error: grantError } = await supabase.rpc('grant_welcome_credits', { p_user_id: user.id });
          
          if (grantError) {
            console.error('Error granting welcome credits:', grantError);
          } else {
            console.log('Welcome credits granted successfully:', grantResult);
            // Show success message
            if (typeof window !== 'undefined') {
              // Simple alert for now - could be replaced with a toast notification
              console.log('🎉 Welcome! You received 3 free credits to get started!');
            }
            // Refresh user profile to show updated credits
            await fetchUserProfile(user.id);
          }
        } else if (credits && credits.balance === 0) {
          // If user has 0 credits, also grant welcome credits
          console.log('User has 0 credits, granting welcome credits...');
          const { data: grantResult, error: grantError } = await supabase.rpc('grant_welcome_credits', { p_user_id: user.id });
          
          if (grantError) {
            console.error('Error granting welcome credits:', grantError);
          } else {
            console.log('Welcome credits granted successfully:', grantResult);
            // Show success message
            if (typeof window !== 'undefined') {
              console.log('🎉 Welcome! You received 3 free credits to get started!');
            }
            await fetchUserProfile(user.id);
          }
        } else {
          console.log('User already has credits:', credits?.balance);
        }
      } catch (e) {
        console.error('Error in welcome credits logic:', e);
      }
    })();
  }, [user?.id, fetchUserProfile]);

  // Disable email/password flows (Google-only)
  const signUp = async () => ({ data: null, error: new Error('Sign up is Google-only') });
  const signIn = async () => ({ data: null, error: new Error('Sign in is Google-only') });

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase?.auth?.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location?.origin}/customer-portal`
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      setError(error?.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase?.auth?.signOut();
      
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setUserProfile(null);
      setSubscription(null);
      
      return { error: null };
    } catch (error) {
      setError(error?.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      setError(error?.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase?.auth?.updateUser({
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      setError(error?.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      setLoading(true);
      setError(null);

      const { data, error } = await supabase?.from('user_profiles')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', user?.id)?.select()?.single();

      if (error) throw error;

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      setError(error?.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      console.log('Refreshing user data for:', user.id);
      await fetchUserProfile(user?.id);
    }
  }, [user?.id, fetchUserProfile]);

  // Check if user has enough credits
  const hasCredits = useCallback((creditsNeeded = 1) => {
    return (userProfile?.current_api_credits || 0) >= creditsNeeded;
  }, [userProfile?.current_api_credits]);

  // Get user's subscription status
  const getSubscriptionStatus = useCallback(() => {
    if (!subscription) return 'none';
    
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    
    if (subscription?.status === 'active' && periodEnd > now) {
      return 'active';
    } else if (subscription?.cancel_at_period_end) {
      return 'cancelling';
    } else if (subscription?.status === 'past_due') {
      return 'past_due';
    }
    
    return 'inactive';
  }, [subscription]);

  const value = {
    user,
    userProfile,
    subscription,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserData,
    hasCredits,
    getSubscriptionStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;