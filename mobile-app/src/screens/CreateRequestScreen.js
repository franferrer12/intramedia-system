import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { requestsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PRIORITIES = [
  { value: 'low', label: 'Baja', icon: 'arrow-down', color: '#6B7280' },
  { value: 'medium', label: 'Media', icon: 'remove', color: '#F59E0B' },
  { value: 'high', label: 'Alta', icon: 'arrow-up', color: '#EF4444' },
  { value: 'urgent', label: 'Urgente', icon: 'alert', color: '#DC2626' },
];

export default function CreateRequestScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    setLoading(true);

    try {
      await requestsAPI.create({
        dj_id: user.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'pending',
      });

      Alert.alert('Éxito', 'Solicitud creada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'No se pudo crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Title Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Necesito ayuda con producción"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.helperText}>{title.length}/100 caracteres</Text>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe tu solicitud en detalle..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.helperText}>{description.length}/500 caracteres</Text>
            </View>

            {/* Priority Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Prioridad</Text>
              <View style={styles.priorityContainer}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityButton,
                      priority === p.value && {
                        backgroundColor: p.color + '20',
                        borderColor: p.color,
                      },
                    ]}
                    onPress={() => setPriority(p.value)}
                  >
                    <Ionicons
                      name={p.icon}
                      size={20}
                      color={priority === p.value ? p.color : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        priority === p.value && { color: p.color, fontWeight: '600' },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Tu solicitud será revisada por el equipo de gestión. Recibirás una
                notificación cuando sea procesada.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 150,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
