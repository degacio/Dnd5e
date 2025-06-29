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

// Helper functions moved outside the component to avoid initialization issues
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
    // First filter spells
    const filtered = spells.filter((spell) => {
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

    // Then sort by level first, then alphabetically by name
    return filtered.sort((a, b) => {
      // First sort by level (0-9)
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [spells, searchText, selectedClass]);

  const selectClass = (className: string | null) => {
    setSelectedClass(className);
    setShowClassFilter(false);
  };

  const totalSpells = filteredAndSortedSpells.length;

  const renderSpellItem = ({ item }: { item: Spell }) => (
    <TouchableOpacity
      style={styles.spellItem}
      onPress={() => setSelectedSpell(item)}
      activeOpacity={0.8}
    >
      <View style={styles.spellHeader}>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
          <Text style={styles.levelText}>
            {item.level === 0 ? 'T' : item.level.toString()}
          </Text>
        </View>
        
        <View style={styles.spellContent}>
          <View style={styles.spellTitleRow}>
            <Text style={styles.spellName}>{item.name}</Text>
            <View style={[styles.schoolBadge, { backgroundColor: SchoolColors[item.school as keyof typeof SchoolColors] }]}>
              <Text style={styles.schoolText}>{item.school}</Text>
            </View>
          </View>
          
          <View style={styles.spellMetaRow}>
            <Text style={styles.levelName}>{getLevelName(item.level)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.spellDetails}>{item.castingTime}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.spellDetails}>{item.range}</Text>
          </View>
          
          <Text style={styles.classesText} numberOfLines={1}>
            {item.classes.join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#666" />
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
            <Filter size={14} color="#666" />
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
              <X size={12} color="#E74C3C" />
            </TouchableOpacity>
          )}

          <View style={styles.totalCountContainer}>
            <BookOpen size={14} color="#D4AF37" />
            <Text style={styles.totalCount}>{totalSpells}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredAndSortedSpells}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderSpellItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
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
                <X size={18} color="#666" />
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
                Todas as Classes ({spells.length})
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
                      {item} ({spellCount})
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
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    flex: 1,
    gap: 6,
  },
  classFilterText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  clearFilterButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  totalCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  totalCount: {
    fontSize: 12,
    color: '#B8941F',
    fontWeight: '600',
  },
  listContent: {
    padding: 8,
    paddingBottom: 16,
  },
  spellItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  itemSeparator: {
    height: 6,
  },
  spellHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  levelBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellContent: {
    flex: 1,
  },
  spellTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  spellName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  schoolBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  schoolText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spellMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  levelName: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  separator: {
    fontSize: 10,
    color: '#999',
  },
  spellDetails: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  classesText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    fontStyle: 'italic',
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
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 350,
    maxHeight: '70%',
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  classOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 1,
  },
  classOptionSelected: {
    backgroundColor: '#D4AF37',
  },
  classOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  classOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});