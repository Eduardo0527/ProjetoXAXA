import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppStore } from '../store/useAppStore';

export const LiveSoundChart = () => {
  // Assuming your store keeps an array of reading objects: { value: number }
  const readings = useAppStore((state) => state.readings);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Decibel Monitor</Text>
      
      {readings.length > 0 ? (
        <LineChart
          data={readings}
          width={300}
          height={200}
          isAnimated
          animateOnDataChange
          animationDuration={300}
          thickness={3}
          color="#007AFF"
          yAxisLabelSuffix=" dB"
          maxValue={120} // Standard max for decibels
          noOfSections={6}
          hideRules
        />
      ) : (
        <Text>Aguardando dados do sensor...</Text>
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
  }
});