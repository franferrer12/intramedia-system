import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { djAPI } from '../services/api';

export default function ProfileScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await djAPI.getStats(user.id);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user.nombre}</Text>
          {user.artistic_name && (
            <Text style={styles.artisticName}>"{user.artistic_name}"</Text>
          )}
          {user.email && (
            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={14} color="#6B7280" />
              <Text style={styles.email}>{user.email}</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : stats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{stats.total_eventos || 0}</Text>
              <Text style={styles.statLabel}>Eventos</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{stats.total_requests || 0}</Text>
              <Text style={styles.statLabel}>Solicitudes</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#10B981" />
              <Text style={styles.statValue}>
                {stats.total_earnings
                  ? new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      notation: 'compact',
                    }).format(stats.total_earnings)
                  : '€0'}
              </Text>
              <Text style={styles.statLabel}>Ingresos</Text>
            </View>
          </View>
        ) : null}

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>

          {user.telefono && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{user.telefono}</Text>
            </View>
          )}

          {user.instagram && (
            <View style={styles.infoRow}>
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
              <Text style={styles.infoText}>@{user.instagram}</Text>
            </View>
          )}

          {user.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Availability */}
        {user.availability && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Disponibilidad</Text>
            <View style={styles.availabilityContainer}>
              <Ionicons
                name={user.availability === 'disponible' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={user.availability === 'disponible' ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.availabilityText,
                  {
                    color: user.availability === 'disponible' ? '#10B981' : '#EF4444',
                  },
                ]}
              >
                {user.availability === 'disponible' ? 'Disponible' : 'No Disponible'}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>Configuración</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>Ayuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>Acerca de</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Versión 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  artisticName: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionsSection: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
