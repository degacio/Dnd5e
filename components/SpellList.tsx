import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Spell, School, SchoolColors } from '@/types/spell';
import { SpellCard } from './SpellCard';
import { SpellDetailModal } from './SpellDetailModal';
import { Search, BookOpen, Filter, X } from 'lucide-react-native';

interface SpellListProps {
  spells: Spell[];
}

export function SpellList({ spells }: SpellListProps) {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassFilter, setShowClassFilter] = useState(false);

  // Get all unique classes from spells
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    spells.forEach(spell => {
      if (spell.classes && Array.isArray(spell.classes)) {
        spell.classes.forEach(className => {
          if (className && className.trim()) {
            classSet.add(className.trim());
          }
        });
      }
    });
    return Array.from(classSet).sort();
  }, [spells]);

  const filteredAndSortedSpells = useMemo(() => {
    let filtered = spells.filter((spell) => {
      // Check search text
      const matchesSearch = !searchText || 
        spell.name.toLowerCase().includes(searchText.toLowerCase());
      
      // Check class filter
      let matchesClass = true;
      if (selectedClass) {
        matchesClass = spell.classes && Array.isArray(spell.classes) && 
          spell.classes.some(className => 
            className && className.trim().toLowerCase() === selectedClass.toLowerCase()
          );
      }
      
      return matchesSearch && matchesClass;
    });

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [spells, searchText, selectedClass]);

  const selectClass = (className: string | null) => {
    setSelectedClass(className);
    setShowClassFilter(false);
  };

  const totalSpells = filteredAndSortedSpells.length;

  const getLevelName = (level: number): string => {
    return level === 0 ? 'Truque' : `${level}º Círculo`;
  };

  const getLevelColor = (level: number): string => {
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

  const renderSpellItem = ({ item }: { item: Spell }) => (
    <View style={styles.spellItemContainer}>
      <TouchableOpacity
        style={styles.spellItem}
        onPress={() => setSelectedSpell(item)}
        activeOpacity={0.8}
      >
        <View style={styles.spellHeader}>
          <View style={styles.spellTitleRow}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
              <Text style={styles.levelText}>{getLevelName(item.level)}</Text>
            </View>
            <View style={styles.spellNameContainer}>
              <Text style={styles.spellName}>{item.name}</Text>
              <View style={styles.spellMetaRow}>
                <View style={[styles.schoolBadge, { backgroundColor: SchoolColors[item.school as keyof typeof SchoolColors] }]}>
                  <Text style={styles.schoolText}>{item.school}</Text>
                </View>
                <Text style={styles.spellInfo}>
                  {item.castingTime} • {item.range}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.spellClasses}>
          <Text style={styles.classesLabel}>Classes:</Text>
          <Text style={styles.classesText} numberOfLines={2}>
            {item.classes.join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar magias..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.classFilterButton}
            onPress={() => setShowClassFilter(true)}
            activeOpacity={0.8}
          >
            <Filter size={16} color="#666" />
            <Text style={styles.classFilterText}>
              {selectedClass || 'Todas as Classes'}
            </Text>
          </TouchableOpacity>

          {selectedClass && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setSelectedClass(null)}
              activeOpacity={0.8}
            >
              <X size={14} color="#E74C3C" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.totalCountContainer}>
          <BookOpen size={16} color="#D4AF37" />
          <Text style={styles.totalCount}>
            Total: {totalSpells} magias
            {selectedClass && (
              <Text style={styles.filterInfo}> • Filtrado por: {selectedClass}</Text>
            )}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredAndSortedSpells}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderSpellItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Class Filter Modal */}
      <Modal
        visible={showClassFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClassFilter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowClassFilter(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Classe</Text>
              <TouchableOpacity
                onPress={() => setShowClassFilter(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.classOption,
                !selectedClass && styles.classOptionSelected
              ]}
              onPress={() => selectClass(null)}
            >
              <Text style={[
                styles.classOptionText,
                !selectedClass && styles.classOptionTextSelected
              ]}>
                Todas as Classes ({spells.length} magias)
              </Text>
            </TouchableOpacity>

            <FlatList
              data={availableClasses}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const spellCount = spells.filter(spell => 
                  spell.classes && Array.isArray(spell.classes) && 
                  spell.classes.some(className => 
                    className && className.trim().toLowerCase() === item.toLowerCase()
                  )
                ).length;

                return (
                  <TouchableOpacity
                    style={[
                      styles.classOption,
                      selectedClass === item && styles.classOptionSelected
                    ]}
                    onPress={() => selectClass(item)}
                  >
                    <Text style={[
                      styles.classOptionText,
                      selectedClass === item && styles.classOptionTextSelected
                    ]}>
                      {item} ({spellCount} magias)
                    </Text>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <SpellDetailModal
        spell={selectedSpell}
        visible={!!selectedSpell}
        onClose={() => setSelectedSpell(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E8E8E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  classFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    flex: 1,
    gap: 8,
  },
  classFilterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  clearFilterButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  totalCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  totalCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterInfo: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  listContent: {
    paddingVertical: 8,
  },
  spellItemContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  spellItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  spellHeader: {
    marginBottom: 12,
  },
  spellTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  levelBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellNameContainer: {
    flex: 1,
  },
  spellName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 22,
  },
  spellMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  schoolText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spellInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  spellClasses: {
    flexDirection: 'column',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  classesLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  classesText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
    lineHeight: 16,
  },
  separator: {
    height: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  classOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  classOptionSelected: {
    backgroundColor: '#D4AF37',
  },
  classOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  classOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});