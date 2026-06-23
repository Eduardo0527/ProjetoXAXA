import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, StatusBar, FlatList, 
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tipagem do Sensor
type Sensor = {
  id: string;
  name: string;
  room: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  battery: string;
};

export function SensorsScreen() {
  // Estado que armazena os sensores (agora começa vazio, sem mocks)
  const [sensors, setSensors] = useState<Sensor[]>([]);
  
  // Controle dos modais
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Estados do formulário do novo sensor
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#00E676';
      case 'WARNING': return '#FFA726';
      case 'OFFLINE': return '#FF4B4B';
      default: return '#888888';
    }
  };

  const handleAddSensor = () => {
    if (newName.trim() === '' || newRoom.trim() === '') return;

    const newSensor: Sensor = {
      id: Date.now().toString(), // Gera um ID único baseado na data
      name: newName,
      room: newRoom,
      status: 'ONLINE', // Por padrão, o novo sensor entra como online
      battery: '100%',  // Bateria cheia por padrão
    };

    setSensors((prev) => [...prev, newSensor]);
    setAddModalVisible(false);
    setNewName('');
    setNewRoom('');
  };

  const renderSensorCard = ({ item }: { item: Sensor }) => (
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
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={28} color="#00E676" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.iconButton}>
              <Ionicons name="information-circle-outline" size={28} color="#00D1FF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.description}>
          Acompanhe o status físico e a bateria dos módulos captadores espalhados pelo ambiente.
        </Text>
      </View>

      <FlatList
        data={sensors}
        keyExtractor={item => item.id}
        renderItem={renderSensorCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-outline" size={48} color="#222" />
            <Text style={styles.emptyText}>Nenhum sensor cadastrado.</Text>
            <Text style={styles.emptySubText}>Clique no botão + para adicionar.</Text>
          </View>
        }
      />

      {/* MODAL DE ADICIONAR SENSOR */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="add-circle" size={24} color="#00E676" />
              <Text style={styles.modalTitle}>Adicionar Sensor</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Módulo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Mic Janela Principal"
                placeholderTextColor="#666"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ambiente / Localização</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Sala de Máquinas"
                placeholderTextColor="#666"
                value={newRoom}
                onChangeText={setNewRoom}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.addButton]} 
                onPress={handleAddSensor}
              >
                <Text style={styles.addButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE LEGENDA DE STATUS (MANTIDO) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
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
              onPress={() => setInfoModalVisible(false)}
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
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { padding: 4 },
  
  title: { color: '#00D1FF', fontSize: 28, fontWeight: 'bold' },
  description: { color: '#888888', fontSize: 14, lineHeight: 20 },
  
  row: { justifyContent: 'space-between', marginBottom: 16 },
  
  // Lista Vazia
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyText: { color: '#888888', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubText: { color: '#555555', fontSize: 14, marginTop: 8, textAlign: 'center' },

  // Card do Sensor
  sensorCard: { backgroundColor: '#121212', borderRadius: 20, padding: 16, width: '48%', borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconContainer: { backgroundColor: '#002B36', padding: 10, borderRadius: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  sensorName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  sensorRoom: { color: '#888888', fontSize: 13, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: '#888888', fontSize: 10, fontWeight: 'bold' },

  // Modais Compartilhados
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Modal de Formulário
  inputContainer: { marginBottom: 16 },
  inputLabel: { color: '#888888', fontSize: 14, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#000000', borderWidth: 1, borderColor: '#333', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 16, height: 50, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionButton: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#333' },
  cancelButtonText: { color: '#888888', fontSize: 16, fontWeight: 'bold' },
  addButton: { backgroundColor: '#00E676' },
  addButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },

  // Modal de Legenda (Mantido)
  modalLegendItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 16 },
  modalDot: { width: 14, height: 14, borderRadius: 7, marginTop: 2 },
  modalLegendTextContainer: { flex: 1 },
  modalLegendTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  modalLegendDesc: { color: '#888888', fontSize: 14, lineHeight: 20 },
  closeButton: { backgroundColor: '#002B36', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: '#00D1FF', fontSize: 16, fontWeight: 'bold' },
});