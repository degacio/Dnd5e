import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { DnDClass } from '@/types/dndClass';
import { Race } from '@/types/race';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Dice6, 
  Plus, 
  Minus,
  Save,
  RefreshCw
} from 'lucide-react-native';
import { router } from 'expo-router';

interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

interface CharacterData {
  name: string;
  race: Race | null;
  class: DnDClass | null;
  background: string;
  alignment: string;
  level: number;
  stats: CharacterStats;
  hitPoints: {
    current: number;
    max: number;
  };
}

const ALIGNMENTS = [
  'Leal e Bom', 'Neutro e Bom', 'Caótico e Bom',
  'Leal e Neutro', 'Neutro', 'Caótico e Neutro',
  'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'
];

const BACKGROUNDS = [
  'Acólito', 'Artesão', 'Artista', 'Charlatão', 'Criminoso',
  'Eremita', 'Herói do Povo', 'Marinheiro', 'Nobre', 'Órfão',
  'Sábio', 'Soldado', 'Forasteiro'
];

export default function CreateCharacterScreen() {
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState<DnDClass[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [characterData, setCharacterData] = useState<CharacterData>({
    name: '',
    race: null,
    class: null,
    background: '',
    alignment: '',
    level: 1,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hitPoints: {
      current: 0,
      max: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateHitPoints();
  }, [characterData.class, characterData.stats.constitution, characterData.level]);

  const loadData = async () => {
    try {
      const classesData = require('@/data/classes.json');
      const racesData = require('@/data/races.json');
      setClasses(classesData);
      setRaces(racesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHitPoints = () => {
    if (!characterData.class) return;

    const hitDie = parseInt(characterData.class.hitDie.replace('d', ''));
    const conModifier = Math.floor((characterData.stats.constitution - 10) / 2);
    
    // First level gets max hit die + con modifier
    // Additional levels get average of hit die + con modifier
    const baseHP = hitDie + conModifier;
    const additionalHP = (characterData.level - 1) * (Math.floor(hitDie / 2) + 1 + conModifier);
    const maxHP = Math.max(1, baseHP + additionalHP);

    setCharacterData(prev => ({
      ...prev,
      hitPoints: {
        current: maxHP,
        max: maxHP,
      },
    }));
  };

  const rollStats = () => {
    const rollStat = () => {
      // Roll 4d6, drop lowest
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
    };

    setCharacterData(prev => ({
      ...prev,
      stats: {
        strength: rollStat(),
        dexterity: rollStat(),
        constitution: rollStat(),
        intelligence: rollStat(),
        wisdom: rollStat(),
        charisma: rollStat(),
      },
    }));
  };

  const adjustStat = (stat: keyof CharacterStats, delta: number) => {
    setCharacterData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: Math.max(3, Math.min(20, prev.stats[stat] + delta)),
      },
    }));
  };

  const getModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const getModifierString = (score: number) => {
    const modifier = getModifier(score);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return characterData.name.trim().length > 0;
      case 2:
        return characterData.race !== null;
      case 3:
        return characterData.class !== null;
      case 4:
        return characterData.background && characterData.alignment;
      case 5:
        return true; // Stats are always valid
      default:
        return false;
    }
  };

  const saveCharacter = async () => {
    if (!characterData.race || !characterData.class) {
      Alert.alert('Erro', 'Dados do personagem incompletos.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        Alert.alert('Erro', 'Você precisa estar autenticado para criar personagens.');
        return;
      }

      // Calculate spell slots if the class is a spellcaster
      let spellSlots = {};
      if (characterData.class.spellcasting) {
        const levelIndex = characterData.level - 1;
        Object.entries(characterData.class.spellcasting.spellSlots).forEach(([level, slots]) => {
          if (slots[levelIndex] > 0) {
            spellSlots[level] = [slots[levelIndex], slots[levelIndex]]; // [current, max]
          }
        });
      }

      const newCharacter = {
        name: characterData.name,
        class_name: characterData.class.name,
        level: characterData.level,
        hp_current: characterData.hitPoints.current,
        hp_max: characterData.hitPoints.max,
        spell_slots: spellSlots,
        spells_known: [],
        character_data: {
          race: characterData.race.name,
          background: characterData.background,
          alignment: characterData.alignment,
          stats: characterData.stats,
          racial_traits: characterData.race.traits,
          size: characterData.race.size,
          speed: characterData.race.speed,
          languages: characterData.race.languages,
          proficiencies: {
            armor: characterData.class.armorProficiencies,
            weapons: characterData.class.weaponProficiencies,
            tools: characterData.class.toolProficiencies,
            skills: characterData.class.skillProficiencies,
            savingThrows: characterData.class.savingThrowProficiencies,
          },
        },
      };

      const response = await fetch('/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCharacter),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Personagem criado com sucesso!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Erro', 'Não foi possível criar o personagem.');
      }
    } catch (error) {
      console.error('Error creating character:', error);
      Alert.alert('Erro', 'Erro ao criar personagem.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <User size={48} color="#D4AF37" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Nome do Personagem</Text>
            <Text style={styles.stepDescription}>
              Escolha um nome épico para seu herói
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Digite o nome do personagem..."
                value={characterData.name}
                onChangeText={(text) => setCharacterData(prev => ({ ...prev, name: text }))}
                maxLength={50}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Escolha sua Raça</Text>
            <Text style={styles.stepDescription}>
              Cada raça possui características únicas
            </Text>
            
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {races.map((race) => (
                <TouchableOpacity
                  key={race.id}
                  style={[
                    styles.optionCard,
                    characterData.race?.id === race.id && styles.selectedOption,
                  ]}
                  onPress={() => setCharacterData(prev => ({ ...prev, race }))}
                >
                  <Text style={[
                    styles.optionTitle,
                    characterData.race?.id === race.id && styles.selectedOptionText,
                  ]}>
                    {race.name}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    characterData.race?.id === race.id && styles.selectedOptionDescription,
                  ]}>
                    {race.description}
                  </Text>
                  <View style={styles.raceStats}>
                    <Text style={[
                      styles.raceStatsText,
                      characterData.race?.id === race.id && styles.selectedOptionDescription,
                    ]}>
                      Tamanho: {race.size} • Velocidade: {race.speed}m
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Escolha sua Classe</Text>
            <Text style={styles.stepDescription}>
              Sua classe define suas habilidades e estilo de jogo
            </Text>
            
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {classes.map((dndClass) => (
                <TouchableOpacity
                  key={dndClass.id}
                  style={[
                    styles.optionCard,
                    characterData.class?.id === dndClass.id && styles.selectedOption,
                  ]}
                  onPress={() => setCharacterData(prev => ({ ...prev, class: dndClass }))}
                >
                  <View style={styles.classHeader}>
                    <Text style={[
                      styles.optionTitle,
                      characterData.class?.id === dndClass.id && styles.selectedOptionText,
                    ]}>
                      {dndClass.name}
                    </Text>
                    <View style={styles.hitDieBadge}>
                      <Text style={styles.hitDieText}>{dndClass.hitDie}</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.optionDescription,
                    characterData.class?.id === dndClass.id && styles.selectedOptionDescription,
                  ]}>
                    {dndClass.description}
                  </Text>
                  <Text style={[
                    styles.classInfo,
                    characterData.class?.id === dndClass.id && styles.selectedOptionDescription,
                  ]}>
                    Habilidade Principal: {dndClass.primaryAbility.join(', ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Antecedente e Tendência</Text>
            <Text style={styles.stepDescription}>
              Defina a história e personalidade do seu personagem
            </Text>
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Antecedente</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {BACKGROUNDS.map((background) => (
                  <TouchableOpacity
                    key={background}
                    style={[
                      styles.chipButton,
                      characterData.background === background && styles.selectedChip,
                    ]}
                    onPress={() => setCharacterData(prev => ({ ...prev, background }))}
                  >
                    <Text style={[
                      styles.chipText,
                      characterData.background === background && styles.selectedChipText,
                    ]}>
                      {background}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Tendência</Text>
              <View style={styles.alignmentGrid}>
                {ALIGNMENTS.map((alignment) => (
                  <TouchableOpacity
                    key={alignment}
                    style={[
                      styles.alignmentButton,
                      characterData.alignment === alignment && styles.selectedAlignment,
                    ]}
                    onPress={() => setCharacterData(prev => ({ ...prev, alignment }))}
                  >
                    <Text style={[
                      styles.alignmentText,
                      characterData.alignment === alignment && styles.selectedAlignmentText,
                    ]}>
                      {alignment}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Atributos</Text>
            <Text style={styles.stepDescription}>
              Distribua os pontos de atributo do seu personagem
            </Text>
            
            <View style={styles.rollContainer}>
              <TouchableOpacity style={styles.rollButton} onPress={rollStats}>
                <Dice6 size={20} color="#FFFFFF" />
                <Text style={styles.rollButtonText}>Rolar Atributos (4d6)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
              {Object.entries(characterData.stats).map(([stat, value]) => (
                <View key={stat} style={styles.statRow}>
                  <Text style={styles.statName}>
                    {stat === 'strength' ? 'Força' :
                     stat === 'dexterity' ? 'Destreza' :
                     stat === 'constitution' ? 'Constituição' :
                     stat === 'intelligence' ? 'Inteligência' :
                     stat === 'wisdom' ? 'Sabedoria' : 'Carisma'}
                  </Text>
                  
                  <View style={styles.statControls}>
                    <TouchableOpacity
                      style={styles.statButton}
                      onPress={() => adjustStat(stat as keyof CharacterStats, -1)}
                    >
                      <Minus size={16} color="#666" />
                    </TouchableOpacity>
                    
                    <View style={styles.statValueContainer}>
                      <Text style={styles.statValue}>{value}</Text>
                      <Text style={styles.statModifier}>
                        {getModifierString(value)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.statButton}
                      onPress={() => adjustStat(stat as keyof CharacterStats, 1)}
                    >
                      <Plus size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Resumo do Personagem</Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Nome:</Text> {characterData.name}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Raça:</Text> {characterData.race?.name}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Classe:</Text> {characterData.class?.name}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Pontos de Vida:</Text> {characterData.hitPoints.max}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <User size={28} color="#D4AF37" />
          <Text style={styles.title}>Criar Personagem</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Passo {step} de 5
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {step < 5 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.disabledButton]}
            onPress={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>Próximo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveCharacter}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw size={20} color="#FFFFFF" />
            ) : (
              <Save size={20} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Criar Personagem'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 1,
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 40,
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
    marginLeft: 40,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  selectedOption: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9E6',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  selectedOptionText: {
    color: '#B8941F',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectedOptionDescription: {
    color: '#8B7A1A',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hitDieBadge: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hitDieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  classInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  raceStats: {
    marginTop: 8,
  },
  raceStatsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  chipButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedChip: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9E6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedChipText: {
    color: '#B8941F',
  },
  alignmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alignmentButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedAlignment: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFF9E6',
  },
  alignmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedAlignmentText: {
    color: '#B8941F',
  },
  rollContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  rollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E44AD',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  rollButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statValueContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statModifier: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  nextButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
});