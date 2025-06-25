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
import { Search, ChevronDown, ChevronRight, BookOpen, Filter, X } from 'lucide-react-native';

interface SpellListProps {
  spells: Spell[];
}

interface SchoolGroup {
  school: string;
  spells: Spell[];
  count: number;
  expanded: boolean;
}

export function SpellList({ spells }: SpellListProps) {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());

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

  const filteredSpells = useMemo(() => {
    return spells.filter((spell) => {
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
  }, [spells, searchText, selectedClass]);

  const schoolGroups = useMemo(() => {
    const groups: Record<string, Spell[]> = {};
    
    filteredSpells.forEach((spell) => {
      if (!groups[spell.school]) {
        groups[spell.school] = [];
      }
      groups[spell.school].push(spell);
    });

    // Convert to array and sort schools alphabetically
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((school) => ({
        school,
        spells: groups[school].sort((a, b) => a.name.localeCompare(b.name)),
        count: groups[school].length,
        expanded: expandedSchools.has(school),
      }));
  }, [filteredSpells, expandedSchools]);

  const toggleSchool = (school: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(school)) {
      newExpanded.delete(school);
    } else {
      newExpanded.add(school);
    }
    setExpandedSchools(newExpanded);
  };

  const selectClass = (className: string | null) => {
    setSelectedClass(className);
    setShowClassFilter(false);
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const totalSpells = filteredSpells.length;

  // Debug information
  console.log('Total spells:', spells.length);
  console.log('Available classes:', availableClasses);
  console.log('Selected class:', selectedClass);
  console.log('Filtered spells count:', filteredSpells.length);
  
  if (selectedClass) {
    const spellsForClass = spells.filter(spell => 
      spell.classes && Array.isArray(spell.classes) && 
      spell.classes.some(className => 
        className && className.trim().toLowerCase() === selectedClass.toLowerCase()
      )
    );
    console.log(`Spells for class "${selectedClass}":`, spellsForClass.length);
  }

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
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <X size={18} color="#999" />
            </TouchableOpacity>
          )}
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
            <ChevronDown size={16} color="#666" />
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

        {/* Debug info - remove in production */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: {spells.length} total, {availableClasses.length} classes
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={schoolGroups}
        keyExtractor={(item) => item.school}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.schoolContainer}>
            <TouchableOpacity
              style={[
                styles.schoolHeader,
                { backgroundColor: SchoolColors[item.school as keyof typeof SchoolColors] },
              ]}
              onPress={() => toggleSchool(item.school)}
              activeOpacity={0.8}
            >
              <View style={styles.schoolHeaderContent}>
                <View style={styles.schoolTitleContainer}>
                  {item.expanded ? (
                    <ChevronDown size={22} color="#FFFFFF" />
                  ) : (
                    <ChevronRight size={22} color="#FFFFFF" />
                  )}
                  <Text style={styles.schoolTitle}>
                    Escola de {item.school}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.count}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {item.expanded && (
              <View style={styles.spellsContainer}>
                {item.spells.map((spell) => (
                  <SpellCard
                    key={spell.id}
                    spell={spell}
                    onPress={() => setSelectedSpell(spell)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
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
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
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
  debugContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  schoolContainer: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  schoolHeader: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellsContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
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