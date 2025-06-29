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
import { 
  Scroll, 
  User, 
  RefreshCw, 
  Sparkles, 
  Zap, 
  X,
  ChevronRight,
  Star,
  Circle,
  Minus,
  Plus,
  Shield,
  UserPlus,
  Heart,
  BookOpen,
  ArrowLeft,
  Share2,
  Eye,
  EyeOff,
  Copy,
  Clock,
  Check,
  ChevronDown
} from 'lucide-react-native';
import { router } from 'expo-router';
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

interface SpellDetailModalProps {
  spell: Spell | null;
  visible: boolean;
  onClose: () => void;
}

interface SpellSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  characterClass: DnDClass;
  characterName: string;
  onAddSpells: (spells: Spell[]) => void;
}

// Component to render HTML-formatted text
function FormattedText({ text, style }: { text: string; style?: any }) {
  // Parse HTML tags and convert to React Native components
  const parseHtmlText = (htmlText: string) => {
    const parts = [];
    let uniqueKey = 0; // Single counter for all keys to prevent collisions

    // First, decode HTML entities
    let decodedText = htmlText
      .replace(/&emsp;/g, '    ') // Em space (4 spaces)
      .replace(/&ensp;/g, '  ')  // En space (2 spaces)
      .replace(/&nbsp;/g, ' ')   // Non-breaking space
      .replace(/&/g, '&')    // Ampersand
      .replace(/</g, '<')     // Less than
      .replace(/>/g, '>')     // Greater than
      .replace(/"/g, '"')   // Quote
      .replace(/&#39;/g, "'")    // Apostrophe
      .replace(/&apos;/g, "'");  // Apostrophe (alternative)

    // Split by <br> tags first to handle line breaks
    const lines = decodedText.split(/<br\s*\/?>/gi);
    
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        parts.push(<Text key={`br-${uniqueKey++}`}>{'\n'}</Text>);
      }

      // Process each line for bold and italic formatting
      const processLine = (text: string) => {
        const segments = [];
        let remaining = text;

        while (remaining.length > 0) {
          // Look for bold text (**text** or <b>text</b> or <strong>text</strong>)
          const boldMatch = remaining.match(/(\*\*(.+?)\*\*|<b>(.+?)<\/b>|<strong>(.+?)<\/strong>)/i);
          
          if (boldMatch) {
            const beforeBold = remaining.substring(0, boldMatch.index);
            const boldText = boldMatch[2] || boldMatch[3] || boldMatch[4];
            
            // Add text before bold
            if (beforeBold) {
              segments.push(
                <Text key={`text-${uniqueKey++}`}>
                  {processItalic(beforeBold)}
                </Text>
              );
            }
            
            // Add bold text
            segments.push(
              <Text key={`bold-${uniqueKey++}`} style={styles.boldText}>
                {processItalic(boldText)}
              </Text>
            );
            
            remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
          } else {
            // No more bold text, process remaining for italic
            segments.push(
              <Text key={`text-${uniqueKey++}`}>
                {processItalic(remaining)}
              </Text>
            );
            break;
          }
        }
        
        return segments;
      };

      // Process italic text (*text* or <i>text</i> or <em>text</em>)
      const processItalic = (text: string) => {
        const segments = [];
        let remaining = text;

        while (remaining.length > 0) {
          const italicMatch = remaining.match(/(\*(.+?)\*|<i>(.+?)<\/i>|<em>(.+?)<\/em>)/i);
          
          if (italicMatch) {
            const beforeItalic = remaining.substring(0, italicMatch.index);
            const italicText = italicMatch[2] || italicMatch[3] || italicMatch[4];
            
            // Add text before italic
            if (beforeItalic) {
              segments.push(beforeItalic);
            }
            
            // Add italic text
            segments.push(
              <Text key={`italic-${uniqueKey++}`} style={styles.italicText}>
                {italicText}
              </Text>
            );
            
            remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
          } else {
            // No more italic text
            segments.push(remaining);
            break;
          }
        }
        
        return segments;
      };

      const lineSegments = processLine(line);
      parts.push(...lineSegments);
    });

    return parts;
  };

  const formattedContent = parseHtmlText(text);

  return (
    <Text style={style}>
      {formattedContent}
    </Text>
  );
}

