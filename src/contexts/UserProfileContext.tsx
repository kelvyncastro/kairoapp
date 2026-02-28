import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppTheme = 'dark' | 'light' | 'violet' | 'pink' | 'emerald' | 'blue' | 'fuchsia';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  app_theme: AppTheme;
  onboarding_completed: boolean;
  public_id: string | null;
  subscription_status: string;
  account_status: string;
}

export interface SubscriptionInfo {
  subscribed: boolean;
  status: string;
  is_trial?: boolean;
  trial_end?: string | null;
  subscription_end?: string | null;
  message?: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  isSubscriptionInactive: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  getInitials: () => string;
  getDisplayName: () => string;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProfile = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (isInitialLoad) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data as UserProfile);
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!roleData);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data) {
        const subData = data as SubscriptionInfo & { source?: string };
        setSubscriptionInfo(subData);
        
        // If backend confirms access (admin or active sub), mark admin immediately
        if (subData.subscribed && subData.source === 'admin') {
          setIsAdmin(true);
        }
        
        // Re-fetch profile to get updated subscription_status
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Check subscription on login and periodically
  useEffect(() => {
    if (!user || !profile) return;

    // Check on load
    checkSubscription();

    // Check every 60 seconds
    intervalRef.current = setInterval(checkSubscription, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check subscription after checkout redirect
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      // Delay to give Stripe time to process
      setTimeout(() => checkSubscription(), 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, checkSubscription]);

  // Apply theme
  useEffect(() => {
    const theme = profile?.app_theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [profile?.app_theme]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      if (profile) {
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            ...updates,
          });

        if (error) throw error;
      }

      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: urlWithCacheBust });

      return urlWithCacheBust;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const getInitials = (): string => {
    if (!profile?.first_name) return '?';
    
    const first = profile.first_name.charAt(0).toUpperCase();
    const last = profile.last_name?.charAt(0).toUpperCase() || '';
    
    return first + last;
  };

  const getDisplayName = (): string => {
    if (!profile?.first_name) return 'Usuário';
    return profile.first_name;
  };

  const needsOnboarding = !loading && user !== null && (!profile || !profile.onboarding_completed);
  const isSubscriptionInactive = !loading && user !== null && !!profile && !isAdmin && profile.subscription_status !== 'active' && !(subscriptionInfo?.subscribed === true);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        needsOnboarding,
        isSubscriptionInactive,
        subscriptionInfo,
        updateProfile,
        uploadAvatar,
        refreshProfile: fetchProfile,
        checkSubscription,
        getInitials,
        getDisplayName,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
