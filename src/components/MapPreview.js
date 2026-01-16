import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

const MapPreview = ({ points = [], height = 400 }) => {
  const mapRef = useRef(null);
  const [showAllPoints, setShowAllPoints] = useState(false);

  const initialPos = points.length
    ? {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 24.8607, // Default Karachi
        longitude: 67.0011,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  // 🧭 Move to user current location
  const moveToCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      err => console.warn('Location error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // 🚗 Auto-follow latest point
  useEffect(() => {
    if (points.length > 0) {
      const latest = points[points.length - 1];
      mapRef.current?.animateToRegion({
        latitude: latest.latitude,
        longitude: latest.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [points.length]);

  // 🟦 Generate circle dots
  const circles = showAllPoints
    ? points.map((p, i) => (
        <Circle
          key={`dot_${i}`}
          center={{ latitude: p.latitude, longitude: p.longitude }}
          radius={2}
          fillColor="rgba(226,221,221,0.9)"
          strokeColor="rgba(226,221,221,1)"
        />
      ))
    : null;

  // 📍 Markers
  const markers = [];
  if (points.length > 0) {
    markers.push(
      <Marker key="start" coordinate={points[0]} title="Start" pinColor="red" />
    );
    if (points.length > 1) {
      markers.push(
        <Marker
          key="end"
          coordinate={points[points.length - 1]}
          title="End"
          pinColor="blue"
        />
      );
    }
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialPos}
        showsUserLocation
        showsCompass
        toolbarEnabled={false}
        zoomControlEnabled={false}
        scrollEnabled
        rotateEnabled
        pitchEnabled
      >
        {points.length > 0 && (
          <Polyline coordinates={points} strokeColor="#007AFF" strokeWidth={5} />
        )}
        {markers}
        {circles}
      </MapView>

      {/* 🧭 Move to Current Location */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 15, right: 15 }]}
        onPress={moveToCurrentLocation}
      >
        <Text style={styles.iconText}>📍</Text>
      </TouchableOpacity>

      {/* 👁 Toggle All Points */}
      <TouchableOpacity
        style={[styles.fab, { top: 15, right: 15 }]}
        onPress={() => setShowAllPoints(!showAllPoints)}
      >
        <Text style={styles.iconText}>{showAllPoints ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 30,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});

export default MapPreview;