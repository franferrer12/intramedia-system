import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function EventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getByDJ(user.id);
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, []);

  const getEventStatus = (fecha, hora_inicio) => {
    const eventDateTime = new Date(`${fecha}T${hora_inicio || '00:00'}`);
    const now = new Date();

    if (eventDateTime < now) {
      return { label: 'Finalizado', color: '#6B7280', icon: 'checkmark-circle' };
    } else if (eventDateTime - now < 24 * 60 * 60 * 1000) {
      return { label: 'Próximo', color: '#F59E0B', icon: 'alert-circle' };
    } else {
      return { label: 'Programado', color: '#3B82F6', icon: 'calendar' };
    }
  };

  const renderEvent = ({ item }) => {
    const status = getEventStatus(item.fecha, item.hora_inicio);

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Venue/Place */}
        {item.local && (
          <View style={styles.venueContainer}>
            <Ionicons name="location" size={20} color="#EF4444" />
            <Text style={styles.venueName}>{item.local}</Text>
          </View>
        )}

        {/* Date and Time */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.dateTimeText}>
              {new Date(item.fecha).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {item.hora_inicio && (
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {item.hora_inicio}
                {item.hora_fin && ` - ${item.hora_fin}`}
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        {item.precio_por_dj && (
          <View style={styles.priceContainer}>
            <Ionicons name="cash-outline" size={18} color="#10B981" />
            <Text style={styles.priceText}>
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
              }).format(item.precio_por_dj)}
            </Text>
          </View>
        )}

        {/* Notes */}
        {item.notas && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notas}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Eventos</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{events.length}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No tienes eventos programados</Text>
            <Text style={styles.emptySubtext}>
              Los eventos asignados aparecerán aquí
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dateTimeContainer: {
    marginBottom: 12,
    gap: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
