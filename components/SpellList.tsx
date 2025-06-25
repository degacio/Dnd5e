import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Spell, School, SchoolColors } from '@/types/spell';
import { SpellCard } from './SpellCard';
import { SpellDetailModal } from './SpellDetailModal';
import { Search, Filter, X } from 'lucide-react-native';

interface SpellListProps {
  spells: Spell[];
}

export function SpellList({ spells }: SpellListProps) {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const filteredSpells = useMemo(() => {
    return spells.filter((spell) => {
      const matchesSearch = spell.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesSchool = !selectedSchool || spell.school === selectedSchool;
      const matchesLevel = selectedLevel === null || spell.level === selectedLevel;
      
      return matchesSearch && matchesSchool && matchesLevel;
    });
  }, [spells, searchText, selectedSchool, selectedLevel]);

  const groupedSpells = useMemo(() => {
    const groups: Record<string, Spell[]> = {};
    
    filteredSpells.forEach((spell) => {
      const key = `${spell.school} - Nível ${spell.level}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(spell);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        const [schoolA, levelA] = a.split(' - Nível ');
        const [schoolB, levelB] = b.split(' - Nível ');
        
        if (schoolA !== schoolB) {
          return schoolA.localeCompare(schoolB);
        }
        return parseInt(levelA) - parseInt(levelB);
      })
      .map((key) => ({
        title: key,
        data: groups[key].sort((a, b) => a.name.localeCompare(b.name)),
        school: groups[key][0].school,
      }));
  }, [filteredSpells]);

  const schools = Object.values(School);
  const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const clearFilters = () => {
    setSearchText('');
    setSelectedSchool(null);
    setSelectedLevel(null);
  };

  const hasActiveFilters = searchText || selectedSchool || selectedLevel !== null;

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
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={18} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>Filtros:</Text>
            {hasActiveFilters && (
              <TouchableOpacity 
                style={styles.clearFiltersButton} 
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterSubLabel}>Escola:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  !selectedSchool && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedSchool(null)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    !selectedSchool && styles.filterButtonTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school}
                  style={[
                    styles.filterButton,
                    selectedSchool === school && styles.filterButtonActive,
                    selectedSchool === school && {
                      backgroundColor: SchoolColors[school],
                    },
                  ]}
                  onPress={() =>
                    setSelectedSchool(selectedSchool === school ? null : school)
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedSchool === school && styles.filterButtonTextActive,
                    ]}
                  >
                    {school}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterSubLabel}>Nível:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedLevel === null && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedLevel(null)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedLevel === null && styles.filterButtonTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {levels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterButton,
                    selectedLevel === level && styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setSelectedLevel(selectedLevel === level ? null : level)
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedLevel === level && styles.filterButtonTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {filteredSpells.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>Nenhuma magia encontrada</Text>
          <Text style={styles.noResultsSubText}>Tente ajustar seus filtros de busca</Text>
        </View>
      ) : (
        <FlatList
          data={groupedSpells}
          keyExtractor={(item) => item.title}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.groupContainer}>
              <View
                style={[
                  styles.groupHeader,
                  { backgroundColor: SchoolColors[item.school as keyof typeof SchoolColors] },
                ]}
              >
                <Text style={styles.groupTitle}>{item.title}</Text>
                <Text style={styles.groupCount}>{item.data.length} magias</Text>
              </View>
              {item.data.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  onPress={() => setSelectedSpell(spell)}
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

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
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearFiltersButton: {
    padding: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#3498DB',
    fontWeight: '500',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  filterButtonActive: {
    backgroundColor: '#2C3E50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 20,
  },
  groupContainer: {
    marginTop: 16,
  },
  groupHeader: {
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});