import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { SpellList } from '@/components/SpellList';
import { Spell } from '@/types/spell';
import { Sparkles, CircleUser as UserCircle, Users, Plus, X } from 'lucide-react-native';
import { adaptSpellsFromLivroDoJogador } from '@/utils/spellAdapter';
import { Platform } from 'react-native';
import { router } from 'expo-router';

export default function SpellsTab() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadSpells();
  }, []);

  const loadSpells = async () => {
    try {
      // First try to load custom spells if available
      let customSpells: Spell[] | null = null;
      
      if (Platform.OS === 'web') {
        const storedSpells = localStorage.getItem('customSpells');
        if (storedSpells) {
          customSpells = JSON.parse(storedSpells);
        }
      } else {
        // For native platforms, you would use AsyncStorage
        // const storedSpells = await AsyncStorage.getItem('customSpells');
        // if (storedSpells) {
        //   customSpells = JSON.parse(storedSpells);
        // }
      }
      
      if (customSpells && customSpells.length > 0) {
        setSpells(customSpells);
      } else {
        // If no custom spells, load the default ones
        const defaultSpells = require('@/data/spells.json');
        
        // Check if we have the Livro do Jogador data
        try {
          const livroDoJogadorData = require('@/data/magias-livro-do-jogador.json');
          const adaptedSpells = adaptSpellsFromLivroDoJogador(livroDoJogadorData);
          
          if (adaptedSpells && adaptedSpells.length > 0) {
            // Combine default spells with adapted ones, avoiding duplicates
            const combinedSpells = [...defaultSpells];
            
            adaptedSpells.forEach(spell => {
              // Check if spell already exists by ID
              const existingIndex = combinedSpells.findIndex(s => s.id === spell.id);
              if (existingIndex === -1) {
                combinedSpells.push(spell);
              }
            });
            
            setSpells(combinedSpells);
          } else {
            setSpells(defaultSpells);
          }
        } catch (error) {
          console.log('Livro do Jogador data not available, using default spells');
          setSpells(defaultSpells);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar magias:', error);
      // Fallback to empty array if everything fails
      setSpells([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFabMenu = () => {
    const toValue = fabMenuOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setFabMenuOpen(!fabMenuOpen);
  };

  const navigateToCharacters = () => {
    setFabMenuOpen(false);
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/characters');
  };

  const navigateToClasses = () => {
    setFabMenuOpen(false);
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(tabs)/classes');
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Sparkles size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando magias...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Sparkles size={28} color="#D4AF37" />
          <Text style={styles.title}>Lista de Magias</Text>
        </View>
        <Text style={styles.subtitle}>
          Dungeons & Dragons 5ª Edição
        </Text>
      </View>
      
      <SpellList spells={spells} />
      
      {/* FAB Menu Options */}
      {fabMenuOpen && (
        <>
          <Animated.View 
            style={[
              styles.fabOption,
              styles.fabOptionCharacters,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.fabOptionButton}
              onPress={navigateToCharacters}
              activeOpacity={0.8}
            >
              <UserCircle size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.fabOptionLabel}>
              <Text style={styles.fabOptionText}>Personagens</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.fabOption,
              styles.fabOptionClasses,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.fabOptionButton}
              onPress={navigateToClasses}
              activeOpacity={0.8}
            >
              <Users size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.fabOptionLabel}>
              <Text style={styles.fabOptionText}>Classes</Text>
            </View>
          </Animated.View>

          {/* Overlay to close menu */}
          <TouchableOpacity 
            style={styles.fabOverlay}
            onPress={toggleFabMenu}
            activeOpacity={1}
          />
        </>
      )}
      
      {/* Main Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={toggleFabMenu}
          activeOpacity={0.8}
        >
          {fabMenuOpen ? (
            <X size={32} color="#FFFFFF" />
          ) : (
            <Plus size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>
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
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 68,
    height: 68,
    borderRadius: 34,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8941F',
  },
  fabOption: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabOptionCharacters: {
    bottom: 110,
  },
  fabOptionClasses: {
    bottom: 170,
  },
  fabOptionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#7D3C98',
  },
  fabOptionLabel: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});