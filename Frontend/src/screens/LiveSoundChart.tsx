import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useLiveStore } from '../store/useLiveStore'; // Point to new store

export const LiveSoundChart = () => {
  const readings = useLiveStore((state) => state.readings);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Decibel Monitor</Text>
      
      {readings.length > 0 ? (
        <LineChart
          data={readings}
          width={300}
          height={200}
          // Animations removed to fix clunkiness on 500ms intervals
          thickness={3}
          color="#007AFF"
          yAxisLabelSuffix=" dB"
          maxValue={120}
          noOfSections={6}
          hideRules
        />
      ) : (
        <Text style={styles.waitingText}>Aguardando dados do sensor...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'transparent',
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00D1FF',
  },
  waitingText: {
    color: '#888888',
    fontSize: 14,
  }
});