import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Shield } from 'lucide-react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email);
        setIsAuthenticated(!!session);
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          router.replace('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle navigation when authentication status changes
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, loading]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Checking auth status:', session?.user?.email || 'No session');
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Shield size={48} color="#D4AF37" />
        <ActivityIndicator size="large" color="#D4AF37" style={styles.spinner} />
        <Text style={styles.loadingText}>Verificando autenticação...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <Shield size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Redirecionando...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 16,
  },
  spinner: {
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});