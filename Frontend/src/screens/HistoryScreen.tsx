import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { useAppStore, Alert } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export const HistoryScreen = () => {
  const alerts = useAppStore((state) => state.alerts);
  const [modalVisible, setModalVisible] = useState(false);

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'HIGH': return { bg: '#420B0B', text: '#FF4B4B', label: 'ALTO' };
      case 'MEDIUM': return { bg: '#432C0B', text: '#FFA726', label: 'MÉDIO' };
      default: return { bg: '#002B36', text: '#00D1FF', label: 'BAIXO' };
    }
  };

  const renderItem = ({ item }: { item: Alert }) => {
    const colors = getSeverityColors(item.severity);
    
    return (
      <View style={styles.historyCard}>
        <View style={[styles.severityIndicator, { backgroundColor: colors.text }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.roomText}>{item.room}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          
          <View style={styles.metricsRow}>
            <Text style={styles.metricText}>{item.db} dB</Text>
          </View>
          
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{colors.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Histórico</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={28} color="#00D1FF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>
          Registro de todas as anomalias sonoras detectadas pela rede de sensores.
        </Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listPadding}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle" size={24} color="#00D1FF" />
              <Text style={styles.modalTitle}>Níveis de Alerta</Text>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#FF4B4B' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>ALTO (Crítico)</Text>
                <Text style={styles.modalLegendDesc}>Padrão sonoro indica falha grave ou vazamento iminente. Requer manutenção imediata.</Text>
              </View>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#FFA726' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>MÉDIO (Atenção)</Text>
                <Text style={styles.modalLegendDesc}>Ruído acima do normal ou oscilação de frequência. Agendar inspeção preventiva.</Text>
              </View>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#00D1FF' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>BAIXO (Rotina)</Text>
                <Text style={styles.modalLegendDesc}>Registro de anomalia leve que retornou rapidamente ao padrão normal.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 110 },
  header: { marginBottom: 24 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  infoButton: { padding: 4 },
  title: { color: '#00D1FF', fontSize: 28, fontWeight: 'bold' },
  description: { color: '#888888', fontSize: 14, lineHeight: 20 },
  listPadding: { paddingBottom: 20 },
  
  historyCard: { flexDirection: 'row', backgroundColor: '#121212', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  severityIndicator: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roomText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  timeText: { color: '#888888', fontSize: 12, fontWeight: '500' },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricText: { color: '#AAAAAA', fontSize: 14, fontWeight: '600' },
  metricDivider: { color: '#444', marginHorizontal: 8, fontSize: 14 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#121212', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  modalTitle: { color: '#00D1FF', fontSize: 20, fontWeight: 'bold' },
  modalLegendItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 16 },
  modalDot: { width: 14, height: 14, borderRadius: 7, marginTop: 2 },
  modalLegendTextContainer: { flex: 1 },
  modalLegendTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  modalLegendDesc: { color: '#888888', fontSize: 14, lineHeight: 20 },
  closeButton: { backgroundColor: '#002B36', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: '#00D1FF', fontSize: 16, fontWeight: 'bold' },
});