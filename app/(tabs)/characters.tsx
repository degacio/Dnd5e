import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Shield, User, Sword, Heart } from 'lucide-react-native';

export default function CharactersTab() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Shield size={28} color="#D4AF37" />
          <Text style={styles.title}>Personagens</Text>
        </View>
        <Text style={styles.subtitle}>
          Gerencie seus heróis
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.placeholderContainer}>
          <User size={64} color="#D4AF37" />
          <Text style={styles.placeholderTitle}>Em Desenvolvimento</Text>
          <Text style={styles.placeholderText}>
            Esta seção permitirá criar e gerenciar seus personagens de D&D.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Sword size={20} color="#666" />
              <Text style={styles.featureText}>Criação de personagens</Text>
            </View>
            <View style={styles.featureItem}>
              <Heart size={20} color="#666" />
              <Text style={styles.featureText}>Controle de vida e recursos</Text>
            </View>
            <View style={styles.featureItem}>
              <Shield size={20} color="#666" />
              <Text style={styles.featureText}>Equipamentos e inventário</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
});