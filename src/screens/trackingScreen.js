import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import TripTempStorage, { TripPoint } from '../services/TripTempStorage';
import LocationService from '../services/LocationService';
import BackgroundLocationRepository from '../services/BackgroundLocationRepository';
import MapPreview from '../components/MapPreview';
import TripDatabase from '../database/TripDatabase';

export default function TrackingScreen({ navigation }) {
  const [points, setPoints] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isBackground, setIsBackground] = useState(false);
  const [tripExists, setTripExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TripDatabase.init();
    // subscribe to services
    LocationService.addListener(onNewPoint);
    BackgroundLocationRepository.addListener(onNewPoint);

    restoreTripState();
    const interval = setInterval(syncRunningState, 1000);
    return () => {
      LocationService.removeListener(onNewPoint);
      BackgroundLocationRepository.removeListener(onNewPoint);
      clearInterval(interval);
    };
  }, []);

  async function syncRunningState() {
    try {
      const bgRunning = BackgroundLocationRepository.isRunning;
      const fgRunning = LocationService.isTracking;
      const hasData = await TripTempStorage.hasData();
      setIsBackground(bgRunning);
      setIsTracking(bgRunning || fgRunning);
      setTripExists(hasData);
    } catch (e) {}
  }

  async function restoreTripState() {
    setLoading(true);
    const hasData = await TripTempStorage.hasData();
    if (!hasData) { setLoading(false); return; }
    const saved = await TripTempStorage.getPoints();
    setPoints(saved.map(p => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp, accuracy: p.accuracy, speed: p.speed })));
    setTripExists(true);
    setLoading(false);

    const wasBg = await TripTempStorage.wasBackgroundTrackingActive();
    if (wasBg) {
      await BackgroundLocationRepository.start();
      setIsTracking(true);
      setIsBackground(true);
    } else {
      setIsTracking(false);
      setIsBackground(false);
    }
  }

  async function onNewPoint(point) {
    // read storage and append latest point if new
    const all = await TripTempStorage.getPoints();
    if (all.length === 0) return;
    const last = all[all.length - 1];
    if (points.length === 0 || last.lat !== points[points.length - 1].lat || last.lng !== points[points.length - 1].lng) {
      setPoints(prev => [...prev, { lat: last.lat, lng: last.lng, timestamp: last.timestamp, accuracy: last.accuracy, speed: last.speed }]);
      setTripExists(true);
    }
  }

  async function start() {
    // check permission: if user gave Always, start BG otherwise FG
    // For brevity: attempt to start background first
    await TripTempStorage.setTripActive(true);
    // try BG
    await BackgroundLocationRepository.start();
    await TripTempStorage.saveBackgroundTrackingState(true);
    await syncRunningState();
    setIsTracking(true);
    setIsBackground(true);
    setTripExists(true);
  }

  async function pause() {
    await LocationService.stopTracking();
    await BackgroundLocationRepository.stop();
    await TripTempStorage.setTripActive(false);
    await syncRunningState();
    setIsTracking(false);
  }

  async function resume() {
    // attempt background resume, fallback to foreground
    const wasBgAllowed = await TripTempStorage.wasBackgroundTrackingActive();
    if (wasBgAllowed) {
      await BackgroundLocationRepository.start();
      setIsBackground(true);
      setIsTracking(true);
    } else {
      await LocationService.startTracking();
      setIsBackground(false);
      setIsTracking(true);
    }
  }

  async function stop() {
    Alert.alert('Saving trip', 'Saving trip to database...', [{ text: 'OK' }], { cancelable: false });
    await LocationService.stopTracking();
    await BackgroundLocationRepository.stop();
    await TripTempStorage.clearBackgroundTrackingState();

    if (points.length > 0) {
      await TripDatabase.insertTripPointsWithMeta(points);
    }
    await TripTempStorage.clear();
    setPoints([]);
    setIsTracking(false);
    setIsBackground(false);
    setTripExists(false);
    navigation.navigate('Trips'); // adjust your route
  }

  const lastThree = points.length <= 3 ? [...points].reverse() : [...points.slice(-3)].reverse();

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={{ padding: 16 }}>
      <MapPreview points={points} height={360} />
      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16 }}>
        {isTracking ? (isBackground ? '🛰 Background Tracking ON' : '📱 Foreground Tracking ON') : (tripExists ? '⏸ Tracking Paused' : 'Tracking OFF')}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 16 }}>
        <Button title="Start" onPress={start} disabled={isTracking || tripExists} />
        <Button title="Resume" onPress={resume} disabled={isTracking || !tripExists} />
        <Button title="Pause" onPress={pause} disabled={!isTracking} />
        <Button title="Stop" onPress={stop} disabled={!tripExists} />
      </View>

      {tripExists && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700' }}>📍 Points tracked: {points.length}</Text>
          {lastThree.map((p, i) => (
            <Text key={i}>• ({p.lat.toFixed(5)}, {p.lng.toFixed(5)})</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = {
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
};
