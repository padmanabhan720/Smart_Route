import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AlertBanner({ message }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFB800',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  text: { color: '#7A5B00', fontWeight: '600', textAlign: 'center' },
});
