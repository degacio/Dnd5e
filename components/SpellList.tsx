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
import { Search, ChevronDown, ChevronRight } from 'lucide-react-native';

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
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());

  const filteredSpells = useMemo(() => {
    return spells.filter((spell) => {
      const matchesSearch = spell.name.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [spells, searchText]);

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

  const totalSpells = filteredSpells.length;

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
        <Text style={styles.totalCount}>
          Total: {totalSpells} magias
        </Text>
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
                    <ChevronDown size={20} color="#FFFFFF" />
                  ) : (
                    <ChevronRight size={20} color="#FFFFFF" />
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
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  totalCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  schoolContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  schoolHeader: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spellsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});