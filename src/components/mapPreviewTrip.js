import React, { useState } from 'react';
import MapView, { Polyline, Marker, Circle } from 'react-native-maps';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

const MapPreviewTrip = ({ points = [], region }) => {
  const [showPoints, setShowPoints] = useState(false);

  const initialRegion = {
    latitude: points[0]?.latitude || 37.78825,
    longitude: points[0]?.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const togglePoints = () => setShowPoints(!showPoints);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region || initialRegion}
        region={region}
        showsUserLocation={true}
        provider="google"
      >
        {/* Route line */}
        {points.length > 1 && (
          <Polyline coordinates={points} strokeColor="#0a84ff" strokeWidth={4} />
        )}

        {/* Start/End markers */}
        {points.length > 0 && (
          <Marker coordinate={points[0]} title="Start" pinColor="green" />
        )}
        {points.length > 1 && (
          <Marker coordinate={points[points.length - 1]} title="End" pinColor="red" />
        )}

        {/* Small dots for all points */}
        {showPoints &&
          points.map((p, index) => (
            <Circle
              key={index}
              center={{ latitude: p.latitude, longitude: p.longitude }}
              radius={3} // small dot radius (in meters)
              fillColor="rgba(255, 255, 255, 0.9)" // blue dot
              strokeColor="transparent"
            />
          ))}
      </MapView>

      {/* Floating button (top-left corner) */}
      <TouchableOpacity style={styles.button} onPress={togglePoints}>
        <Text style={styles.buttonText}>
          {showPoints ? 'Hide Points' : 'Show Points'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  button: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(10,132,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

export default MapPreviewTrip;