// Spell Detail Modal Component
function SpellDetailModal({ spell, visible, onClose }: SpellDetailModalProps) {
  if (!spell) return null;

  const getSchoolColor = (school: string): string => {
    const schoolColors: Record<string, string> = {
      'Abjuração': '#4A90E2',
      'Adivinhação': '#9B59B6',
      'Encantamento': '#E74C3C',
      'Evocação': '#F39C12',
      'Ilusão': '#8E44AD',
      'Invocação': '#27AE60',
      'Necromancia': '#2C3E50',
      'Transmutação': '#16A085'
    };
    return schoolColors[school] || '#666';
  };

  const schoolColor = getSchoolColor(spell.school);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={[styles.spellModalHeader, { backgroundColor: schoolColor }]}>
          <View style={styles.spellModalHeaderContent}>
            <View style={styles.spellModalTitleSection}>
              <Text style={styles.spellModalName}>{spell.name}</Text>
              <Text style={styles.spellModalSchoolLevel}>
                {spell.school} • Nível {spell.level}
              </Text>
            </View>
            <TouchableOpacity style={styles.spellModalCloseButton} onPress={onClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.spellModalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.spellStatsContainer}>
            <View style={styles.spellStatRow}>
              <View style={styles.spellStatItem}>
                <Clock size={20} color={schoolColor} />
                <Text style={styles.spellStatLabel}>Tempo de Conjuração</Text>
                <Text style={styles.spellStatValue}>{spell.castingTime}</Text>
              </View>
              <View style={styles.spellStatItem}>
                <Zap size={20} color={schoolColor} />
                <Text style={styles.spellStatLabel}>Alcance</Text>
                <Text style={styles.spellStatValue}>{spell.range}</Text>
              </View>
            </View>

            <View style={styles.spellStatRow}>
              <View style={styles.spellStatItem}>
                <Star size={20} color={schoolColor} />
                <Text style={styles.spellStatLabel}>Componentes</Text>
                <Text style={styles.spellStatValue}>{spell.components}</Text>
              </View>
              <View style={styles.spellStatItem}>
                <Circle size={20} color={schoolColor} />
                <Text style={styles.spellStatLabel}>Duração</Text>
                <Text style={styles.spellStatValue}>{spell.duration}</Text>
              </View>
            </View>
          </View>

          <View style={styles.spellSection}>
            <View style={styles.spellSectionHeader}>
              <BookOpen size={20} color={schoolColor} />
              <Text style={[styles.spellSectionTitle, { color: schoolColor }]}>
                Descrição
              </Text>
            </View>
            <FormattedText text={spell.description} style={styles.spellDescription} />
          </View>

          <View style={styles.spellSection}>
            <View style={styles.spellSectionHeader}>
              <User size={20} color={schoolColor} />
              <Text style={[styles.spellSectionTitle, { color: schoolColor }]}>
                Classes
              </Text>
            </View>
            <View style={styles.spellClassesContainer}>
              {spell.classes.map((className, index) => (
                <View key={index} style={[styles.spellClassBadge, { borderColor: schoolColor }]}>
                  <Text style={[styles.spellClassText, { color: schoolColor }]}>
                    {className}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.spellSourceSection}>
            <Text style={styles.spellSourceLabel}>Fonte:</Text>
            <Text style={styles.spellSourceText}>{spell.source}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Spell Selection Modal Component
function SpellSelectionModal({ 
  visible, 
  onClose, 
  characterClass, 
  characterName, 
  onAddSpells 
}: SpellSelectionModalProps) {
  const [selectedSpells, setSelectedSpells] = useState<Set<string>>(new Set());
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [allSpells, setAllSpells] = useState<Spell[]>([]);

  useEffect(() => {
    if (visible) {
      loadSpells();
    }
  }, [visible]);

  const loadSpells = async () => {
    try {
      // Load spells data
      let spellsData: Spell[] = [];
      
      if (Platform.OS === 'web') {
        const storedSpells = localStorage.getItem('customSpells');
        if (storedSpells) {
          spellsData = JSON.parse(storedSpells);
        }
      }
      
      // If no custom spells, load the default ones
      if (spellsData.length === 0) {
        const defaultSpells = require('@/data/spells.json');
        
        // Check if we have the Livro do Jogador data
        try {
          const livroDoJogadorData = require('@/data/magias-livro-do-jogador.json');
          const { adaptSpellsFromLivroDoJogador } = require('@/utils/spellAdapter');
          const adaptedSpells = adaptSpellsFromLivroDoJogador(livroDoJogadorData);
          
          if (adaptedSpells && adaptedSpells.length > 0) {
            spellsData = adaptedSpells;
          } else {
            spellsData = defaultSpells;
          }
        } catch (error) {
          spellsData = defaultSpells;
        }
      }
      
      setAllSpells(spellsData);
    } catch (error) {
      console.error('Error loading spells:', error);
      setAllSpells([]);
    }
  };

  const classSpells = React.useMemo(() => {
    if (!characterClass || !characterClass.name) {
      return [];
    }

    // Filter spells for this class
    const filteredSpells = allSpells.filter((spell: Spell) => {
      // Check if spell is available to this class
      const isClassSpell = spell.classes && Array.isArray(spell.classes) && 
        spell.classes.some(className => 
          className && className.trim().toLowerCase() === characterClass.name.toLowerCase()
        );
      
      // Check if spell is available to any subclass of this class
      const isSubclassSpell = spell.subclasses && Array.isArray(spell.subclasses) && 
        characterClass.subclasses && Array.isArray(characterClass.subclasses) &&
        spell.subclasses.some(subclass => 
          characterClass.subclasses.some(classSubclass => 
            typeof classSubclass === 'string' 
              ? classSubclass.toLowerCase() === subclass.toLowerCase()
              : classSubclass && classSubclass.name && classSubclass.name.toLowerCase() === subclass.toLowerCase()
          )
        );
      
      return isClassSpell || isSubclassSpell;
    });
    
    return filteredSpells;
  }, [characterClass, allSpells]);

  const spellsBySchool = React.useMemo(() => {
    const groups: Record<string, Spell[]> = {};
    
    classSpells.forEach((spell) => {
      if (!groups[spell.school]) {
        groups[spell.school] = [];
      }
      groups[spell.school].push(spell);
    });

    // Sort spells within each school
    Object.keys(groups).forEach(school => {
      groups[school].sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [classSpells]);

  const toggleSpellSelection = (spellId: string) => {
    const newSelected = new Set(selectedSpells);
    if (newSelected.has(spellId)) {
      newSelected.delete(spellId);
    } else {
      newSelected.add(spellId);
    }
    setSelectedSpells(newSelected);
  };

  const toggleSchool = (school: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(school)) {
      newExpanded.delete(school);
    } else {
      newExpanded.add(school);
    }
    setExpandedSchools(newExpanded);
  };

  const handleSelectAll = () => {
    if (selectedSpells.size === classSpells.length) {
      setSelectedSpells(new Set());
    } else {
      setSelectedSpells(new Set(classSpells.map(spell => spell.id)));
    }
  };

  const handleAddSelectedSpells = () => {
    if (selectedSpells.size === 0) {
      const message = 'Selecione pelo menos uma magia para adicionar ao grimório.';
      if (Platform.OS === 'web') {
        alert(`Aviso: ${message}`);
      } else {
        Alert.alert('Aviso', message);
      }
      return;
    }

    const spellsToAdd = classSpells.filter(spell => selectedSpells.has(spell.id));
    const confirmMessage = `Adicionar ${spellsToAdd.length} magia(s) ao grimório de ${characterName}?`;
    
    const performAdd = () => {
      onAddSpells(spellsToAdd);
      handleClose();
    };

    if (Platform.OS === 'web') {
      if (confirm(`Confirmar: ${confirmMessage}`)) {
        performAdd();
      }
    } else {
      Alert.alert(
        'Confirmar',
        confirmMessage,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Adicionar', onPress: performAdd }
        ]
      );
    }
  };

  const handleClose = () => {
    setSelectedSpells(new Set());
    setSelectedSpell(null);
    setExpandedSchools(new Set());
    onClose();
  };

  const getSchoolColor = (school: string): string => {
    const schoolColors: Record<string, string> = {
      'Abjuração': '#4A90E2',
      'Adivinhação': '#9B59B6',
      'Encantamento': '#E74C3C',
      'Evocação': '#F39C12',
      'Ilusão': '#8E44AD',
      'Invocação': '#27AE60',
      'Necromancia': '#2C3E50',
      'Transmutação': '#16A085'
    };
    return schoolColors[school] || '#666';
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.spellSelectionHeader}>
            <View style={styles.spellSelectionHeaderContent}>
              <View style={styles.spellSelectionTitleSection}>
                <Text style={styles.spellSelectionTitle}>Adicionar Magias</Text>
                <Text style={styles.spellSelectionSubtitle}>
                  {characterName} • {characterClass?.name || 'Classe não definida'}
                </Text>
              </View>
              <TouchableOpacity style={styles.spellSelectionCloseButton} onPress={handleClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection Controls */}
          <View style={styles.selectionControls}>
            <View style={styles.selectionHeader}>
              <BookOpen size={20} color="#8E44AD" />
              <Text style={styles.selectionTitle}>
                Magias Disponíveis: {classSpells.length} ({selectedSpells.size} selecionadas)
              </Text>
            </View>
            
            {classSpells.length > 0 && (
              <View style={styles.selectionButtons}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={handleSelectAll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectAllButtonText}>
                    {selectedSpells.size === classSpells.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    selectedSpells.size === 0 && styles.confirmButtonDisabled
                  ]}
                  onPress={handleAddSelectedSpells}
                  activeOpacity={0.8}
                  disabled={selectedSpells.size === 0}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>
                    Adicionar ({selectedSpells.size})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView style={styles.spellSelectionContent} showsVerticalScrollIndicator={false}>
            {/* Spells by School */}
            {Object.keys(spellsBySchool).length > 0 ? (
              <View style={styles.spellsContainer}>
                {Object.entries(spellsBySchool)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([school, spells]) => {
                    const schoolColor = getSchoolColor(school);
                    const isExpanded = expandedSchools.has(school);
                    
                    return (
                      <View key={school} style={styles.schoolContainer}>
                        <TouchableOpacity
                          style={[styles.schoolHeader, { backgroundColor: schoolColor }]}
                          onPress={() => toggleSchool(school)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.schoolHeaderContent}>
                            <View style={styles.schoolTitleContainer}>
                              {isExpanded ? (
                                <ChevronDown size={20} color="#FFFFFF" />
                              ) : (
                                <ChevronRight size={20} color="#FFFFFF" />
                              )}
                              <Text style={styles.schoolTitle}>
                                {school}
                              </Text>
                            </View>
                            <View style={styles.countBadge}>
                              <Text style={styles.countText}>{spells.length}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.schoolSpellsContainer}>
                            {spells.map((spell) => (
                              <View key={spell.id} style={styles.spellCardContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.spellCheckbox,
                                    selectedSpells.has(spell.id) && styles.spellCheckboxSelected
                                  ]}
                                  onPress={() => toggleSpellSelection(spell.id)}
                                  activeOpacity={0.8}
                                >
                                  {selectedSpells.has(spell.id) && (
                                    <Check size={16} color="#FFFFFF" />
                                  )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                  style={styles.spellCardWrapper}
                                  onPress={() => setSelectedSpell(spell)}
                                  activeOpacity={0.8}
                                >
                                  <View style={styles.spellCard}>
                                    <View style={styles.spellCardHeader}>
                                      <View style={[styles.spellLevelBadge, { backgroundColor: getSchoolColor(spell.school) }]}>
                                        <Text style={styles.spellLevelBadgeText}>
                                          {spell.level === 0 ? 'T' : spell.level}
                                        </Text>
                                      </View>
                                      <View style={styles.spellCardInfo}>
                                        <Text style={styles.spellCardName}>{spell.name}</Text>
                                        <Text style={styles.spellCardSchool}>{spell.school}</Text>
                                      </View>
                                    </View>
                                    <View style={styles.spellCardMeta}>
                                      <Text style={styles.spellCardMetaText}>{spell.castingTime}</Text>
                                      <Text style={styles.spellCardMetaText}>•</Text>
                                      <Text style={styles.spellCardMetaText}>{spell.range}</Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.noSpellsContainer}>
                <Sparkles size={48} color="#D4AF37" />
                <Text style={styles.noSpellsTitle}>Nenhuma Magia Disponível</Text>
                <Text style={styles.noSpellsText}>
                  Não foram encontradas magias para a classe {characterClass?.name || 'não definida'}.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <SpellDetailModal
        spell={selectedSpell}
        visible={!!selectedSpell}
        onClose={() => setSelectedSpell(null)}
      />
    </>
  );
}

export default function GrimoireTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSpells | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [spellSelectionCharacter, setSpellSelectionCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allSpells, setAllSpells] = useState<Spell[]>([]);
  const [showToken, setShowToken] = useState(false);

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

  const navigateToCreateCharacter = () => {
    router.push('/characters/create');
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

  const openSpellSelection = (character: Character) => {
    setSpellSelectionCharacter(character);
  };

  const handleAddSpellsToGrimoire = async (spells: Spell[]) => {
    if (!spellSelectionCharacter) {
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
      const currentSpells = spellSelectionCharacter.spells_known || [];
      
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
      const response = await fetch(`/api/characters/${spellSelectionCharacter.id}`, {
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
          char.id === spellSelectionCharacter.id ? updatedCharacter : char
        ));
        
        // Update selected character if it's the same one
        if (selectedCharacter?.character.id === spellSelectionCharacter.id) {
          const updatedCharacterSpells = prepareCharacterSpells(updatedCharacter);
          setSelectedCharacter(updatedCharacterSpells);
        }
        
        Alert.alert(
          'Sucesso', 
          `${newSpells.length} magia(s) adicionada(s) ao grimório de ${spellSelectionCharacter.name}!`
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

  const handleGenerateToken = async (characterId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the character in our local state
        setCharacters(prev => prev.map(char => 
          char.id === characterId 
            ? { ...char, share_token: result.share_token, token_expires_at: result.expires_at }
            : char
        ));

        // Update selected character if it's the same one
        if (selectedCharacter?.character.id === characterId) {
          const updatedCharacter = { 
            ...selectedCharacter.character, 
            share_token: result.share_token, 
            token_expires_at: result.expires_at 
          };
          setSelectedCharacter(prev => prev ? {
            ...prev,
            character: updatedCharacter
          } : null);
        }

        Alert.alert('Sucesso', 'Token de compartilhamento gerado com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível gerar o token.');
      }
    } catch (error) {
      console.error('Error generating token:', error);
      Alert.alert('Erro', 'Erro ao gerar token.');
    }
  };

  const handleRevokeToken = async (characterId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado.');
        return;
      }

      const response = await fetch(`/api/characters/${characterId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Update the character in our local state
        setCharacters(prev => prev.map(char => 
          char.id === characterId 
            ? { ...char, share_token: null, token_expires_at: null }
            : char
        ));

        // Update selected character if it's the same one
        if (selectedCharacter?.character.id === characterId) {
          const updatedCharacter = { 
            ...selectedCharacter.character, 
            share_token: null, 
            token_expires_at: null 
          };
          setSelectedCharacter(prev => prev ? {
            ...prev,
            character: updatedCharacter
          } : null);
        }

        Alert.alert('Sucesso', 'Token revogado com sucesso!');
      } else {
        Alert.alert('Erro', 'Não foi possível revogar o token.');
      }
    } catch (error) {
      console.error('Error revoking token:', error);
      Alert.alert('Erro', 'Erro ao revogar token.');
    }
  };

  const copyTokenToClipboard = () => {
    if (selectedCharacter?.character.share_token) {
      // For web, we can use the Clipboard API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(selectedCharacter.character.share_token);
        Alert.alert('Copiado', 'Token copiado para a área de transferência!');
      } else {
        Alert.alert('Erro', 'Não foi possível copiar o token.');
      }
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          Personagens e suas magias
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
              const hpPercentage = (character.hp_current / character.hp_max) * 100;
              
              const getHpColor = (percentage: number) => {
                if (percentage > 75) return '#27AE60';
                if (percentage > 50) return '#F39C12';
                if (percentage > 25) return '#E67E22';
                return '#E74C3C';
              };
              
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
                        <Heart size={16} color={getHpColor(hpPercentage)} />
                        <Text style={styles.statLabel}>Vida</Text>
                        <Text style={[styles.statValue, { color: getHpColor(hpPercentage) }]}>
                          {character.hp_current}/{character.hp_max}
                        </Text>
                      </View>
                      
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

                    {character.share_token && (
                      <View style={styles.sharedIndicator}>
                        <Share2 size={12} color="#27AE60" />
                        <Text style={styles.sharedText}>Compartilhado com DM</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Add Spells Button */}
                  <TouchableOpacity
                    style={styles.addSpellsButton}
                    onPress={() => openSpellSelection(character)}
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
            
            <TouchableOpacity 
              style={styles.createCharacterButton}
              onPress={navigateToCreateCharacter}
              activeOpacity={0.8}
            >
              <UserPlus size={20} color="#FFFFFF" />
              <Text style={styles.createCharacterButtonText}>Criar Personagem Conjurador</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Character Detail Modal */}
      <Modal
        visible={!!selectedCharacter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCharacter(null)}
      >
        {selectedCharacter && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedCharacter(null)}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.modalTitleSection}>
                <Text style={styles.modalTitle}>{selectedCharacter.character.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCharacter.character.class_name} • Nível {selectedCharacter.character.level}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Character Stats */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <User size={20} color="#D4AF37" />
                  <Text style={styles.sectionTitle}>Status do Personagem</Text>
                </View>

                <View style={styles.characterStatsGrid}>
                  <View style={styles.characterStatCard}>
                    <Heart size={24} color="#E74C3C" />
                    <Text style={styles.characterStatLabel}>Pontos de Vida</Text>
                    <Text style={styles.characterStatValue}>
                      {selectedCharacter.character.hp_current} / {selectedCharacter.character.hp_max}
                    </Text>
                  </View>

                  <View style={styles.characterStatCard}>
                    <Sparkles size={24} color="#8E44AD" />
                    <Text style={styles.characterStatLabel}>Magias Conhecidas</Text>
                    <Text style={styles.characterStatValue}>
                      {selectedCharacter.spells.length}
                    </Text>
                  </View>
                </View>
              </View>

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
                            <TouchableOpacity
                              key={spell.id}
                              style={styles.spellItem}
                              onPress={() => setSelectedSpell(spell)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.spellInfo}>
                                <Text style={styles.spellName}>{spell.name}</Text>
                                <Text style={styles.spellSchool}>{spell.school}</Text>
                              </View>
                              <View style={styles.spellMeta}>
                                <Text style={styles.spellCastingTime}>{spell.castingTime}</Text>
                                <Text style={styles.spellRange}>{spell.range}</Text>
                              </View>
                            </TouchableOpacity>
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

              {/* Sharing Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Share2 size={20} color="#27AE60" />
                  <Text style={styles.sectionTitle}>Compartilhamento com DM</Text>
                </View>

                {selectedCharacter.character.share_token ? (
                  <View style={styles.tokenContainer}>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenLabel}>Token Ativo:</Text>
                      <View style={styles.tokenRow}>
                        <Text style={styles.tokenValue}>
                          {showToken ? selectedCharacter.character.share_token : '••••••••-••••-••••-••••-••••••••••••'}
                        </Text>
                        <TouchableOpacity 
                          style={styles.tokenToggle}
                          onPress={() => setShowToken(!showToken)}
                        >
                          {showToken ? <EyeOff size={16} color="#666" /> : <Eye size={16} color="#666" />}
                        </TouchableOpacity>
                      </View>
                      
                      {selectedCharacter.character.token_expires_at && (
                        <View style={styles.expirationInfo}>
                          <Clock size={14} color="#666" />
                          <Text style={styles.expirationText}>
                            Expira em: {formatExpirationDate(selectedCharacter.character.token_expires_at)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.tokenActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={copyTokenToClipboard}>
                        <Copy size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Copiar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.revokeButton]} 
                        onPress={() => handleRevokeToken(selectedCharacter.character.id)}
                      >
                        <X size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Revogar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noTokenContainer}>
                    <Text style={styles.noTokenText}>
                      Nenhum token de compartilhamento ativo. Gere um token para permitir que seu DM acesse este personagem.
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.generateButton}
                      onPress={() => handleGenerateToken(selectedCharacter.character.id)}
                    >
                      <Share2 size={16} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Gerar Token</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      <SpellDetailModal
        spell={selectedSpell}
        visible={!!selectedSpell}
        onClose={() => setSelectedSpell(null)}
      />

      <SpellSelectionModal
        visible={!!spellSelectionCharacter}
        onClose={() => setSpellSelectionCharacter(null)}
        characterClass={spellSelectionCharacter ? classesData.find(cls => cls.name === spellSelectionCharacter.class_name)! : {} as any}
        characterName={spellSelectionCharacter?.name || ''}
        onAddSpells={handleAddSpellsToGrimoire}
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
  charactersContainer: {
    padding: 16,
  },
  characterCardWrapper: {
    marginBottom: 8,
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
  sharedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sharedText: {
    fontSize: 11,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 4,
  },
  addSpellsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0B3FF',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    marginBottom: 32,
  },
  createCharacterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  createCharacterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  backButton: {
    padding: 4,
    marginRight: 16,
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
  characterStatsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  characterStatCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  characterStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  characterStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
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
  tokenContainer: {
    gap: 16,
  },
  tokenInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tokenToggle: {
    padding: 8,
  },
  expirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  expirationText: {
    fontSize: 12,
    color: '#666',
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  revokeButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noTokenContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noTokenText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Spell Detail Modal styles
  spellModalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  spellModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  spellModalTitleSection: {
    flex: 1,
  },
  spellModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spellModalSchoolLevel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  spellModalCloseButton: {
    padding: 4,
  },
  spellModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spellStatsContainer: {
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
  spellStatRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  spellStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  spellStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  spellStatValue: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  spellSection: {
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
  spellSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spellSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  spellDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#444',
  },
  spellClassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spellClassBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  spellClassText: {
    fontSize: 14,
    fontWeight: '500',
  },
  spellSourceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  spellSourceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  spellSourceText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // Spell Selection Modal styles
  spellSelectionHeader: {
    backgroundColor: '#8E44AD',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  spellSelectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  spellSelectionTitleSection: {
    flex: 1,
  },
  spellSelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spellSelectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  spellSelectionCloseButton: {
    padding: 4,
  },
  selectionControls: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  selectAllButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectAllButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  spellSelectionContent: {
    flex: 1,
  },
  spellsContainer: {
    padding: 16,
  },
  schoolContainer: {
    marginBottom: 16,
  },
  schoolHeader: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  schoolHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schoolTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schoolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  schoolSpellsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  spellCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spellCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  spellCheckboxSelected: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  spellCardWrapper: {
    flex: 1,
  },
  spellCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  spellCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  spellLevelBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  spellLevelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellCardInfo: {
    flex: 1,
  },
  spellCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  spellCardSchool: {
    fontSize: 11,
    color: '#8E44AD',
    fontWeight: '500',
  },
  spellCardMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  spellCardMetaText: {
    fontSize: 11,
    color: '#666',
  },
});