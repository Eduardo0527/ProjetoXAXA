import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SENSORS_DATA = [
  { id: '1', name: 'Mic Principal', room: 'Sala de Estar', status: 'ONLINE', battery: '98%' },
  { id: '2', name: 'Mic Janela', room: 'Quarto 1', status: 'ONLINE', battery: '75%' },
  { id: '3', name: 'Sensor Externo', room: 'Varanda', status: 'OFFLINE', battery: '0%' },
  { id: '4', name: 'Mic Cozinha', room: 'Cozinha', status: 'WARNING', battery: '15%' },
];

export function SensorsScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#00E676';
      case 'WARNING': return '#FFA726';
      case 'OFFLINE': return '#FF4B4B';
      default: return '#888888';
    }
  };

  const renderSensorCard = ({ item }: { item: typeof SENSORS_DATA[0] }) => (
    <View style={styles.sensorCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic-outline" size={24} color="#00D1FF" />
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
      <Text style={styles.sensorName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.sensorRoom}>{item.room}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name={item.battery === '0%' ? 'battery-dead' : 'battery-half'} size={14} color={item.status === 'WARNING' ? '#FFA726' : '#888'} />
          <Text style={styles.footerText}>{item.battery}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name={item.status === 'OFFLINE' ? 'wifi-outline' : 'wifi'} size={14} color={item.status === 'OFFLINE' ? '#FF4B4B' : '#888'} />
          <Text style={styles.footerText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Rede Radxa</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={28} color="#00D1FF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>
          Acompanhe o status físico e a bateria dos módulos captadores espalhados pelo ambiente.
        </Text>
      </View>

      <FlatList
        data={SENSORS_DATA}
        keyExtractor={item => item.id}
        renderItem={renderSensorCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.modalTitle}>Legenda de Status</Text>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#00E676' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>ONLINE</Text>
                <Text style={styles.modalLegendDesc}>Conectado e operando normalmente.</Text>
              </View>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#FFA726' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>WARNING</Text>
                <Text style={styles.modalLegendDesc}>Atenção necessária (ex: bateria baixa ou sinal fraco).</Text>
              </View>
            </View>

            <View style={styles.modalLegendItem}>
              <View style={[styles.modalDot, { backgroundColor: '#FF4B4B' }]} />
              <View style={styles.modalLegendTextContainer}>
                <Text style={styles.modalLegendTitle}>OFFLINE</Text>
                <Text style={styles.modalLegendDesc}>Desconectado da rede ou sem bateria.</Text>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 110 },
  header: { marginBottom: 24 },

  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  infoButton: { padding: 4 },
  
  title: { color: '#00D1FF', fontSize: 28, fontWeight: 'bold' },
  description: { color: '#888888', fontSize: 14, lineHeight: 20 },
  
  row: { justifyContent: 'space-between', marginBottom: 16 },
  sensorCard: { backgroundColor: '#121212', borderRadius: 20, padding: 16, width: '48%', borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconContainer: { backgroundColor: '#002B36', padding: 10, borderRadius: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  sensorName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  sensorRoom: { color: '#888888', fontSize: 13, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: '#888888', fontSize: 10, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  modalTitle: {
    color: '#00D1FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalLegendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  modalDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
  },
  modalLegendTextContainer: {
    flex: 1,
  },
  modalLegendTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalLegendDesc: {
    color: '#888888',
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#002B36',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#00D1FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});