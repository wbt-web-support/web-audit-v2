import { supabase } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import type { UserProfile } from './supabase-types';

const signUp = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName || '', last_name: lastName || '' } },
  });

  if (error) return { error };

  if (data.user && !data.user.email_confirmed_at) {
    return {
      error: null,
      message:
        'Please check your email and click the confirmation link to complete your registration.',
    };
  }

  return { error: null };
};

const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
};

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  return { error };
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return { error };
  return { error: null };
};

const resendConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  return { error };
};

const updateProfile = async (user: User | null, updates: Partial<UserProfile>) => {
  if (!user) {
    return { error: { message: 'No user logged in' } as any };
  }
  const { error } = await supabase.from('users').update(updates).eq('id', user.id);
  return { error };
};

// Function to fetch user profile
const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data as UserProfile | null;
  } catch {
    return null;
  }
};

// Function to create user profile if it doesn't exist
const createUserProfile = async (user: User) => {
  try {
    const profileData = {
      id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      role: 'user',
      email_confirmed: !!user.email_confirmed_at,
    };

    const { data, error } = await supabase.from('users').insert(profileData).select().single();

    if (error) {
      if (error.code === '23505') {
        return await fetchUserProfile(user.id);
      }

      return {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        role: 'user' as const,
        email_confirmed: !!user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.created_at,
        blocked: false,
        blocked_at: null,
        blocked_by: null,
        role_changed_at: null,
        role_changed_by: null,
        last_activity_at: null,
        login_count: 0,
        notes: null,
        projects: 0,
        plan_type: 'Starter',
        plan_name: null,
        plan_id: null,
        billing_cycle: 'monthly',
        max_projects: 1,
        can_use_features: [],
        plan_expires_at: null,
        subscription_id: null,
        feedback_given: false,
      } as UserProfile;
    }

    return data as UserProfile;
  } catch (error) {
    return {
      id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      role: 'user' as const,
      email_confirmed: !!user.email_confirmed_at,
      created_at: user.created_at,
    } as UserProfile;
  }
};

export {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  resendConfirmation,
  updateProfile,
  fetchUserProfile,
  createUserProfile,
};
