import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Character } from '@/types/database';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Users, Plus, RefreshCw } from 'lucide-react-native';

export default function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

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

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };

  const handleGenerateToken = async (characterId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const message = 'Você precisa estar autenticado.';
        if (Platform.OS === 'web') {
          alert(`Erro: ${message}`);
        } else {
          Alert.alert('Erro', message);
        }
        return { share_token: '', expires_at: '' };
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local character data
        setCharacters(prev => prev.map(char => 
          char.id === characterId 
            ? { ...char, share_token: result.share_token, token_expires_at: result.expires_at }
            : char
        ));
        
        // Update selected character if it's the same one
        if (selectedCharacter && selectedCharacter.id === characterId) {
          setSelectedCharacter(prev => prev ? {
            ...prev,
            share_token: result.share_token,
            token_expires_at: result.expires_at
          } : null);
        }
        
        return result;
      } else {
        throw new Error('Não foi possível gerar o token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  };

  const handleRevokeToken = async (characterId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const message = 'Você precisa estar autenticado.';
        if (Platform.OS === 'web') {
          alert(`Erro: ${message}`);
        } else {
          Alert.alert('Erro', message);
        }
        return;
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Update local character data
        setCharacters(prev => prev.map(char => 
          char.id === characterId 
            ? { ...char, share_token: null, token_expires_at: null }
            : char
        ));
        
        // Update selected character if it's the same one
        if (selectedCharacter && selectedCharacter.id === characterId) {
          setSelectedCharacter(prev => prev ? {
            ...prev,
            share_token: null,
            token_expires_at: null
          } : null);
        }
      } else {
        throw new Error('Não foi possível revogar o token');
      }
    } catch (error) {
      console.error('Error revoking token:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Users size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando personagens...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Users size={28} color="#D4AF37" />
          <Text style={styles.title}>Meus Personagens</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerencie seus personagens de D&D
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={20} color="#D4AF37" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateCharacter}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Novo Personagem</Text>
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
                onShare={() => handleGenerateToken(character.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={64} color="#D4AF37" />
            <Text style={styles.emptyTitle}>Nenhum Personagem</Text>
            <Text style={styles.emptyText}>
              Você ainda não criou nenhum personagem. Comece criando seu primeiro aventureiro!
            </Text>
            <TouchableOpacity 
              style={styles.emptyCreateButton}
              onPress={handleCreateCharacter}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyCreateButtonText}>Criar Primeiro Personagem</Text>
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
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  charactersContainer: {
    padding: 16,
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
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  emptyCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});