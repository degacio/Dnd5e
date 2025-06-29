import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Character } from '@/types/database';
import { Spell } from '@/types/spell';
import { DnDClass } from '@/types/dndClass';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { SpellSelectionModal } from '@/components/SpellSelectionModal';
import { ClassCard } from '@/components/ClassCard';
import { ClassDetailModal } from '@/components/ClassDetailModal';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Scroll, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Minus,
  Eye,
  EyeOff,
  Share2,
  Copy,
  X,
  Clock,
  Trash2,
  TriangleAlert as AlertTriangle,
  ArrowLeft,
  Heart,
  Shield
} from 'lucide-react-native';
import classesData from '@/data/classes.json';

interface SpellSlotInfo {
  current: number;
  max: number;
  level: number;
}

interface CharacterSpells {
  character: Character;
  spells: Spell[];
  spellsByLevel: Record<number, Spell[]>;
  spellSlots: SpellSlotInfo[];
  characterClass: DnDClass | null;
}

type ViewMode = 'list' | 'character-detail' | 'classes' | 'class-detail';

export default function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [selectedCharacterSpells, setSelectedCharacterSpells] = useState<CharacterSpells | null>(null);
  const [selectedClass, setSelectedClass] = useState<DnDClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [showAddSpellsModal, setShowAddSpellsModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingCharacter, setDeletingCharacter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load spells data
      const spellsData = require('@/data/spells.json');
      setAllSpells(spellsData);

      // Load characters
      await loadCharacters();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };

  const getSpellByName = (spellName: string): Spell | null => {
    return allSpells.find(spell => spell.name === spellName) || null;
  };

  // Função para calcular espaços de magia baseado na classe e nível
  const calculateSpellSlots = (characterClass: DnDClass, level: number): Record<string, [number, number]> => {
    const spellSlots: Record<string, [number, number]> = {};
    
    if (!characterClass.spellcasting) {
      return spellSlots;
    }

    // Usar o índice correto (level - 1) para acessar os arrays de progressão
    const levelIndex = level - 1;
    
    Object.entries(characterClass.spellcasting.spellSlots).forEach(([spellLevel, slotsArray]) => {
      const maxSlots = slotsArray[levelIndex] || 0;
      if (maxSlots > 0) {
        spellSlots[spellLevel] = [maxSlots, maxSlots]; // [current, max] - inicia com todos os slots disponíveis
      }
    });

    return spellSlots;
  };

  const prepareCharacterSpells = (character: Character): CharacterSpells => {
    const characterClass = classesData.find(cls => cls.name === character.class_name) || null;
    
    // Get character's known spells
    const knownSpellNames = character.spells_known || [];
    const spells: Spell[] = [];
    
    knownSpellNames.forEach((spellData: any) => {
      const spellName = typeof spellData === 'string' ? spellData : spellData.name;
      const spell = getSpellByName(spellName);
      if (spell) {
        spells.push(spell);
      }
    });

    // Group spells by level
    const spellsByLevel: Record<number, Spell[]> = {};
    spells.forEach(spell => {
      if (!spellsByLevel[spell.level]) {
        spellsByLevel[spell.level] = [];
      }
      spellsByLevel[spell.level].push(spell);
    });

    // Sort spells within each level
    Object.keys(spellsByLevel).forEach(level => {
      spellsByLevel[parseInt(level)].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Get spell slots information - usar dados salvos ou calcular baseado na classe
    const spellSlots: SpellSlotInfo[] = [];
    
    if (characterClass?.spellcasting) {
      // Se o personagem tem spell_slots salvos, usar esses dados
      if (character.spell_slots && typeof character.spell_slots === 'object' && Object.keys(character.spell_slots).length > 0) {
        Object.entries(character.spell_slots).forEach(([level, slots]) => {
          if (Array.isArray(slots) && slots.length >= 2) {
            spellSlots.push({
              level: parseInt(level),
              current: slots[0],
              max: slots[1]
            });
          }
        });
      } else {
        // Se não tem dados salvos, calcular baseado na classe e nível
        const calculatedSlots = calculateSpellSlots(characterClass, character.level);
        Object.entries(calculatedSlots).forEach(([level, [current, max]]) => {
          spellSlots.push({
            level: parseInt(level),
            current,
            max
          });
        });
      }
    }

    // Sort spell slots by level
    spellSlots.sort((a, b) => a.level - b.level);

    return {
      character,
      spells,
      spellsByLevel,
      spellSlots,
      characterClass
    };
  };

  const handleCharacterPress = (character: Character) => {
    const characterSpells = prepareCharacterSpells(character);
    setSelectedCharacterSpells(characterSpells);
    setViewMode('character-detail');
  };

  const handleClassPress = (dndClass: DnDClass) => {
    setSelectedClass(dndClass);
    setViewMode('class-detail');
  };

  const handleBackToList = () => {
    setSelectedCharacterSpells(null);
    setSelectedClass(null);
    setViewMode('list');
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setViewMode('classes');
  };

  const updateSpellSlot = async (level: number, type: 'current' | 'max', delta: number) => {
    if (!selectedCharacterSpells) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const currentSlots = { ...selectedCharacterSpells.character.spell_slots };
      const levelKey = level.toString();
      
      // Se não existe o slot para este nível, criar baseado nos dados da classe
      if (!currentSlots[levelKey] && selectedCharacterSpells.characterClass?.spellcasting) {
        const calculatedSlots = calculateSpellSlots(selectedCharacterSpells.characterClass, selectedCharacterSpells.character.level);
        if (calculatedSlots[levelKey]) {
          currentSlots[levelKey] = calculatedSlots[levelKey];
        }
      }
      
      if (currentSlots[levelKey] && Array.isArray(currentSlots[levelKey])) {
        const slots = [...currentSlots[levelKey]];
        
        if (type === 'current') {
          slots[0] = Math.max(0, Math.min(slots[1], slots[0] + delta));
        } else {
          slots[1] = Math.max(0, slots[1] + delta);
          slots[0] = Math.min(slots[0], slots[1]); // Adjust current if it exceeds new max
        }
        
        currentSlots[levelKey] = slots;

        // Update character
        const response = await fetch(`/api/characters/${selectedCharacterSpells.character.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spell_slots: currentSlots,
          }),
        });

        if (response.ok) {
          const updatedCharacter = await response.json();
          
          // Update local state
          setCharacters(prev => prev.map(char => 
            char.id === selectedCharacterSpells.character.id ? updatedCharacter : char
          ));
          
          // Update selected character
          const updatedCharacterSpells = prepareCharacterSpells(updatedCharacter);
          setSelectedCharacterSpells(updatedCharacterSpells);
        } else {
          Alert.alert('Erro', 'Não foi possível atualizar os espaços de magia.');
        }
      }
    } catch (error) {
      console.error('Error updating spell slot:', error);
      Alert.alert('Erro', 'Erro ao atualizar espaços de magia.');
    }
  };

  const handleAddSpellsToGrimoire = async (spells: Spell[]) => {
    if (!selectedCharacterSpells) {
      Alert.alert('Erro', 'Nenhum personagem selecionado.');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      // Get current spells known
      const currentSpells = selectedCharacterSpells.character.spells_known || [];
      
      // Convert current spells to consistent format
      const currentSpellNames = currentSpells.map((spell: any) => 
        typeof spell === 'string' ? spell : spell.name
      );

      // Filter out spells that are already known
      const newSpells = spells.filter(spell => 
        !currentSpellNames.includes(spell.name)
      );

      if (newSpells.length === 0) {
        Alert.alert('Aviso', 'Todas as magias selecionadas já estão no grimório do personagem.');
        return;
      }

      // Convert new spells to the format expected by the database
      const spellsToAdd = newSpells.map(spell => ({
        name: spell.name,
        level: spell.level
      }));

      // Combine current spells with new spells
      const updatedSpells = [...currentSpells, ...spellsToAdd];

      // Update character
      const response = await fetch(`/api/characters/${selectedCharacterSpells.character.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spells_known: updatedSpells,
        }),
      });

      if (response.ok) {
        const updatedCharacter = await response.json();
        
        // Update local state
        setCharacters(prev => prev.map(char => 
          char.id === selectedCharacterSpells.character.id ? updatedCharacter : char
        ));
        
        // Update selected character
        const updatedCharacterSpells = prepareCharacterSpells(updatedCharacter);
        setSelectedCharacterSpells(updatedCharacterSpells);
        
        Alert.alert(
          'Sucesso', 
          `${newSpells.length} magia(s) adicionada(s) ao grimório de ${selectedCharacterSpells.character.name}!`
        );
      } else {
        const errorText = await response.text();
        console.error('Error updating character:', errorText);
        Alert.alert('Erro', 'Não foi possível adicionar as magias ao grimório.');
      }
    } catch (error) {
      console.error('Error adding spells to grimoire:', error);
      Alert.alert('Erro', 'Erro ao adicionar magias ao grimório.');
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacterSpells) return;

    setDeletingCharacter(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const response = await fetch(`/api/characters/${selectedCharacterSpells.character.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Remove character from local state
        setCharacters(prev => prev.filter(char => char.id !== selectedCharacterSpells.character.id));
        
        // Close modals and go back to list
        setShowDeleteConfirmation(false);
        setSelectedCharacterSpells(null);
        setViewMode('list');
        
        const successMessage = `Personagem ${selectedCharacterSpells.character.name} foi excluído com sucesso.`;
        
        if (Platform.OS === 'web') {
          alert(`Sucesso: ${successMessage}`);
        } else {
          Alert.alert('Sucesso', successMessage);
        }
      } else {
        const errorText = await response.text();
        console.error('Error deleting character:', errorText);
        
        const errorMessage = 'Não foi possível excluir o personagem. Tente novamente.';
        
        if (Platform.OS === 'web') {
          alert(`Erro: ${errorMessage}`);
        } else {
          Alert.alert('Erro', errorMessage);
        }
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      
      const errorMessage = 'Erro inesperado ao excluir personagem.';
      
      if (Platform.OS === 'web') {
        alert(`Erro: ${errorMessage}`);
      } else {
        Alert.alert('Erro', errorMessage);
      }
    } finally {
      setDeletingCharacter(false);
    }
  };

  const confirmDeleteCharacter = () => {
    if (!selectedCharacterSpells) return;

    const confirmMessage = `Tem certeza que deseja excluir o personagem "${selectedCharacterSpells.character.name}"? Esta ação não pode ser desfeita.`;
    
    if (Platform.OS === 'web') {
      if (confirm(`Confirmar Exclusão: ${confirmMessage}`)) {
        handleDeleteCharacter();
      }
    } else {
      setShowDeleteConfirmation(true);
    }
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

  const getSpellLevelName = (level: number): string => {
    if (level === 0) return 'Truques';
    return `${level}º Círculo`;
  };

  const getSpellLevelColor = (level: number): string => {
    const colors = [
      '#8E44AD', // Truques - Roxo
      '#3498DB', // 1º - Azul
      '#27AE60', // 2º - Verde
      '#F39C12', // 3º - Laranja
      '#E74C3C', // 4º - Vermelho
      '#9B59B6', // 5º - Roxo claro
      '#1ABC9C', // 6º - Turquesa
      '#34495E', // 7º - Azul escuro
      '#E67E22', // 8º - Laranja escuro
      '#8B4513', // 9º - Marrom
    ];
    return colors[level] || '#666';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Users size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  // Class Detail View
  if (viewMode === 'class-detail' && selectedClass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToClasses}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>{selectedClass.name}</Text>
            <Text style={styles.detailSubtitle}>Classe de D&D 5ª Edição</Text>
          </View>
        </View>

        <ClassDetailModal
          dndClass={selectedClass}
          visible={true}
          onClose={handleBackToClasses}
        />
      </SafeAreaView>
    );
  }

  // Character Detail View
  if (viewMode === 'character-detail' && selectedCharacterSpells) {
    const character = selectedCharacterSpells.character;
    const hpPercentage = (character.hp_current / character.hp_max) * 100;
    
    const getHpColor = (percentage: number) => {
      if (percentage > 75) return '#27AE60';
      if (percentage > 50) return '#F39C12';
      if (percentage > 25) return '#E67E22';
      return '#E74C3C';
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.detailHeaderContent}>
            <Text style={styles.detailTitle}>{character.name}</Text>
            <Text style={styles.detailSubtitle}>
              {character.class_name} • Nível {character.level}
            </Text>
          </View>
          
          <View style={styles.detailHeaderActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDeleteCharacter}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Character Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#D4AF37" />
              <Text style={styles.sectionTitle}>Status do Personagem</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Heart size={24} color={getHpColor(hpPercentage)} />
                <Text style={styles.statLabel}>Pontos de Vida</Text>
                <Text style={[styles.statValue, { color: getHpColor(hpPercentage) }]}>
                  {character.hp_current} / {character.hp_max}
                </Text>
                <View style={styles.hpBar}>
                  <View style={styles.hpBarBackground}>
                    <View 
                      style={[
                        styles.hpBarFill, 
                        { 
                          width: `${hpPercentage}%`,
                          backgroundColor: getHpColor(hpPercentage)
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Spell Slots Section */}
          {selectedCharacterSpells.spellSlots.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color="#E74C3C" />
                <Text style={styles.sectionTitle}>Espaços de Magia</Text>
              </View>

              <View style={styles.spellSlotsGrid}>
                {selectedCharacterSpells.spellSlots.map((slotInfo) => (
                  <View key={slotInfo.level} style={styles.spellSlotCard}>
                    <Text style={styles.spellSlotLevel}>
                      {getSpellLevelName(slotInfo.level)}
                    </Text>
                    
                    <View style={styles.spellSlotControls}>
                      <View style={styles.spellSlotRow}>
                        <Text style={styles.spellSlotLabel}>Atual:</Text>
                        <View style={styles.slotAdjustControls}>
                          <TouchableOpacity
                            style={styles.slotButton}
                            onPress={() => updateSpellSlot(slotInfo.level, 'current', -1)}
                          >
                            <Minus size={12} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.slotValue}>{slotInfo.current}</Text>
                          <TouchableOpacity
                            style={styles.slotButton}
                            onPress={() => updateSpellSlot(slotInfo.level, 'current', 1)}
                          >
                            <Plus size={12} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.spellSlotRow}>
                        <Text style={styles.spellSlotLabel}>Máximo:</Text>
                        <View style={styles.slotAdjustControls}>
                          <TouchableOpacity
                            style={styles.slotButton}
                            onPress={() => updateSpellSlot(slotInfo.level, 'max', -1)}
                          >
                            <Minus size={12} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.slotValue}>{slotInfo.max}</Text>
                          <TouchableOpacity
                            style={styles.slotButton}
                            onPress={() => updateSpellSlot(slotInfo.level, 'max', 1)}
                          >
                            <Plus size={12} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Add Spells Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#8E44AD" />
              <Text style={styles.sectionTitle}>Gerenciar Magias</Text>
            </View>
            
            <TouchableOpacity
              style={styles.addSpellsModalButton}
              onPress={() => setShowAddSpellsModal(true)}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addSpellsModalButtonText}>Adicionar Novas Magias</Text>
            </TouchableOpacity>
          </View>

          {/* Spells by Level */}
          {Object.keys(selectedCharacterSpells.spellsByLevel).length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={20} color="#8E44AD" />
                <Text style={styles.sectionTitle}>
                  Grimório - Magias Conhecidas ({selectedCharacterSpells.spells.length})
                </Text>
              </View>

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                const spellsAtLevel = selectedCharacterSpells.spellsByLevel[level] || [];
                if (spellsAtLevel.length === 0) return null;

                const levelColor = getSpellLevelColor(level);

                return (
                  <View key={level} style={styles.spellLevelSection}>
                    <View style={[styles.spellLevelHeader, { backgroundColor: levelColor }]}>
                      <Text style={styles.spellLevelTitle}>
                        {getSpellLevelName(level)}
                      </Text>
                      <View style={styles.spellCountBadge}>
                        <Text style={styles.spellCountText}>{spellsAtLevel.length}</Text>
                      </View>
                    </View>

                    <View style={styles.spellsList}>
                      {spellsAtLevel.map((spell, index) => (
                        <View key={spell.id} style={styles.spellItem}>
                          <View style={styles.spellInfo}>
                            <Text style={styles.spellName}>{spell.name}</Text>
                            <Text style={styles.spellSchool}>{spell.school}</Text>
                          </View>
                          <View style={styles.spellMeta}>
                            <Text style={styles.spellCastingTime}>{spell.castingTime}</Text>
                            <Text style={styles.spellRange}>{spell.range}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noSpellsContainer}>
              <Sparkles size={48} color="#D4AF37" />
              <Text style={styles.noSpellsTitle}>Nenhuma Magia</Text>
              <Text style={styles.noSpellsText}>
                Este personagem ainda não possui magias em seu grimório.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add Spells Modal */}
        <Modal
          visible={showAddSpellsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddSpellsModal(false)}
        >
          {selectedCharacterSpells && (
            <SpellSelectionModal
              visible={showAddSpellsModal}
              onClose={() => setShowAddSpellsModal(false)}
              characterClass={selectedCharacterSpells.characterClass!}
              characterName={selectedCharacterSpells.character.name}
              onAddSpells={(spells) => {
                handleAddSpellsToGrimoire(spells);
                setShowAddSpellsModal(false);
              }}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirmation(false)}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContainer}>
              <View style={styles.deleteModalHeader}>
                <AlertTriangle size={24} color="#E74C3C" />
                <Text style={styles.deleteModalTitle}>Confirmar Exclusão</Text>
              </View>
              
              <Text style={styles.deleteModalMessage}>
                Tem certeza que deseja excluir o personagem "{selectedCharacterSpells?.character.name}"?
                {'\n\n'}Esta ação não pode ser desfeita e todos os dados do personagem serão perdidos permanentemente.
              </Text>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity 
                  style={styles.deleteModalCancelButton} 
                  onPress={() => setShowDeleteConfirmation(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.deleteModalConfirmButton, deletingCharacter && styles.deleteModalButtonDisabled]} 
                  onPress={handleDeleteCharacter}
                  activeOpacity={0.8}
                  disabled={deletingCharacter}
                >
                  {deletingCharacter ? (
                    <RefreshCw size={16} color="#FFFFFF" />
                  ) : (
                    <Trash2 size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.deleteModalConfirmText}>
                    {deletingCharacter ? 'Excluindo...' : 'Excluir'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Classes List View
  if (viewMode === 'classes') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Shield size={28} color="#D4AF37" />
            <Text style={styles.title}>Classes</Text>
          </View>
          <Text style={styles.subtitle}>
            Explore as classes de D&D 5ª Edição
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.classesContainer}>
            {classesData.map((dndClass) => (
              <ClassCard
                key={dndClass.id}
                dndClass={dndClass}
                onPress={() => handleClassPress(dndClass)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main List View with Navigation Options
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Users size={28} color="#D4AF37" />
          <Text style={styles.title}>Personagens</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerencie seus personagens e explore classes
        </Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={20} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Navigation Options */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setViewMode('classes')}
          >
            <Shield size={24} color="#FFFFFF" />
            <Text style={styles.navButtonText}>Explorar Classes</Text>
            <Text style={styles.navButtonSubtext}>Veja todas as classes de D&D</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.createButtonContainer}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateCharacter}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Novo Personagem</Text>
          </TouchableOpacity>
        </View>

        {characters.length > 0 ? (
          <View style={styles.charactersContainer}>
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onPress={() => handleCharacterPress(character)}
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
          </View>
        )}
      </ScrollView>

      {/* Character Details Modal */}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    position: 'absolute',
    bottom: 8,
    left: 52,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  content: {
    flex: 1,
  },
  navigationContainer: {
    padding: 16,
  },
  navButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  navButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  charactersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  classesContainer: {
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
  },
  // Character Detail View Styles
  detailHeader: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#D4AF37',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  detailHeaderContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  detailHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  hpBar: {
    width: '100%',
  },
  hpBarBackground: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  addSpellsModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E44AD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addSpellsModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spellSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spellSlotCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minWidth: 140,
    flex: 1,
  },
  spellSlotLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  spellSlotControls: {
    gap: 8,
  },
  spellSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spellSlotLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  slotAdjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  slotValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  spellLevelSection: {
    marginBottom: 20,
  },
  spellLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  spellLevelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  spellCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spellsList: {
    gap: 8,
  },
  spellItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  spellInfo: {
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  spellSchool: {
    fontSize: 12,
    color: '#8E44AD',
    fontWeight: '500',
  },
  spellMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  spellCastingTime: {
    fontSize: 12,
    color: '#666',
  },
  spellRange: {
    fontSize: 12,
    color: '#666',
  },
  noSpellsContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  noSpellsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noSpellsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Delete Confirmation Modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
  },
  deleteModalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    gap: 6,
  },
  deleteModalButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});