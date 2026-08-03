import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://YOUR_LOCAL_IP:8080/api/routes/optimize';

export default function App() {
  const [location, setLocation] = useState(null);
  const [priority, setPriority] = useState('MONEY');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to optimize routes.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  const fetchOptimizedRoutes = async () => {
    if (!location) return;
    setLoading(true);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originLat: location.latitude,
          originLng: location.longitude,
          destLat: location.latitude + 0.05,
          destLng: location.longitude + 0.05,
          priority: priority,
          vehicleMpg: 25.0,
          gasPricePerGallon: 3.65
        })
      });

      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      Alert.alert('Connection Error', 'Could not reach backend optimization service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Start Point"
          />
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Fetching GPS location...</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <Text style={styles.header}>Optimization Strategy</Text>
        <View style={styles.priorityGroup}>
          {['MONEY', 'MILES', 'TIME', 'BALANCED'].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, priority === p && styles.activeChip]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.chipText, priority === p && styles.activeChipText]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.calcButton} onPress={fetchOptimizedRoutes}>
          <Text style={styles.calcButtonText}>Calculate Routes</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator style={{ marginTop: 15 }} color="#007AFF" />}

        <ScrollView style={styles.resultsList}>
          {routes.map((route, idx) => (
            <View
              key={idx}
              style={[styles.routeCard, route.isRecommended && styles.recommendedCard]}
            >
              {route.isRecommended && <Text style={styles.badge}>BEST MATCH</Text>}
              <Text style={styles.routeTitle}>{route.summary}</Text>
              <Text style={styles.routeSub}>
                Distance: {route.distanceMiles} mi | Duration: {route.durationMinutes} mins
              </Text>
              <Text style={styles.routeCost}>
                Fuel: ${route.fuelCost.toFixed(2)} | Tolls: ${route.tollCost.toFixed(2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#1C1C1E' },
  priorityGroup: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  activeChip: { backgroundColor: '#007AFF' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#3A3A3C' },
  activeChipText: { color: '#FFFFFF' },
  calcButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  calcButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  resultsList: { marginTop: 15 },
  routeCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  recommendedCard: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  badge: {
    color: '#34C759',
    fontWeight: '800',
    fontSize: 10,
    marginBottom: 4,
  },
  routeTitle: { fontWeight: '700', fontSize: 14 },
  routeSub: { fontSize: 12, color: '#6C6C70', marginTop: 2 },
  routeCost: { fontSize: 12, fontWeight: '600', color: '#1C1C1E', marginTop: 4 },
});
