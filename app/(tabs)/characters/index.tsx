import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Character } from '@/types/database';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { supabase } from '@/lib/supabase';
import { Shield, User, Plus, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      loadCharacters();
    } else {
      // For demo purposes, we'll create a mock user session
      // In a real app, you'd implement proper authentication
      setLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/characters', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const charactersData = await response.json();
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCharacters();
  };

  const handleGenerateToken = async (characterId: string): Promise<{ share_token: string; expires_at: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const result = await response.json();
      
      // Update the character in our local state
      setCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, share_token: result.share_token, token_expires_at: result.expires_at }
          : char
      ));

      // Update selected character if it's the same one
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(prev => prev ? {
          ...prev,
          share_token: result.share_token,
          token_expires_at: result.expires_at
        } : null);
      }

      return result;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  };

  const handleRevokeToken = async (characterId: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke token');
      }

      // Update the character in our local state
      setCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, share_token: null, token_expires_at: null }
          : char
      ));

      // Update selected character if it's the same one
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(prev => prev ? {
          ...prev,
          share_token: null,
          token_expires_at: null
        } : null);
      }
    } catch (error) {
      console.error('Error revoking token:', error);
      throw error;
    }
  };

  const navigateToCreateCharacter = () => {
    router.push('/characters/create');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Shield size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando personagens...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Shield size={28} color="#D4AF37" />
          <Text style={styles.title}>Personagens</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerencie seus heróis
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color="#D4AF37" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={navigateToCreateCharacter}
          >
            <Plus size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {characters.length > 0 ? (
          <View style={styles.charactersContainer}>
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onPress={() => setSelectedCharacter(character)}
                onShare={() => setSelectedCharacter(character)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <User size={64} color="#D4AF37" />
            <Text style={styles.emptyTitle}>Nenhum Personagem</Text>
            <Text style={styles.emptyText}>
              Você ainda não possui personagens criados. Clique no botão + para criar um novo personagem.
            </Text>
            
            <TouchableOpacity 
              style={styles.createButton}
              onPress={navigateToCreateCharacter}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Criar Novo Personagem</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CharacterDetailModal
        character={selectedCharacter}
        visible={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        onGenerateToken={handleGenerateToken}
        onRevokeToken={handleRevokeToken}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    top: 20,
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  content: {
    flex: 1,
  },
  charactersContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});