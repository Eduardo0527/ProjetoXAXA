import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, Animated } from 'react-native';
import { useAppStore, Alert } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const getSeverityDetails = () => {
    switch (severity) {
      case 'HIGH': return { bg: '#420B0B', text: '#FF4B4B', label: 'ALTO' };
      case 'MEDIUM': return { bg: '#432C0B', text: '#FFA726', label: 'MÉDIO' };
      default: return { bg: '#002B36', text: '#00D1FF', label: 'BAIXO' };
    }
  };
  const details = getSeverityDetails();
  
  return (
    <View style={[styles.badge, { backgroundColor: details.bg }]}>
      <Text style={[styles.badgeText, { color: details.text }]}>{details.label}</Text>
    </View>
  );
};

export const HomeScreen = () => {
  const alerts = useAppStore((state) => state.alerts);
  const latestAlert = alerts[0];
  const recentAlerts = alerts.slice(1, 4);

  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const isResolved = latestAlert && latestAlert.id === resolvedId;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: false })
      ])
    );

    if (latestAlert && !isResolved) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(0);
    }

    return () => pulse.stop();
  }, [latestAlert, isResolved]);

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#222222', '#FF4B4B']
  });

  const animatedBackgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#121212', '#2A0808']
  });

  const renderRecentItem = ({ item }: { item: Alert }) => (
    <View style={styles.recentCard}>
      <View style={styles.iconCircle}>
        <Ionicons name="pulse-outline" size={20} color="#00D1FF" />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle}>{item.db} dB</Text>
        <Text style={styles.recentSubtitle}>{item.room}</Text>
      </View>
      <Text style={styles.recentTime}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Text style={styles.headerTitle}>Último Alerta</Text>
      
      {latestAlert && (
        <Animated.View style={[
          styles.mainCard, 
          { 
            borderColor: animatedBorderColor,
            backgroundColor: animatedBackgroundColor,
            shadowColor: isResolved ? '#00D1FF' : '#FF4B4B',
          }
        ]}>
          <View style={[styles.mainIconContainer, !isResolved && { backgroundColor: '#420B0B' }]}>
            <Ionicons name="warning" size={28} color={isResolved ? "#00D1FF" : "#FF4B4B"} />
          </View>
          
          <View style={styles.hzContainer}>
            <Text style={styles.mainValue}>{latestAlert.db}</Text>
            <Text style={styles.mainUnit}>dB</Text>
          </View>
          
          
          <SeverityBadge severity={latestAlert.severity} />
          
          <View style={styles.locationTimeContainer}>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={16} color="#888" />
              <Text style={styles.subText}>{latestAlert.room}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.subText}>{latestAlert.time}</Text>
            </View>
          </View>

          {!isResolved ? (
            <TouchableOpacity 
              style={styles.resolveButton} 
              activeOpacity={0.8}
              onPress={() => setResolvedId(latestAlert.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.resolveButtonText}>Marcar como Resolvido</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-done" size={16} color="#00E676" />
              <Text style={styles.resolvedText}>Alerta Resolvido</Text>
            </View>
          )}

        </Animated.View>
      )}

      <Text style={[styles.headerTitle, { marginTop: 24 }]}>Detecções Recentes</Text>
      
      <FlatList
        data={recentAlerts}
        keyExtractor={(item) => item.id}
        renderItem={renderRecentItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 110 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#00D1FF', marginBottom: 16 },
  
  mainCard: {
    borderWidth: 2, 
    borderRadius: 24, 
    padding: 24,
    alignItems: 'center', 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 5
  },
  mainIconContainer: { backgroundColor: '#002B36', padding: 12, borderRadius: 50, marginBottom: 8 },
  hzContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  mainValue: { color: '#FFFFFF', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  mainUnit: { color: '#888888', fontSize: 24, fontWeight: '500', marginLeft: 8 },
  mainDb: { fontSize: 16, color: '#AAAAAA', marginTop: 4, marginBottom: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  badgeText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  
  locationTimeContainer: { 
    flexDirection: 'row', gap: 16, alignItems: 'center', borderTopWidth: 1, 
    borderTopColor: '#333', paddingTop: 16, width: '100%', justifyContent: 'center' 
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subText: { fontSize: 14, color: '#888888', fontWeight: '500' },

  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4B4B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
    width: '100%',
    justifyContent: 'center'
  },
  resolveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)'
  },
  resolvedText: { color: '#00E676', fontSize: 14, fontWeight: 'bold' },

  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#002B36', justifyContent: 'center', alignItems: 'center' },
  recentInfo: { flex: 1, marginLeft: 12 },
  recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  recentSubtitle: { fontSize: 13, color: '#888888', marginTop: 4 },
  recentTime: { fontSize: 14, fontWeight: 'bold', color: '#00D1FF' }
});