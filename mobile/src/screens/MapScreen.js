import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

import { getRouteOptions } from '../services/routing';
import RouteOptionsPanel from '../components/RouteOptionsPanel';
import AlertBanner from '../components/AlertBanner';

// Route colors by selection state, so all options are visible on the
// map at once and the chosen one stands out.
const SELECTED_COLOR = '#2A6FDB';
const UNSELECTED_COLOR = '#B7C6DE';

export default function MapScreen() {
  const mapRef = useRef(null);
  const [origin, setOrigin] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission required', 'MapNav needs location access to route.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setOrigin({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // Call this with a destination once you wire up search/geocoding.
  async function planRoute(dest) {
    if (!origin) return;
    setLoading(true);
    try {
      const routeOptions = await getRouteOptions(origin, dest);
      setOptions(routeOptions);
      setSelectedId(routeOptions[0]?.id ?? null);

      const allCoords = routeOptions.flatMap((o) => o.coordinates);
      mapRef.current?.fitToCoordinates(allCoords, {
        edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
      });
    } catch (err) {
      Alert.alert('Route error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedOption = options.find((o) => o.id === selectedId);
  const activeZones = selectedOption?.activeZonesOnRoute || [];

  if (!origin) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {/* Draw unselected routes first, selected route last so it renders on top */}
        {options
          .filter((o) => o.id !== selectedId)
          .map((o) => (
            <Polyline key={o.id} coordinates={o.coordinates} strokeWidth={3} strokeColor={UNSELECTED_COLOR} />
          ))}
        {selectedOption && (
          <Polyline coordinates={selectedOption.coordinates} strokeWidth={5} strokeColor={SELECTED_COLOR} />
        )}

        {activeZones.map((zone) => (
          <Circle
            key={zone.id}
            center={{ latitude: zone.latitude, longitude: zone.longitude }}
            radius={zone.radiusMeters}
            strokeColor={zone.type === 'school' ? '#FFB800' : '#E53935'}
            fillColor={zone.type === 'school' ? 'rgba(255,184,0,0.2)' : 'rgba(229,57,53,0.15)'}
          />
        ))}
      </MapView>

      {activeZones.length > 0 && (
        <AlertBanner
          message={`Selected route crosses ${activeZones.length} active school/hospital zone(s) - beacons likely flashing`}
        />
      )}

      <RouteOptionsPanel options={options} selectedId={selectedId} onSelect={setSelectedId} />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
