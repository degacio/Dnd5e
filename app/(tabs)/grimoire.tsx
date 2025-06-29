import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Character } from '@/types/database';
import { Spell } from '@/types/spell';
import { DnDClass } from '@/types/dndClass';
import { supabase } from '@/lib/supabase';
import { Scroll, User, RefreshCw, Sparkles, Zap, X, ChevronRight, Star, Circle, Minus, Plus, BookOpen, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react-native';
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

export function GrimoireTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSpells | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [showAddSpellsModal, setShowAddSpellsModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingCharacter, setDeletingCharacter] = useState(false);

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
        // Filter only spellcasting characters
        const spellcasters = charactersData.filter((char: Character) => {
          const characterClass = classesData.find(cls => cls.name === char.class_name);
          return characterClass?.spellcasting;
        });
        setCharacters(spellcasters);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const getSpellByName = (spellName: string): Spell | null => {
    return allSpells.find(spell => spell.name === spellName) || null;
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

    // Get spell slots information
    const spellSlots: SpellSlotInfo[] = [];
    if (character.spell_slots && typeof character.spell_slots === 'object') {
      Object.entries(character.spell_slots).forEach(([level, slots]) => {
        if (Array.isArray(slots) && slots.length >= 2) {
          spellSlots.push({
            level: parseInt(level),
            current: slots[0],
            max: slots[1]
          });
        }
      });
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
    setSelectedCharacter(characterSpells);
  };

  const updateSpellSlot = async (level: number, type: 'current' | 'max', delta: number) => {
    if (!selectedCharacter) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const currentSlots = { ...selectedCharacter.character.spell_slots };
      const levelKey = level.toString();
      
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
        const response = await fetch(`/api/characters/${selectedCharacter.character.id}`, {
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
            char.id === selectedCharacter.character.id ? updatedCharacter : char
          ));
          
          // Update selected character
          const updatedCharacterSpells = prepareCharacterSpells(updatedCharacter);
          setSelectedCharacter(updatedCharacterSpells);
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
    if (!selectedCharacter) {
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
      const currentSpells = selectedCharacter.character.spells_known || [];
      
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
      const response = await fetch(`/api/characters/${selectedCharacter.character.id}`, {
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
          char.id === selectedCharacter.character.id ? updatedCharacter : char
        ));
        
        // Update selected character
        const updatedCharacterSpells = prepareCharacterSpells(updatedCharacter);
        setSelectedCharacter(updatedCharacterSpells);
        
        Alert.alert(
          'Sucesso', 
          `${newSpells.length} magia(s) adicionada(s) ao grimório de ${selectedCharacter.character.name}!`
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
    if (!selectedCharacter) return;

    setDeletingCharacter(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const response = await fetch(`/api/characters/${selectedCharacter.character.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Remove character from local state
        setCharacters(prev => prev.filter(char => char.id !== selectedCharacter.character.id));
        
        // Close modals
        setShowDeleteConfirmation(false);
        setSelectedCharacter(null);
        
        const successMessage = `Personagem ${selectedCharacter.character.name} foi excluído com sucesso.`;
        
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
    if (!selectedCharacter) return;

    const confirmMessage = `Tem certeza que deseja excluir o personagem "${selectedCharacter.character.name}"? Esta ação não pode ser desfeita.`;
    
    if (Platform.OS === 'web') {
      if (confirm(`Confirmar Exclusão: ${confirmMessage}`)) {
        handleDeleteCharacter();
      }
    } else {
      setShowDeleteConfirmation(true);
    }
  };

  const openAddSpellsModal = () => {
    setShowAddSpellsModal(true);
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
        <Scroll size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando grimórios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Scroll size={28} color="#D4AF37" />
          <Text style={styles.title}>Grimório</Text>
        </View>
        <Text style={styles.subtitle}>
          Magias dos seus personagens
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
        {characters.length > 0 ? (
          <View style={styles.charactersContainer}>
            {characters.map((character) => {
              const characterClass = classesData.find(cls => cls.name === character.class_name);
              const spellCount = character.spells_known ? character.spells_known.length : 0;
              const totalSlots = Object.values(character.spell_slots || {}).reduce((total: number, slots: any) => {
                return total + (Array.isArray(slots) ? slots[1] : 0);
              }, 0);
              
              return (
                <View key={character.id} style={styles.characterCardWrapper}>
                  <TouchableOpacity
                    style={styles.characterCard}
                    onPress={() => handleCharacterPress(character)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.characterHeader}>
                      <View style={styles.characterInfo}>
                        <User size={24} color="#D4AF37" />
                        <View style={styles.characterDetails}>
                          <Text style={styles.characterName}>{character.name}</Text>
                          <Text style={styles.characterClass}>
                            {character.class_name} • Nível {character.level}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#666" />
                    </View>

                    <View style={styles.characterStats}>
                      <View style={styles.statItem}>
                        <Sparkles size={16} color="#8E44AD" />
                        <Text style={styles.statLabel}>Magias</Text>
                        <Text style={styles.statValue}>{spellCount}</Text>
                      </View>
                      
                      {totalSlots > 0 && (
                        <View style={styles.statItem}>
                          <Zap size={16} color="#E74C3C" />
                          <Text style={styles.statLabel}>Espaços</Text>
                          <Text style={styles.statValue}>{totalSlots}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Add Spells Button */}
                  <TouchableOpacity
                    style={styles.addSpellsButton}
                    onPress={() => {
                      setSelectedCharacter(prepareCharacterSpells(character));
                      openAddSpellsModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <BookOpen size={16} color="#8E44AD" />
                    <Text style={styles.addSpellsButtonText}>Adicionar Magias ao Grimório</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Scroll size={64} color="#D4AF37" />
            <Text style={styles.emptyTitle}>Nenhum Conjurador</Text>
            <Text style={styles.emptyText}>
              Você não possui personagens conjuradores. Apenas classes que podem lançar magias aparecem no grimório.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Character Details Modal */}
      <Modal
        visible={!!selectedCharacter && !showAddSpellsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCharacter(null)}
      >
        {selectedCharacter && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleSection}>
                <Text style={styles.modalTitle}>{selectedCharacter.character.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCharacter.character.class_name} • Nível {selectedCharacter.character.level}
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={confirmDeleteCharacter}
                  activeOpacity={0.8}
                >
                  <Trash2 size={20} color="#E74C3C" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedCharacter(null)}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Spell Slots Section */}
              {selectedCharacter.spellSlots.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Zap size={20} color="#E74C3C" />
                    <Text style={styles.sectionTitle}>Espaços de Magia</Text>
                  </View>

                  <View style={styles.spellSlotsGrid}>
                    {selectedCharacter.spellSlots.map((slotInfo) => (
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
                  onPress={openAddSpellsModal}
                  activeOpacity={0.8}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addSpellsModalButtonText}>Adicionar Novas Magias</Text>
                </TouchableOpacity>
              </View>

              {/* Spells by Level */}
              {Object.keys(selectedCharacter.spellsByLevel).length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Sparkles size={20} color="#8E44AD" />
                    <Text style={styles.sectionTitle}>
                      Magias Conhecidas ({selectedCharacter.spells.length})
                    </Text>
                  </View>

                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                    const spellsAtLevel = selectedCharacter.spellsByLevel[level] || [];
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
          </SafeAreaView>
        )}
      </Modal>

      {/* Add Spells Modal */}
      <Modal
        visible={showAddSpellsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddSpellsModal(false)}
      >
        {selectedCharacter && (
          <SpellSelectionModal
            visible={showAddSpellsModal}
            onClose={() => setShowAddSpellsModal(false)}
            characterClass={selectedCharacter.characterClass!}
            characterName={selectedCharacter.character.name}
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
              Tem certeza que deseja excluir o personagem "{selectedCharacter?.character.name}"?
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

// Import SpellSelectionModal component
const SpellSelectionModal = ({ visible, onClose, characterClass, characterName, onAddSpells }: {
  visible: boolean;
  onClose: () => void;
  characterClass: DnDClass;
  characterName: string;
  onAddSpells: (spells: Spell[]) => void;
}) => {
  const [selectedSpells, setSelectedSpells] = useState<Set<string>>(new Set());
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [classSpells, setClassSpells] = useState<Spell[]>([]);

  useEffect(() => {
    if (visible && characterClass) {
      loadSpells();
    }
  }, [visible, characterClass]);

  const loadSpells = async () => {
    try {
      const spellsData = require('@/data/spells.json');
      setAllSpells(spellsData);
      
      // Filter spells for this class
      const filteredSpells = spellsData.filter((spell: Spell) => {
        return spell.classes && Array.isArray(spell.classes) && 
          spell.classes.some(className => 
            className && className.trim().toLowerCase() === characterClass.name.toLowerCase()
          );
      });
      
      setClassSpells(filteredSpells);
    } catch (error) {
      console.error('Error loading spells:', error);
      setClassSpells([]);
    }
  };

  const toggleSpellSelection = (spellId: string) => {
    const newSelected = new Set(selectedSpells);
    if (newSelected.has(spellId)) {
      newSelected.delete(spellId);
    } else {
      newSelected.add(spellId);
    }
    setSelectedSpells(newSelected);
  };

  const handleAddSelectedSpells = () => {
    if (selectedSpells.size === 0) {
      Alert.alert('Aviso', 'Selecione pelo menos uma magia para adicionar ao grimório.');
      return;
    }

    const spellsToAdd = classSpells.filter(spell => selectedSpells.has(spell.id));
    onAddSpells(spellsToAdd);
    setSelectedSpells(new Set());
  };

  const handleClose = () => {
    setSelectedSpells(new Set());
    onClose();
  };

  return (
    <SafeAreaView style={styles.spellModalContainer}>
      <View style={styles.spellModalHeader}>
        <View style={styles.spellModalTitleSection}>
          <Text style={styles.spellModalTitle}>Adicionar Magias</Text>
          <Text style={styles.spellModalSubtitle}>
            {characterName} • {characterClass.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.spellModalCloseButton} onPress={handleClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.spellSelectionControls}>
        <Text style={styles.spellSelectionTitle}>
          Magias Disponíveis: {classSpells.length} ({selectedSpells.size} selecionadas)
        </Text>
        
        {selectedSpells.size > 0 && (
          <TouchableOpacity
            style={styles.spellConfirmButton}
            onPress={handleAddSelectedSpells}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.spellConfirmButtonText}>
              Adicionar ({selectedSpells.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.spellModalContent} showsVerticalScrollIndicator={false}>
        {classSpells.length > 0 ? (
          <View style={styles.spellsGrid}>
            {classSpells.map((spell) => (
              <TouchableOpacity
                key={spell.id}
                style={[
                  styles.spellSelectionCard,
                  selectedSpells.has(spell.id) && styles.spellSelectionCardSelected
                ]}
                onPress={() => toggleSpellSelection(spell.id)}
                activeOpacity={0.8}
              >
                <View style={styles.spellSelectionHeader}>
                  <Text style={styles.spellSelectionName}>{spell.name}</Text>
                  <View style={styles.spellSelectionCheckbox}>
                    {selectedSpells.has(spell.id) && (
                      <Circle size={16} color="#27AE60" fill="#27AE60" />
                    )}
                  </View>
                </View>
                <Text style={styles.spellSelectionLevel}>Nível {spell.level} • {spell.school}</Text>
                <Text style={styles.spellSelectionDetails} numberOfLines={2}>
                  {spell.castingTime} • {spell.range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noSpellsContainer}>
            <Sparkles size={48} color="#D4AF37" />
            <Text style={styles.noSpellsTitle}>Nenhuma Magia Disponível</Text>
            <Text style={styles.noSpellsText}>
              Não foram encontradas magias para a classe {characterClass.name}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GrimoireTab;

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
  charactersContainer: {
    padding: 16,
  },
  characterCardWrapper: {
    marginBottom: 12,
  },
  characterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#8E44AD',
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  characterDetails: {
    marginLeft: 12,
    flex: 1,
  },
  characterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  characterClass: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  characterStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addSpellsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0B3FF',
    gap: 8,
  },
  addSpellsButtonText: {
    color: '#8E44AD',
    fontSize: 14,
    fontWeight: '600',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleSection: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
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
  // Spell Selection Modal styles
  spellModalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  spellModalHeader: {
    backgroundColor: '#8E44AD',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spellModalTitleSection: {
    flex: 1,
  },
  spellModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spellModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  spellModalCloseButton: {
    padding: 4,
  },
  spellSelectionControls: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spellSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  spellConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  spellConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  spellModalContent: {
    flex: 1,
  },
  spellsGrid: {
    padding: 16,
    gap: 12,
  },
  spellSelectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  spellSelectionCardSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF4',
  },
  spellSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  spellSelectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  spellSelectionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spellSelectionLevel: {
    fontSize: 12,
    color: '#8E44AD',
    fontWeight: '500',
    marginBottom: 4,
  },
  spellSelectionDetails: {
    fontSize: 12,
    color: '#666',
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