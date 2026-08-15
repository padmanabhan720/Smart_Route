import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { formatDistance, formatDuration } from '../services/routing';

// Shows each route option as a selectable card - distance, live-traffic
// duration, and how many active school/hospital zones it crosses. The
// user picks; nothing is auto-selected as "best."
export default function RouteOptionsPanel({ options, selectedId, onSelect }) {
  if (!options || options.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        const zoneCount = opt.activeZonesOnRoute?.length || 0;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onSelect(opt.id)}
          >
            {opt.label && (
              <Text style={styles.badge}>
                {opt.label === 'fastest_and_shortest'
                  ? 'FASTEST & SHORTEST'
                  : opt.label.toUpperCase()}
              </Text>
            )}
            <Text style={styles.duration}>{formatDuration(opt.durationSeconds)}</Text>
            <Text style={styles.distance}>{formatDistance(opt.distanceMeters)}</Text>
            {zoneCount > 0 ? (
              <Text style={styles.zoneWarning}>
                {zoneCount} active zone{zoneCount > 1 ? 's' : ''}
              </Text>
            ) : (
              <Text style={styles.zoneOk}>No active zones</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 16, left: 0, right: 0 },
  content: { paddingHorizontal: 12, gap: 10 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
    marginRight: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#2A6FDB' },
  badge: { fontSize: 10, fontWeight: '700', color: '#2A6FDB', marginBottom: 4 },
  duration: { fontSize: 18, fontWeight: '700' },
  distance: { fontSize: 13, color: '#555', marginTop: 2 },
  zoneWarning: { fontSize: 12, color: '#C24C00', marginTop: 6, fontWeight: '600' },
  zoneOk: { fontSize: 12, color: '#2E7D32', marginTop: 6 },
});
